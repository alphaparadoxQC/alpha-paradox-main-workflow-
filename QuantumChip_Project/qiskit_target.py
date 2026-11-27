import pandas as pd
import os
import sys

def build_custom_target():
    print("=== Qiskit Transpiler Target Construction ===")
    
    try:
        from qiskit.transpiler import Target, InstructionProperties
        from qiskit.circuit.library import CXGate, SXGate, RZGate, XGate, Measure
        from qiskit.circuit import Parameter
    except ImportError as e:
        print(f"Error importing Qiskit: {e}")
        print("Note: The 'quantumchip' environment might not have modern qiskit natively.")
        sys.exit(1)
        
    coords_file = os.path.join("exports", "qubit_coordinates.csv")
    if not os.path.exists(coords_file):
        print(f"Error: Could not find {coords_file}. Run main.py first.")
        sys.exit(1)
        
    df = pd.read_csv(coords_file)
    num_qubits = len(df)
    print(f"Loaded {num_qubits} qubits from layout.")
    
    # 1. Initialize Target
    target = Target(num_qubits=num_qubits)
    
    # 2. Add Single Qubit Gates (assumed uniform single qubit capability)
    # Properties: typical T1/T2 ~ 100us, gate time ~ 30ns, error ~ 1e-4
    rz_props = {q: InstructionProperties(duration=0.0, error=0.0) for q in range(num_qubits)}
    sx_props = {q: InstructionProperties(duration=3e-8, error=1e-4) for q in range(num_qubits)}
    x_props = {q: InstructionProperties(duration=3e-8, error=1e-4) for q in range(num_qubits)}
    measure_props = {q: InstructionProperties(duration=5e-7, error=1e-2) for q in range(num_qubits)}
    
    theta = Parameter('theta')
    target.add_instruction(RZGate(theta), rz_props)
    target.add_instruction(SXGate(), sx_props)
    target.add_instruction(XGate(), x_props)
    target.add_instruction(Measure(), measure_props)
    
    # 3. Add Two Qubit Gates (CX) based on topology
    # Our architecture utilizes a bus network. For the transpiler, we define 
    # the feasible native coupling graph. For demonstration, we add nearest neighbors.
    print("Constructing sparse coupling map...")
    cx_props = {}
    
    # Add vertical and horizontal nearest neighbors from grid
    rows, cols = 25, 44
    for r in range(rows):
        for c in range(cols):
            q_idx = r * cols + c
            # Right neighbor
            if c < cols - 1:
                q_right = q_idx + 1
                cx_props[(q_idx, q_right)] = InstructionProperties(duration=2e-7, error=1e-3)
                cx_props[(q_right, q_idx)] = InstructionProperties(duration=2e-7, error=1e-3)
            # Bottom neighbor
            if r < rows - 1:
                q_down = q_idx + cols
                cx_props[(q_idx, q_down)] = InstructionProperties(duration=2e-7, error=1e-3)
                cx_props[(q_down, q_idx)] = InstructionProperties(duration=2e-7, error=1e-3)
            
    target.add_instruction(CXGate(), cx_props)
    
    print(f"Target successfully constructed for {num_qubits} qubits.")
    print(f"Coupling map contains {len(cx_props)} directed edges.")
    print(f"Basis gates: {target.operation_names}")
    
    print("\nNext Step: Run `transpile(circuit, target=target)` to map logical algorithms to this chip.")

if __name__ == "__main__":
    build_custom_target()
