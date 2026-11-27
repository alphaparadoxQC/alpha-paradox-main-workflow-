import asyncio
import json
import logging
import uuid
import queue
import os
import sys
from typing import Dict, Optional, Callable, Awaitable
from jupyter_client.manager import AsyncKernelManager
from quantum_runtime import KERNEL_INIT_CODE, get_kernel_init_code

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
logger = logging.getLogger("kernel_manager")


class KernelSession:
    """
    Manages an active IPython kernel instance and its ZeroMQ channels
    for a single client session.
    """
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.client = None
        self.km: Optional[AsyncKernelManager] = None
        self.is_running = False
        self.iopub_task: Optional[asyncio.Task] = None
        self.message_handlers: list[Callable[[dict], Awaitable[None]]] = []
        self.execution_count = 0
        self.status = "disconnected"
        # Map msg_id -> cell_id so we can tag outputs back to the correct cell
        self._msg_to_cell: Dict[str, str] = {}
        self._start_lock = asyncio.Lock()

    def register_handler(self, handler: Callable[[dict], Awaitable[None]]):
        self.message_handlers.append(handler)

    async def broadcast(self, message: dict):
        for handler in self.message_handlers:
            try:
                await handler(message)
            except Exception as e:
                logger.warning(f"Handler broadcast error: {e}")

    async def start(self):
        """Start the IPython kernel locally and connect channels."""
        async with self._start_lock:
            if self.is_running:
                return True
            
            self.status = "starting"
            await self.broadcast({"type": "status", "status": "starting"})
        
        try:
            logger.info(f"Starting local kernel for session {self.session_id}")
            env = dict(os.environ)
            existing_pp = env.get("PYTHONPATH", "")
            env["PYTHONPATH"] = f"{_BACKEND_DIR}:{existing_pp}" if existing_pp else _BACKEND_DIR
            self.km = AsyncKernelManager(kernel_name='python3')
            await self.km.start_kernel(env=env, cwd=_BACKEND_DIR)
            self.client = self.km.client()
            self.client.start_channels()
            await self.client.wait_for_ready()
            logger.info(f"Local kernel ready")
        except Exception as e:
            logger.error(f"Failed to start local kernel: {e}")
            self.status = "error"
            await self.broadcast({"type": "status", "status": "error", "error": str(e)})
            return False

        self.is_running = True
        self.status = "idle"
        
        # Start background IOPub listener
        self.iopub_task = asyncio.create_task(self._listen_iopub())
        
        # Initialize quantum runtime environment in kernel
        await self.execute_code(KERNEL_INIT_CODE, silent=True)
        
        await self.broadcast({"type": "status", "status": "idle"})
        logger.info(f"Kernel fully initialized for session {self.session_id}")
        return True

    async def _listen_iopub(self):
        """Continuous listener for messages on the kernel's IOPub channel."""
        try:
            while self.is_running and self.client:
                try:
                    msg = await self.client.get_iopub_msg(timeout=1.0)
                except (asyncio.TimeoutError, queue.Empty):
                    continue
                except Exception as e:
                    logger.error(f"Error in IOPub listener: {e}", exc_info=True)
                    break

                if not msg:
                    continue

                msg_type = msg.get("header", {}).get("msg_type")
                content = msg.get("content", {})
                parent_header = msg.get("parent_header", {})
                # Resolve the msg_id from the parent header back to the original cell_id
                parent_msg_id = parent_header.get("msg_id", "")
                cell_id = self._msg_to_cell.get(parent_msg_id, parent_msg_id)

                if msg_type == "status":
                    execution_state = content.get("execution_state")
                    self.status = execution_state
                    await self.broadcast({
                        "type": "status",
                        "status": execution_state,
                        "cell_id": cell_id
                    })

                elif msg_type == "stream":
                    name = content.get("name", "stdout")
                    text = content.get("text", "")
                    await self.broadcast({
                        "type": "output",
                        "cell_id": cell_id,
                        "output": {
                            "output_type": "stream",
                            "name": name,
                            "text": text
                        }
                    })

                elif msg_type in ("display_data", "execute_result"):
                    data = content.get("data", {})
                    metadata = content.get("metadata", {})
                    exec_count = content.get("execution_count")
                    if exec_count is not None:
                        self.execution_count = exec_count

                    await self.broadcast({
                        "type": "output",
                        "cell_id": cell_id,
                        "output": {
                            "output_type": msg_type,
                            "data": data,
                            "metadata": metadata,
                            "execution_count": exec_count
                        }
                    })

                elif msg_type == "error":
                    ename = content.get("ename", "Error")
                    evalue = content.get("evalue", "")
                    traceback = content.get("traceback", [])
                    await self.broadcast({
                        "type": "output",
                        "cell_id": cell_id,
                        "output": {
                            "output_type": "error",
                            "ename": ename,
                            "evalue": evalue,
                            "traceback": traceback
                        }
                    })

                elif msg_type == "execute_input":
                    exec_count = content.get("execution_count")
                    if exec_count is not None:
                        self.execution_count = exec_count
                    await self.broadcast({
                        "type": "execution_count",
                        "cell_id": cell_id,
                        "execution_count": exec_count
                    })

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"IOPub listener error in session {self.session_id}: {e}")

    async def execute_code(self, code: str, cell_id: Optional[str] = None, silent: bool = False):
        """Send code to the kernel on the shell channel."""
        if not self.client:
            raise RuntimeError("Kernel client not connected")

        # jupyter_client.execute() returns the msg_id it assigned
        msg_id = self.client.execute(
            code=code,
            silent=silent,
            store_history=not silent,
            user_expressions={},
            allow_stdin=False,
            stop_on_error=True
        )
        
        # Map the kernel's msg_id back to the cell_id so IOPub outputs get tagged correctly
        if cell_id:
            self._msg_to_cell[msg_id] = cell_id
        
        return msg_id

    async def interrupt(self):
        """Send interrupt signal to the kernel."""
        if self.km:
            try:
                await self.km.interrupt_kernel()
            except Exception as e:
                logger.error(f"Failed to interrupt local kernel: {e}")

    async def restart(self):
        """Restart the kernel cleanly by stopping and starting the container."""
        self.status = "restarting"
        await self.broadcast({"type": "status", "status": "restarting"})
        
        await self.shutdown()
        success = await self.start()
        
        if success:
            await self.broadcast({"type": "status", "status": "idle", "restarted": True})

    async def get_variables(self) -> list:
        """Fetch current Python workspace variables from the kernel."""
        if not self.is_running:
            return []
        try:
            self.client.execute(
                code="__inspect_variables__()",
                silent=False,
                store_history=False
            )
            return []
        except Exception:
            return []

    async def shutdown(self):
        """Cleanly shutdown the kernel."""
        self.is_running = False
        self.status = "disconnected"
        
        if self.iopub_task:
            self.iopub_task.cancel()
            
        if self.client:
            try:
                self.client.stop_channels()
            except Exception:
                pass
                
        if self.km:
            try:
                await self.km.shutdown_kernel()
            except Exception as e:
                logger.error(f"Failed to shutdown local kernel: {e}")
                
        self.client = None
        self.km = None
        self._msg_to_cell.clear()


class SessionOrchestrator:
    """
    Singleton gateway managing active user sessions and their kernel processes.
    """
    def __init__(self):
        self.sessions: Dict[str, KernelSession] = {}

    def get_or_create_session(self, session_id: str) -> KernelSession:
        if session_id not in self.sessions:
            self.sessions[session_id] = KernelSession(session_id)
        return self.sessions[session_id]

    async def remove_session(self, session_id: str):
        if session_id in self.sessions:
            session = self.sessions.pop(session_id)
            await session.shutdown()

    async def shutdown_all(self):
        for session_id in list(self.sessions.keys()):
            await self.remove_session(session_id)


orchestrator = SessionOrchestrator()
