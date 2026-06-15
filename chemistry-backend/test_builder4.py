import sys
from routers.builder import _build_gate_circuit, _build_excitation_list

# Test with our values
qubits = 8
active_electrons = 4
spin_orbitals = 8
active_orbitals = 4

print("Starting _build_gate_circuit")
gates, sections, param_idx = _build_gate_circuit(
    qubits, active_electrons, spin_orbitals, active_orbitals,
    "UCCSD", "Jordan-Wigner", 0
)
print("done")
