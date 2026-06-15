from fastapi import APIRouter
import importlib

router = APIRouter()

def check_package(name: str) -> str:
    try:
        importlib.import_module(name)
        return "available"
    except ImportError:
        return "unavailable"

@router.get("/backends/status")
def get_backend_status():
    return {
        "rdkit": check_package("rdkit"),
        "openbabel": check_package("openbabel"),
        "pyscf": check_package("pyscf"),
        "psi4": check_package("psi4"),
        "openfermion": check_package("openfermion"),
        "qiskit_nature": check_package("qiskit_nature"),
        "pennylane_qchem": check_package("pennylane.qchem"),
        "qiskit_aer": check_package("qiskit_aer"),
        "celery": check_package("celery"),
        "redis": check_package("redis"),
        "ray": check_package("ray"),
        "cloud_hpc": "not_configured",
        "hardware_backends": {
            "ibm_quantum": "not_configured",
            "aws_braket": "not_configured",
            "azure_quantum": "not_configured",
            "local_5_qubit": "not_configured"
        }
    }
