import asyncio
from jupyter_client.manager import AsyncKernelManager

async def main():
    km = AsyncKernelManager(kernel_name='python3')
    await km.start_kernel()
    client = km.client()
    client.start_channels()
    await client.wait_for_ready()
    print("Kernel ready!")
    await km.shutdown_kernel()

asyncio.run(main())
