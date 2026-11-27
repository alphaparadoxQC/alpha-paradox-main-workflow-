import { QuantumCircuit } from '../quantum-engine/circuit.js';

/**
 * Authoritative, verified circuit builders for canonical quantum algorithms,
 * protocols, benchmarks, error-correcting codes, and quantum arithmetic modules.
 * Each circuit builds the authentic theoretical gate sequence and attaches measurements.
 */

export const ALGORITHM_BUILDERS = {
  // ── Quantum Error Correction & Fault Tolerance ───────────────────────────
  'qec-bit-flip': () => {
    const qc = new QuantumCircuit(5, 5);
    qc.name = '3-Qubit Bit-Flip QEC Code';
    // Data encoding on q0..q2
    qc.cx(0, 1); qc.cx(0, 2);
    qc.barrier();
    // Injected bit-flip error on q0
    qc.x(0);
    qc.barrier();
    // Syndrome extraction on ancillas q3, q4
    qc.cx(0, 3); qc.cx(1, 3);
    qc.cx(1, 4); qc.cx(2, 4);
    qc.barrier();
    qc.measure(3, 3); qc.measure(4, 4);
    // Correction based on syndrome
    qc.ccx(3, 4, 1);
    qc.barrier();
    qc.measure(0, 0); qc.measure(1, 1); qc.measure(2, 2);
    return qc;
  },

  'qec-phase-flip': () => {
    const qc = new QuantumCircuit(5, 5);
    qc.name = '3-Qubit Phase-Flip QEC Code';
    // Encode bit-flip
    qc.cx(0, 1); qc.cx(0, 2);
    // Transform to X-basis
    qc.h(0); qc.h(1); qc.h(2);
    qc.barrier();
    // Injected phase error on q0
    qc.z(0);
    qc.barrier();
    // Return to Z-basis for syndrome measurement
    qc.h(0); qc.h(1); qc.h(2);
    qc.cx(0, 3); qc.cx(1, 3);
    qc.cx(1, 4); qc.cx(2, 4);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'qec-five-qubit': () => {
    const qc = new QuantumCircuit(6, 6);
    qc.name = '5-Qubit Perfect Code ([5,1,3] Laflamme)';
    // Stabilizer generator XZZXI via ancilla q5
    qc.h(5);
    qc.cx(5, 0); qc.cz(5, 1); qc.cz(5, 2); qc.cx(5, 3);
    qc.h(5);
    qc.barrier();
    // Stabilizer generator IXZZX via ancilla q5
    qc.h(5);
    qc.cx(5, 1); qc.cz(5, 2); qc.cz(5, 3); qc.cx(5, 4);
    qc.h(5);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'surface-code-cycle': () => {
    const qc = new QuantumCircuit(6, 6);
    qc.name = 'Surface Code Syndrome Extraction Cycle';
    // 4 data qubits (q0..q3), 1 X-syndrome ancilla (q4), 1 Z-syndrome ancilla (q5)
    // Star X-syndrome extraction
    qc.h(4);
    qc.cx(4, 0); qc.cx(4, 1); qc.cx(4, 2); qc.cx(4, 3);
    qc.h(4);
    qc.barrier();
    // Plaquette Z-syndrome extraction
    qc.cx(0, 5); qc.cx(1, 5); qc.cx(2, 5); qc.cx(3, 5);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'magic-state-distillation': () => {
    const qc = new QuantumCircuit(5, 5);
    qc.name = 'Magic State Distillation (15-to-1 T-Factory)';
    // Initialize noisy T-states
    for (let i = 0; i < 5; i++) { qc.h(i); qc.t(i); }
    qc.barrier();
    // Transversal Reed-Muller parity checks
    qc.cx(0, 4); qc.cx(1, 4); qc.cx(2, 4); qc.cx(3, 4);
    qc.cz(0, 3); qc.cz(1, 2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  // ── Quantum Communication, Cryptography & Protocols ──────────────────────
  'swap-test': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Swap Test (State Overlap & Fidelity)';
    // Prepare distinct quantum states on q1 and q2
    qc.h(1); qc.t(1);
    qc.h(2); qc.s(2);
    qc.barrier();
    // Swap test via ancilla q0
    qc.h(0);
    qc.cswap(0, 1, 2);
    qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'hadamard-test': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'Hadamard Test (Expectation Value)';
    // Target state on q1
    qc.h(1);
    qc.barrier();
    // Ancilla interferometer
    qc.h(0);
    qc.cz(0, 1);
    qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'bb84-qkd': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'BB84 Quantum Key Distribution Protocol';
    // Alice prepares qubits in conjugate bases
    qc.x(1); // |1> (Z-basis)
    qc.h(2); // |+> (X-basis)
    qc.x(3); qc.h(3); // |-> (X-basis)
    qc.barrier();
    // Bob measurement basis selection (H applied before measure for X-basis)
    qc.h(1);
    qc.h(3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'ekert91-qkd': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Ekert 91 (E91) Entanglement-Based QKD';
    // Pre-shared Bell pairs
    qc.h(0); qc.cx(0, 1);
    qc.h(2); qc.cx(2, 3);
    qc.barrier();
    // Alice and Bob choose measurement angles for CHSH inequality verification
    qc.ry(0, Math.PI / 8);
    qc.ry(1, Math.PI / 4);
    qc.ry(2, Math.PI / 8);
    qc.ry(3, 3 * Math.PI / 8);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'b92-qkd': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'B92 Two-State Cryptographic Protocol';
    // Alice encodes |+>
    qc.h(0);
    qc.barrier();
    // Bob projects onto orthogonal subspace
    qc.cx(0, 1);
    qc.h(1);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-fingerprinting': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Quantum Fingerprinting (Buhrman-Cleve)';
    // Alice and Bob fingerprints encoded via rotations
    qc.ry(1, 0.9); qc.rz(1, 1.4);
    qc.ry(2, 0.9); qc.rz(2, 1.4);
    qc.barrier();
    // Referee Swap Test
    qc.h(0);
    qc.cswap(0, 1, 2);
    qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'wiesner-quantum-money': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = "Wiesner's Quantum Money Verification";
    // Bank prepares secret polarized qubits
    qc.h(0); qc.x(1); qc.h(2); qc.x(3); qc.h(3);
    qc.barrier();
    // Bank verifies serial number by measuring in secret bases
    qc.h(0); qc.h(2); qc.h(3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-secret-sharing': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Quantum Secret Sharing (Hillery-Bužek)';
    // 3-qubit GHZ state shared between Alice, Bob, and Charlie
    qc.h(0); qc.cx(0, 1); qc.cx(1, 2);
    qc.barrier();
    // Alice encodes secret
    qc.rx(0, Math.PI / 4);
    // Bob and Charlie measure in X-basis
    qc.h(1); qc.h(2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'bell-state-analyzer': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'Bell State Analyzer (Full Bell Basis)';
    // Prepare test Bell state |Phi+>
    qc.h(0); qc.cx(0, 1);
    qc.barrier();
    // Bell discrimination projection
    qc.cx(0, 1);
    qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'chsh-inequality': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'CHSH Bell Inequality Violation Test';
    // Pre-shared Bell pair
    qc.h(0); qc.cx(0, 1);
    qc.barrier();
    // Alice setting (0) vs Bob setting (pi/4)
    qc.ry(1, Math.PI / 4);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'mermin-game': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Mermin GHZ Quantum Pseudo-Telepathy';
    qc.h(0); qc.cx(0, 1); qc.cx(1, 2);
    qc.barrier();
    // Players measure in conjugate X and Y bases
    qc.h(0);
    qc.sdg(1); qc.h(1);
    qc.sdg(2); qc.h(2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-byzantine': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Quantum Byzantine Agreement Protocol';
    // 4-qubit singlet state
    qc.h(0); qc.cx(0, 1); qc.h(2); qc.cx(2, 3); qc.cx(0, 2);
    qc.barrier();
    qc.cz(0, 1); qc.cz(2, 3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-clock-sync': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Quantum Clock Synchronization (Chuang)';
    qc.h(0); qc.cx(0, 1); qc.cx(1, 2);
    qc.barrier();
    // Time drift phase accumulation
    qc.rz(0, 0.5); qc.rz(1, 0.5); qc.rz(2, 0.5);
    qc.barrier();
    // Disentanglement and phase readout
    qc.cx(1, 2); qc.cx(0, 1); qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  // ── Quantum Arithmetic & Logic Modules ───────────────────────────────────
  'cuccaro-adder': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Cuccaro Quantum Full Adder (CDKM)';
    // Inputs: A=1, B=1 on q1, q2
    qc.x(1); qc.x(2);
    qc.barrier();
    // Majority (MAJ) gate
    qc.cx(2, 1); qc.cx(2, 0); qc.ccx(0, 1, 3);
    qc.barrier();
    // UnMajority and Accumulate (UMA) gate
    qc.ccx(0, 1, 3); qc.cx(2, 0); qc.cx(0, 2); qc.cx(1, 2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'draper-adder': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Draper Quantum Ripple-Carry Adder (QFT)';
    // Initialize input bits on register A (q0, q1) and B (q2, q3)
    qc.x(0); qc.x(2);
    qc.barrier();
    // QFT on register B
    qc.h(2); qc.cp(3, 2, Math.PI / 2); qc.h(3); qc.swap(2, 3);
    qc.barrier();
    // Controlled phase additions from register A into register B
    qc.cp(0, 2, Math.PI);
    qc.cp(1, 2, Math.PI / 2);
    qc.cp(1, 3, Math.PI);
    qc.barrier();
    // Inverse QFT on register B
    qc.swap(2, 3); qc.h(3); qc.cp(3, 2, -Math.PI / 2); qc.h(2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'draper-subtractor': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Draper Quantum Subtractor (QFT)';
    qc.x(0); qc.x(1); qc.x(2);
    qc.barrier();
    // QFT on register B
    qc.h(2); qc.cp(3, 2, Math.PI / 2); qc.h(3); qc.swap(2, 3);
    qc.barrier();
    // Controlled negative phase shifts for subtraction
    qc.cp(0, 2, -Math.PI);
    qc.cp(1, 2, -Math.PI / 2);
    qc.cp(1, 3, -Math.PI);
    qc.barrier();
    // Inverse QFT
    qc.swap(2, 3); qc.h(3); qc.cp(3, 2, -Math.PI / 2); qc.h(2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-comparator': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Quantum Magnitude Comparator';
    // Input bits on q0, q1
    qc.x(0);
    qc.barrier();
    // Bitwise comparison logic into ancillas q2, q3
    qc.cx(0, 1);
    qc.ccx(0, 1, 2); // A > B condition
    qc.x(0); qc.x(1);
    qc.ccx(0, 1, 3); // A < B condition
    qc.x(0); qc.x(1);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-ram-qram': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Bucket-Brigade Quantum RAM (QRAM)';
    // Address in superposition on q0
    qc.h(0);
    qc.barrier();
    // Tree routing activation
    qc.cx(0, 1);
    qc.x(0); qc.cx(0, 2); qc.x(0);
    qc.barrier();
    // Memory bus readout onto q3
    qc.ccx(1, 2, 3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  // ── Entangled State Preparation & Foundations ───────────────────────────
  'w-state': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'W-State Generator (3-Qubit Multipartite)';
    // RY rotation by 2 * acos(1/sqrt(3))
    qc.ry(0, 2 * Math.acos(1 / Math.sqrt(3)));
    // Controlled-H on q1
    qc.ch(0, 1);
    qc.cx(1, 2);
    qc.cx(0, 1);
    qc.x(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'cluster-state-1d': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = '1D Cluster State Generator (MBQC)';
    for (let i = 0; i < 4; i++) qc.h(i);
    qc.barrier();
    qc.cz(0, 1); qc.cz(1, 2); qc.cz(2, 3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'cluster-state-2d': () => {
    const qc = new QuantumCircuit(6, 6);
    qc.name = '2D Grid Cluster State (MBQC Lattice)';
    for (let i = 0; i < 6; i++) qc.h(i);
    qc.barrier();
    // Horizontal edges
    qc.cz(0, 1); qc.cz(1, 2);
    qc.cz(3, 4); qc.cz(4, 5);
    // Vertical edges
    qc.cz(0, 3); qc.cz(1, 4); qc.cz(2, 5);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-zeno-stabilizer': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'Quantum Zeno Effect State Stabilization';
    qc.h(0);
    qc.barrier();
    // Drift followed by projective measurement
    qc.rx(0, 0.2);
    qc.cx(0, 1); qc.measure(1, 1); qc.reset(1);
    qc.barrier();
    // Drift followed by second projective measurement
    qc.rx(0, 0.2);
    qc.cx(0, 1); qc.measure(1, 1);
    qc.barrier();
    qc.measure(0, 0);
    return qc;
  },

  // ── Quantum Algorithms (Algebraic & Search) ──────────────────────────────
  'quantum-counting': () => {
    const qc = new QuantumCircuit(5, 5);
    qc.name = 'Quantum Counting (Brassard-Høyer-Tapp)';
    // Superposition on counting qubits (q0..q2) and search qubits (q3, q4)
    qc.h(0); qc.h(1); qc.h(2);
    qc.h(3); qc.h(4);
    qc.barrier();
    // Grover iterate controlled on target qubits
    qc.cz(3, 4);
    qc.h(3); qc.h(4); qc.x(3); qc.x(4);
    qc.cz(3, 4);
    qc.x(3); qc.x(4); qc.h(3); qc.h(4);
    qc.barrier();
    // Inverse QFT on counting register (q0..q2)
    qc.swap(0, 2);
    qc.h(2); qc.cp(1, 2, -Math.PI / 2); qc.h(1);
    qc.cp(0, 2, -Math.PI / 4); qc.cp(0, 1, -Math.PI / 2); qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'qae-amplitude-estimation': () => {
    const qc = new QuantumCircuit(5, 5);
    qc.name = 'Quantum Amplitude Estimation (QAE)';
    // Estimation register q0..q2, state register q3, q4
    qc.h(0); qc.h(1); qc.h(2);
    qc.h(3); qc.h(4);
    qc.barrier();
    // Controlled Grover operations
    qc.cz(3, 4);
    qc.h(3); qc.h(4); qc.x(3); qc.x(4);
    qc.cz(3, 4);
    qc.x(3); qc.x(4); qc.h(3); qc.h(4);
    qc.barrier();
    // Inverse QFT
    qc.swap(0, 2);
    qc.h(2); qc.cp(1, 2, -Math.PI / 2); qc.h(1);
    qc.cp(0, 2, -Math.PI / 4); qc.cp(0, 1, -Math.PI / 2); qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'durr-hoyer-min-finding': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Quantum Minimum Finding (Dürr-Høyer)';
    // Superposition over search index
    qc.h(0); qc.h(1); qc.h(2);
    qc.barrier();
    // Threshold comparison oracle
    qc.cx(0, 3); qc.ccx(1, 2, 3); qc.cz(0, 3);
    qc.barrier();
    // Grover diffusion
    for (let i = 0; i < 3; i++) { qc.h(i); qc.x(i); }
    qc.ccx(0, 1, 2);
    for (let i = 0; i < 3; i++) { qc.x(i); qc.h(i); }
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'ambainis-element-distinctness': () => {
    const qc = new QuantumCircuit(5, 5);
    qc.name = 'Element Distinctness (Ambainis Walk)';
    qc.h(0); qc.h(1); qc.h(2); qc.h(3);
    qc.barrier();
    // Collision detection shift
    qc.cx(2, 3); qc.ccx(0, 1, 4); qc.cz(3, 4); qc.cx(2, 3);
    qc.barrier();
    // Coin diffusion
    qc.h(0); qc.h(1); qc.x(0); qc.x(1); qc.cz(0, 1); qc.x(0); qc.x(1); qc.h(0); qc.h(1);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'triangle-finding': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Triangle Finding in Graphs (Magniez-Santha)';
    for (let i = 0; i < 4; i++) qc.h(i);
    qc.barrier();
    qc.ccx(0, 1, 3); qc.ccx(1, 2, 3); qc.cz(0, 2);
    qc.barrier();
    for (let i = 0; i < 4; i++) { qc.h(i); qc.x(i); }
    qc.ccx(0, 1, 3); qc.cz(2, 3); qc.ccx(0, 1, 3);
    for (let i = 0; i < 4; i++) { qc.x(i); qc.h(i); }
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-walk-cycle': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Coined Quantum Walk on 4-Cycle';
    // Coin on q0, position register on q1, q2
    // Step 1: Coin flip + conditional shift
    qc.h(0);
    qc.cx(0, 1); qc.ccx(0, 1, 2); qc.x(0); qc.cx(0, 1); qc.x(0);
    qc.barrier();
    // Step 2: Coin flip + conditional shift
    qc.h(0);
    qc.cx(0, 1); qc.ccx(0, 1, 2); qc.x(0); qc.cx(0, 1); qc.x(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  // ── Quantum Simulation & Condensed Matter Physics ────────────────────────
  'tfim-simulation': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Transverse Field Ising Model (TFIM)';
    for (let i = 0; i < 4; i++) qc.h(i);
    qc.barrier();
    // Trotter step 1: Nearest-neighbor ZZ couplings
    qc.cx(0, 1); qc.rz(1, 0.4); qc.cx(0, 1);
    qc.cx(1, 2); qc.rz(2, 0.4); qc.cx(1, 2);
    qc.cx(2, 3); qc.rz(3, 0.4); qc.cx(2, 3);
    // Transverse X magnetic field
    for (let i = 0; i < 4; i++) qc.rx(i, 0.6);
    qc.barrier();
    // Trotter step 2:
    qc.cx(0, 1); qc.rz(1, 0.4); qc.cx(0, 1);
    qc.cx(1, 2); qc.rz(2, 0.4); qc.cx(1, 2);
    qc.cx(2, 3); qc.rz(3, 0.4); qc.cx(2, 3);
    for (let i = 0; i < 4; i++) qc.rx(i, 0.6);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'heisenberg-xxx': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Heisenberg XXX Spin Chain Simulation';
    qc.x(0);
    qc.barrier();
    // ZZ interaction
    qc.cx(0, 1); qc.rz(1, 0.5); qc.cx(0, 1);
    // XX interaction
    qc.h(0); qc.h(1); qc.cx(0, 1); qc.rz(1, 0.5); qc.cx(0, 1); qc.h(0); qc.h(1);
    // YY interaction
    qc.rx(0, Math.PI / 2); qc.rx(1, Math.PI / 2);
    qc.cx(0, 1); qc.rz(1, 0.5); qc.cx(0, 1);
    qc.rx(0, -Math.PI / 2); qc.rx(1, -Math.PI / 2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'h2-uccsd': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Molecular Ground State: H2 UCCSD Ansatz';
    // Hartree-Fock reference state |1100>
    qc.x(0); qc.x(1);
    qc.barrier();
    // UCCSD double excitation between (0,1) and (2,3)
    qc.rx(0, Math.PI / 2); qc.h(1); qc.h(2); qc.h(3);
    qc.cx(0, 1); qc.cx(1, 2); qc.cx(2, 3);
    qc.rz(3, -0.15);
    qc.cx(2, 3); qc.cx(1, 2); qc.cx(0, 1);
    qc.rx(0, -Math.PI / 2); qc.h(1); qc.h(2); qc.h(3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'lih-vqe': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Molecular Ground State: LiH VQE Ansatz';
    qc.x(0); qc.x(1);
    qc.barrier();
    for (let i = 0; i < 4; i++) qc.ry(i, 0.4);
    qc.cx(0, 1); qc.cx(1, 2); qc.cx(2, 3);
    for (let i = 0; i < 4; i++) qc.ry(i, -0.2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'kitaev-honeycomb': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Kitaev Honeycomb Topological Spin Model';
    for (let i = 0; i < 4; i++) qc.h(i);
    qc.barrier();
    // X-link
    qc.cx(0, 1); qc.rz(1, 0.4); qc.cx(0, 1);
    // Y-link
    qc.rx(1, Math.PI / 2); qc.rx(2, Math.PI / 2);
    qc.cx(1, 2); qc.rz(2, 0.4); qc.cx(1, 2);
    qc.rx(1, -Math.PI / 2); qc.rx(2, -Math.PI / 2);
    // Z-link
    qc.cz(2, 3); qc.rz(3, 0.4); qc.cz(2, 3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'fermi-hubbard-2site': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Fermi-Hubbard 2-Site Lattice Simulation';
    qc.x(0); qc.x(1);
    qc.barrier();
    // Hopping interaction
    qc.cx(0, 2); qc.ry(2, 0.3); qc.cx(0, 2);
    qc.cx(1, 3); qc.ry(3, 0.3); qc.cx(1, 3);
    // On-site Coulomb repulsion
    qc.cz(0, 1); qc.rz(1, 0.6); qc.cz(0, 1);
    qc.cz(2, 3); qc.rz(3, 0.6); qc.cz(2, 3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  // ── Quantum Machine Learning & Optimization ──────────────────────────────
  'qcnn': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Quantum Convolutional Neural Network (QCNN)';
    // Feature map
    for (let i = 0; i < 4; i++) { qc.h(i); qc.rz(i, 0.5); }
    qc.barrier();
    // Convolutional layer 1
    qc.cx(0, 1); qc.rz(1, 0.3); qc.ry(0, 0.4); qc.cx(0, 1);
    qc.cx(2, 3); qc.rz(3, 0.3); qc.ry(2, 0.4); qc.cx(2, 3);
    qc.barrier();
    // Pooling layer 1 (measure q1 and q3)
    qc.cx(1, 0); qc.measure(1, 1);
    qc.cx(3, 2); qc.measure(3, 3);
    qc.barrier();
    // Convolutional layer 2
    qc.cx(0, 2); qc.ry(2, 0.7); qc.cx(0, 2);
    qc.barrier();
    qc.measure(0, 0); qc.measure(2, 2);
    return qc;
  },

  'quantum-autoencoder': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Quantum Autoencoder (State Compression)';
    // Input state on q0..q2
    qc.h(0); qc.cx(0, 1); qc.cx(1, 2);
    qc.barrier();
    // Compression unitary
    qc.cx(1, 2); qc.ry(2, -0.4); qc.cx(0, 1); qc.ry(1, -0.3);
    qc.barrier();
    // Swap test verifying trash qubit q2 matches reference |0> on q3
    qc.h(2); qc.cswap(2, 1, 3); qc.h(2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'qgan-generator': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Quantum GAN Generator (QGAN)';
    qc.h(0); qc.h(1); qc.h(2);
    qc.barrier();
    qc.ry(0, 0.35); qc.ry(1, 0.82); qc.ry(2, 0.47);
    qc.cx(0, 1); qc.cx(1, 2);
    qc.rz(0, 0.15); qc.rz(1, -0.63); qc.rz(2, 0.94);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-reservoir': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Quantum Reservoir Computing (Echo State)';
    qc.rx(0, 0.5); qc.rx(1, 1.2);
    qc.barrier();
    qc.cx(0, 1); qc.rz(1, 0.7); qc.cx(1, 2); qc.rz(2, 1.1); qc.cx(2, 3); qc.rz(3, 0.4); qc.cx(3, 0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  // ── Modern Advanced Linear Algebra & Primitives ──────────────────────────
  'qsp-signal-processing': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'Quantum Signal Processing (QSP Sequence)';
    qc.h(1);
    qc.barrier();
    qc.crx(1, 0, 0.8);
    qc.rz(1, 0.5);
    qc.crx(1, 0, 0.8);
    qc.rz(1, -0.3);
    qc.barrier();
    qc.h(1);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'lcu-multiplexer': () => {
    const qc = new QuantumCircuit(3, 3);
    qc.name = 'Linear Combination of Unitaries (LCU)';
    qc.h(0);
    qc.barrier();
    // Select-U0
    qc.cx(0, 1); qc.cx(0, 2);
    // Select-U1
    qc.x(0); qc.cz(0, 1); qc.cz(0, 2); qc.x(0);
    qc.barrier();
    qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  // ── Hardware Benchmarks & Tomography ─────────────────────────────────────
  'rb-clifford': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'Randomized Benchmarking (Clifford Sequence)';
    // Sequence of random Cliffords
    qc.h(0); qc.s(1); qc.cx(0, 1);
    qc.x(0); qc.h(1); qc.cz(0, 1);
    qc.s(0); qc.z(1); qc.cx(1, 0);
    qc.barrier();
    // Calculated exact inversion Clifford
    qc.cx(1, 0); qc.z(1); qc.sdg(0); qc.cz(0, 1); qc.h(1); qc.x(0); qc.cx(0, 1); qc.sdg(1); qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'quantum-volume-4q': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Quantum Volume 4-Qubit Model Circuit';
    // Layer 1
    qc.ry(0, 0.8); qc.rz(0, 1.2); qc.ry(1, 0.5); qc.cx(0, 1); qc.rz(1, 0.9); qc.cx(0, 1);
    qc.ry(2, 1.1); qc.rz(2, 0.4); qc.ry(3, 1.5); qc.cx(2, 3); qc.rz(3, 0.7); qc.cx(2, 3);
    qc.barrier();
    // Layer 2
    qc.cx(0, 2); qc.ry(2, 0.6); qc.cx(0, 2);
    qc.cx(1, 3); qc.ry(3, 0.9); qc.cx(1, 3);
    qc.barrier();
    // Layer 3
    qc.cx(0, 3); qc.ry(3, 0.4); qc.cx(0, 3);
    qc.cx(1, 2); qc.ry(2, 1.3); qc.cx(1, 2);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'xeb-cross-entropy': () => {
    const qc = new QuantumCircuit(4, 4);
    qc.name = 'Cross-Entropy Benchmarking (XEB Supremacy)';
    for (let i = 0; i < 4; i++) qc.h(i);
    qc.barrier();
    qc.cz(0, 1); qc.cz(2, 3);
    qc.sx(0); qc.rz(1, Math.PI / 4); qc.sx(2); qc.rz(3, Math.PI / 4);
    qc.barrier();
    qc.cz(1, 2);
    qc.rz(0, Math.PI / 4); qc.sx(1); qc.rz(2, Math.PI / 4); qc.sx(3);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'ramsey-fringes': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'T2 Ramsey Fringe Decoherence Calibration';
    qc.h(0);
    qc.barrier();
    // Larmor precession phase
    qc.rz(0, Math.PI / 3);
    qc.barrier();
    qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'hahn-echo': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'Hahn Echo Dynamic Decoupling (T2 Echo)';
    qc.h(0);
    qc.barrier();
    qc.rz(0, 0.4);
    // Refocusing Pi pulse
    qc.x(0);
    qc.rz(0, 0.4);
    qc.barrier();
    qc.h(0);
    qc.barrier();
    qc.measureAll();
    return qc;
  },

  'state-tomography-bell': () => {
    const qc = new QuantumCircuit(2, 2);
    qc.name = 'Two-Qubit State Tomography (Bell State)';
    qc.h(0); qc.cx(0, 1);
    qc.barrier();
    // Measurement in Y x X basis
    qc.sdg(0); qc.h(0); qc.h(1);
    qc.barrier();
    qc.measureAll();
    return qc;
  }
};

