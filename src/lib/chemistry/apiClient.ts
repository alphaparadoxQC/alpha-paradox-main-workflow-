export interface BackendStatus {
  rdkit: string;
  openbabel: string;
  pyscf: string;
  psi4: string;
  openfermion: string;
  qiskit_nature: string;
  pennylane_qchem: string;
  qiskit_aer: string;
  celery: string;
  redis: string;
  ray: string;
  cloud_hpc: string;
  hardware_backends: Record<string, string>;
}

export interface MoleculeResponse {
  molecule: {
    name: string;
    formula: string;
    smiles: string;
    charge: number;
    multiplicity: number;
    atoms: { symbol: string; x: number; y: number; z: number }[];
    bonds: { start_atom: number; end_atom: number; bond_type: number }[];
  };
  descriptors: {
    molecular_weight: number;
    logp: number;
    h_bond_donors: number;
    h_bond_acceptors: number;
    tpsa: number;
    rotatable_bonds: number;
  };
}

export interface ClassicalResponse {
  backend: string;
  method: string;
  basis_set: string;
  electron_count: number;
  orbital_count: number;
  spin_orbital_count: number;
  nuclear_repulsion_energy: number;
  hf_energy: number;
  dft_energy?: number;
  correlation_energy?: number;
  homo_energy?: number;
  lumo_energy?: number;
  homo_lumo_gap?: number;
  dipole_moment?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const ChemistryAPI = {
  async getStatus(): Promise<BackendStatus> {
    const res = await fetch(`${API_BASE_URL}/chemistry/backends/status`);
    if (!res.ok) throw new Error('Failed to fetch backend status');
    return res.json();
  },

  async parseSmiles(smiles: string): Promise<MoleculeResponse> {
    const res = await fetch(`${API_BASE_URL}/chemistry/parse-smiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smiles })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to parse SMILES');
    }
    return res.json();
  },

  async runHF(smiles: string, basis: string = "sto-3g"): Promise<ClassicalResponse> {
    const res = await fetch(`${API_BASE_URL}/chemistry/run-hf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smiles, basis })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to run PySCF HF');
    }
    return res.json();
  },

  async generateHamiltonian(
    smiles: string, 
    mapping: string = "jordan_wigner",
    active_electrons?: number,
    active_orbitals?: number,
    basis: string = "sto-3g"
  ): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/chemistry/generate-hamiltonian`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        smiles, 
        mapping,
        active_electrons,
        active_orbitals,
        basis
      })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate Hamiltonian');
    }
    return res.json();
  },

  async generateChemistryCircuit(req: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/chemistry/generate-chemistry-circuit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate chemistry circuit');
    }
    return res.json();
  },

  async getCircuit(circuitId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/chemistry/circuits/${circuitId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to load chemistry circuit');
    }
    return res.json();
  },
  async buildMolecule(req: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/chemistry/molecule/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to build molecule');
    }
    return res.json();
  },

  async generateRealHamiltonian(req: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/chemistry/hamiltonian/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate Hamiltonian');
    }
    return res.json();
  },

  async generateRealAnsatz(req: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/chemistry/ansatz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate ansatz');
    }
    return res.json();
  },

  async runRealVQE(req: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/chemistry/vqe/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to run VQE');
    }
    return res.json();
  },

  async getVQEStatus(jobId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/chemistry/vqe/status/${jobId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch VQE status');
    }
    return res.json();
  },

  async getVQEResult(jobId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/chemistry/vqe/result/${jobId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch VQE result');
    }
    return res.json();
  }
};
