import time
from routers.builder import generate_chemistry_circuit
from models import CircuitGenerationRequest

req = CircuitGenerationRequest(
    molecule="N",
    input_type="smiles",
    basis_set="STO-3G",
    charge=0,
    multiplicity=1,
    mapping="jordan_wigner",
    ansatz="UCCSD",
    algorithm="VQE",
    optimizer="COBYLA",
    shots=1024
)

print("Calling generate_chemistry_circuit...")
t0 = time.time()
res = generate_chemistry_circuit(req)
print("Finished in", time.time() - t0)
print(res["circuit_id"])
