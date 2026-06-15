from fastapi import APIRouter, HTTPException
from models import SmilesInput, MoleculeModel, AtomModel, BondModel, DescriptorsModel

try:
    from rdkit import Chem
    from rdkit.Chem import AllChem
    from rdkit.Chem import Descriptors
    from rdkit.Chem import rdMolDescriptors
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False

router = APIRouter()

@router.post("/parse-smiles")
def parse_smiles(data: SmilesInput):
    if not RDKIT_AVAILABLE:
        raise HTTPException(status_code=503, detail="RDKit is not installed.")
        
    mol = Chem.MolFromSmiles(data.smiles)
    if not mol:
        raise HTTPException(status_code=400, detail="Invalid SMILES string.")
        
    # Add explicit hydrogens
    mol = Chem.AddHs(mol)
    
    # Generate 3D coordinates
    AllChem.EmbedMolecule(mol, randomSeed=42)
    AllChem.MMFFOptimizeMolecule(mol)
    
    atoms = []
    bonds = []
    
    conf = mol.GetConformer()
    for atom in mol.GetAtoms():
        pos = conf.GetAtomPosition(atom.GetIdx())
        atoms.append(AtomModel(
            symbol=atom.GetSymbol(),
            x=pos.x,
            y=pos.y,
            z=pos.z
        ))
        
    for bond in mol.GetBonds():
        bonds.append(BondModel(
            start_atom=bond.GetBeginAtomIdx(),
            end_atom=bond.GetEndAtomIdx(),
            bond_type=bond.GetBondTypeAsDouble()
        ))
        
    charge = Chem.GetFormalCharge(mol)
    unpaired = sum([atom.GetNumRadicalElectrons() for atom in mol.GetAtoms()])
    multiplicity = unpaired + 1
    
    descriptors = DescriptorsModel(
        molecular_weight=Descriptors.ExactMolWt(mol),
        logp=Descriptors.MolLogP(mol),
        h_bond_donors=rdMolDescriptors.CalcNumHBD(mol),
        h_bond_acceptors=rdMolDescriptors.CalcNumHBA(mol),
        tpsa=rdMolDescriptors.CalcTPSA(mol),
        rotatable_bonds=rdMolDescriptors.CalcNumRotatableBonds(mol)
    )
    
    molecule = MoleculeModel(
        name=data.smiles,
        formula=rdMolDescriptors.CalcMolFormula(mol),
        smiles=data.smiles,
        charge=charge,
        multiplicity=multiplicity,
        atoms=atoms,
        bonds=bonds
    )
    
    return {
        "molecule": molecule,
        "descriptors": descriptors
    }
