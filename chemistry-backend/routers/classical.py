from fastapi import APIRouter, HTTPException
from models import HfInput, ClassicalResultModel
try:
    from rdkit import Chem
    from rdkit.Chem import AllChem
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False
    
try:
    from pyscf import gto, scf
    PYSCF_AVAILABLE = True
except ImportError:
    PYSCF_AVAILABLE = False

router = APIRouter()

@router.post("/run-hf")
def run_hf(data: HfInput):
    if not PYSCF_AVAILABLE or not RDKIT_AVAILABLE:
        raise HTTPException(status_code=503, detail="PySCF or RDKit is not installed.")
        
    mol_rdkit = Chem.MolFromSmiles(data.smiles)
    if not mol_rdkit:
        raise HTTPException(status_code=400, detail="Invalid SMILES string.")
        
    mol_rdkit = Chem.AddHs(mol_rdkit)
    AllChem.EmbedMolecule(mol_rdkit, randomSeed=42)
    AllChem.MMFFOptimizeMolecule(mol_rdkit)
    
    # Convert to PySCF format
    atom_str = ""
    conf = mol_rdkit.GetConformer()
    for atom in mol_rdkit.GetAtoms():
        pos = conf.GetAtomPosition(atom.GetIdx())
        atom_str += f"{atom.GetSymbol()} {pos.x} {pos.y} {pos.z}; "
        
    charge = Chem.GetFormalCharge(mol_rdkit)
    unpaired = sum([atom.GetNumRadicalElectrons() for atom in mol_rdkit.GetAtoms()])
    spin = unpaired
    
    # Build PySCF molecule
    try:
        mol = gto.M(
            atom=atom_str,
            basis=data.basis,
            charge=charge,
            spin=spin,
            verbose=0
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PySCF molecule build failed: {str(e)}")
        
    # Run HF
    try:
        if spin == 0:
            mf = scf.RHF(mol)
        else:
            mf = scf.ROHF(mol)
            
        hf_energy = mf.kernel()
        
        # Calculate dipole
        dipole = mf.dip_moment(mol, unit='Debye')
        dipole_mag = (dipole[0]**2 + dipole[1]**2 + dipole[2]**2)**0.5
        
        # HOMO/LUMO calculation
        mo_energies = mf.mo_energy
        mo_occ = mf.mo_occ
        
        homo_energy = None
        lumo_energy = None
        
        if spin == 0:
            # RHF
            homo_idx = max([i for i, occ in enumerate(mo_occ) if occ > 0])
            homo_energy = mo_energies[homo_idx]
            if homo_idx + 1 < len(mo_energies):
                lumo_energy = mo_energies[homo_idx + 1]
        else:
            # ROHF - using alpha energies
            alpha_energies = mo_energies[0] if isinstance(mo_energies, tuple) else mo_energies
            alpha_occ = mo_occ[0] if isinstance(mo_occ, tuple) else mo_occ
            homo_idx = max([i for i, occ in enumerate(alpha_occ) if occ > 0])
            homo_energy = alpha_energies[homo_idx]
            if homo_idx + 1 < len(alpha_energies):
                lumo_energy = alpha_energies[homo_idx + 1]

        homo_lumo_gap = (lumo_energy - homo_energy) if (homo_energy is not None and lumo_energy is not None) else None
        
        result = ClassicalResultModel(
            backend="pyscf",
            method="HF",
            basis_set=data.basis,
            electron_count=mol.nelectron,
            orbital_count=mol.nao,
            spin_orbital_count=mol.nao * 2,
            nuclear_repulsion_energy=mol.energy_nuc(),
            hf_energy=float(hf_energy),
            homo_energy=float(homo_energy) if homo_energy is not None else None,
            lumo_energy=float(lumo_energy) if lumo_energy is not None else None,
            homo_lumo_gap=float(homo_lumo_gap) if homo_lumo_gap is not None else None,
            dipole_moment=float(dipole_mag)
        )
        return result.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PySCF calculation failed: {str(e)}")
