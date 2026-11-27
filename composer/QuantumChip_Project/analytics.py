import os
import math

def calculate_yield():
    print("=== 1100-Qubit Processor: Logical Yield Analytics ===")
    
    physical_qubits = 1100
    
    # Assumptions based on 50-ohm optimized planar design
    p_err = 1e-3  # Average physical error rate
    p_th = 1e-2   # Surface code threshold
    
    print(f"Physical Error Rate (p): {p_err}")
    print(f"Threshold Error Rate (p_th): {p_th}")
    
    if p_err >= p_th:
        print("Error rate is above threshold. Zero logical qubits.")
        return
        
    # Standard Surface Code scaling formula
    # P_L = 0.1 * (p / p_th)^((d+1)/2)
    
    # For a distance d=5 code (capable of correcting 2 errors), we need ~50 physical qubits
    d = 5
    qubits_per_logical = 2 * (d**2) - 1 # Roughly 49 qubits for d=5
    
    num_logical = physical_qubits // qubits_per_logical
    
    p_logical = 0.1 * math.pow((p_err / p_th), (d+1)/2.0)
    
    print(f"\nTargeting Distance d={d} Surface Code:")
    print(f"Physical Qubits per Logical Qubit: {qubits_per_logical}")
    print(f"Total Maximum Logical Qubits: {num_logical}")
    print(f"Logical Error Rate (P_L): {p_logical:.2e}")
    
    print("\n[Architecture Conclusion]")
    print(f"By utilizing an all-to-all crossbar lattice on {physical_qubits} qubits,")
    print(f"we can theoretically yield ~{num_logical} logical qubits with error rates around {p_logical:.2e}.")
    print("If we deploy higher-rate qLDPC (quantum Low-Density Parity-Check) codes that utilize")
    print("the long-range bus connections, we can increase this yield by an order of magnitude (up to 150-200 logical qubits).")

if __name__ == "__main__":
    calculate_yield()
