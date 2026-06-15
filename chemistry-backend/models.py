from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AtomModel(BaseModel):
    symbol: str
    x: float
    y: float
    z: float

class BondModel(BaseModel):
    start_atom: int
    end_atom: int
    bond_type: float

class MoleculeModel(BaseModel):
    name: str
    formula: str
    smiles: str
    charge: int
    multiplicity: int
    atoms: List[AtomModel]
    bonds: List[BondModel]

class DescriptorsModel(BaseModel):
    molecular_weight: float
    logp: float
    h_bond_donors: int
    h_bond_acceptors: int
    tpsa: float
    rotatable_bonds: int

class ClassicalResultModel(BaseModel):
    backend: str
    method: str
    basis_set: str
    electron_count: int
    orbital_count: int
    spin_orbital_count: int
    nuclear_repulsion_energy: float
    hf_energy: float
    dft_energy: Optional[float] = None
    correlation_energy: Optional[float] = None
    homo_energy: Optional[float] = None
    lumo_energy: Optional[float] = None
    homo_lumo_gap: Optional[float] = None
    dipole_moment: Optional[float] = None

class QuantumResultModel(BaseModel):
    hamiltonian_backend: str
    mapping: str
    ansatz: str
    algorithm: str
    optimizer: str
    qubit_count: int
    pauli_term_count: int
    circuit_depth_estimate: int
    gate_count_estimate: int
    parameter_count: int
    vqe_energy: float
    ground_state_energy: float
    convergence: List[float]
    top_measurements: List[Dict[str, Any]]

class ExportsModel(BaseModel):
    json_data: str
    qasm: str
    csv_data: str
    report: str

class ChemistryJobResult(BaseModel):
    job_id: str
    status: str
    mode: str
    molecule: MoleculeModel
    descriptors: DescriptorsModel
    classical_result: Optional[ClassicalResultModel] = None
    quantum_result: Optional[QuantumResultModel] = None
    exports: Optional[ExportsModel] = None

class SmilesInput(BaseModel):
    smiles: str
    
class HfInput(BaseModel):
    smiles: str
    basis: str = "sto-3g"

class QuantumInput(BaseModel):
    smiles: str
    basis: str = "sto-3g"
    active_electrons: Optional[int] = None
    active_orbitals: Optional[int] = None
    mapping: str = "jordan_wigner"

class CircuitGenerationRequest(BaseModel):
    molecule: str
    input_type: str = "smiles"
    basis_set: str = "sto-3g"
    charge: int = 0
    multiplicity: int = 1
    active_space: Optional[Dict[str, int]] = None
    backend: str = "qiskit_nature"
    mapping: str = "jordan_wigner"
    ansatz: str = "UCCSD"
    algorithm: str = "VQE"
    optimizer: str = "COBYLA"
    shots: int = 1024
    noise_model: str = "none"


