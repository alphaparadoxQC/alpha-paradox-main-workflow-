/**
 * AlphaIR — Unified Intermediate Representation & Project Format
 * ==============================================================
 * Serializes the entire Alpha suite (Composer, Analog, Notebook,
 * backend config, pulse schedule) into a single `.alpha` JSON file.
 *
 * This is the root dependency for:
 *  - Pulse Engine (reads circuit operations from IR)
 *  - GDSII Export (reads analog graph from IR)
 *  - Python SDK / CLI (sends IR payloads to backend)
 *  - Offline Packaging (saves/loads complete project state)
 */

import { QuantumCircuit } from './circuit.js';

// ─── Schema Version ──────────────────────────────────────────────────
export const ALPHA_IR_VERSION = '2.0.0';

// ─── File Extension ──────────────────────────────────────────────────
export const ALPHA_FILE_EXTENSION = '.alpha';

/**
 * Serialize the full project state from all Zustand stores into an AlphaIR JSON object.
 *
 * @param {Object} circuitStore  - useCircuitStore.getState()
 * @param {Object} analogStore   - useAnalogStore.getState()
 * @param {Object} notebookStore - useNotebookStore.getState()
 * @param {Object} backendStore  - useBackendStore.getState()
 * @param {Object} [options]     - Optional overrides (projectName, author, pulseSchedule)
 * @returns {Object} AlphaIR JSON object
 */
export function serialize(circuitStore, analogStore, notebookStore, backendStore, options = {}, edaStore = null) {
  const circuit = circuitStore.circuit;

  return {
    // ── Header ─────────────────────────────────────────────
    alphaIR: ALPHA_IR_VERSION,
    metadata: {
      name: options.projectName || circuit.name || 'Untitled Project',
      author: options.author || null,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: 1,
      description: options.description || '',
    },

    // ── Composer (Gate-Level Circuit) ──────────────────────
    composer: {
      name: circuit.name,
      numQubits: circuit.numQubits,
      numClbits: circuit.numClbits,
      operations: circuit.operations.map(op => ({
        id: op.id,
        gate: op.gate,
        qubits: op.qubits,
        clbits: op.clbits,
        params: op.params,
        timeSlice: op.timeSlice,
      })),
      initialStates: circuit.initialStates,
      metadata: circuit.metadata,
    },

    // ── Analog (Node-Graph Physics Canvas) ─────────────────
    analog: {
      nodes: (analogStore.nodes || []).map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: (analogStore.edges || []).map(edge => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
      })),
    },

    // ── Notebook (Jupyter-compatible Cells) ────────────────
    notebook: {
      name: notebookStore.notebookName || 'Untitled Notebook',
      cells: (notebookStore.cells || []).map(cell => ({
        id: cell.id,
        type: cell.type,
        content: cell.content,
        executionCount: cell.executionCount,
        outputs: cell.outputs,
      })),
    },

    // ── Target Hardware & Backend Config ───────────────────
    targetHardware: {
      processor: backendStore.selectedProcessor,
      backend: backendStore.selectedBackend,
      multiChipMode: backendStore.multiChipMode,
      selectedBackends: backendStore.selectedBackends,
      shots: backendStore.shots,
      noiseConfig: backendStore.noiseConfig,
      provider: backendStore.selectedProvider,
    },

    // ── EDA / Silicon Layout (Alpha Metal) ─────────────────
    eda: edaStore ? {
      chips: edaStore.chips || {},
      components: (edaStore.components || []).map(comp => ({
        id: comp.id,
        name: comp.name,
        type: comp.type,
        params: comp.params,
      })),
      netlist: edaStore.netlist || [],
      dependencies: edaStore.dependencies || {},
      variables: edaStore.variables || {},
    } : null,

    // ── Pulse Schedule (populated by Pulse Engine) ─────────
    pulseSchedule: options.pulseSchedule || null,

    // ── Cross-Product Bridge Metadata ──────────────────────
    bridges: options.bridges || null,
  };
}

/**
 * Deserialize an AlphaIR JSON object and hydrate all Zustand stores.
 *
 * @param {Object} ir            - AlphaIR JSON object (parsed from .alpha file)
 * @param {Object} circuitStore  - useCircuitStore.getState()
 * @param {Object} analogStore   - useAnalogStore.getState()
 * @param {Object} notebookStore - useNotebookStore.getState()
 * @param {Object} backendStore  - useBackendStore.getState()
 */
export function deserialize(ir, circuitStore, analogStore, notebookStore, backendStore, edaStore = null) {
  // ── Validate ──────────────────────────────────────────────
  if (!ir || !ir.alphaIR) {
    throw new Error('Invalid AlphaIR file: missing "alphaIR" version field.');
  }

  const [major] = ir.alphaIR.split('.').map(Number);
  if (major > 2) {
    throw new Error(`Unsupported AlphaIR version: ${ir.alphaIR}. This client supports v1.x.x and v2.x.x.`);
  }

  // ── Hydrate Composer ──────────────────────────────────────
  if (ir.composer) {
    const qc = new QuantumCircuit(ir.composer.numQubits || 5, ir.composer.numClbits || 3);
    qc.name = ir.composer.name || 'unnamed-Circuit';
    qc.operations = ir.composer.operations || [];
    qc.initialStates = ir.composer.initialStates || qc.initialStates;
    qc.metadata = ir.composer.metadata || {};
    circuitStore.loadCircuit(qc);
  }

  // ── Hydrate Analog Canvas ─────────────────────────────────
  if (ir.analog) {
    const restoredNodes = (ir.analog.nodes || []).map(node => ({
      ...node,
      selected: false,
    }));
    const restoredEdges = (ir.analog.edges || []).map(edge => ({
      ...edge,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    }));
    analogStore.setNodes(restoredNodes);
    analogStore.setEdges(restoredEdges);
  }

  // ── Hydrate Notebook ──────────────────────────────────────
  if (ir.notebook) {
    const cells = (ir.notebook.cells || []).map(cell => ({
      ...cell,
      status: 'idle',
      collapsed: false,
      editing: cell.type === 'code',
      startedAt: null,
      completedAt: null,
    }));

    // Use the store's internal setter pattern
    notebookStore.setNotebookName(ir.notebook.name || 'Untitled Notebook');
    // Direct state update for cells — notebookStore doesn't expose a bulk setter,
    // so we'll use the fromIpynb-style approach
    if (cells.length > 0) {
      // Build a pseudo-ipynb to leverage existing import logic
      const pseudoNotebook = {
        cells: cells.map(c => ({
          cell_type: c.type === 'code' ? 'code' : 'markdown',
          source: c.content,
          execution_count: c.executionCount,
          outputs: c.outputs || [],
        })),
      };
      notebookStore.fromIpynb(pseudoNotebook);
      notebookStore.setNotebookName(ir.notebook.name || 'Untitled Notebook');
    }
  }

  // ── Hydrate Backend Config ────────────────────────────────
  if (ir.targetHardware) {
    const hw = ir.targetHardware;
    if (hw.processor) backendStore.setProcessor(hw.processor);
    if (hw.backend) backendStore.setBackend(hw.backend);
    if (hw.shots) backendStore.setShots(hw.shots);
    if (hw.noiseConfig) backendStore.setNoiseConfig(hw.noiseConfig);
    if (hw.multiChipMode !== undefined) backendStore.setMultiChipMode(hw.multiChipMode);
    if (hw.provider) backendStore.setSelectedProvider(hw.provider);
  }

  // ── Hydrate EDA / Silicon Layout ──────────────────────────
  if (ir.eda && edaStore) {
    const eda = ir.eda;
    edaStore.clearDesign();
    // Restore chips
    if (eda.chips && Object.keys(eda.chips).length > 0) {
      // Use setState to bulk-replace chips
      const { useEdaStore: EdaStoreRef } = require('../stores/edaStore');
      EdaStoreRef.setState({
        chips: eda.chips,
        components: eda.components || [],
        netlist: eda.netlist || [],
        dependencies: eda.dependencies || {},
        variables: eda.variables || { cpw_width: '10um', cpw_gap: '6um' },
      });
    }
  }
}

/**
 * Download the AlphaIR project as a .alpha file (triggers browser download).
 *
 * @param {Object} irData   - Serialized AlphaIR JSON
 * @param {string} filename - File name (without extension)
 */
export function downloadProject(irData, filename = 'project') {
  const json = JSON.stringify(irData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}${ALPHA_FILE_EXTENSION}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open a file picker and load an .alpha project file.
 * Returns a Promise that resolves with the parsed AlphaIR JSON.
 *
 * @returns {Promise<Object>} Parsed AlphaIR JSON
 */
export function openProjectFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.alpha,.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const ir = JSON.parse(event.target.result);
          resolve(ir);
        } catch (err) {
          reject(new Error(`Failed to parse project file: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    input.click();
  });
}

/**
 * Generate a circuit code string from the Composer section of AlphaIR.
 * Useful for the bidirectional sync: Composer → Notebook auto-code-gen.
 *
 * @param {Object} composerIR - The `composer` section of an AlphaIR object
 * @returns {string} Python code string (Alpha-compatible)
 */
export function composerToNotebookCode(composerIR) {
  if (!composerIR || !composerIR.operations) return '# Empty circuit\n';

  const lines = [
    '# Auto-generated from Alpha Composer',
    '# ─────────────────────────────────',
    'from alpha import QuantumCircuit',
    'import numpy as np',
    '',
    `qc = QuantumCircuit(${composerIR.numQubits}, ${composerIR.numClbits})`,
    '',
  ];

  for (const op of composerIR.operations) {
    const q = op.qubits;
    switch (op.gate) {
      case 'H': lines.push(`qc.h(${q[0]})`); break;
      case 'X': lines.push(`qc.x(${q[0]})`); break;
      case 'Y': lines.push(`qc.y(${q[0]})`); break;
      case 'Z': lines.push(`qc.z(${q[0]})`); break;
      case 'S': lines.push(`qc.s(${q[0]})`); break;
      case 'SDG': lines.push(`qc.sdg(${q[0]})`); break;
      case 'T': lines.push(`qc.t(${q[0]})`); break;
      case 'TDG': lines.push(`qc.tdg(${q[0]})`); break;
      case 'SX': lines.push(`qc.sx(${q[0]})`); break;
      case 'RX': lines.push(`qc.rx(${op.params?.theta ?? Math.PI}, ${q[0]})`); break;
      case 'RY': lines.push(`qc.ry(${op.params?.theta ?? Math.PI}, ${q[0]})`); break;
      case 'RZ': lines.push(`qc.rz(${op.params?.theta ?? Math.PI}, ${q[0]})`); break;
      case 'P': lines.push(`qc.p(${op.params?.lambda ?? Math.PI}, ${q[0]})`); break;
      case 'U': lines.push(`qc.u(${op.params?.theta ?? 0}, ${op.params?.phi ?? 0}, ${op.params?.lambda ?? 0}, ${q[0]})`); break;
      case 'CX': lines.push(`qc.cx(${q[0]}, ${q[1]})`); break;
      case 'CY': lines.push(`qc.cy(${q[0]}, ${q[1]})`); break;
      case 'CZ': lines.push(`qc.cz(${q[0]}, ${q[1]})`); break;
      case 'SWAP': lines.push(`qc.swap(${q[0]}, ${q[1]})`); break;
      case 'CCX': lines.push(`qc.ccx(${q[0]}, ${q[1]}, ${q[2]})`); break;
      case 'CSWAP': lines.push(`qc.cswap(${q[0]}, ${q[1]}, ${q[2]})`); break;
      case 'MEASURE': lines.push(`qc.measure(${q[0]}, ${op.clbits?.[0] ?? q[0]})`); break;
      case 'BARRIER': lines.push(`qc.barrier(${q.join(', ')})`); break;
      case 'RESET': lines.push(`qc.reset(${q[0]})`); break;
      default: lines.push(`# ${op.gate}(...)`); break;
    }
  }

  lines.push('');
  lines.push('print(qc.draw())');
  return lines.join('\n');
}

// ─── Default Export ──────────────────────────────────────────────────
const AlphaIR = {
  VERSION: ALPHA_IR_VERSION,
  FILE_EXTENSION: ALPHA_FILE_EXTENSION,
  serialize,
  deserialize,
  downloadProject,
  openProjectFile,
  composerToNotebookCode,
};

export default AlphaIR;
