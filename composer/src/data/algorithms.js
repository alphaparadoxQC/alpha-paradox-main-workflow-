export const algorithmsData = [
  {
    id: 'portfolio-qaoa',
    title: 'Portfolio Optimization using QAOA',
    isPremium: true,
    description: 'Portfolio Optimization using QAOA is a hybrid quantum-classical toolkit for asset selection and weighting. It frames portfolio construction as a QUBO and solves it with the Quantum Approximate Optimization Algorithm (QAOA). From a chosen asset universe, it jointly optimizes expected return and risk, then converts the best measured bitstrings into investable portfolios.',
    controls: []
  },
  {
    id: 'teleportation-n',
    title: 'Quantum N Qubit Teleportation',
    isPremium: true,
    description: 'N-Qubit Quantum Teleportation is a generalized protocol that transfers an arbitrary unknown n-qubit quantum state between distant nodes using pre-shared entangled Bell pairs and classical communication. The quantum information is relocated without physically moving qubits, preserving all correlations and multipartite entanglement.',
    controls: [
      { type: 'select', options: ['2 Qubits', '3 Qubits', '4 Qubits'] },
      { type: 'select', options: ['GHZ State(Sampled)', 'W State(Sampled)'] }
    ]
  },
  {
    id: 'max-cut',
    title: 'Max Cut QAOA',
    isPremium: true,
    description: 'Max-Cut QAOA is a hybrid quantum-classical algorithm that partitions graph vertices into two sets. It maps edges to a cost Hamiltonian, using alternating quantum gates to evolve states toward an optimal configuration. By iteratively tuning variational parameters with a classical optimizer, it identifies the cut maximizing edges between sets.',
    controls: [
      { type: 'select', options: ['Random', 'Regular', 'Custom'] }
    ]
  },
  {
    id: 'qds',
    title: 'Quantum Digital Signatures',
    isPremium: true,
    description: 'Quantum Digital Signatures (QDS) provide authenticity, integrity, and non-repudiation of messages with information-theoretic security. Instead of relying on computational hardness assumptions (like RSA), QDS uses the laws of quantum physics, specifically the no-cloning theorem and destructive measurements, to prevent public keys from being copied or reverse-engineered.',
    controls: []
  },
  {
    id: 'qpca',
    title: 'QPCA Algorithm',
    isPremium: true,
    description: 'Quantum Principal Component Analysis (QPCA) is a hybrid dimensional-reduction algorithm that translates the covariance structure of classical data into a quantum density matrix and then employs Quantum Phase Estimation (QPE) to extract its eigenvalues.',
    controls: []
  },
  {
    id: 'qperceptron',
    title: 'QPerceptron Algorithm',
    isPremium: true,
    description: 'The Quantum Perceptron Algorithm is a quantum-inspired adaptation of the classical perceptron, a fundamental building block in machine learning. It leverages quantum computing principles to enhance computational efficiency and tackle problems that are challenging for classical systems.',
    controls: []
  },
  {
    id: 'qnn',
    title: 'QNN Algorithm',
    isPremium: true,
    description: 'Quantum Neural Network (QNN) is a hybrid learning framework that integrates quantum circuit-based feature maps and variational layers with classical neural network components. At its core, QNN leverages parameterized quantum circuits to extract nonlinear transformations of input data, which are then processed by a classical head for prediction.',
    controls: []
  },
  {
    id: 'dqs',
    title: 'DQS Algorithm',
    isPremium: true,
    description: 'Deterministic Quantum Search algorithm offers a quadratic speedup for locating target elements in an unstructured database with certainty. It provides a quantum advantage across all values of the initial success probability of measuring the target states.',
    controls: []
  },
  {
    id: 'trotterization',
    title: 'Time-Evolution of Quantum System using Trotterization',
    isPremium: true,
    description: 'Trotterization approximates quantum time evolution by splitting a complex Hamiltonian into simpler parts using the Suzuki-Trotter formula. Each term is exponentiated and applied in small time steps, with accuracy improving as the steps get finer. It\'s a standard method for simulating quantum dynamics on classical and quantum computers.',
    controls: []
  },
  {
    id: 'steane-code',
    title: 'QEC: Steane Seven-Qubit Code',
    isPremium: true,
    description: 'The Steane code encodes one logical qubit into seven physical qubits, enabling detection and correction of any single-qubit bit-flip, phase-flip, or both. Based on the classical [7,4,3] Hamming code, it uses a CSS structure to independently correct bit- and phase-flip errors, simplifying quantum error correction.',
    controls: []
  },
  {
    id: 'deutsch',
    title: 'Deutsch Algorithm',
    isPremium: false,
    description: 'The Deutsch algorithm is a foundational quantum algorithm for a function f:{0,1}→{0,1}. It determines if f is constant (f(0)=f(1)) or balanced (f(0)≠f(1)). While classically requiring two function evaluations, this algorithm solves it quantumly with just one, showcasing a simple quantum speedup.',
    controls: [
      { type: 'select', options: ['f(x)= 0', 'f(x)= 1', 'f(x)= x', 'f(x)= ~x'] }
    ]
  },
  {
    id: 'deutsch-jozsa',
    title: 'Deutsch-Jozsa Algorithm',
    isPremium: false,
    description: 'An extended Deutsch\'s algorithm for functions f:{0,1}^n→{0,1}. It efficiently determines if f is constant or balanced. While classical methods need multiple checks, this quantum algorithm solves the problem with just one function evaluation, demonstrating a clear quantum speedup.',
    controls: [
      { type: 'select', options: ['2 Qubits', '3 Qubits', '4 Qubits'] },
      { type: 'select', options: ['f(x)= 0', 'f(x)= 1', 'Balanced 1', 'Balanced 2'] }
    ]
  },
  {
    id: 'bernstein-vazirani',
    title: 'Bernstein-Vazirani Algorithm',
    isPremium: false,
    description: 'The Bernstein-Vazirani algorithm finds a hidden bit string s for functions of the form f(x)=s·x(mod2). While classical algorithms require n evaluations to find the string s, this quantum algorithm identifies it uniquely with just a single evaluation.',
    controls: [
      { type: 'select', options: ['2 Qubits', '3 Qubits', '4 Qubits'] },
      { type: 'input', placeholder: 'Enter secret message' }
    ]
  },
  {
    id: 'simon',
    title: 'Simon\'s Algorithm',
    isPremium: false,
    description: 'Simon\'s algorithm solves a promise problem: find a hidden string s such that f(x)=f(y) iff y=x⊕s. While classical algorithms need exponential time, this quantum finds s in polynomial time with high probability, showcasing exponential speedup.',
    controls: [
      { type: 'select', options: ['2 Qubits', '3 Qubits', '4 Qubits'] },
      { type: 'input', placeholder: 'Enter secret message' }
    ]
  },
  {
    id: 'teleportation-1',
    title: 'Quantum Teleportation',
    isPremium: false,
    description: 'Quantum teleportation is a protocol to transfer the unknown quantum state of a qubit from one location to another. It utilizes entanglement between the sender and receiver and classical communication, effectively moving the quantum information without physically sending the qubit itself.',
    controls: []
  },
  {
    id: 'superdense-coding',
    title: 'Superdense Coding',
    isPremium: false,
    description: 'Superdense coding is a quantum communication protocol that allows sending two classical bits of information by transmitting only one qubit. This is achieved by leveraging a shared entangled pair of qubits between the sender and receiver, doubling the classical communication capacity per qubit sent.',
    controls: [
      { type: 'input', placeholder: 'Enter input bit' }
    ]
  },
  {
    id: 'qft',
    title: 'Quantum Fourier Transform (QFT)',
    isPremium: false,
    description: 'The Quantum Fourier Transform (QFT) is the quantum equivalent of the classical Discrete Fourier Transform. It can be implemented efficiently on a quantum computer and is a fundamental subroutine used in many powerful quantum algorithms, including Shor\'s factoring algorithm and Quantum Phase Estimation.',
    controls: [
      { type: 'select', options: ['2 Qubits', '3 Qubits', '4 Qubits', '5 Qubits'] }
    ]
  },
  {
    id: 'qpe',
    title: 'Quantum Phase Estimation (QPE)',
    isPremium: false,
    description: 'Quantum Phase Estimation (QPE) estimates the phase φ of a unitary operator U for its eigenvector |ψ⟩, where U|ψ⟩=e^(2πiφ)|ψ⟩. It provides a precise estimate of φ. This is a key component used within many quantum algorithms, most notably Shor\'s algorithm for factoring.',
    controls: []
  },
  {
    id: 'grover',
    title: 'Grover\'s Algorithm - Search',
    isPremium: true,
    description: 'Grover\'s algorithm provides a quadratic speedup for searching an unsorted database of N items. It finds a target item in roughly O(√N) steps, vs classical O(N) checks. It demonstrates quantum advantage for search problems.',
    controls: []
  },
  {
    id: 'shor',
    title: 'Shor\'s Algorithm - Factorization',
    isPremium: true,
    description: 'Shor\'s algorithm is a quantum algorithm for finding the prime factors of a composite integer N. It offers a dramatic, exponential speedup over the best-known classical factoring algorithms, posing a significant threat to widely used classical encryption methods like RSA.',
    controls: [
      { type: 'input', placeholder: 'Enter Number' }
    ]
  },
  {
    id: 'quantum-walks',
    title: 'Quantum Walks (1-Dimension)',
    isPremium: true,
    description: 'A 1D Quantum Walk is the quantum analogue of a classical random walk. Unlike the classical diffusive spread (√t), the quantum walk spreads quadratically faster (t), useful for quantum search algorithms and other applications.',
    controls: [
      { type: 'select', options: ['2-Qubits', '3-Qubits', '4-Qubits'] }
    ]
  },
  {
    id: 'vqe',
    title: 'Variational Quantum Eigensolver (VQE)',
    isPremium: true,
    description: 'The Variational Quantum Eigensolver (VQE) is a hybrid quantum-classical algorithm. It uses a quantum computer to prepare and measure quantum states, while a classical optimizer minimizes the energy expectation value of a Hamiltonian, commonly applied to finding molecular ground state energies.',
    controls: [
      { type: 'select', options: ['Molecule : BeH2', 'Molecule : H2', 'Molecule : LiH'] }
    ]
  },
  {
    id: 'hhl',
    title: 'Harrow-Hassidim-Lloyd (HHL) Algorithm',
    isPremium: true,
    description: 'The Harrow-Hassidim-Lloyd (HHL) algorithm is a quantum algorithm designed to solve linear systems of equations of the form Ax = b. HHL offers an exponential speedup in the matrix dimension N compared to classical methods, under the conditions that the matrix A is sparse, well-conditioned, and Hermitian.',
    controls: []
  },
  {
    id: 'veto',
    title: 'Veto Algorithm',
    isPremium: true,
    description: 'Quantum Veto is a protocol that uses quantum entanglement to let participants anonymously block a decision. If even one person vetoes, the outcome reflects it, without revealing who did it. The process ensures both security and participant anonymity.',
    controls: []
  },
  {
    id: 'qsvm',
    title: 'QSVM Algorithm',
    isPremium: true,
    description: 'QSVMs are quantum machine learning algorithms used for classification and regression that leverage quantum computers to optimize the hyperplane selection in high-dimensional spaces for maximal class separation.',
    controls: []
  },
  {
    id: 'qkmean',
    title: 'QKmean Algorithm',
    isPremium: true,
    description: 'Quantum K-Means algorithm is an innovative advancement in quantum computing and machine learning that harnesses quantum mechanics principles to potentially accelerate the clustering process compared to classical K-Means.',
    controls: []
  },
  {
    id: 'qpc',
    title: 'QPC for the socialist millionaire problem',
    isPremium: true,
    description: 'Quantum Private Comparison (QPC) algorithm enables secure value comparison using entangled Bell pairs, quantum rotations, and a shared key, ensuring that Alice and Bob\'s values remain private while allowing comparison without revealing actual information.',
    controls: []
  },
  {
    id: 'qknn',
    title: 'QKNN',
    isPremium: true,
    description: 'Quantum k-Nearest Neighbors adapts classical kNN to quantum computing by leveraging quantum superposition and the swap test for parallel state comparisons, enabling fast similarity assessments in high-dimensional machine learning tasks.',
    controls: []
  },
  {
    id: 'bell-parity-qec',
    title: '2-Qubit Bell State Parity Measurement & Active Reset',
    isPremium: false,
    description: 'Quantum Error Correction (QEC) stabilizer protocol. Prepares an entangled Bell pair on data qubits, extracts ZZ and XX parity syndromes via an ancilla with mid-circuit measurement, and performs dynamic active reset (|0⟩) between extraction rounds.',
    controls: []
  },
  {
    id: 'repetition-code',
    title: 'QEC : Three-Qubit Repetition Code',
    isPremium: true,
    description: 'Quantum Error Correction (QEC) protects quantum information from errors caused by noise and decoherence. The 3-bit repetition code is a simple yet powerful scheme where a single logical qubit is encoded into three physical qubits.',
    controls: []
  },
  {
    id: 'shor-code',
    title: 'QEC : Shor\'s Nine-Qubit Code',
    isPremium: true,
    description: 'The Shor 9-qubit code is a foundational quantum error correction method that protects a single logical qubit by encoding it into nine physical qubits. It uses a nested structure that combines the 3-qubit phase-flip code with the 3-qubit bit-flip code.',
    controls: []
  },
  {
    id: 'qhc',
    title: 'QHC Algorithm',
    isPremium: true,
    description: 'Quantum Hierarchical Clustering integrates quantum computing techniques into hierarchical clustering algorithms, primarily using quantum-based similarity measures like the swap test. This enables exponential speedups in calculating distances between quantum states.',
    controls: []
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// Canonical, Literature-Verified Quantum Algorithms & Protocols (Stephen Jordan Zoo, Nielsen & Chuang)
// ═══════════════════════════════════════════════════════════════════════════════
const VERIFIED_ALGORITHMS = [
  // ── Quantum Error Correction & Fault Tolerance ───────────────────────────
  {
    id: 'qec-bit-flip',
    title: '3-Qubit Bit-Flip Quantum Error Correction',
    isPremium: true,
    description: 'Encodes one logical qubit into three physical qubits using CNOT gates. Measures two syndrome ancillas (Z0Z1 and Z1Z2 parities) to diagnose single bit-flip (X) errors and applies corrective Pauli-X without destroying superposition.',
    controls: []
  },
  {
    id: 'qec-phase-flip',
    title: '3-Qubit Phase-Flip Quantum Error Correction',
    isPremium: true,
    description: 'Protects quantum information against phase-flip (Z) errors by encoding in the Hadamard basis |+⟩, |−⟩. Measures X0X1 and X1X2 stabilizers via ancillas to diagnose phase errors and restore coherence.',
    controls: []
  },
  {
    id: 'qec-five-qubit',
    title: '5-Qubit Perfect Code ([5,1,3] Laflamme Code)',
    isPremium: true,
    description: 'The smallest quantum error-correcting code capable of protecting a logical qubit against arbitrary single-qubit errors (X, Y, or Z). Measures cyclic stabilizer generators (XZZXI, IXZZX, XIXZZ, ZXIXZ).',
    controls: []
  },
  {
    id: 'surface-code-cycle',
    title: 'Surface Code Syndrome Extraction Cycle',
    isPremium: true,
    description: 'Fundamental building block of 2D topological quantum computing. Implements interleaved star (X-basis) and plaquette (Z-basis) parity measurements across data qubits on a planar superconducting lattice.',
    controls: []
  },
  {
    id: 'magic-state-distillation',
    title: 'Magic State Distillation (15-to-1 T-Factory)',
    isPremium: true,
    description: 'Bravyi-Kitaev protocol that distills one high-fidelity non-Clifford |T⟩ state from fifteen noisy ancilla copies using the transversal symmetries of the [15,1,3] Reed-Muller code for universal fault-tolerant computation.',
    controls: []
  },

  // ── Quantum Communication, Cryptography & Protocols ──────────────────────
  {
    id: 'swap-test',
    title: 'Swap Test (Quantum State Overlap & Fidelity)',
    isPremium: true,
    description: 'Fundamental quantum routine (Buhrman et al., 2001) that determines the inner product |⟨ψ|ϕ⟩|² between two unknown quantum states without performing full state tomography, using an ancilla-controlled SWAP (Fredkin) gate.',
    controls: []
  },
  {
    id: 'hadamard-test',
    title: 'Hadamard Test (Unitary Expectation Value)',
    isPremium: false,
    description: 'Interferometric quantum protocol that measures the real or imaginary part of the expectation value ⟨ψ|U|ψ⟩ of a unitary operator U on state |ψ⟩ using a single control ancilla qubit.',
    controls: []
  },
  {
    id: 'bb84-qkd',
    title: 'BB84 Quantum Key Distribution Protocol',
    isPremium: false,
    description: 'The pioneering Bennett & Brassard (1984) quantum cryptography protocol. Alice sends polarized qubits in conjugate rectilinear (Z) or diagonal (X) bases; Bob measures in randomly chosen bases, guaranteeing information-theoretic security via the no-cloning theorem.',
    controls: []
  },
  {
    id: 'ekert91-qkd',
    title: 'Ekert 91 (E91) Entanglement-Based QKD',
    isPremium: true,
    description: 'Artur Ekert (1991) protocol establishing secure cryptographic keys using entangled Bell pairs. Any eavesdropping attempt collapses the entanglement and introduces detectable CHSH Bell-inequality violations.',
    controls: []
  },
  {
    id: 'b92-qkd',
    title: 'B92 Two-State Cryptographic Protocol',
    isPremium: false,
    description: 'Charles Bennett (1992) minimalist quantum key distribution protocol using only two non-orthogonal quantum states (|0⟩ and |+⟩), achieving security from the quantum impossibility of unambiguously discriminating non-orthogonal states.',
    controls: []
  },
  {
    id: 'quantum-fingerprinting',
    title: 'Quantum Fingerprinting (Buhrman-Cleve Protocol)',
    isPremium: true,
    description: 'Communicates equality of two n-bit classical strings using only O(log n) quantum bits. Alice and Bob transmit quantum codeword states to a referee who performs a Swap Test to detect discrepancies.',
    controls: []
  },
  {
    id: 'wiesner-quantum-money',
    title: "Wiesner's Quantum Money Verification",
    isPremium: true,
    description: 'Stephen Wiesner (1983) original quantum cryptographic protocol. Banknotes carry trapped physical qubits prepared in secret random conjugate bases. The bank verifies authenticity without revealing the state, while the no-cloning theorem forbids counterfeiting.',
    controls: []
  },
  {
    id: 'quantum-secret-sharing',
    title: 'Quantum Secret Sharing (Hillery-Bužek Protocol)',
    isPremium: true,
    description: 'Splits quantum or classical secrets among multiple distributed parties using an entangled GHZ state. The secret can only be reconstructed when the authorized quorum of parties cooperate and pool their measurement outcomes.',
    controls: []
  },
  {
    id: 'bell-state-analyzer',
    title: 'Bell State Analyzer (Complete Bell Basis Discrimination)',
    isPremium: false,
    description: 'Projects any arbitrary two-qubit state onto the orthonormal Bell basis (|Φ+⟩, |Φ−⟩, |Ψ+⟩, |Ψ−⟩) using a CNOT gate followed by a Hadamard gate, serving as the central measurement engine in quantum teleportation and dense coding.',
    controls: []
  },
  {
    id: 'chsh-inequality',
    title: 'CHSH Bell Inequality Violation Experiment',
    isPremium: false,
    description: 'Clauser-Horne-Shimony-Holt (1969) test of quantum non-locality. Measures correlations between entangled pairs across rotated detector angles, yielding S = 2√2 ≈ 2.828, directly refuting local hidden-variable theories.',
    controls: []
  },
  {
    id: 'mermin-game',
    title: 'Mermin GHZ Quantum Pseudo-Telepathy Game',
    isPremium: true,
    description: 'David Mermin (1990) multi-player non-local coordination game. Three players share a 3-qubit GHZ state and win the game with probability 1 without communicating classically, demonstrating quantum advantage over classical game theory.',
    controls: []
  },
  {
    id: 'quantum-byzantine',
    title: 'Quantum Byzantine Agreement Protocol',
    isPremium: true,
    description: 'Enables nodes in a distributed computing network to reach unforgeable consensus even in the presence of malicious Byzantine traitor nodes, utilizing pre-shared 4-qubit singlet entangled states.',
    controls: []
  },
  {
    id: 'quantum-clock-sync',
    title: 'Quantum Clock Synchronization (Chuang Algorithm)',
    isPremium: true,
    description: 'Isaac Chuang (2000) quantum protocol enabling spatially separated parties to synchronize local clocks with precision surpassing classical limits using entangled states and phase estimation.',
    controls: []
  },

  // ── Quantum Arithmetic & Logic Modules ───────────────────────────────────
  {
    id: 'cuccaro-adder',
    title: 'Cuccaro Quantum Full Adder (CDKM Architecture)',
    isPremium: true,
    description: 'In-place reversible quantum ripple-carry adder (Cuccaro et al., 2004) utilizing Majority (MAJ) and UnMajority-Accumulate (UMA) gates to add two n-bit numbers with O(1) ancilla overhead.',
    controls: []
  },
  {
    id: 'draper-adder',
    title: 'Draper Quantum Ripple-Carry Adder (QFT Adder)',
    isPremium: true,
    description: 'Thomas Draper (2000) arithmetic architecture. Transforms the target register into Fourier frequency space using QFT, applies controlled-phase gate rotations proportional to input bits, and applies inverse QFT to retrieve the binary sum.',
    controls: []
  },
  {
    id: 'draper-subtractor',
    title: 'Draper Quantum Subtractor (QFT)',
    isPremium: true,
    description: 'Reversible quantum subtraction module that computes A − B (mod 2ⁿ) in the Fourier frequency domain using controlled negative phase rotations followed by inverse QFT.',
    controls: []
  },
  {
    id: 'quantum-comparator',
    title: 'Quantum Magnitude Comparator',
    isPremium: true,
    description: 'Reversible quantum arithmetic circuit that compares two binary registers A and B, asserting output ancilla flags indicating A < B, A = B, or A > B using cascaded Toffoli gates.',
    controls: []
  },
  {
    id: 'quantum-ram-qram',
    title: 'Bucket-Brigade Quantum RAM (QRAM Architecture)',
    isPremium: true,
    description: 'Giovannetti, Lloyd & Maccone (2008) QRAM architecture. Routes quantum queries through a binary routing tree using O(log N) active gates, retrieving data superposition in O(log N) steps.',
    controls: []
  },

  // ── Entangled State Preparation & Foundations ───────────────────────────
  {
    id: 'w-state',
    title: 'W-State Generator (3-Qubit Multipartite)',
    isPremium: false,
    description: 'Dür, Vidal & Cirac (2000) entanglement generator. Prepares the state (|100⟩ + |010⟩ + |001⟩)/√3, exhibiting robust multipartite entanglement that survives the loss or measurement of any single qubit.',
    controls: []
  },
  {
    id: 'cluster-state-1d',
    title: '1D Cluster State Generator (MBQC)',
    isPremium: false,
    description: 'Briegel & Raussendorf (2001) measurement-based quantum computing substrate. Prepares a 1D chain of qubits in |+⟩ and applies nearest-neighbor Controlled-Z (CZ) entangling gates.',
    controls: []
  },
  {
    id: 'cluster-state-2d',
    title: '2D Grid Cluster State (MBQC Lattice)',
    isPremium: true,
    description: 'Two-dimensional universal resource state for measurement-based quantum computation. Implements a 2D grid lattice of qubits interconnected via horizontal and vertical Controlled-Z gates.',
    controls: []
  },
  {
    id: 'quantum-zeno-stabilizer',
    title: 'Quantum Zeno Effect State Stabilization',
    isPremium: true,
    description: 'Demonstrates the Quantum Zeno effect (Misra & Sudarshan, 1977). Rapid, frequent projective measurements on a monitoring ancilla inhibit Hamiltonian drift and freeze the quantum state in its initial subspace.',
    controls: []
  },

  // ── Quantum Algorithms (Algebraic & Search) ──────────────────────────────
  {
    id: 'quantum-counting',
    title: 'Quantum Counting (Brassard-Høyer-Mosca-Tapp)',
    isPremium: true,
    description: 'Combines Quantum Phase Estimation (QPE) with Grover search iterates to count the exact number of solutions M to an unstructured search problem in O(√N) queries instead of classical O(N).',
    controls: []
  },
  {
    id: 'qae-amplitude-estimation',
    title: 'Quantum Amplitude Estimation (QAE)',
    isPremium: true,
    description: 'Core subroutine (Brassard et al., 2002) providing quadratic speedup for Monte Carlo sampling and risk analysis. Uses phase estimation on the Grover diffusion operator to estimate state amplitudes.',
    controls: []
  },
  {
    id: 'durr-hoyer-min-finding',
    title: 'Quantum Minimum Finding (Dürr-Høyer Algorithm)',
    isPremium: true,
    description: 'Dürr & Høyer (1996) randomized quantum search algorithm that finds the minimum element of an unsorted table of N items in O(√N) steps using iterative threshold marking.',
    controls: []
  },
  {
    id: 'ambainis-element-distinctness',
    title: 'Element Distinctness (Ambainis Quantum Walk)',
    isPremium: true,
    description: 'Andris Ambainis (2007) algorithm solving element distinctness in O(N^(2/3)) queries via a quantum walk on the Johnson graph, surpassing classical Ω(N) lower bounds.',
    controls: []
  },
  {
    id: 'triangle-finding',
    title: 'Triangle Finding in Graphs (Magniez-Santha-Szegedy)',
    isPremium: true,
    description: 'Detects whether a given graph contains a 3-clique (triangle) in O(N^(1.3)) queries using quantum walks over combinatorial graph spaces.',
    controls: []
  },
  {
    id: 'quantum-walk-cycle',
    title: 'Coined Quantum Walk on 4-Cycle',
    isPremium: false,
    description: 'Discrete-time coined quantum random walk (Aharonov et al., 2001). Applies Hadamard coin flips and conditional position shifts, demonstrating quadratic ballistic spread over classical diffusion.',
    controls: []
  },

  // ── Quantum Simulation & Condensed Matter Physics ────────────────────────
  {
    id: 'tfim-simulation',
    title: 'Transverse Field Ising Model (TFIM)',
    isPremium: true,
    description: 'Trotterized simulation of the 1D quantum Ising spin chain with nearest-neighbor exchange coupling J and transverse magnetic field h, modeling quantum phase transitions.',
    controls: []
  },
  {
    id: 'heisenberg-xxx',
    title: 'Heisenberg XXX Spin Chain Simulation',
    isPremium: true,
    description: 'Simulates isotropic spin-1/2 Heisenberg exchange Hamiltonian H = J ∑ (XᵢXᵢ₊₁ + YᵢYᵢ₊₁ + ZᵢZᵢ₊₁) using Suzuki-Trotter operator splitting on digital quantum hardware.',
    controls: []
  },
  {
    id: 'h2-uccsd',
    title: 'Molecular Ground State: H2 UCCSD Ansatz',
    isPremium: true,
    description: 'Unitary Coupled Cluster Singles and Doubles (UCCSD) parameterized quantum circuit for the hydrogen molecule (H2) in a minimal STO-3G basis, calculating ground state binding curves.',
    controls: []
  },
  {
    id: 'lih-vqe',
    title: 'Molecular Ground State: LiH VQE Ansatz',
    isPremium: true,
    description: 'Variational Quantum Eigensolver (VQE) ansatz for lithium hydride (LiH) active orbital spaces, evaluating potential energy surfaces via hybrid quantum-classical optimization.',
    controls: []
  },
  {
    id: 'kitaev-honeycomb',
    title: 'Kitaev Honeycomb Topological Spin Model',
    isPremium: true,
    description: 'Simulates Kitaev’s exactly solvable honeycomb spin model with bond-dependent directional Ising couplings (XX, YY, ZZ), displaying topological order and Majorana fermion excitations.',
    controls: []
  },
  {
    id: 'fermi-hubbard-2site',
    title: 'Fermi-Hubbard 2-Site Lattice Simulation',
    isPremium: true,
    description: 'Models electronic correlations in strongly coupled materials via the Jordan-Wigner mapped Fermi-Hubbard Hamiltonian, simulating electron hopping t and on-site repulsion U.',
    controls: []
  },

  // ── Quantum Machine Learning & Optimization ──────────────────────────────
  {
    id: 'qcnn',
    title: 'Quantum Convolutional Neural Network (QCNN)',
    isPremium: true,
    description: 'Cong, Choi & Lukin (2019) hierarchical machine learning architecture. Alternates parameterised multi-qubit convolutional unitaries with quantum pooling measurements to recognize topological quantum phases.',
    controls: []
  },
  {
    id: 'quantum-autoencoder',
    title: 'Quantum Autoencoder (State Compression)',
    isPremium: true,
    description: 'Romero, Olson & Aspuru-Guzik (2017) quantum data compression network. Trains a unitary circuit to compress quantum states into a latent subspace, discarding trash qubits verified via a Swap Test.',
    controls: []
  },
  {
    id: 'qgan-generator',
    title: 'Quantum GAN Generator (QGAN)',
    isPremium: true,
    description: 'Lloyd & Weedbrook (2018) parameterized quantum circuit acting as a generative network, synthesizing target quantum state distributions through adversarial game-theoretic training.',
    controls: []
  },
  {
    id: 'quantum-reservoir',
    title: 'Quantum Reservoir Computing (Echo State)',
    isPremium: true,
    description: 'Fujii & Nakajima (2017) quantum reservoir framework. Maps complex sequential temporal inputs into the exponentially large Hilbert space of a fixed disordered spin network for linear readout.',
    controls: []
  },

  // ── Modern Advanced Linear Algebra & Primitives ──────────────────────────
  {
    id: 'qsp-signal-processing',
    title: 'Quantum Signal Processing (QSP Sequence)',
    isPremium: true,
    description: 'Low & Chuang (2017) grand unification primitive. Interleaves signal rotations W(x) with parameterised phase shifts to evaluate arbitrary polynomial matrix functions.',
    controls: []
  },
  {
    id: 'lcu-multiplexer',
    title: 'Linear Combination of Unitaries (LCU)',
    isPremium: true,
    description: 'Childs & Wiebe (2012) block-encoding method. Prepares linear superposition of coefficients on an ancilla register and applies Select-V multi-controlled unitaries to implement non-unitary operators.',
    controls: []
  },

  // ── Hardware Benchmarks & Tomography ─────────────────────────────────────
  {
    id: 'rb-clifford',
    title: 'Randomized Benchmarking (Clifford Sequence)',
    isPremium: false,
    description: 'Industry-standard Knill & Emerson protocol for hardware verification. Executes random sequences of Clifford group gates followed by their unique inversion gate to quantify average gate fidelity without state tomography errors.',
    controls: []
  },
  {
    id: 'quantum-volume-4q',
    title: 'Quantum Volume 4-Qubit Model Circuit',
    isPremium: true,
    description: 'Cross et al. (2019) benchmark metric for NISQ hardware capability. Evaluates random square depth-equal-width circuits composed of pairwise Haar-random SU(4) unitaries and qubit permutations.',
    controls: []
  },
  {
    id: 'xeb-cross-entropy',
    title: 'Cross-Entropy Benchmarking (XEB Supremacy)',
    isPremium: true,
    description: 'Arute et al. (2019) Google Sycamore benchmark. Evaluates pseudo-random circuits of non-Clifford rotations and CZ entangling layers to benchmark quantum fidelity in the quantum supremacy regime.',
    controls: []
  },
  {
    id: 'ramsey-fringes',
    title: 'T2 Ramsey Fringe Decoherence Calibration',
    isPremium: false,
    description: 'Fundamental spectroscopy pulse sequence. Applies two π/2 pulses separated by free precession delay to measure qubit phase coherence time T₂* and detuning frequencies.',
    controls: []
  },
  {
    id: 'hahn-echo',
    title: 'Hahn Echo Dynamic Decoupling (T2 Echo)',
    isPremium: false,
    description: 'Erwin Hahn (1950) spin echo technique. Inserts a π refocusing pulse between two π/2 pulses to cancel low-frequency 1/f magnetic flux noise and extend qubit coherence time T₂.',
    controls: []
  },
  {
    id: 'state-tomography-bell',
    title: 'Two-Qubit State Tomography (Bell State)',
    isPremium: false,
    description: 'Full quantum state reconstruction of a Bell pair. Measures projective correlations across Pauli bases (X, Y, Z) to reconstruct the complete two-qubit density matrix ρ and calculate state purity.',
    controls: []
  }
];

// Append all verified algorithms
VERIFIED_ALGORITHMS.forEach(algo => {
  if (!algorithmsData.some(a => a.id === algo.id)) {
    algorithmsData.push(algo);
  }
});

