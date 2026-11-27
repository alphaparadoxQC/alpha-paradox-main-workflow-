import { useState } from 'react';
import { algorithmsData } from '../../data/algorithms';
import { useCircuitStore } from '../../stores/circuitStore';
import { QuantumCircuit } from '../../quantum-engine/circuit';
import { ALGORITHM_BUILDERS } from '../../data/algorithmBuilders';
import AlgorithmConfigModal from './AlgorithmConfigModal';

export default function AlgorithmsModal({ onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [configAlgo, setConfigAlgo] = useState(null); // which algorithm's config dialog is open
  const loadCircuitStore = useCircuitStore(state => state.loadCircuit);

  const filteredAlgorithms = algorithmsData.filter(algo => 
    algo.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const buildCircuit = (algoId, params = {}) => {
    if (ALGORITHM_BUILDERS[algoId]) {
      const builtQc = ALGORITHM_BUILDERS[algoId](params);
      builtQc.name = algorithmsData.find(a => a.id === algoId)?.title || builtQc.name;
      return builtQc;
    }

    const n = params.numQubits || 3;
    let qc;

    switch(algoId) {
      // ── Teleportation ──────────────────────────────────────
      case 'teleportation-1': {
        qc = new QuantumCircuit(3, 3);
        // Prepare initial state on q0 using alpha/beta if given
        if (params.alpha && params.beta) {
          const theta = 2 * Math.atan2(
            Math.sqrt(params.beta.re ** 2 + params.beta.im ** 2),
            Math.sqrt(params.alpha.re ** 2 + params.alpha.im ** 2)
          );
          if (Math.abs(theta) > 1e-6) qc.ry(0, theta);
        }
        qc.barrier();
        
        // Bell pair generation (q1, q2)
        qc.h(1);
        qc.cx(1, 2);
        qc.barrier();
        
        // Alice operations
        qc.cx(0, 1);
        qc.h(0);
        qc.barrier();
        qc.measure(0, 0);
        qc.measure(1, 1);
        
        // Bob operations (Corrections)
        qc.cx(1, 2);
        qc.cz(0, 2);
        qc.barrier();
        qc.measure(2, 2);
        break;
      }
      case 'teleportation-n': {
        const nq = params.numQubits || 3;
        qc = new QuantumCircuit(nq * 3, nq * 3); // nq data + nq alice + nq bob
        
        if (params.alpha && params.beta) {
          const theta = 2 * Math.atan2(
            Math.sqrt(params.beta.re ** 2 + params.beta.im ** 2),
            Math.sqrt(params.alpha.re ** 2 + params.alpha.im ** 2)
          );
          if (Math.abs(theta) > 1e-6) {
            for(let i=0; i<nq; i++) qc.ry(i, theta);
          }
        }
        qc.barrier();
        // Create Bell pairs between Alice and Bob
        for (let i = 0; i < nq; i++) {
          qc.h(nq + i);
          qc.cx(nq + i, nq * 2 + i);
        }
        qc.barrier();
        // Alice Bell measurement
        for (let i = 0; i < nq; i++) {
          qc.cx(i, nq + i);
          qc.h(i);
        }
        qc.barrier();
        for (let i = 0; i < nq; i++) {
          qc.measure(i, i);
          qc.measure(nq + i, nq + i);
        }
        // Bob corrections
        for (let i = 0; i < nq; i++) {
          qc.cx(nq + i, nq * 2 + i);
          qc.cz(i, nq * 2 + i);
        }
        qc.barrier();
        for (let i = 0; i < nq; i++) {
          qc.measure(nq * 2 + i, nq * 2 + i);
        }
        break;
      }

      // ── Deutsch ────────────────────────────────────────────
      case 'deutsch': {
        qc = new QuantumCircuit(2, 2);
        qc.x(1);
        qc.h(0); qc.h(1);
        if (params.oracle === 'constant-0') {
          // f(x) = 0, no gate needed
        } else if (params.oracle === 'constant-1') {
          qc.x(1);
        } else if (params.oracle === 'identity') {
          qc.cx(0, 1);
        } else if (params.oracle === 'negation') {
          qc.x(0); qc.cx(0, 1); qc.x(0);
        } else {
          qc.cx(0, 1); // default: balanced
        }
        qc.h(0);
        qc.barrier();
        qc.measure(0, 0);
        break;
      }
      case 'deutsch-jozsa': {
        const nq = params.numQubits || 2;
        qc = new QuantumCircuit(nq + 1, nq + 1);
        qc.x(nq); // ancilla
        for (let i = 0; i <= nq; i++) qc.h(i);
        if (params.oracle === 'constant-0') {
          // no gate
        } else if (params.oracle === 'constant-1') {
          qc.x(nq);
        } else {
          // balanced oracle: CNOT from each input to ancilla
          for (let i = 0; i < nq; i++) qc.cx(i, nq);
        }
        for (let i = 0; i < nq; i++) qc.h(i);
        qc.barrier();
        for (let i = 0; i < nq; i++) qc.measure(i, i);
        break;
      }

      // ── Bernstein-Vazirani ─────────────────────────────────
      case 'bernstein-vazirani': {
        const nq = params.numQubits || 3;
        const secret = params.secret || '101';
        qc = new QuantumCircuit(nq + 1, nq + 1);
        qc.x(nq);
        for (let i = 0; i <= nq; i++) qc.h(i);
        // Oracle: CNOT on positions where secret bit is 1
        for (let i = 0; i < Math.min(secret.length, nq); i++) {
          if (secret[i] === '1') qc.cx(i, nq);
        }
        for (let i = 0; i < nq; i++) qc.h(i);
        qc.barrier();
        for (let i = 0; i < nq; i++) qc.measure(i, i);
        break;
      }

      // ── Simon's ────────────────────────────────────────────
      case 'simon': {
        const nq = params.numQubits || 2;
        const secret = params.secret || '11';
        qc = new QuantumCircuit(nq * 2, nq * 2);
        for (let i = 0; i < nq; i++) qc.h(i);
        // Oracle: copy, then XOR with secret
        for (let i = 0; i < nq; i++) qc.cx(i, nq + i);
        for (let i = 0; i < Math.min(secret.length, nq); i++) {
          if (secret[i] === '1') qc.cx(0, nq + i);
        }
        for (let i = 0; i < nq; i++) qc.h(i);
        qc.barrier();
        for (let i = 0; i < nq; i++) qc.measure(i, i);
        break;
      }

      // ── Superdense Coding ──────────────────────────────────
      case 'superdense-coding': {
        const bits = params.inputBits || '00';
        qc = new QuantumCircuit(2, 2);
        qc.h(0);
        qc.cx(0, 1);
        // Encode bits
        if (bits[1] === '1') qc.x(0);
        if (bits[0] === '1') qc.z(0);
        qc.cx(0, 1);
        qc.h(0);
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── QFT ────────────────────────────────────────────────
      case 'qft': {
        const nq = params.numQubits || 3;
        qc = new QuantumCircuit(nq, nq);
        for (let i = nq - 1; i >= 0; i--) {
          qc.h(i);
          for (let j = i - 1; j >= 0; j--) {
            qc.cp(j, i, Math.PI / Math.pow(2, i - j));
          }
          qc.barrier();
        }
        // SWAP for bit reversal
        for (let i = 0; i < Math.floor(nq / 2); i++) {
          qc.swap(i, nq - 1 - i);
        }
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── QPE ────────────────────────────────────────────────
      case 'qpe': {
        const nq = params.numQubits || 3;
        qc = new QuantumCircuit(nq + 1, nq + 1);
        qc.x(nq); // eigenstate |1⟩
        for (let i = 0; i < nq; i++) qc.h(i);
        // Controlled-U^(2^k) rotations
        for (let i = 0; i < nq; i++) {
          for (let j = 0; j < Math.pow(2, i); j++) {
            qc.cp(i, nq, Math.PI / 4); // T gate phase as example
          }
        }
        // Inverse QFT on counting register
        for (let i = 0; i < Math.floor(nq / 2); i++) qc.swap(i, nq - 1 - i);
        for (let i = 0; i < nq; i++) {
          for (let j = 0; j < i; j++) {
            qc.cp(j, i, -Math.PI / Math.pow(2, i - j));
          }
          qc.h(i);
        }
        qc.barrier();
        for (let i = 0; i < nq; i++) qc.measure(i, i);
        break;
      }

      // ── Grover's Search ────────────────────────────────────
      case 'grover': {
        const nq = params.numQubits || 2;
        qc = new QuantumCircuit(nq, nq);
        // Superposition
        for (let i = 0; i < nq; i++) qc.h(i);
        // Number of iterations ~ π/4 * √N
        const iters = Math.max(1, Math.round(Math.PI / 4 * Math.sqrt(Math.pow(2, nq))));
        for (let it = 0; it < iters; it++) {
          // Oracle: mark target state (all 1s by default)
          if (nq === 2) {
            qc.cz(0, 1);
          } else if (nq === 3) {
            qc.h(2); qc.ccx(0, 1, 2); qc.h(2);
          } else {
            qc.h(nq - 1); qc.ccx(0, 1, nq - 1); qc.h(nq - 1);
          }
          // Diffuser
          for (let i = 0; i < nq; i++) qc.h(i);
          for (let i = 0; i < nq; i++) qc.x(i);
          if (nq === 2) {
            qc.cz(0, 1);
          } else if (nq === 3) {
            qc.h(2); qc.ccx(0, 1, 2); qc.h(2);
          } else {
            qc.h(nq - 1); qc.ccx(0, 1, nq - 1); qc.h(nq - 1);
          }
          for (let i = 0; i < nq; i++) qc.x(i);
          for (let i = 0; i < nq; i++) qc.h(i);
        }
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── Shor's Factorization ───────────────────────────────
      case 'shor': {
        // Simplified demonstration for N=15
        qc = new QuantumCircuit(8, 8);
        // Counting register
        for (let i = 0; i < 4; i++) qc.h(i);
        qc.x(4); // work register starts at |1⟩
        // Modular exponentiation (simplified for a=7, N=15)
        qc.cx(0, 4); qc.cx(0, 5);
        qc.cx(1, 5); qc.cx(1, 6);
        // Inverse QFT on counting register
        for (let i = 0; i < 2; i++) qc.swap(i, 3 - i);
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < i; j++) {
            qc.cp(j, i, -Math.PI / Math.pow(2, i - j));
          }
          qc.h(i);
        }
        qc.barrier();
        for (let i = 0; i < 4; i++) qc.measure(i, i);
        break;
      }

      // ── VQE ────────────────────────────────────────────────
      case 'vqe': {
        const isLiH = params.molecule && params.molecule.includes('LiH');
        const numQ = isLiH ? 6 : 4;
        qc = new QuantumCircuit(numQ, numQ);
        qc.name = isLiH ? 'VQE-LiH-GroundState' : 'VQE-H2-GroundState';
        
        // Hartree-Fock initial state
        qc.x(0); qc.x(1);
        if (isLiH) { qc.x(2); qc.x(3); }
        qc.barrier();

        const l = params.layers || 1;
        for (let layer = 0; layer < l; layer++) {
          // Variational ansatz (UCCSD-inspired)
          qc.ry(0, Math.PI / 4);
          qc.ry(1, Math.PI / 3);
          qc.ry(2, Math.PI / 6);
          qc.ry(3, Math.PI / 8);
          if (isLiH) {
            qc.ry(4, Math.PI / 5);
            qc.ry(5, Math.PI / 7);
          }
          qc.cx(0, 1); qc.cx(1, 2); qc.cx(2, 3);
          if (isLiH) { qc.cx(3, 4); qc.cx(4, 5); }
          qc.rz(numQ - 1, Math.PI / 4);
          if (isLiH) { qc.cx(4, 5); qc.cx(3, 4); }
          qc.cx(2, 3); qc.cx(1, 2); qc.cx(0, 1);
        }
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── Bell Parity Measurement & Active Reset (QEC) ───────
      case 'bell-parity-qec': {
        qc = new QuantumCircuit(3, 4);
        qc.name = 'Bell-Parity-ActiveReset-QEC';
        // 1. Prepare entangled Bell pair
        qc.h(0);
        qc.cx(0, 1);
        qc.barrier();
        // 2. Measure ZZ Parity with ancilla q2
        qc.cx(0, 2);
        qc.cx(1, 2);
        qc.measure(2, 0);
        qc.barrier();
        // 3. Mid-circuit active reset on ancilla
        qc.reset(2);
        qc.barrier();
        // 4. Measure XX Parity
        qc.h(0); qc.h(1); qc.h(2);
        qc.cx(2, 0); qc.cx(2, 1);
        qc.h(2);
        qc.measure(2, 1);
        qc.barrier();
        // 5. Active reset ancilla and rotate data back
        qc.reset(2);
        qc.h(0); qc.h(1);
        qc.barrier();
        // 6. Readout data qubits
        qc.measure(0, 2);
        qc.measure(1, 3);
        break;
      }

      // ── QAOA / Max-Cut / Portfolio ─────────────────────────
      case 'portfolio-qaoa':
      case 'max-cut': {
        const nq = params.numQubits || 3;
        const l = params.layers || 1;
        qc = new QuantumCircuit(nq, nq);
        // Initial superposition
        for (let i = 0; i < nq; i++) qc.h(i);
        for (let layer = 0; layer < l; layer++) {
          // Cost layer (ZZ interactions for edges)
          for (let i = 0; i < nq - 1; i++) {
            qc.cx(i, i + 1);
            qc.rz(i + 1, Math.PI / (4 * (layer + 1)));
            qc.cx(i, i + 1);
          }
          // Mixer layer (RX rotations)
          for (let i = 0; i < nq; i++) {
            qc.rx(i, Math.PI / (2 * (layer + 1)));
          }
        }
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── Quantum Walks ──────────────────────────────────────
      case 'quantum-walks': {
        const nq = params.numQubits || 3;
        const steps = params.steps || 5;
        qc = new QuantumCircuit(nq + 1, nq + 1); // +1 for coin
        qc.h(0); // Coin in superposition
        for (let s = 0; s < Math.min(steps, 10); s++) {
          // Coin flip
          qc.h(0);
          // Conditional shift
          for (let i = 1; i < nq + 1; i++) {
            qc.cx(0, i);
          }
        }
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── HHL ────────────────────────────────────────────────
      case 'hhl': {
        qc = new QuantumCircuit(4, 4);
        qc.x(3); // |b⟩ state
        qc.barrier();
        qc.h(1); qc.h(2); // QPE register
        qc.barrier();
        // Controlled rotations (simplified)
        qc.cp(2, 3, Math.PI / 2);
        qc.cp(1, 3, Math.PI / 4);
        qc.barrier();
        // Inverse QFT
        qc.swap(1, 2);
        qc.h(2);
        qc.cp(1, 2, -Math.PI / 2);
        qc.h(1);
        qc.barrier();
        // Controlled rotation for eigenvalue inversion (using cp instead of cry)
        qc.cp(1, 0, Math.PI / 4);
        qc.cp(2, 0, Math.PI / 8);
        // Measure ancilla
        qc.barrier();
        qc.measure(0, 0);
        break;
      }

      // ── QEC: Repetition Code ───────────────────────────────
      case 'repetition-code': {
        qc = new QuantumCircuit(5, 5);
        // Encode logical |+⟩
        qc.h(0);
        qc.cx(0, 1); qc.cx(0, 2);
        // Inject error
        if (params.oracle === 'bit-flip' || params.oracle === 'both') {
          qc.x(params.numQubits || 1);
        }
        // Syndrome extraction
        qc.cx(0, 3); qc.cx(1, 3);
        qc.cx(1, 4); qc.cx(2, 4);
        qc.barrier();
        qc.measure(3, 3);
        qc.measure(4, 4);
        break;
      }

      // ── QEC: Shor Code ─────────────────────────────────────
      case 'shor-code': {
        qc = new QuantumCircuit(9, 9);
        // Encode logical qubit into 9 physical qubits
        // Phase-flip encoding
        qc.cx(0, 3); qc.cx(0, 6);
        qc.barrier();
        // Bit-flip encoding
        qc.h(0); qc.h(3); qc.h(6);
        qc.cx(0, 1); qc.cx(0, 2);
        qc.cx(3, 4); qc.cx(3, 5);
        qc.cx(6, 7); qc.cx(6, 8);
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── QEC: Steane Code ───────────────────────────────────
      case 'steane-code': {
        qc = new QuantumCircuit(7, 7);
        // Steane [7,4,3] code encoding
        qc.h(0); qc.h(1); qc.h(2);
        qc.barrier();
        qc.cx(0, 3); qc.cx(0, 4); qc.cx(0, 6);
        qc.cx(1, 3); qc.cx(1, 5); qc.cx(1, 6);
        qc.cx(2, 4); qc.cx(2, 5); qc.cx(2, 6);
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── QDS ────────────────────────────────────────────────
      case 'qds': {
        qc = new QuantumCircuit(3, 3);
        // Simplified QDS protocol
        qc.h(0);
        qc.cx(0, 1);
        qc.h(2);
        qc.cx(2, 1);
        qc.h(0); qc.h(2);
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── Veto ───────────────────────────────────────────────
      case 'veto': {
        qc = new QuantumCircuit(3, 3);
        qc.h(0); qc.h(1);
        qc.cx(0, 2); qc.cx(1, 2);
        qc.h(0); qc.h(1);
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── QPC ────────────────────────────────────────────────
      case 'qpc': {
        qc = new QuantumCircuit(4, 4);
        qc.h(0); qc.h(2);
        qc.cx(0, 1); qc.cx(2, 3);
        qc.rx(0, Math.PI / 4);
        qc.rx(2, Math.PI / 3);
        qc.cx(0, 1); qc.cx(2, 3);
        qc.h(0); qc.h(2);
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── ML Algorithms (QNN, QSVM, etc.) ────────────────────
      case 'qnn':
      case 'qperceptron':
      case 'qsvm':
      case 'qkmean':
      case 'qknn':
      case 'qhc':
      case 'qpca': {
        const nq = params.numQubits || 3;
        const l = params.layers || 2;
        qc = new QuantumCircuit(nq, nq);
        // Feature map
        for (let i = 0; i < nq; i++) qc.h(i);
        for (let i = 0; i < nq - 1; i++) qc.cx(i, i + 1);
        // Variational layers
        for (let layer = 0; layer < l; layer++) {
          for (let i = 0; i < nq; i++) {
            qc.ry(i, Math.PI / (3 + layer));
            qc.rz(i, Math.PI / (4 + layer));
          }
          for (let i = 0; i < nq - 1; i++) qc.cx(i, i + 1);
        }
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── DQS ────────────────────────────────────────────────
      case 'dqs': {
        qc = new QuantumCircuit(3, 3);
        for (let i = 0; i < 3; i++) qc.h(i);
        // Oracle marking |101⟩
        qc.x(1);
        qc.h(2); qc.ccx(0, 1, 2); qc.h(2);
        qc.x(1);
        // Diffuser
        for (let i = 0; i < 3; i++) qc.h(i);
        for (let i = 0; i < 3; i++) qc.x(i);
        qc.h(2); qc.ccx(0, 1, 2); qc.h(2);
        for (let i = 0; i < 3; i++) qc.x(i);
        for (let i = 0; i < 3; i++) qc.h(i);
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── Trotterization ─────────────────────────────────────
      case 'trotterization': {
        qc = new QuantumCircuit(4, 4);
        // Simulating Heisenberg model H = J(XX + YY + ZZ)
        const dt = 0.5;
        const steps = 3;
        for (let s = 0; s < steps; s++) {
          // XX interaction
          qc.h(0); qc.h(1);
          qc.cx(0, 1); qc.rz(1, dt); qc.cx(0, 1);
          qc.h(0); qc.h(1);
          // YY interaction
          qc.rx(0, Math.PI / 2); qc.rx(1, Math.PI / 2);
          qc.cx(0, 1); qc.rz(1, dt); qc.cx(0, 1);
          qc.rx(0, -Math.PI / 2); qc.rx(1, -Math.PI / 2);
          // ZZ interaction
          qc.cx(0, 1); qc.rz(1, dt); qc.cx(0, 1);
        }
        qc.barrier();
        qc.measureAll();
        break;
      }

      // ── Generic Fallback ────────────────────────────────────
      default: {
        qc = new QuantumCircuit(4, 4);
        qc.h(0); qc.h(1);
        qc.cx(0, 2); qc.cx(1, 3);
        qc.barrier();
        qc.measureAll();
        break;
      }
    }

    qc.name = algorithmsData.find(a => a.id === algoId)?.title || 'Loaded Algorithm';
    return qc;
  };

  const handleLoadWithParams = (algoId, params) => {
    const qc = buildCircuit(algoId, params);
    loadCircuitStore(qc);
    setConfigAlgo(null);
    onClose();
  };

  return (
    <div className="algorithms-modal-overlay">
      <div className="algorithms-modal-content">
        
        {/* Header */}
        <div className="algorithms-header">
          <h2>Algorithms</h2>
          <div className="algorithms-header-right">
            <input 
              type="text" 
              placeholder="Search" 
              className="algo-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="algo-all-btn">All Algorithms</button>
            <button className="algo-close-btn" onClick={onClose} title="Close">×</button>
          </div>
        </div>
        
        {/* Grid of Cards */}
        <div className="algorithms-grid">
          {filteredAlgorithms.map(algo => (
            <div key={algo.id} className="algo-card">
              
              <div className="algo-card-title">
                {algo.title} 
                {algo.isPremium && <span className="premium-icon" title="Premium">👑</span>}
              </div>
              
              <div className="algo-card-desc">
                {algo.description} <span className="read-more">Read more</span>
              </div>
              
              <div className="algo-card-footer">
                <div className="algo-controls">
                  {algo.controls && algo.controls.map((ctrl, idx) => (
                    ctrl.type === 'select' ? (
                      <select key={idx} className="algo-select">
                        {ctrl.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input key={idx} type="text" className="algo-input" placeholder={ctrl.placeholder} />
                    )
                  ))}
                </div>
                
                <button 
                  className="algo-load-btn" 
                  onClick={() => setConfigAlgo(algo)}
                >
                  Load Circuit
                </button>
              </div>
              
            </div>
          ))}
        </div>

      </div>

      {/* Config Dialog (shows on top of the grid) */}
      {configAlgo && (
        <AlgorithmConfigModal
          algorithm={configAlgo}
          onLoad={handleLoadWithParams}
          onClose={() => setConfigAlgo(null)}
        />
      )}
    </div>
  );
}
