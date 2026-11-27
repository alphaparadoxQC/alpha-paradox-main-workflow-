import requests
import json
import time

class AlphaClient:
    def __init__(self, api_url="http://localhost:8000", api_key=None):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({"Authorization": f"Bearer {self.api_key}"})

    def run_circuit(self, qasm_code: str, backend_name: str = "aer_statevector", shots: int = 1024):
        """Submit a QASM circuit to the Alpha Engine."""
        payload = {
            "code": qasm_code,
            "language": "qasm2",
            "backend_name": backend_name,
            "shots": shots
        }
        resp = self.session.post(f"{self.api_url}/execute", json=payload)
        resp.raise_for_status()
        return resp.json()

    def run_analog(self, analog_payload: dict):
        """Submit a raw TCAD Analog payload for simulation."""
        resp = self.session.post(f"{self.api_url}/analog/run", json=analog_payload)
        resp.raise_for_status()
        return resp.json()

    def load_project(self, alpha_ir_path: str):
        """Load an AlphaIR (.alpha) file and extract its circuits and analog config."""
        with open(alpha_ir_path, 'r') as f:
            return json.load(f)
