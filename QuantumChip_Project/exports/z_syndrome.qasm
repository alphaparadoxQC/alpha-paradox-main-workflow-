OPENQASM 3.0;
include "stdgates.inc";

// Z-Syndrome Extraction for Ancilla Q_anc_1 (Surface Code Weight-4)
qubit a; // Ancilla Q_anc_1
qubit dN; // Data North Q_data_N
qubit dE; // Data East Q_data_E
qubit dS; // Data South Q_data_S
qubit dW; // Data West Q_data_W
bit c;

reset a;
cx dN, a;
cx dE, a;
cx dS, a;
cx dW, a;
c[0] = measure a;
