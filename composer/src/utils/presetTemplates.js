/**
 * Preset Templates & Cross-Launch Utilities
 * =========================================
 * Bridges the 4 modules:
 * 1. Transmon Qubit with Readout Resonator (EDA → Analog)
 * 2. VQE Molecular Ground State for H2 / LiH (Notebook → Composer)
 * 3. 2-Qubit Bell State Parity Measurement & Active Reset (Composer)
 */

import { QuantumCircuit } from '../quantum-engine/circuit';
import { useCircuitStore } from '../stores/circuitStore';
import { useEdaStore } from '../stores/edaStore';
import useAnalogStore from '../stores/analogStore';
import useNotebookStore from '../stores/notebookStore';
import CrossProductBridge from '../quantum-engine/cross-product-bridge';

/**
 * 1. Transmon Qubit with Readout Resonator (EDA Layout)
 */
export function loadTransmonEdaPreset(navigate) {
  const store = useEdaStore.getState();
  
  // Set up chip geometry
  store.clearDesign();
  useEdaStore.setState({
    chips: {
      main: {
        material: 'silicon',
        size_x: '8mm',
        size_y: '6mm',
        size_z: '-500um',
        layer_stack: 1
      }
    },
    components: [
      {
        id: 1,
        name: 'Q1_Transmon',
        type: 'transmon_pocket',
        params: {
          pos_x: '-1.5mm',
          pos_y: '0.0mm',
          orientation: '0',
          pad_width: '420um',
          pad_height: '280um',
          pad_gap: '30um',
          induction: '12nH',
          cap_style: 'round',
          chip: 'main',
          layer: '1'
        }
      },
      {
        id: 2,
        name: 'Readout_Resonator',
        type: 'route_meander',
        params: {
          pos_x: '0.0mm',
          pos_y: '0.0mm',
          fillet: '50um',
          total_length: '5.2mm',
          trace_width: '10um',
          trace_gap: '6um',
          meander_asymmetry: '0um',
          chip: 'main',
          layer: '1'
        }
      },
      {
        id: 3,
        name: 'Launchpad_Readout',
        type: 'launchpad_wirebond',
        params: {
          pos_x: '2.5mm',
          pos_y: '0.0mm',
          orientation: '180',
          trace_width: '10um',
          trace_gap: '6um',
          pad_width: '200um',
          pad_height: '200um',
          chip: 'main',
          layer: '1'
        }
      }
    ],
    netlist: [
      { net_id: 1, comp: 1, pin: 'readout' },
      { net_id: 1, comp: 2, pin: 'start' },
      { net_id: 2, comp: 2, pin: 'end' },
      { net_id: 2, comp: 3, pin: 'tie' }
    ],
    selectedComponentId: 1
  });

  if (navigate) navigate('/eda');
}

/**
 * 1b. Transmon Hamiltonian Solver in Analog Node Engine
 */
export function loadTransmonAnalogPreset(params = {}, navigate) {
  const circuitState = useCircuitStore.getState();
  if (circuitState?.circuit && circuitState.circuit.operations?.length > 0) {
    // If an active circuit exists, use CrossProductBridge to reflect circuit statevector
    CrossProductBridge.bridgeComposerToAnalog(navigate);
    return;
  }

  const store = useAnalogStore.getState();
  store.clearGraph();

  const Ec_MHz = params.Ec_MHz || 280;
  const Ej_MHz = params.Ej_MHz || 14200;
  // Natural units scaling for T = -0.5 d^2/dx^2
  const ejScaled = Math.min(22, Math.max(12, (Ej_MHz / (4 * Ec_MHz)) || 15.0));

  // Add nodes representing the CPB/Transmon Hamiltonian:
  // H = 4 * Ec * (n - ng)^2 - Ej * cos(phi)
  const sdId = store.addNode('spatialDimension', { x: 60, y: 140 }, {
    label: 'Phase Coordinate φ',
    xmin: -3.14159,
    xmax: 3.14159,
    n: 300
  });

  const scEcId = store.addNode('scalar', { x: 60, y: 320 }, {
    label: 'Ec (Charging Energy)',
    value: Ec_MHz
  });

  const scEjId = store.addNode('scalar', { x: 60, y: 440 }, {
    label: 'Ej (Josephson Energy)',
    value: Number(ejScaled.toFixed(2))
  });

  const ptId = store.addNode('potential', { x: 300, y: 220 }, {
    label: 'Transmon Potential V(φ)',
    expression: `-${ejScaled.toFixed(2)} * cos(x)`
  });

  const hmId = store.addNode('hamiltonian', { x: 530, y: 180 }, {
    label: 'Transmon H = 4Ec·n² - Ej·cosφ'
  });

  const spId = store.addNode('spectrum', { x: 530, y: 340 }, {
    label: 'Transmon Spectrum (Levels 0..4)',
    nEigenstates: 5
  });

  const epId = store.addNode('energyPlot', { x: 780, y: 120 }, {
    label: 'Anharmonic Ladder & Wavefunctions',
    ymin: -Math.round(ejScaled * 1.3),
    ymax: 5,
    showV: true,
    showPsi2: true,
    showEn: true
  });

  const lcId = store.addNode('linearCombination', { x: 300, y: 440 }, {
    nEigenstates: 5,
    normalize: true,
    coefficients: [
      { re: 1, im: 0 },
      { re: 0, im: 0 },
      { re: 0, im: 0 },
      { re: 0, im: 0 },
      { re: 0, im: 0 }
    ]
  });

  // Edge wiring
  store.setEdges([
    { id: 'e_sd_pt', source: sdId, sourceHandle: 'x', target: ptId, targetHandle: 'x', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
    { id: 'e_pt_hm', source: ptId, sourceHandle: 'V', target: hmId, targetHandle: 'V', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e_hm_sp', source: hmId, sourceHandle: 'H', target: spId, targetHandle: 'H', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    { id: 'e_hm_ep', source: hmId, sourceHandle: 'V_out', target: epId, targetHandle: 'V', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e_sp_ep', source: spId, sourceHandle: 'eigenstates', target: epId, targetHandle: 'eigenstates', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    { id: 'e_sp_lc', source: spId, sourceHandle: 'eigenstates', target: lcId, targetHandle: 'eigenstates', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    { id: 'e_lc_ep', source: lcId, sourceHandle: 'psi', target: epId, targetHandle: 'psi', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } }
  ]);

  // Auto-run simulation immediately so results are calculated upon navigation
  store.runSimulation();

  if (navigate) navigate('/vqpu');
}

/**
 * 2. VQE Molecular Ground State for H2 / LiH (Composer Circuit)
 */
export function loadVqeComposerPreset(molecule = 'H2', navigate) {
  const numQubits = molecule === 'LiH' ? 6 : 4;
  const numClbits = numQubits;
  const qc = new QuantumCircuit(numQubits, numClbits);
  qc.name = `VQE-${molecule}-GroundState`;

  // 1. Hartree-Fock Reference State
  // H2 requires 2 electrons in lowest molecular orbital (spin up, spin down) -> |1100>
  qc.x(0);
  qc.x(1);
  if (molecule === 'LiH') {
    qc.x(2);
    qc.x(3);
  }
  qc.barrier();

  // 2. Parameterized UCCSD / Hardware-Efficient Entangling Ansatz
  // Variational theta rotations
  const thetaH2 = [0.7854, 1.0472, 0.5236, 0.3927];
  for (let i = 0; i < 4; i++) {
    qc.ry(i, thetaH2[i]);
  }
  if (molecule === 'LiH') {
    qc.ry(4, 0.612);
    qc.ry(5, 0.448);
  }

  // Entangling CNOT ladder
  qc.cx(0, 1);
  qc.cx(1, 2);
  qc.cx(2, 3);
  if (molecule === 'LiH') {
    qc.cx(3, 4);
    qc.cx(4, 5);
  }

  // Correlated two-body excitation rotation
  qc.rz(numQubits - 1, 0.7854);

  // Uncompute ladder for UCCSD symmetry
  if (molecule === 'LiH') {
    qc.cx(4, 5);
    qc.cx(3, 4);
  }
  qc.cx(2, 3);
  qc.cx(1, 2);
  qc.cx(0, 1);
  qc.barrier();

  // 3. Pauli Basis Measurement (Z and X basis rotation)
  qc.measureAll();

  useCircuitStore.getState().loadCircuit(qc);
  if (navigate) navigate('/composer');
}

/**
 * 3. 2-Qubit Bell State Parity Measurement & Active Reset (Composer Circuit)
 * Demonstrates QEC stabilizer syndrome extraction with mid-circuit measurement and reset.
 */
export function loadBellParityResetPreset(navigate) {
  // 3 qubits: q0, q1 (data qubits), q2 (syndrome ancilla)
  // 4 clbits: c0 (ZZ syndrome), c1 (XX syndrome), c2 (data q0), c3 (data q1)
  const qc = new QuantumCircuit(3, 4);
  qc.name = 'Bell-Parity-ActiveReset-QEC';

  // --- Step 1: Prepare Entangled Bell State on Data Qubits ---
  qc.h(0);
  qc.cx(0, 1);
  qc.barrier();

  // --- Step 2: Measure ZZ Stabilizer Parity using Ancilla q2 ---
  qc.cx(0, 2);
  qc.cx(1, 2);
  // Mid-circuit measurement into classical bit c0
  qc.measure(2, 0);
  qc.barrier();

  // --- Step 3: Active Mid-Circuit Reset on Ancilla ---
  // Returns ancilla q2 to |0> state for syndrome reuse
  qc.reset(2);
  qc.barrier();

  // --- Step 4: Measure XX Stabilizer Parity in Hadamard Basis ---
  qc.h(0);
  qc.h(1);
  qc.h(2);
  qc.cx(2, 0);
  qc.cx(2, 1);
  qc.h(2);
  // Measure XX parity into classical bit c1
  qc.measure(2, 1);
  qc.barrier();

  // --- Step 5: Second Active Reset on Ancilla ---
  qc.reset(2);
  // Rotate data qubits back to computational basis
  qc.h(0);
  qc.h(1);
  qc.barrier();

  // --- Step 6: Final Data Qubit Readout ---
  qc.measure(0, 2);
  qc.measure(1, 3);

  useCircuitStore.getState().loadCircuit(qc);
  if (navigate) navigate('/composer');
}
