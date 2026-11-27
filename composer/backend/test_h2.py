import pubchempy as pcp
from qiskit_nature.second_q.drivers import PySCFDriver
from qiskit_nature.second_q.mappers import JordanWignerMapper
from qiskit_nature.second_q.circuit.library import UCCSD, HartreeFock
from qiskit_algorithms import VQE
from qiskit_algorithms.optimizers import SLSQP
from alpha.primitives import StatevectorEstimator as Estimator
import time

molecule_query = "H2"
print(f"Searching PubChem database for '{molecule_query}'...", flush=True)

compounds = pcp.get_compounds(molecule_query, 'name')
c = compounds[0]
cid = c.cid
compounds_3d = pcp.get_compounds(cid, 'cid', record_type='3d')
c3d = compounds_3d[0]
atom_str = '; '.join([f'{a.element} {a.x} {a.y} {a.z}' for a in c3d.atoms])
print("atoms", atom_str)
driver = PySCFDriver(atom=atom_str, basis="sto3g")
problem = driver.run()
mapper = JordanWignerMapper()
fermionic_op = problem.hamiltonian.second_q_op()
qubit_op = mapper.map(fermionic_op)
ansatz = UCCSD(
    problem.num_spatial_orbitals,
    problem.num_particles,
    mapper,
    initial_state=HartreeFock(problem.num_spatial_orbitals, problem.num_particles, mapper),
)
print("Starting VQE...")
vqe = VQE(Estimator(), ansatz, SLSQP(maxiter=30))
result = vqe.compute_minimum_eigenvalue(qubit_op)
print("Energy:", result.eigenvalue.real)
