from fastapi import APIRouter, HTTPException
from models import CircuitGenerationRequest
import uuid
import math
import traceback

try:
    from rdkit import Chem
    from rdkit.Chem import AllChem, rdMolDescriptors
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False

try:
    from openfermion.chem import MolecularData
    from openfermionpyscf import run_pyscf
    from openfermion.transforms import get_fermion_operator, jordan_wigner, bravyi_kitaev
    from openfermion.utils import count_qubits
    OPENFERMION_AVAILABLE = True
except ImportError:
    OPENFERMION_AVAILABLE = False

router = APIRouter()

# In-memory store for generated circuits (keyed by circuit_id)
circuit_store: dict = {}


@router.get("/circuits/{circuit_id}")
def get_circuit(circuit_id: str):
    """Retrieve a previously generated chemistry circuit by ID."""
    if circuit_id not in circuit_store:
        raise HTTPException(status_code=404, detail=f"Circuit '{circuit_id}' not found. Generate it first.")
    return circuit_store[circuit_id]


def _parse_molecule(smiles: str):
    """Parse SMILES string with RDKit, embed 3D geometry, optimize."""
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return None, None, None
    mol = Chem.AddHs(mol)
    AllChem.EmbedMolecule(mol, randomSeed=42)
    AllChem.MMFFOptimizeMolecule(mol)

    atoms = []
    coordinates = []
    geometry = []
    conf = mol.GetConformer()
    for atom in mol.GetAtoms():
        pos = conf.GetAtomPosition(atom.GetIdx())
        atoms.append(atom.GetSymbol())
        coordinates.append([round(pos.x, 6), round(pos.y, 6), round(pos.z, 6)])
        geometry.append((atom.GetSymbol(), (pos.x, pos.y, pos.z)))

    formula = rdMolDescriptors.CalcMolFormula(mol)
    return mol, geometry, {
        "atoms": atoms,
        "coordinates": coordinates,
        "formula": formula,
    }


def _format_pauli_terms(qubit_operator, n_qubits, max_terms=100):
    """Convert OpenFermion QubitOperator terms into full Pauli strings."""
    terms = []
    pauli_map = {0: "X", 1: "Y", 2: "Z"}
    sorted_terms = sorted(qubit_operator.terms.items(), key=lambda x: abs(x[1]), reverse=True)
    for paulis, coeff in sorted_terms[:max_terms]:
        if not paulis:
            terms.append({"pauli": "I" * n_qubits, "coefficient": round(coeff.real, 8)})
        else:
            chars = ["I"] * n_qubits
            for idx, op in paulis:
                if idx < n_qubits:
                    chars[idx] = op
            terms.append({"pauli": "".join(chars), "coefficient": round(coeff.real, 8)})
    return terms


def _format_fermionic_terms(fermion_operator, max_terms=50):
    """Convert OpenFermion FermionOperator into readable strings."""
    terms = []
    sorted_terms = sorted(fermion_operator.terms.items(), key=lambda x: abs(x[1]), reverse=True)
    for ops, coeff in sorted_terms[:max_terms]:
        if not ops:
            terms.append({"operator": "I", "coefficient": round(coeff.real, 8)})
        else:
            op_str = " ".join(f"a{idx}{'†' if dag else ''}" for idx, dag in ops)
            terms.append({"operator": op_str, "coefficient": round(coeff.real, 8)})
    return terms


def _build_gate_circuit(qubits, active_electrons, spin_orbitals, active_orbitals,
                        ansatz, mapping_display, param_count):
    """
    Generate gate-level circuit data: individual gate objects with
    qubit indices, type, parameters, section, and chemistry meaning.
    """
    gates = []
    gate_id = 0
    layer = 0
    param_idx = 0

    # ── Section 1: Hartree-Fock Initial State ────────────────────────
    for i in range(min(active_electrons, qubits)):
        spin_label = f"{i // 2}{'α' if i % 2 == 0 else 'β'}"
        gates.append({
            "id": f"g{gate_id}",
            "type": "X",
            "qubits": [i],
            "params": [],
            "layer": layer,
            "section": "Hartree-Fock Initial State",
            "chemistry_meaning": f"Occupy spin orbital {spin_label}",
        })
        gate_id += 1
    layer += 1

    # ── Section 2: UCCSD Ansatz ──────────────────────────────────────
    if ansatz == "UCCSD":
        # Single excitations
        excitation_idx = 0
        singles = []
        for i in range(active_electrons):
            for a in range(active_electrons, min(spin_orbitals, qubits)):
                singles.append((i, a))

        for (i, a) in singles[:8]:  # limit for rendering
            p_name = f"θ{param_idx}"
            # CNOT ladder down
            gates.append({
                "id": f"g{gate_id}", "type": "CX", "qubits": [i, a],
                "params": [], "layer": layer,
                "section": "UCCSD Ansatz",
                "chemistry_meaning": f"Single excitation {i}→{a}: entangle",
            })
            gate_id += 1
            layer += 1

            gates.append({
                "id": f"g{gate_id}", "type": "RY", "qubits": [a],
                "params": [p_name], "layer": layer,
                "section": "UCCSD Ansatz",
                "chemistry_meaning": f"Single excitation {i}→{a}: rotation {p_name}",
            })
            gate_id += 1
            layer += 1

            gates.append({
                "id": f"g{gate_id}", "type": "CX", "qubits": [i, a],
                "params": [], "layer": layer,
                "section": "UCCSD Ansatz",
                "chemistry_meaning": f"Single excitation {i}→{a}: disentangle",
            })
            gate_id += 1
            layer += 1
            param_idx += 1
            excitation_idx += 1

        # Double excitations (limited for rendering)
        doubles = []
        for i in range(min(active_electrons, 4)):
            for j in range(i + 1, min(active_electrons, 4)):
                for a in range(active_electrons, min(spin_orbitals, qubits)):
                    for b in range(a + 1, min(spin_orbitals, qubits)):
                        doubles.append((i, j, a, b))

        for (i, j, a, b) in doubles[:4]:  # limit for rendering
            p_name = f"θ{param_idx}"
            # CNOT cascade for double excitation
            for (c, t) in [(i, j), (j, a), (a, b)]:
                gates.append({
                    "id": f"g{gate_id}", "type": "CX", "qubits": [c, t],
                    "params": [], "layer": layer,
                    "section": "UCCSD Ansatz",
                    "chemistry_meaning": f"Double excitation ({i},{j})→({a},{b}): CNOT ladder",
                })
                gate_id += 1
                layer += 1

            gates.append({
                "id": f"g{gate_id}", "type": "RZ", "qubits": [b],
                "params": [p_name], "layer": layer,
                "section": "UCCSD Ansatz",
                "chemistry_meaning": f"Double excitation ({i},{j})→({a},{b}): Pauli evolution {p_name}",
            })
            gate_id += 1
            layer += 1

            # Reverse CNOT cascade
            for (c, t) in reversed([(i, j), (j, a), (a, b)]):
                gates.append({
                    "id": f"g{gate_id}", "type": "CX", "qubits": [c, t],
                    "params": [], "layer": layer,
                    "section": "UCCSD Ansatz",
                    "chemistry_meaning": f"Double excitation ({i},{j})→({a},{b}): reverse CNOT",
                })
                gate_id += 1
                layer += 1
            param_idx += 1

    elif ansatz == "hardware_efficient":
        hw_layers = 3
        for l_idx in range(hw_layers):
            for q in range(qubits):
                gates.append({
                    "id": f"g{gate_id}", "type": "RY", "qubits": [q],
                    "params": [f"θ{param_idx}"], "layer": layer,
                    "section": "Hardware Efficient Ansatz",
                    "chemistry_meaning": f"HW layer {l_idx+1}: RY rotation on q{q}",
                })
                gate_id += 1
                param_idx += 1
            layer += 1
            for q in range(qubits):
                gates.append({
                    "id": f"g{gate_id}", "type": "RZ", "qubits": [q],
                    "params": [f"θ{param_idx}"], "layer": layer,
                    "section": "Hardware Efficient Ansatz",
                    "chemistry_meaning": f"HW layer {l_idx+1}: RZ rotation on q{q}",
                })
                gate_id += 1
                param_idx += 1
            layer += 1
            for q in range(qubits - 1):
                gates.append({
                    "id": f"g{gate_id}", "type": "CX", "qubits": [q, q + 1],
                    "params": [], "layer": layer,
                    "section": "Hardware Efficient Ansatz",
                    "chemistry_meaning": f"HW layer {l_idx+1}: entangle q{q}-q{q+1}",
                })
                gate_id += 1
            layer += 1
    else:
        # Custom ansatz fallback
        for q in range(qubits):
            gates.append({
                "id": f"g{gate_id}", "type": "RY", "qubits": [q],
                "params": [f"θ{param_idx}"], "layer": layer,
                "section": "Custom Ansatz",
                "chemistry_meaning": f"Custom rotation on q{q}",
            })
            gate_id += 1
            param_idx += 1
        layer += 1
        for q in range(qubits - 1):
            gates.append({
                "id": f"g{gate_id}", "type": "CX", "qubits": [q, q + 1],
                "params": [], "layer": layer,
                "section": "Custom Ansatz",
                "chemistry_meaning": f"Custom entanglement q{q}-q{q+1}",
            })
            gate_id += 1
        layer += 1

    # ── Section 3: Measurement ───────────────────────────────────────
    layer += 1
    for q in range(qubits):
        gates.append({
            "id": f"g{gate_id}", "type": "MEASURE", "qubits": [q],
            "params": [], "layer": layer,
            "section": "Measurement",
            "chemistry_meaning": f"Measure qubit {q} for Hamiltonian expectation",
        })
        gate_id += 1

    # Collect unique sections in order
    seen = set()
    sections = []
    for g in gates:
        if g["section"] not in seen:
            seen.add(g["section"])
            sections.append(g["section"])

    return gates, sections, param_idx


def _build_qubit_metadata(qubits, active_electrons, active_orbitals):
    """Build per-qubit metadata: spin orbital mapping, occupation."""
    qubit_meta = []
    for i in range(qubits):
        orb_idx = i // 2
        spin = "α" if i % 2 == 0 else "β"
        occ = 1 if i < active_electrons else 0
        qubit_meta.append({
            "index": i,
            "label": f"q{i}",
            "spin_orbital": f"{orb_idx}{spin}",
            "orbital_index": orb_idx,
            "spin": spin,
            "occupation": occ,
            "active": orb_idx < active_orbitals,
        })
    return qubit_meta


def _build_excitation_list(active_electrons, spin_orbitals, qubits, ansatz):
    """Build structured excitation list for UCCSD."""
    excitations = []
    if ansatz != "UCCSD":
        return excitations

    exc_id = 0
    # Singles
    for i in range(active_electrons):
        for a in range(active_electrons, min(spin_orbitals, qubits)):
            excitations.append({
                "id": f"exc_{exc_id}",
                "type": "single",
                "from_orbitals": [f"{i // 2}{'α' if i % 2 == 0 else 'β'}"],
                "to_orbitals": [f"{a // 2}{'α' if a % 2 == 0 else 'β'}"],
                "parameter": f"θ{exc_id}",
                "qubit_indices": [i, a],
            })
            exc_id += 1

    # Doubles
    for i in range(min(active_electrons, 4)):
        for j in range(i + 1, min(active_electrons, 4)):
            for a in range(active_electrons, min(spin_orbitals, qubits)):
                for b in range(a + 1, min(spin_orbitals, qubits)):
                    excitations.append({
                        "id": f"exc_{exc_id}",
                        "type": "double",
                        "from_orbitals": [
                            f"{i // 2}{'α' if i % 2 == 0 else 'β'}",
                            f"{j // 2}{'α' if j % 2 == 0 else 'β'}",
                        ],
                        "to_orbitals": [
                            f"{a // 2}{'α' if a % 2 == 0 else 'β'}",
                            f"{b // 2}{'α' if b % 2 == 0 else 'β'}",
                        ],
                        "parameter": f"θ{exc_id}",
                        "qubit_indices": [i, j, a, b],
                    })
                    exc_id += 1

    return excitations


@router.post("/generate-chemistry-circuit")
def generate_chemistry_circuit(req: CircuitGenerationRequest):
    """
    Full chemistry circuit generation pipeline:
    SMILES → RDKit → PySCF HF → Active Space → OpenFermion Hamiltonian →
    Qubit Mapping → Ansatz → Gate-level circuit + QASM
    """
    circuit_id = f"chem_{req.molecule}_{req.basis_set}_{uuid.uuid4().hex[:6]}"
    circuit_id = circuit_id.replace(" ", "_").replace("-", "")
    warnings = []
    logs = []

    # ── Step 1: Validate backends ────────────────────────────────────────
    if not RDKIT_AVAILABLE:
        raise HTTPException(status_code=503, detail="RDKit is not installed. Cannot parse molecules.")
    if not OPENFERMION_AVAILABLE:
        raise HTTPException(status_code=503, detail="OpenFermion / PySCF is not installed. Cannot generate Hamiltonians.")

    logs.append("✓ RDKit available")
    logs.append("✓ OpenFermion + PySCF available")

    # ── Step 2: Parse molecule ───────────────────────────────────────────
    smiles = req.molecule
    example_map = {
        "H2": "[H][H]", "h2": "[H][H]",
        "LiH": "[Li][H]", "lih": "[Li][H]",
        "BeH2": "[BeH2]", "beh2": "[BeH2]",
        "H2O": "O", "h2o": "O", "water": "O",
        "NH3": "N", "nh3": "N", "ammonia": "N",
        "CH4": "C", "ch4": "C", "methane": "C",
    }
    if req.input_type == "example" or smiles in example_map:
        smiles = example_map.get(smiles, smiles)

    mol_rdkit, geometry, mol_info = _parse_molecule(smiles)
    if not mol_rdkit:
        raise HTTPException(status_code=400, detail=f"Could not parse molecule: {req.molecule}")

    logs.append(f"✓ Parsed molecule: {mol_info['formula']} ({len(mol_info['atoms'])} atoms)")

    # ── Step 3: Run PySCF Hartree-Fock ───────────────────────────────────
    charge = req.charge
    multiplicity = req.multiplicity
    basis = req.basis_set.lower().replace("-", "").replace(" ", "")
    basis_map = {"sto3g": "sto-3g", "631g": "6-31g", "631g*": "6-31g*", "ccpvdz": "cc-pvdz"}
    basis_normalized = basis_map.get(basis, req.basis_set.lower())

    molecule_data = MolecularData(
        geometry, basis_normalized, multiplicity, charge,
        description=f"builder_{circuit_id}"
    )

    try:
        molecule_data = run_pyscf(molecule_data, run_scf=1, run_mp2=0, run_cisd=0, run_ccsd=0, run_fci=0)
        hf_energy = molecule_data.hf_energy
        nuclear_repulsion = molecule_data.nuclear_repulsion
        n_electrons = molecule_data.n_electrons
        n_orbitals = molecule_data.n_orbitals
        logs.append(f"✓ PySCF HF converged: E = {hf_energy:.8f} Ha")
        logs.append(f"  Electrons: {n_electrons}, Orbitals: {n_orbitals}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PySCF Hartree-Fock failed: {str(e)}")

    # ── Step 4: Active Space ─────────────────────────────────────────────
    if req.active_space and "electrons" in req.active_space and "orbitals" in req.active_space:
        ae = min(req.active_space["electrons"], n_electrons)
        ao = min(req.active_space["orbitals"], n_orbitals)
        core_orbitals = max(0, (n_electrons - ae) // 2)
        active_indices = list(range(core_orbitals, core_orbitals + ao))
        mol_hamiltonian = molecule_data.get_molecular_hamiltonian(
            occupied_indices=list(range(core_orbitals)),
            active_indices=active_indices
        )
        active_electrons = ae
        active_orbitals = ao
        spin_orbitals = ao * 2
        logs.append(f"✓ Active space: ({ae}e, {ao}o) → {spin_orbitals} spin-orbitals")
    else:
        # Enforce strict active space for molecules with > 4 orbitals to prevent hanging
        if n_orbitals > 4:
            ae = min(4, n_electrons)
            ao = min(4, n_orbitals)
            core_orbitals = max(0, (n_electrons - ae) // 2)
            active_indices = list(range(core_orbitals, core_orbitals + ao))
            mol_hamiltonian = molecule_data.get_molecular_hamiltonian(
                occupied_indices=list(range(core_orbitals)),
                active_indices=active_indices
            )
            active_electrons = ae
            active_orbitals = ao
            spin_orbitals = ao * 2
            logs.append(f"✓ Automatic Active space: ({ae}e, {ao}o) → {spin_orbitals} spin-orbitals")
        else:
            mol_hamiltonian = molecule_data.get_molecular_hamiltonian()
            active_electrons = n_electrons
            active_orbitals = n_orbitals
            spin_orbitals = n_orbitals * 2
            logs.append(f"✓ Full space: ({n_electrons}e, {n_orbitals}o) → {spin_orbitals} spin-orbitals")

    # ── Step 5: Fermionic Hamiltonian ────────────────────────────────────
    fermion_operator = get_fermion_operator(mol_hamiltonian)
    fermionic_terms = _format_fermionic_terms(fermion_operator)
    logs.append(f"✓ Fermionic Hamiltonian: {len(fermion_operator.terms)} terms")

    # ── Step 6: Qubit Mapping ────────────────────────────────────────────
    if req.mapping == "bravyi_kitaev":
        qubit_operator = bravyi_kitaev(fermion_operator)
        mapping_display = "Bravyi-Kitaev"
    else:
        qubit_operator = jordan_wigner(fermion_operator)
        mapping_display = "Jordan-Wigner"

    n_qubits = count_qubits(qubit_operator)
    pauli_term_count = len(qubit_operator.terms)
    pauli_terms = _format_pauli_terms(qubit_operator, n_qubits)
    logs.append(f"✓ {mapping_display} mapping → {n_qubits} qubits, {pauli_term_count} Pauli terms")

    # ── Step 7: Build orbital-qubit mapping ──────────────────────────────
    orbital_qubit_mapping = []
    for i in range(active_orbitals):
        orbital_qubit_mapping.append({
            "orbital": f"{i}α",
            "qubit": 2 * i,
            "occupation": 1 if 2 * i < active_electrons else 0,
        })
        orbital_qubit_mapping.append({
            "orbital": f"{i}β",
            "qubit": 2 * i + 1,
            "occupation": 1 if 2 * i + 1 < active_electrons else 0,
        })

    # ── Step 8: Build gate-level circuit ─────────────────────────────────
    gate_list, sections, actual_params = _build_gate_circuit(
        n_qubits, active_electrons, spin_orbitals, active_orbitals,
        req.ansatz, mapping_display, 0
    )

    qubit_metadata = _build_qubit_metadata(n_qubits, active_electrons, active_orbitals)
    excitation_list = _build_excitation_list(active_electrons, spin_orbitals, n_qubits, req.ansatz)

    total_depth = max(g["layer"] for g in gate_list) + 1 if gate_list else 0
    gate_count = len(gate_list)

    logs.append(f"✓ Gate circuit: {gate_count} gates, depth {total_depth}, {actual_params} parameters")

    # ── Step 9: QASM ─────────────────────────────────────────────────────
    qasm_lines = [
        "OPENQASM 2.0;",
        'include "qelib1.inc";',
        f"qreg q[{n_qubits}];",
        f"creg c[{n_qubits}];",
        "",
        f"// Chemistry Circuit: {mol_info['formula']}",
        f"// Basis: {req.basis_set} | Mapping: {mapping_display}",
        f"// Ansatz: {req.ansatz} | Qubits: {n_qubits}",
        "",
    ]
    current_section = ""
    for g in gate_list:
        if g["section"] != current_section:
            current_section = g["section"]
            qasm_lines.append(f"// ── {current_section} ──")
        gt = g["type"]
        qs = g["qubits"]
        if gt == "X":
            qasm_lines.append(f"x q[{qs[0]}];")
        elif gt == "H":
            qasm_lines.append(f"h q[{qs[0]}];")
        elif gt == "RY":
            qasm_lines.append(f"ry({g['params'][0]}) q[{qs[0]}];")
        elif gt == "RZ":
            qasm_lines.append(f"rz({g['params'][0]}) q[{qs[0]}];")
        elif gt == "RX":
            qasm_lines.append(f"rx({g['params'][0]}) q[{qs[0]}];")
        elif gt == "CX":
            qasm_lines.append(f"cx q[{qs[0]}],q[{qs[1]}];")
        elif gt == "MEASURE":
            qasm_lines.append(f"measure q[{qs[0]}] -> c[{qs[0]}];")

    qasm_str = "\n".join(qasm_lines)

    # ── Step 10: Measurement groups ──────────────────────────────────────
    group_count = max(1, pauli_term_count // max(n_qubits, 1) + 1)
    measurement_groups = []
    for i in range(min(group_count, 10)):
        basis_str = "Z" * n_qubits if i == 0 else f"Mixed Pauli basis {i+1}"
        terms_in_group = [t["pauli"] for t in pauli_terms[i * 3:(i + 1) * 3]]
        measurement_groups.append({
            "group_id": f"m{i+1}",
            "basis": basis_str,
            "pauli_terms": terms_in_group,
            "term_count": len(terms_in_group),
        })

    # ── Step 11: Warnings ────────────────────────────────────────────────
    if n_qubits > 15:
        warnings.append(f"Large circuit ({n_qubits} qubits). Showing compressed gate view.")
    if pauli_term_count > 500:
        warnings.append(f"High Pauli term count ({pauli_term_count}). VQE convergence may be slow.")

    # ── Build response ───────────────────────────────────────────────────
    response_data = {
        "circuit_id": circuit_id,
        "chemistry_circuit_url": f"/chemistry/circuit-builder?circuit_id={circuit_id}",
        "molecule": {
            "name": req.molecule,
            "formula": mol_info["formula"],
            "smiles": smiles,
            "atoms": [{"index": idx, "symbol": s} for idx, s in enumerate(mol_info["atoms"])],
            "coordinates": mol_info["coordinates"],
        },
        "chemistry_metadata": {
            "basis_set": req.basis_set,
            "charge": charge,
            "multiplicity": multiplicity,
            "electron_count": n_electrons,
            "active_electrons": active_electrons,
            "orbital_count": n_orbitals,
            "active_orbitals": active_orbitals,
            "spin_orbital_count": spin_orbitals,
            "qubit_count": n_qubits,
            "pauli_term_count": pauli_term_count,
            "classical_backend": "PySCF",
            "hamiltonian_backend": "OpenFermion",
            "mapping": mapping_display,
            "ansatz": req.ansatz,
            "algorithm": req.algorithm,
            "optimizer": req.optimizer,
            "hf_energy": round(hf_energy, 10),
            "nuclear_repulsion": round(nuclear_repulsion, 10),
        },
        "circuit_data": {
            "qubits": qubit_metadata,
            "gates": gate_list,
            "sections": sections,
            "depth": total_depth,
            "gate_count": gate_count,
            "parameter_count": actual_params,
            "qasm": qasm_str,
        },
        "hamiltonian": {
            "fermionic_terms": fermionic_terms,
            "pauli_terms": pauli_terms,
        },
        "orbital_qubit_mapping": orbital_qubit_mapping,
        "excitation_list": excitation_list[:50],
        "measurement_groups": measurement_groups,
        "vqe_loop": {
            "optimizer": req.optimizer,
            "max_iterations": 100,
            "current_iteration": 0,
            "energy_history": [],
            "status": "not_started",
        },
        "convergence": [],
        "warnings": warnings,
        "logs": logs,
    }
    circuit_store[circuit_id] = response_data
    return response_data
