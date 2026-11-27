import os

def generate_pulse_control():
    print("=== Qiskit Dynamics Pulse Control Definition ===")
    
    print("\n1. Single-Qubit Gates (DRAG Pulses)")
    print("   To minimize leakage into the |2> state of the transmon, we define a")
    print("   Derivative Removal by Adiabatic Gate (DRAG) envelope.")
    
    drag_code = """
from qiskit import pulse
from qiskit.pulse.library import Drag

with pulse.build(name='drag_pi') as drag_pi_pulse:
    pulse.play(Drag(duration=160, amp=0.1, sigma=40, beta=0.5), pulse.DriveChannel(0))
    """
    print(drag_code)
    
    print("2. Two-Qubit Gates (Cross-Resonance)")
    print("   For the static-frequency crossbar architecture, we use the Cross-Resonance (CR) interaction.")
    print("   We define a flat-topped Gaussian pulse applied to the control qubit at the frequency of the target qubit.")
    
    cr_code = """
from qiskit.pulse.library import GaussianSquare

with pulse.build(name='cr_gate') as cr_pulse:
    # Drive target freq on control channel
    pulse.play(GaussianSquare(duration=800, amp=0.05, sigma=64, width=544), pulse.ControlChannel(0))
    """
    print(cr_code)
    
    print("These pulse schedules will be calibrated against the Hamiltonians extracted from the EPR analysis.")

if __name__ == "__main__":
    generate_pulse_control()
