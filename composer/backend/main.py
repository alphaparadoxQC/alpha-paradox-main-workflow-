import asyncio
import json
import logging
import psutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from auth import get_current_user, get_current_user_optional
from pydantic import BaseModel
from typing import Optional, Any
import os
import uuid
from supabase import create_client, Client
from worker import execute_long_quantum_job, execute_vqpu_job

local_jobs_cache = {}

from kernel_manager import orchestrator

# Initialize Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "http://localhost:8000")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "dummy")
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception:
    supabase = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("api_gateway")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Quantum Kernel API Gateway starting up...")
    yield
    logger.info("Shutting down all active kernel sessions...")
    await orchestrator.shutdown_all()

app = FastAPI(
    title="Alpha Paradox Quantum Kernel Gateway",
    description="Orchestrator and WebSocket Bridge for Isolated Quantum Execution Kernels",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from eda_router import router as eda_api_router
app.include_router(eda_api_router)


class ExecuteRequest(BaseModel):
    code: str
    cell_id: Optional[str] = None

class NotebookData(BaseModel):
    name: str
    content_json: Any

class JobRequest(BaseModel):
    circuit_json: str
    shots: int = 1024
    processor: str = "CPU"
    backend: str = "statevector"
    noise_config: Optional[dict] = None
    cloud_config: Optional[dict] = None  # { provider, api_token, backend_name }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "quantum-kernel-gateway",
        "active_kernels": len(orchestrator.sessions)
    }

@app.get("/api/system/metrics")
async def system_metrics():
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    return {
        "ram_percent": mem.percent,
        "ram_used_gb": round((mem.total - mem.available) / (1024 ** 3), 2),
        "ram_total_gb": round(mem.total / (1024 ** 3), 2),
        "disk_percent": disk.percent,
        "disk_used_gb": round(disk.used / (1024 ** 3), 2),
        "disk_total_gb": round(disk.total / (1024 ** 3), 2),
        "cpu_percent": psutil.cpu_percent(interval=None)
    }

@app.post("/api/kernels/{session_id}/execute")
async def execute_cell(session_id: str, req: ExecuteRequest):
    session = orchestrator.get_or_create_session(session_id)
    if not session.is_running:
        success = await session.start()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to initialize kernel")
            
    msg_id = await session.execute_code(req.code, cell_id=req.cell_id)
    return {"status": "queued", "msg_id": msg_id, "session_id": session_id}

@app.post("/api/kernels/{session_id}/interrupt")
async def interrupt_kernel(session_id: str):
    session = orchestrator.get_or_create_session(session_id)
    await session.interrupt()
    return {"status": "interrupted", "session_id": session_id}

@app.post("/api/kernels/{session_id}/restart")
async def restart_kernel(session_id: str):
    session = orchestrator.get_or_create_session(session_id)
    await session.restart()
    return {"status": "restarted", "session_id": session_id}

@app.get("/api/notebooks")
async def list_notebooks():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        response = supabase.table("notebooks").select("id, name, created_at, updated_at").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notebooks")
async def save_notebook(data: NotebookData, user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        response = supabase.table("notebooks").insert({
            "name": data.name,
            "content_json": data.content_json
        }).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class JobTracker:
    def __init__(self, jid):
        self.id = jid
        self.state = "RUNNING"
        self.result = None
        self.info = {"status": "Job queued for execution...", "progress": 5}
    def update_state(self, state="PROGRESS", meta=None):
        self.state = state
        self.info = meta or {}

@app.post("/api/jobs/submit")
async def submit_job(req: JobRequest, background_tasks: BackgroundTasks, user: Optional[dict] = Depends(get_current_user_optional)):
    """Submit a quantum simulation job to the background worker runner."""
    job_id = str(uuid.uuid4())
    tracker = JobTracker(job_id)
    local_jobs_cache[job_id] = tracker
    
    def run_worker():
        from worker import execute_vqpu_job as run_sync
        try:
            run_sync.update_tracker = tracker.update_state
            res = run_sync(
                circuit_json=req.circuit_json,
                shots=req.shots,
                processor=req.processor,
                backend=req.backend,
                noise_config=req.noise_config,
                cloud_config=req.cloud_config,
            )
            if isinstance(res, dict) and res.get("status") == "FAILED":
                tracker.state = "FAILURE"
                tracker.info = {"status": res.get("error", "Execution failed"), "error": res.get("error")}
                tracker.result = res
            else:
                tracker.state = "SUCCESS"
                tracker.result = res
        except Exception as exec_err:
            tracker.state = "FAILURE"
            tracker.info = {"status": f"Execution failed: {str(exec_err)}", "error": str(exec_err)}
            tracker.result = {"status": "FAILED", "error": str(exec_err)}

    background_tasks.add_task(run_worker)
    return {"job_id": job_id, "status": "submitted", "processor": req.processor, "backend": req.backend}

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id in local_jobs_cache:
        task = local_jobs_cache[job_id]
        if task.state == 'SUCCESS':
            result_data = task.result
            return {
                'state': 'COMPLETED',
                'status': result_data.get('status', 'COMPLETED') if isinstance(result_data, dict) else 'COMPLETED',
                'progress': 100,
                'result': result_data.get('result') if isinstance(result_data, dict) else result_data,
            }
        elif task.state == 'FAILURE':
            err_msg = task.info.get('status') or task.info.get('error') or 'Job failed'
            return {'state': 'FAILURE', 'status': err_msg, 'error': err_msg}
        else:
            return {
                'state': task.state,
                'status': task.info.get('status', 'Processing...'),
                'progress': task.info.get('progress', 50)
            }

    try:
        task = execute_vqpu_job.AsyncResult(job_id)
        if task.state == 'PENDING':
            response = {'state': task.state, 'status': 'Pending...'}
        elif task.state == 'SUCCESS':
            result_data = task.result
            response = {
                'state': 'COMPLETED',
                'status': result_data.get('status', 'COMPLETED') if isinstance(result_data, dict) else 'COMPLETED',
                'progress': 100,
                'result': result_data.get('result') if isinstance(result_data, dict) else result_data,
            }
        elif task.state == 'FAILURE':
            response = {'state': task.state, 'status': str(task.info)}
        else:
            response = {
                'state': task.state,
                'status': task.info.get('status', '') if isinstance(task.info, dict) else '',
                'progress': task.info.get('progress', 0) if isinstance(task.info, dict) else 0
            }
        return response
    except Exception as e:
        return {'state': 'FAILURE', 'status': str(e)}

@app.get("/api/jobs/{job_id}/result")
async def get_job_result(job_id: str):
    """Get the full simulation result for a completed job."""
    if job_id in local_jobs_cache:
        task = local_jobs_cache[job_id]
        if task.state != 'SUCCESS':
            raise HTTPException(status_code=404, detail=f"Job not completed. Current state: {task.state}")
        result_data = task.result
        if isinstance(result_data, dict):
            return result_data.get('result', result_data)
        return result_data

    task = execute_vqpu_job.AsyncResult(job_id)
    if task.state != 'SUCCESS':
        raise HTTPException(status_code=404, detail=f"Job not completed. Current state: {task.state}")
    result_data = task.result
    if isinstance(result_data, dict):
        return result_data.get('result', result_data)
    return result_data

class AnalogSimRequest(BaseModel):
    nodes: list
    edges: list

@app.post("/api/analog/simulate")
async def analog_simulate(req: AnalogSimRequest):
    """Run an analog physics simulation from the node graph."""
    from analog_engine import interpret_graph
    try:
        result = interpret_graph({"nodes": req.nodes, "edges": req.edges})
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {e}")

@app.get("/api/vqpu/info")
async def get_vqpu_info():
    """Return Alpha-Paradox chip specifications and status."""
    from vqpu_engine import AlphaParadoxVQPU
    vqpu = AlphaParadoxVQPU()
    return vqpu.get_info()

class PackageModeAnalyzeRequest(BaseModel):
    Lx: float = 30.0
    Ly: float = 30.0
    Lz: float = 3.0
    t: float = 0.5
    eps_r: float = 11.9
    n: int = 10
    pitch: float = 3.0
    px: float = 3.41e-10
    a: int = 1
    b: int = 1

@app.get("/api/eda/package_modes/defaults")
async def get_package_modes_defaults():
    import package_modes as pm
    return {
        "device": pm.DEVICE,
        "paper": {k: v for k, v in pm.PAPER.items() if not isinstance(v, dict)}
    }

@app.post("/api/eda/package_modes/analyze")
async def analyze_package_modes(req: PackageModeAnalyzeRequest):
    """Analytical package-mode and qubit coupling analysis following arXiv:2609.22442."""
    import package_modes as pm
    import numpy as np
    try:
        f_empty = pm.C0 / 2 * np.hypot(1 / (req.Lx * 1e-3), 1 / (req.Ly * 1e-3))
        mode = pm.lsm_mode(req.a, req.b, Lx=req.Lx, Ly=req.Ly, Lz=req.Lz, t=req.t, eps_r=req.eps_r)
        kC, A = pm.dipole_coupling(req.px, mode)
        centers = pm.qubit_centers(req.n, req.pitch)
        
        qubits = []
        for (i, j), (xq, yq) in centers.items():
            g_val = A * np.cos(req.a * np.pi * (xq * 1e-3) / (req.Lx * 1e-3)) * np.sin(req.b * np.pi * (yq * 1e-3) / (req.Ly * 1e-3))
            qubits.append({
                "col": i,
                "row": j,
                "x_mm": round(float(xq), 3),
                "y_mm": round(float(yq), 3),
                "g_Hz": float(g_val),
                "g_MHz": float(g_val / 1e6)
            })
            
        return {
            "mode": f"LSM_{req.a}{req.b}0",
            "f_empty_GHz": float(f_empty / 1e9),
            "f_mode_GHz": float(mode.f / 1e9),
            "kz_si_inv_m": float(mode.kz_si),
            "kz_air_inv_m": float(mode.kz_air),
            "E0x_MV_per_m": float(mode.E0x / 1e6),
            "A_dipole_MHz": float(A / 1e6),
            "kC": float(kC),
            "qubit_count": len(qubits),
            "qubits": qubits,
            "comparison": {
                "paper_f_empty_GHz": float(pm.PAPER["f_empty"] / 1e9),
                "paper_f_si_GHz": float(pm.PAPER["f_si"] / 1e9),
                "paper_A_110_dipole_MHz": float(pm.PAPER["A_110_dipole"] / 1e6),
                "paper_A_210_dipole_MHz": float(pm.PAPER["A_210_dipole"] / 1e6),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Package mode analysis failed: {e}")

@app.websocket("/ws/kernel/{session_id}")
async def kernel_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected for session: {session_id}")
    
    session = orchestrator.get_or_create_session(session_id)

    # Handler to forward IOPub and kernel events directly down the WebSocket
    async def forward_to_ws(msg: dict):
        try:
            await websocket.send_text(json.dumps(msg))
        except Exception as e:
            logger.error(f"Failed to forward message to WS: {e}, msg={msg}")

    session.register_handler(forward_to_ws)

    # Always start a fresh kernel for a new WebSocket connection.
    # This avoids stale state, dead handlers, and zombie containers.
    if not session.is_running:
        await websocket.send_text(json.dumps({"type": "status", "status": "starting"}))
        started = await session.start()
        if not started:
            await websocket.send_text(json.dumps({"type": "status", "status": "error", "error": "Kernel startup failed"}))
    else:
        # Kernel already running from this session — just confirm status
        await websocket.send_text(json.dumps({"type": "status", "status": session.status}))

    # Background task for streaming system metrics
    metrics_task = asyncio.create_task(_stream_metrics(websocket))

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
            except json.JSONDecodeError:
                continue

            action = msg.get("action")
            cell_id = msg.get("cell_id")

            if action == "execute":
                code = msg.get("code", "")
                logger.info(f"Execute request: cell_id={cell_id}, code={code[:50]!r}, is_running={session.is_running}, handlers={len(session.message_handlers)}")
                try:
                    msg_id = await session.execute_code(code, cell_id=cell_id)
                    logger.info(f"Execute dispatched: msg_id={msg_id}, cell_id={cell_id}")
                except Exception as e:
                    logger.error(f"Execute error: {e}")
                    await websocket.send_text(json.dumps({
                        "type": "output",
                        "cell_id": cell_id,
                        "output": {
                            "output_type": "error",
                            "ename": "ExecutionError",
                            "evalue": str(e),
                            "traceback": [str(e)]
                        }
                    }))

            elif action == "interrupt":
                await session.interrupt()

            elif action == "restart":
                await session.restart()

            elif action == "get_variables":
                vars_list = await session.get_variables()
                await websocket.send_text(json.dumps({"type": "variables", "data": vars_list}))

            elif action == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        logger.info(f"Client disconnected for session: {session_id}")
    except Exception as e:
        logger.warning(f"WebSocket exception for session {session_id}: {e}")
    finally:
        metrics_task.cancel()
        # Remove this specific handler to prevent leaks
        if forward_to_ws in session.message_handlers:
            session.message_handlers.remove(forward_to_ws)

async def _stream_metrics(websocket: WebSocket):
    """Periodically push RAM and Disk usage every 3 seconds."""
    try:
        while True:
            await asyncio.sleep(3)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            metrics = {
                "type": "resource_metrics",
                "ram_percent": mem.percent,
                "disk_percent": disk.percent,
                "ram_used_gb": round((mem.total - mem.available) / (1024 ** 3), 2),
                "ram_total_gb": round(mem.total / (1024 ** 3), 2),
                "disk_used_gb": round(disk.used / (1024 ** 3), 2),
                "disk_total_gb": round(disk.total / (1024 ** 3), 2),
            }
            await websocket.send_text(json.dumps(metrics))
    except (asyncio.CancelledError, Exception):
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
