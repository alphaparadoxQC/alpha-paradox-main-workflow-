import asyncio
from jupyter_client.manager import AsyncKernelManager

async def main():
    km = AsyncKernelManager(kernel_name='python3')
    await km.start_kernel()
    client = km.client()
    client.start_channels()
    await client.wait_for_ready()
    
    from backend.quantum_runtime import KERNEL_INIT_CODE
    client.execute(KERNEL_INIT_CODE, silent=True)
    
    code = """
from alpha import QuantumCircuit, QuantumRegister, ClassicalRegister
from alpha.circuit.library import QFT
import numpy as np

# Shor's Algorithm: Factor N=15, a=7
N = 15
a = 7
n_count = 8

qc = QuantumCircuit(n_count + 4, n_count)
for q in range(n_count):
    qc.h(q)
qc.x(n_count)
for q in range(n_count):
    power = 2 ** q
    if a == 7:
        if power % 4 == 1:
            qc.cswap(q, n_count, n_count+1)
            qc.cswap(q, n_count+1, n_count+2)
            qc.cswap(q, n_count+2, n_count+3)

qc.append(QFT(n_count, inverse=True), range(n_count))
qc.measure(range(n_count), range(n_count))
print("Shor circuit successfully built in kernel!")
print(f"Num qubits: {qc.num_qubits}, Num clbits: {qc.num_clbits}")
"""
    msg_id = client.execute(code)
    
    while True:
        msg = await client.get_iopub_msg()
        mtype = msg.get('msg_type')
        content = msg.get('content', {})
        parent = msg.get('parent_header', {}).get('msg_id')
        
        if parent == msg_id:
            if mtype == 'stream':
                print(f"[STDOUT]: {content.get('text')}", end='')
            elif mtype == 'error':
                print(f"[ERROR]: {content.get('ename')}: {content.get('evalue')}")
                for line in content.get('traceback', []):
                    print(line)
            elif mtype == 'status' and content.get('execution_state') == 'idle':
                print("[KERNEL STATUS]: idle")
                break

    await km.shutdown_kernel()

asyncio.run(main())
