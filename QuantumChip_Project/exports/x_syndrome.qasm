OPENQASM 3.0;
include "stdgates.inc";

// X-Syndrome Extraction for Ancilla Q_anc_2 (Surface Code Weight-4)
qubit a; // Ancilla Q_anc_2
qubit dN; // Data North Q_data_N
qubit dE; // Data East Q_data_E
qubit dS; // Data South Q_data_S
qubit dW; // Data West Q_data_W
bit c;

reset a;
h a;
cx a, dN;
cx a, dE;
cx a, dS;
cx a, dW;
h a;
c[0] = measure a;
