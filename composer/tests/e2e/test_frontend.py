import asyncio, websockets, json, time

async def test():
    # Use a realistic session ID
    session_id = "e7d7722a-1014-4451-8502-f347969d30a5"
    uri = f'ws://127.0.0.1:8000/ws/kernel/{session_id}'
    try:
        async with websockets.connect(uri) as ws:
            print('Connected to WebSocket!')
            
            # Wait for idle
            while True:
                raw = await ws.recv()
                data = json.loads(raw)
                if data.get('type') == 'status' and data.get('status') == 'idle' and not data.get('cell_id'):
                    break
            
            # Now send exact payload from frontend
            cell_id = 'c1234567-890a-bcde-f012-3456789abcde'
            payload = {
                "action": "execute",
                "code": "# Try running this cell!\nprint(\"Hello, Quantum World!\")",
                "cell_id": cell_id
            }
            await ws.send(json.dumps(payload))
            print(f'Sent payload: {payload}')
            
            # Collect output
            start_time = time.time()
            while time.time() - start_time < 5:
                raw = await asyncio.wait_for(ws.recv(), timeout=5)
                data = json.loads(raw)
                if data.get('type') != 'resource_metrics':
                    print(f'RECV: {data}')
                if data.get('type') == 'status' and data.get('status') == 'idle' and data.get('cell_id') == cell_id:
                    print('=== CELL COMPLETED ===')
                    break
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(test())
