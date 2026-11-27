OPENQASM 3.0;
include "stdgates.inc";

// ============================================================================
// qLDPC Bivariate Bicycle Check Matrix Syndrome Extraction (Weight-6)
// Target Ancilla: Q_check_102
// Non-Local Data Qubit Targets: Q_data_45, Q_data_46, Q_data_189, Q_data_190, Q_data_540, Q_data_882
// Bus Routing SWAP Nodes: Q_bus_hop_r2_c10, Q_bus_hop_r12_c10
// ============================================================================

qubit a;          // Check Ancilla Q_check_102
qubit d1;         // Local Data Qubit Q_data_45
qubit d2;         // Local Data Qubit Q_data_46
qubit d3_far;     // Non-Local Data Qubit Q_data_189 (Across Row Bus)
qubit d4_far;     // Non-Local Data Qubit Q_data_190 (Across Row Bus)
qubit d5_dist;    // Distant Data Qubit Q_data_540 (Across Col Bus)
qubit d6_dist;    // Distant Data Qubit Q_data_882 (Across Col Bus)

// Intermediate bus routing qubits used as SWAP chains
qubit bus_hop_1;  // Routing node Q_bus_hop_r2_c10
qubit bus_hop_2;  // Routing node Q_bus_hop_r12_c10
bit c;

reset a;
h a;

// 1. Entangle local nearest-neighbor data qubits
cx a, d1;
cx a, d2;

// 2. SWAP-Network routing to reach non-local horizontal targets (d3_far, d4_far)
swap a, bus_hop_1;
cx bus_hop_1, d3_far;
cx bus_hop_1, d4_far;
swap a, bus_hop_1; // Return state to check ancilla

// 3. SWAP-Network routing along vertical bus to reach distant targets (d5_dist, d6_dist)
swap a, bus_hop_2;
cx bus_hop_2, d5_dist;
cx bus_hop_2, d6_dist;
swap a, bus_hop_2; // Return state to check ancilla

h a;
c[0] = measure a;
