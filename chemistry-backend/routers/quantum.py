from fastapi import APIRouter, HTTPException
from models import QuantumInput
from typing import List, Dict, Any

try:
    from rdkit import Chem
    from rdkit.Chem import AllChem
    from openfermion.chem import MolecularData
    from openfermionpyscf import run_pyscf
    from openfermion.transforms import get_fermion_operator, jordan_wigner, bravyi_kitaev
    from openfermion.utils import count_qubits
    QUANTUM_AVAILABLE = True
except ImportError as e:
    QUANTUM_AVAILABLE = False
    print(f"Quantum tools unavailable: {e}")

router = APIRouter()

@router.post("/generate-hamiltonian")
def generate_hamiltonian(data: QuantumInput):
    if not QUANTUM_AVAILABLE:
        raise HTTPException(status_code=503, detail="Quantum backend tools (OpenFermion) are not installed.")

    # 1. Build Geometry
    mol_rdkit = Chem.MolFromSmiles(data.smiles)
    if not mol_rdkit:
        raise HTTPException(status_code=400, detail="Invalid SMILES string.")
    
    mol_rdkit = Chem.AddHs(mol_rdkit)
    AllChem.EmbedMolecule(mol_rdkit, randomSeed=42)
    AllChem.MMFFOptimizeMolecule(mol_rdkit)
    
    geometry = []
    conf = mol_rdkit.GetConformer()
    for atom in mol_rdkit.GetAtoms():
        pos = conf.GetAtomPosition(atom.GetIdx())
        geometry.append((atom.GetSymbol(), (pos.x, pos.y, pos.z)))

    charge = Chem.GetFormalCharge(mol_rdkit)
    multiplicity = sum([atom.GetNumRadicalElectrons() for atom in mol_rdkit.GetAtoms()]) + 1

    # 2. Setup MolecularData
    molecule = MolecularData(
        geometry,
        data.basis,
        multiplicity,
        charge,
        description=f"smiles_{data.smiles}"
    )

    # 3. Run PySCF to get integrals
    try:
        molecule = run_pyscf(molecule, run_scf=1, run_mp2=0, run_cisd=0, run_ccsd=0, run_fci=0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PySCF integral generation failed: {str(e)}")

    # 4. Generate Molecular Hamiltonian
    if data.active_electrons is not None and data.active_orbitals is not None:
        if data.active_electrons <= 0 or data.active_orbitals <= 0:
            raise HTTPException(status_code=400, detail="Active space must be > 0.")
            
        core_orbitals = max(0, (molecule.n_electrons - data.active_electrons) // 2)
        active_indices = list(range(core_orbitals, core_orbitals + data.active_orbitals))
        
        try:
            mol_hamiltonian = molecule.get_molecular_hamiltonian(
                occupied_indices=list(range(core_orbitals)),
                active_indices=active_indices
            )
        except Exception as e:
             raise HTTPException(status_code=400, detail=f"Invalid active space parameters: {str(e)}")
    else:
        mol_hamiltonian = molecule.get_molecular_hamiltonian()

    # 5. Fermion to Qubit Mapping
    fermion_operator = get_fermion_operator(mol_hamiltonian)
    
    if data.mapping == "bravyi_kitaev":
        qubit_operator = bravyi_kitaev(fermion_operator)
    else:
        qubit_operator = jordan_wigner(fermion_operator)

    # 6. Formatting Output
    qubit_count = count_qubits(qubit_operator)
    terms = []
    
    # Extract terms
    for term, coefficient in qubit_operator.terms.items():
        if abs(coefficient) > 1e-8:
            pauli_string = ""
            if len(term) == 0:
                pauli_string = "I"
            else:
                for idx, op in term:
                    pauli_string += f"{op}{idx} "
            terms.append({
                "pauli": pauli_string.strip(),
                "coefficient": float(coefficient.real)
            })

    # Sort terms by absolute coefficient (highest first)
    terms.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

    return {
        "mapping": data.mapping,
        "qubit_count": qubit_count,
        "pauli_term_count": len(terms),
        "hf_energy": molecule.hf_energy,
        "nuclear_repulsion": molecule.nuclear_repulsion,
        "terms": terms[:1000] # Cap to top 1000 to prevent browser OOM
    }
