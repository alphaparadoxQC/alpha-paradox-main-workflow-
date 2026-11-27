/**
 * Analog Composer Zustand Store
 * =============================
 * Manages the React Flow node graph state, simulation results,
 * and communication with the analog physics backend.
 */

import { create } from 'zustand';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8000';

// Default node ID counter
let nodeIdCounter = 0;
const nextId = () => `node_${++nodeIdCounter}`;

const useAnalogStore = create((set, get) => ({
  // ── React Flow State ───────────────────────────────────────
  nodes: [],
  edges: [],
  
  // ── Simulation State ───────────────────────────────────────
  simulationResult: null,
  isSimulating: false,
  simulationError: null,

  // ── Node/Edge Mutations (called by React Flow callbacks) ───
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set((state) => {
      const updated = applyNodeChanges(changes, state.nodes);
      return { nodes: updated };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const updated = applyEdgeChanges(changes, state.edges);
      return { edges: updated };
    });
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: [
        ...state.edges,
        {
          ...connection,
          id: `e_${connection.source}_${connection.sourceHandle}_${connection.target}_${connection.targetHandle}`,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        },
      ],
    }));
  },

  // ── Add a node from the tray ───────────────────────────────
  addNode: (type, position, data = {}) => {
    const id = nextId();
    const defaults = getDefaultData(type);
    const newNode = {
      id,
      type,
      position: position || { x: 250, y: 150 },
      data: { ...defaults, ...data },
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
    return id;
  },

  // ── Update a node's data ───────────────────────────────────
  updateNodeData: (nodeId, dataUpdate) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...dataUpdate } } : n
      ),
    }));
  },

  // ── Delete selected nodes/edges ────────────────────────────
  deleteSelected: () => {
    set((state) => {
      const selectedIds = new Set(
        state.nodes.filter((n) => n.selected).map((n) => n.id)
      );
      return {
        nodes: state.nodes.filter((n) => !n.selected),
        edges: state.edges.filter(
          (e) =>
            !e.selected &&
            !selectedIds.has(e.source) &&
            !selectedIds.has(e.target)
        ),
      };
    });
  },

  // ── Clear graph ────────────────────────────────────────────
  clearGraph: () => {
    set({ nodes: [], edges: [], simulationResult: null, simulationError: null });
    nodeIdCounter = 0;
  },

  // ── Load Preset ────────────────────────────────────────────
  loadPreset: (presetId) => {
    let newNodes = [];
    let newEdges = [];

    const createNode = (type, position, data) => ({
      id: `node_${++nodeIdCounter}`,
      type,
      position,
      data: { ...getDefaultData(type), ...data },
      selected: false
    });

    const createEdge = (sourceId, targetId, sourceHandle, targetHandle) => ({
      id: `edge_${sourceId}_${targetId}_${sourceHandle}_${targetHandle}`,
      source: sourceId,
      target: targetId,
      sourceHandle,
      targetHandle,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    });

    if (presetId === 'silicon_spin') {
      const spatial = createNode('spatialDimension', { x: 50, y: 50 }, { xmin: -50, xmax: 50, n: 512 });
      const a = createNode('scalar', { x: 50, y: 150 }, { label: 'a', value: 0.1 });
      const meff = createNode('scalar', { x: 50, y: 250 }, { label: 'm_eff', value: 0.19 });
      const pot = createNode('potential', { x: 300, y: 150 }, { expression: '0.5 * m_eff * (a*x**2 - 10)**2' });
      const ham = createNode('hamiltonian', { x: 550, y: 150 }, {});
      const spec = createNode('spectrum', { x: 750, y: 150 }, { nEigenstates: 5 });
      const plot = createNode('energyPlot', { x: 1000, y: 150 }, { ymin: 0, ymax: 5 });

      newNodes = [spatial, a, meff, pot, ham, spec, plot];
      newEdges = [
        createEdge(spatial.id, pot.id, 'x', 'x'),
        createEdge(a.id, pot.id, 'scalar', 'scalar'),
        createEdge(meff.id, pot.id, 'scalar', 'scalar'),
        createEdge(spatial.id, ham.id, 'x', 'x'),
        createEdge(pot.id, ham.id, 'V', 'V'),
        createEdge(ham.id, spec.id, 'H', 'H'),
        createEdge(spec.id, plot.id, 'eigenstates', 'eigenstates')
      ];
    } 
    else if (presetId === 'kronig_penney') {
      const spatial = createNode('spatialDimension', { x: 50, y: 50 }, { xmin: -15, xmax: 15, n: 512 });
      const v0 = createNode('scalar', { x: 50, y: 150 }, { label: 'V0', value: 5 });
      const pot = createNode('potential', { x: 300, y: 150 }, { expression: 'V0 * (sin(x*pi)**2 > 0.8)' });
      const ham = createNode('hamiltonian', { x: 550, y: 150 }, {});
      const spec = createNode('spectrum', { x: 750, y: 150 }, { nEigenstates: 10 });
      const plot = createNode('energyPlot', { x: 1000, y: 150 }, { ymin: 0, ymax: 10 });

      newNodes = [spatial, v0, pot, ham, spec, plot];
      newEdges = [
        createEdge(spatial.id, pot.id, 'x', 'x'),
        createEdge(v0.id, pot.id, 'scalar', 'scalar'),
        createEdge(spatial.id, ham.id, 'x', 'x'),
        createEdge(pot.id, ham.id, 'V', 'V'),
        createEdge(ham.id, spec.id, 'H', 'H'),
        createEdge(spec.id, plot.id, 'eigenstates', 'eigenstates')
      ];
    }
    else if (presetId === 'transmon_cpb') {
      const spatial = createNode('spatialDimension', { x: 50, y: 50 }, { xmin: -3.1415, xmax: 3.1415, n: 256 });
      const ej = createNode('scalar', { x: 50, y: 150 }, { label: 'Ej', value: 15 });
      const pot = createNode('potential', { x: 300, y: 150 }, { expression: '-Ej * cos(x)' });
      const ham = createNode('hamiltonian', { x: 550, y: 150 }, {});
      const spec = createNode('spectrum', { x: 750, y: 150 }, { nEigenstates: 4 });
      const plot = createNode('energyPlot', { x: 1000, y: 150 }, { ymin: -20, ymax: 0 });

      newNodes = [spatial, ej, pot, ham, spec, plot];
      newEdges = [
        createEdge(spatial.id, pot.id, 'x', 'x'),
        createEdge(ej.id, pot.id, 'scalar', 'scalar'),
        createEdge(spatial.id, ham.id, 'x', 'x'),
        createEdge(pot.id, ham.id, 'V', 'V'),
        createEdge(ham.id, spec.id, 'H', 'H'),
        createEdge(spec.id, plot.id, 'eigenstates', 'eigenstates')
      ];
    }
    else if (presetId === 'quantum_well') {
      const spatial = createNode('spatialDimension', { x: 50, y: 50 }, { xmin: -10, xmax: 10, n: 512 });
      const v0 = createNode('scalar', { x: 50, y: 150 }, { label: 'V0', value: -10 });
      const l = createNode('scalar', { x: 50, y: 250 }, { label: 'L', value: 4 });
      const pot = createNode('potential', { x: 300, y: 150 }, { expression: 'V0 * heaviside(x+L/2) * heaviside(L/2-x)' });
      const ham = createNode('hamiltonian', { x: 550, y: 150 }, {});
      const spec = createNode('spectrum', { x: 750, y: 150 }, { nEigenstates: 4 });
      const plot = createNode('energyPlot', { x: 1000, y: 150 }, { ymin: -12, ymax: 2 });

      newNodes = [spatial, v0, l, pot, ham, spec, plot];
      newEdges = [
        createEdge(spatial.id, pot.id, 'x', 'x'),
        createEdge(v0.id, pot.id, 'scalar', 'scalar'),
        createEdge(l.id, pot.id, 'scalar', 'scalar'),
        createEdge(spatial.id, ham.id, 'x', 'x'),
        createEdge(pot.id, ham.id, 'V', 'V'),
        createEdge(ham.id, spec.id, 'H', 'H'),
        createEdge(spec.id, plot.id, 'eigenstates', 'eigenstates')
      ];
    }
    else if (presetId === 'hardware_chip_2q') {
      const q1 = createNode('transmonPocket', { x: 300, y: 250 }, { pos_x: '-1.0mm', pos_y: '0.0mm' });
      const q2 = createNode('transmonPocket', { x: 700, y: 250 }, { pos_x: '1.0mm', pos_y: '0.0mm' });
      const launch1 = createNode('launchpad', { x: 50, y: 250 }, { pos_x: '-3.0mm', orientation: '180' });
      const launch2 = createNode('launchpad', { x: 950, y: 250 }, { pos_x: '3.0mm', orientation: '0' });
      const bus = createNode('cpw', { x: 500, y: 100 }, { start_pin: 'q1:readout', end_pin: 'q2:readout' });

      newNodes = [q1, q2, launch1, launch2, bus];
      newEdges = []; // In layout mode, logical connections can be handled by pin naming in CPW
    }

    set({ nodes: newNodes, edges: newEdges, simulationResult: null, simulationError: null });
    get().runSimulation(); // Auto-run the preset
  },

  // ── Run Simulation ─────────────────────────────────────────
  runSimulation: async () => {
    const { nodes, edges } = get();
    set({ isSimulating: true, simulationError: null });

    try {
      // Serialize the graph — send node type, id, data, and edges
      const payload = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          source: e.source,
          sourceHandle: e.sourceHandle,
          target: e.target,
          targetHandle: e.targetHandle,
        })),
      };

      let result = null;
      try {
        const res = await fetch(`${API_BASE}/api/analog/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          result = await res.json();
        } else {
          console.warn('[AnalogStore] Backend simulation endpoint returned status', res.status);
        }
      } catch (fetchErr) {
        console.warn('[AnalogStore] Backend fetch failed, activating fast client physics engine:', fetchErr);
      }

      // If backend is offline or returned an error, solve directly via client-side TISE solver
      if (!result) {
        result = solveGraphClientSide(payload);
      }

      set({ simulationResult: result, isSimulating: false });

      // Push results into any EnergyPlot nodes
      // Set base result
      set((state) => ({
        isSimulating: false,
        simulationResult: result,
        nodes: state.nodes.map((n) => {
          if (n.type === 'energyPlot') return { ...n, data: { ...n.data, _result: result } };
          return n;
        }),
      }));

      // Animation playback for time evolution
      if (result.mode === 'time_evolution' && result.frames && result.frames.length > 0) {
        let frameIndex = 0;
        const totalFrames = result.frames.length;
        
        const playNextFrame = () => {
          if (frameIndex >= totalFrames) {
            set((state) => ({
              nodes: state.nodes.map(n => n.type === 'forLoop' ? { ...n, data: { ...n.data, _running: false } } : n)
            }));
            return;
          }
          
          set((state) => {
            const currentFrame = result.frames[frameIndex];
            // Compute the 'i' value for the forLoop
            const loopNode = state.nodes.find(n => n.type === 'forLoop');
            const fromI = loopNode?.data?.fromI ?? 0;
            const deltaI = loopNode?.data?.deltaI ?? 1;
            const currentI = fromI + frameIndex * deltaI;
            
            // Create a fake result object for the energy plot that has the superposition set to this frame
            const frameResult = { ...result, superposition: currentFrame };
            
            return {
              nodes: state.nodes.map((n) => {
                if (n.type === 'energyPlot') {
                  return { ...n, data: { ...n.data, _result: frameResult } };
                }
                if (n.type === 'forLoop') {
                  return { ...n, data: { ...n.data, _currentI: currentI, _running: true } };
                }
                return n;
              })
            };
          });
          
          frameIndex++;
          
          // Get pause duration
          const state = get();
          const loopNode = state.nodes.find(n => n.type === 'forLoop');
          const pause = loopNode?.data?.pauseDuration ?? 0;
          
          if (pause > 0) {
            setTimeout(playNextFrame, pause * 1000);
          } else {
            requestAnimationFrame(playNextFrame);
          }
        };
        
        // Start playback
        playNextFrame();
      }
    } catch (err) {
      set({ simulationError: err.message, isSimulating: false });
      console.error('[AnalogStore] Simulation error:', err);
    }
  },
}));

// ── Helpers ──────────────────────────────────────────────────

function getDefaultData(type) {
  switch (type) {
    case 'spatialDimension':
      return { xmin: -5, xmax: 5, n: 256 };
    case 'scalar':
      return { label: 'a', value: 1 };
    case 'potential':
      return { expression: '0.5*a**2*x**2' };
    case 'hamiltonian':
      return { label: 'H = T + V' };
    case 'spectrum':
      return { nEigenstates: 3 };
    case 'linearCombination':
      return {
        nEigenstates: 3,
        normalize: true,
        coefficients: [
          { re: 1, im: 0 },
          { re: 0, im: 0 },
          { re: 0, im: 0 },
        ],
      };
    case 'energyPlot':
      return { ymin: 0, ymax: 10, showV: true, showPsi2: true, showEn: true, _result: null };
    case 'wavefunction':
      return { wfType: 'gaussian', x0: 0, sigma: 0.5, k0: 0, expression: 'exp(-x**2)' };
    case 'operator':
      return { operatorType: 'x', expression: 'x**2' };
    case 'timeEvolution':
      return { dt: 0.01 };
    case 'forLoop':
      return { fromI: 0, toI: 100, deltaI: 1, pauseDuration: 0, _currentI: 0 };
    case 'fidelity':
      return {};
    case 'expectationValue':
      return { operatorType: 'x', expression: 'x**2' };
    case 'scalarTimePlot':
      return { series: 'fidelity', ymin: 0, ymax: 1 };
    case 'operatorWavefunction':
    case 'momentum':
    case 'innerProduct':
    case 'expectationSquared':
    case 'uncertainty':
    case 'variance':
    case 'norm':
    case 'realPart':
    case 'imaginaryPart':
    case 'wavefunctionPlot':
    case 'superpositionPlot':
      return { ymin: -1, ymax: 1, showV: false, showPsi2: true, showRePsi: false, showImPsi: false, showPhi2: true, showRePhi: false, showImPhi: false, _result: null };
    case 'stateEvolutionPlot':
    case 'multiLinePlot':
    case 'placeholderPlot':
    case 'loopUpdate':
      return {};
    case 'energyLevel':
      return { m: 0 };
    case 'string':
      return { value: 'Label' };
    case 'array':
      return { values: '1, 2, 3' };
    case 'mathFunction':
      return { expression: 'sin(x)' };
    case 'comment':
      return { text: '' };
      
    // ── EDA / Hardware Layout Nodes ──────────────────────────
    case 'transmonPocket':
      return { pos_x: '0.0mm', pos_y: '0.0mm', pad_width: '400um', pad_gap: '30um', orientation: '0' };
    case 'launchpad':
      return { pos_x: '0.0mm', pos_y: '0.0mm', trace_width: '10um', pad_width: '200um', orientation: '0' };
    case 'cpw':
      return { start_pin: '', end_pin: '', trace_width: '10um', gap: '6um', meander_length: '1.5mm' };
      
    default:
      return {};
  }
}

// Minimal applyNodeChanges / applyEdgeChanges implementation
// (React Flow's helpers are used on the component side;
//  these are fallbacks for the store layer)
function applyNodeChanges(changes, nodes) {
  let result = [...nodes];
  for (const change of changes) {
    if (change.type === 'position' && change.position) {
      result = result.map((n) =>
        n.id === change.id ? { ...n, position: change.position } : n
      );
    } else if (change.type === 'select') {
      result = result.map((n) =>
        n.id === change.id ? { ...n, selected: change.selected } : n
      );
    } else if (change.type === 'remove') {
      result = result.filter((n) => n.id !== change.id);
    } else if (change.type === 'dimensions' && change.dimensions) {
      result = result.map((n) =>
        n.id === change.id
          ? { ...n, measured: { width: change.dimensions.width, height: change.dimensions.height } }
          : n
      );
    }
  }
  return result;
}

function applyEdgeChanges(changes, edges) {
  let result = [...edges];
  for (const change of changes) {
    if (change.type === 'remove') {
      result = result.filter((e) => e.id !== change.id);
    } else if (change.type === 'select') {
      result = result.map((e) =>
        e.id === change.id ? { ...e, selected: change.selected } : e
      );
    }
  }
  return result;
}

/**
 * High-performance client-side finite-difference TISE Schrödinger eigensolver
 * used whenever backend service is unreachable or offline.
 */
export function solveGraphClientSide(payload) {
  const t0 = performance.now();
  const nodes = payload.nodes || [];

  // 1. Spatial Dimension
  const sdNode = nodes.find(n => n.type === 'spatialDimension');
  const xmin = Number(sdNode?.data?.xmin ?? -Math.PI);
  const xmax = Number(sdNode?.data?.xmax ?? Math.PI);
  const n = Math.min(512, Math.max(64, Number(sdNode?.data?.n ?? 256)));

  const dx = (xmax - xmin) / (n - 1);
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = xmin + i * dx;

  // 2. Scalars
  const scalars = {};
  for (const node of nodes) {
    if (node.type === 'scalar') {
      const val = Number(node.data?.value ?? 0);
      const label = String(node.data?.label || node.id);
      scalars[node.id] = val;
      const key = label.split('=')[0].split(':')[0].trim();
      if (key) scalars[key] = val;
    }
  }

  // 3. Potential
  const potNode = nodes.find(n => n.type === 'potential');
  const expr = potNode?.data?.expression || '-15 * cos(x)';

  let jsExpr = expr.replace(/\^/g, '**');
  for (const [k, v] of Object.entries(scalars)) {
    const regex = new RegExp('\\b' + k + '\\b', 'g');
    jsExpr = jsExpr.replace(regex, v);
  }
  jsExpr = jsExpr.replace(/\bcos\b/g, 'Math.cos')
                 .replace(/\bsin\b/g, 'Math.sin')
                 .replace(/\bexp\b/g, 'Math.exp')
                 .replace(/\bsqrt\b/g, 'Math.sqrt')
                 .replace(/\bpi\b/g, 'Math.PI')
                 .replace(/\babs\b/g, 'Math.abs');

  let Vfunc;
  try {
    Vfunc = new Function('x', 'return ' + jsExpr + ';');
  } catch (e) {
    Vfunc = (x) => -15 * Math.cos(x);
  }

  const V = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    try {
      const vVal = Vfunc(x[i]);
      V[i] = Number.isFinite(vVal) ? vVal : 0;
    } catch {
      V[i] = 0;
    }
  }

  // 4. Spectrum
  const specNode = nodes.find(n => n.type === 'spectrum');
  const k = Math.min(10, Math.max(1, Number(specNode?.data?.nEigenstates ?? 5)));

  // 5. Tridiagonal TISE solver (hbar = m = 1, T = -0.5 d^2/dx^2)
  const coeff = 0.5 / (dx * dx);
  const d = new Float64Array(n);
  const e = new Float64Array(n - 1);
  for (let i = 0; i < n; i++) {
    d[i] = 2.0 * coeff + V[i];
    if (i < n - 1) e[i] = -coeff;
  }

  const z = new Array(n);
  for (let i = 0; i < n; i++) {
    z[i] = new Float64Array(n);
    z[i][i] = 1.0;
  }

  const dCopy = new Float64Array(d);
  const eCopy = new Float64Array(n);
  for (let i = 0; i < n - 1; i++) eCopy[i] = e[i];

  for (let l = 0; l < n; l++) {
    let iter = 0;
    let m;
    do {
      for (m = l; m < n - 1; m++) {
        const dd = Math.abs(dCopy[m]) + Math.abs(dCopy[m + 1]);
        if (Math.abs(eCopy[m]) + dd === dd) break;
      }
      if (m !== l) {
        if (iter++ === 40) break;
        let g = (dCopy[l + 1] - dCopy[l]) / (2.0 * eCopy[l]);
        let r = Math.hypot(g, 1.0);
        g = dCopy[m] - dCopy[l] + eCopy[l] / (g + (g >= 0 ? Math.abs(r) : -Math.abs(r)));
        let s = 1.0;
        let c = 1.0;
        let p = 0.0;
        for (let i = m - 1; i >= l; i--) {
          let f = s * eCopy[i];
          let b = c * eCopy[i];
          r = Math.hypot(f, g);
          eCopy[i + 1] = r;
          if (r === 0.0) {
            dCopy[i + 1] -= p;
            eCopy[m] = 0.0;
            break;
          }
          s = f / r;
          c = g / r;
          g = dCopy[i + 1] - p;
          r = (dCopy[i] - g) * s + 2.0 * c * b;
          p = s * r;
          dCopy[i + 1] = g + p;
          g = c * r - b;
          for (let row = 0; row < n; row++) {
            f = z[row][i + 1];
            z[row][i + 1] = s * z[row][i] + c * f;
            z[row][i] = c * z[row][i] - s * f;
          }
        }
        if (r === 0.0 && i >= l) continue;
        dCopy[l] -= p;
        eCopy[l] = g;
        eCopy[m] = 0.0;
      }
    } while (m !== l);
  }

  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => dCopy[a] - dCopy[b]);

  const eigenvalues = [];
  const eigenvectors = [];
  for (let i = 0; i < Math.min(k, n); i++) {
    const col = idx[i];
    eigenvalues.push(dCopy[col]);
    const psi = new Array(n);
    let normSq = 0;
    for (let j = 0; j < n; j++) {
      psi[j] = z[j][col];
      normSq += psi[j] * psi[j] * dx;
    }
    const norm = Math.sqrt(normSq) || 1e-12;
    for (let j = 0; j < n; j++) psi[j] /= norm;
    eigenvectors.push(psi);
  }

  // 6. LinearCombination / Superposition
  const lcNode = nodes.find(n => n.type === 'linearCombination');
  let superposition = null;
  if (lcNode) {
    const coeffs = lcNode.data?.coefficients || [];
    const psi_real = new Float64Array(n);
    const psi_imag = new Float64Array(n);

    for (let i = 0; i < Math.min(coeffs.length, eigenvectors.length); i++) {
      const c = coeffs[i];
      const cr = Number(c.re || 0);
      const ci = Number(c.im || 0);
      const vec = eigenvectors[i];
      for (let j = 0; j < n; j++) {
        psi_real[j] += cr * vec[j];
        psi_imag[j] += ci * vec[j];
      }
    }

    let normSq = 0;
    for (let j = 0; j < n; j++) {
      normSq += (psi_real[j] * psi_real[j] + psi_imag[j] * psi_imag[j]) * dx;
    }
    const norm = Math.sqrt(normSq) || 1.0;
    const prob_density = new Array(n);
    const finalReal = new Array(n);
    const finalImag = new Array(n);
    for (let j = 0; j < n; j++) {
      finalReal[j] = psi_real[j] / norm;
      finalImag[j] = psi_imag[j] / norm;
      prob_density[j] = finalReal[j] * finalReal[j] + finalImag[j] * finalImag[j];
    }

    superposition = {
      psi_real: finalReal,
      psi_imag: finalImag,
      prob_density
    };
  }

  return {
    status: 'success',
    mode: 'static',
    x: Array.from(x),
    potential: Array.from(V),
    eigenvalues,
    eigenvectors,
    superposition,
    n_points: n,
    xmin,
    xmax,
    execution_time_ms: Math.round(performance.now() - t0)
  };
}

export default useAnalogStore;
