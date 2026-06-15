from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
import math
import random
from routers.builder import circuit_store

router = APIRouter()
vqe_jobs = {}

class VQERunRequest(BaseModel):
    hamiltonian_id: str
    ansatz_type: str
    optimizer: str
    max_iterations: int
    tolerance: float
    backend: str

@router.post("/run")
def run_vqe(req: VQERunRequest):
    if req.hamiltonian_id not in circuit_store:
        raise HTTPException(status_code=404, detail="Hamiltonian/Circuit not found")
    
    circuit_data = circuit_store[req.hamiltonian_id]
    hf_energy = circuit_data["chemistry_metadata"].get("hf_energy", 0.0)
    
    # We will simulate a VQE optimization trajectory that converges to slightly below HF energy.
    # In a real scenario, this would evaluate the Pauli expectation over the ansatz.
    # Here we mock a mathematical convergence curve for the UI.
    target_energy = hf_energy - abs(hf_energy) * 0.02 # Example correlation energy
    
    job_id = f"vqe_{uuid.uuid4().hex[:8]}"
    vqe_jobs[job_id] = {
        "status": "running",
        "circuit_id": req.hamiltonian_id,
        "hf_energy": hf_energy,
        "target_energy": target_energy,
        "iterations": [],
        "max_iter": req.max_iterations,
        "current_iter": 0
    }
    return {"job_id": job_id, "status": "started"}

@router.get("/status/{job_id}")
def get_status(job_id: str):
    if job_id not in vqe_jobs:
        raise HTTPException(status_code=404, detail="VQE job not found")
    
    job = vqe_jobs[job_id]
    if job["status"] == "running":
        # Advance iterations
        step = len(job["iterations"])
        
        # Add a batch of iterations (since UI polls every 1s, we can add 5 iterations per second)
        for i in range(5):
            if step >= job["max_iter"]:
                job["status"] = "completed"
                break
                
            decay = math.exp(-step / 15.0)
            energy = job["target_energy"] + (job["hf_energy"] - job["target_energy"]) * decay
            noise = (random.random() - 0.5) * 0.005 * decay
            
            job["iterations"].append({
                "iteration": step,
                "energy": energy + noise,
                "parameters": [random.random() for _ in range(5)]
            })
            step += 1
            job["current_iter"] = step
            
            if step > 30 and abs(job["iterations"][-1]["energy"] - job["iterations"][-2]["energy"]) < 1e-6:
                job["status"] = "completed"
                break
            
    return {
        "job_id": job_id,
        "status": job["status"],
        "convergence": job["iterations"]
    }

@router.get("/result/{job_id}")
def get_result(job_id: str):
    if job_id not in vqe_jobs:
        raise HTTPException(status_code=404, detail="VQE job not found")
    
    job = vqe_jobs[job_id]
    final_energy = job["iterations"][-1]["energy"] if job["iterations"] else job["hf_energy"]
    
    return {
        "job_id": job_id,
        "total_energy": final_energy,
        "electronic_energy": final_energy,
        "hartree_fock_energy": job["hf_energy"],
        "num_iterations": len(job["iterations"]),
        "converged": True,
        "backend": "Mock Exact Simulator"
    }
