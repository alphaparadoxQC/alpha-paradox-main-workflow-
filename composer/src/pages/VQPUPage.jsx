/**
 * VQPUPage.jsx — Analog Physics Composer
 * =======================================
 * Replaces the old VQPU results viewer with a full node-based
 * quantum physics simulator inspired by ScienceAtHome's Composer.
 *
 * Uses React Flow for the node graph, and communicates with
 * the Python analog_engine.py backend for solving the
 * Schrödinger equation.
 */

import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../styles/analog-composer.css';

import useAnalogStore from '../stores/analogStore';
import { useEdaStore } from '../stores/edaStore';
import CrossProductBridge from '../quantum-engine/cross-product-bridge';
import AIChatPanel from '../components/shared/AIChatPanel';
import UnifiedNavbar from '../components/shared/UnifiedNavbar';
import useAIChatStore from '../stores/aiChatStore';

// Custom Nodes
import SpatialDimensionNode from '../components/analog/nodes/SpatialDimensionNode';
import ScalarNode from '../components/analog/nodes/ScalarNode';
import PotentialNode from '../components/analog/nodes/PotentialNode';
import HamiltonianNode from '../components/analog/nodes/HamiltonianNode';
import SpectrumNode from '../components/analog/nodes/SpectrumNode';
import LinearCombinationNode from '../components/analog/nodes/LinearCombinationNode';
import EnergyPlotNode from '../components/analog/nodes/EnergyPlotNode';
import WavefunctionNode from '../components/analog/nodes/WavefunctionNode';
import OperatorNode from '../components/analog/nodes/OperatorNode';
import TimeEvolutionNode from '../components/analog/nodes/TimeEvolutionNode';
import ForLoopNode from '../components/analog/nodes/ForLoopNode';
import FidelityNode from '../components/analog/nodes/FidelityNode';
import ExpectationValueNode from '../components/analog/nodes/ExpectationValueNode';
import ScalarTimePlotNode from '../components/analog/nodes/ScalarTimePlotNode';

// Phase 3 QEngine Parity Nodes
import MomentumNode from '../components/analog/nodes/MomentumNode';
import OperatorWavefunctionNode from '../components/analog/nodes/OperatorWavefunctionNode';
import InnerProductNode from '../components/analog/nodes/InnerProductNode';
import ExpectationSquaredNode from '../components/analog/nodes/ExpectationSquaredNode';
import UncertaintyNode from '../components/analog/nodes/UncertaintyNode';
import VarianceNode from '../components/analog/nodes/VarianceNode';
import NormNode from '../components/analog/nodes/NormNode';
import EnergyLevelNode from '../components/analog/nodes/EnergyLevelNode';
import StringNode from '../components/analog/nodes/StringNode';
import ArrayNode from '../components/analog/nodes/ArrayNode';
import MathFunctionNode from '../components/analog/nodes/MathFunctionNode';
import RealPartNode from '../components/analog/nodes/RealPartNode';
import ImaginaryPartNode from '../components/analog/nodes/ImaginaryPartNode';
import WavefunctionPlotNode from '../components/analog/nodes/WavefunctionPlotNode';
import StateComparisonPlotNode from '../components/analog/nodes/StateComparisonPlotNode';
import StateEvolutionPlotNode from '../components/analog/nodes/StateEvolutionPlotNode';
import MultiLinePlotNode from '../components/analog/nodes/MultiLinePlotNode';
import PlaceholderPlotNode from '../components/analog/nodes/PlaceholderPlotNode';
import CommentNode from '../components/analog/nodes/CommentNode';
import LoopUpdateNode from '../components/analog/nodes/LoopUpdateNode';
import TransmonPocketNode from '../components/analog/nodes/TransmonPocketNode';
import LaunchpadNode from '../components/analog/nodes/LaunchpadNode';
import CPWNode from '../components/analog/nodes/CPWNode';

// Node Tray
import NodeTray from '../components/analog/NodeTray';

// Register custom node types
const nodeTypes = {
  spatialDimension: SpatialDimensionNode,
  scalar: ScalarNode,
  potential: PotentialNode,
  hamiltonian: HamiltonianNode,
  spectrum: SpectrumNode,
  linearCombination: LinearCombinationNode,
  energyPlot: EnergyPlotNode,
  wavefunction: WavefunctionNode,
  operator: OperatorNode,
  timeEvolution: TimeEvolutionNode,
  forLoop: ForLoopNode,
  fidelity: FidelityNode,
  expectationValue: ExpectationValueNode,
  scalarTimePlot: ScalarTimePlotNode,
  
  momentum: MomentumNode,
  operatorWavefunction: OperatorWavefunctionNode,
  innerProduct: InnerProductNode,
  expectationSquared: ExpectationSquaredNode,
  uncertainty: UncertaintyNode,
  variance: VarianceNode,
  norm: NormNode,
  energyLevel: EnergyLevelNode,
  string: StringNode,
  array: ArrayNode,
  mathFunction: MathFunctionNode,
  realPart: RealPartNode,
  imaginaryPart: ImaginaryPartNode,
  wavefunctionPlot: WavefunctionPlotNode,
  superpositionPlot: StateComparisonPlotNode,
  stateEvolutionPlot: StateEvolutionPlotNode,
  multiLinePlot: MultiLinePlotNode,
  placeholderPlot: PlaceholderPlotNode,
  comment: CommentNode,
  loopUpdate: LoopUpdateNode,
  transmonPocket: TransmonPocketNode,
  launchpad: LaunchpadNode,
  cpw: CPWNode,
};

export default function VQPUPage({ session }) {
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);

  // Store
  const nodes = useAnalogStore((s) => s.nodes);
  const edges = useAnalogStore((s) => s.edges);
  const onNodesChange = useAnalogStore((s) => s.onNodesChange);
  const onEdgesChange = useAnalogStore((s) => s.onEdgesChange);
  const onConnect = useAnalogStore((s) => s.onConnect);
  const addNode = useAnalogStore((s) => s.addNode);
  const deleteSelected = useAnalogStore((s) => s.deleteSelected);
  const clearGraph = useAnalogStore((s) => s.clearGraph);
  const runSimulation = useAnalogStore((s) => s.runSimulation);
  const isSimulating = useAnalogStore((s) => s.isSimulating);
  const simulationError = useAnalogStore((s) => s.simulationError);
  const simulationResult = useAnalogStore((s) => s.simulationResult);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ── Drop handler for dragging nodes from the tray ──────────
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: e.clientX - bounds.left - 80,
        y: e.clientY - bounds.top - 20,
      };

      addNode(type, position);
    },
    [addNode]
  );

  // ── Keyboard shortcuts ─────────────────────────────────────
  const onKeyDown = useCallback(
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const store = useAnalogStore.getState();
      const selectedNodes = store.nodes.filter(n => n.selected);

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key.toLowerCase() === 'r') {
        runSimulation();
      } else if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'e') {
        const direction = e.key.toLowerCase() === 'q' ? -1 : 1;
        const delta = e.shiftKey ? 15 : 90;
        selectedNodes.forEach(n => {
          const currentRot = parseFloat(n.data.orientation || '0');
          store.updateNodeData(n.id, { orientation: String((currentRot + direction * delta) % 360) });
        });
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const delta = e.altKey ? 1 : (e.shiftKey ? 15 : 5);
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -delta;
        if (e.key === 'ArrowDown') dy = delta;
        if (e.key === 'ArrowLeft') dx = -delta;
        if (e.key === 'ArrowRight') dx = delta;
        
        store.setNodes(store.nodes.map(n => 
          n.selected ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } } : n
        ));
      }
    },
    [deleteSelected, runSimulation]
  );

  // ── Quick template: load a harmonic oscillator setup ───────
  const loadTemplate = () => {
    clearGraph();
    const sdId = addNode('spatialDimension', { x: 80, y: 120 }, { xmin: -5, xmax: 5, n: 256 });
    const scId = addNode('scalar', { x: 80, y: 310 }, { label: 'a', value: 2 });
    const ptId = addNode('potential', { x: 320, y: 150 }, { expression: '0.5*a**2*x**2' });
    const hmId = addNode('hamiltonian', { x: 540, y: 170 });
    const spId = addNode('spectrum', { x: 540, y: 310 }, { nEigenstates: 5 });
    const epId = addNode('energyPlot', { x: 780, y: 80 }, { ymin: 0, ymax: 12, showV: true, showPsi2: true, showEn: true });
    const lcId = addNode('linearCombination', { x: 320, y: 380 }, {
      nEigenstates: 5,
      normalize: true,
      coefficients: [
        { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 },
        { re: 0, im: 0 }, { re: 0, im: 0 },
      ],
    });

    // Add edges
    const store = useAnalogStore.getState();
    const newEdges = [
      { id: 'e1', source: sdId, sourceHandle: 'x', target: ptId, targetHandle: 'x', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
      { id: 'e2', source: scId, sourceHandle: 'value', target: ptId, targetHandle: 'a', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
      { id: 'e3', source: ptId, sourceHandle: 'V', target: hmId, targetHandle: 'V', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e4', source: hmId, sourceHandle: 'H', target: spId, targetHandle: 'H', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e5', source: hmId, sourceHandle: 'V_out', target: epId, targetHandle: 'V', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e6', source: spId, sourceHandle: 'eigenstates', target: epId, targetHandle: 'eigenstates', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
      { id: 'e7', source: spId, sourceHandle: 'eigenstates', target: lcId, targetHandle: 'eigenstates', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
      { id: 'e8', source: lcId, sourceHandle: 'psi', target: epId, targetHandle: 'psi', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    ];
    store.setEdges(newEdges);
  };

  const [feedback, setFeedback] = useState(null);

  const handleLoadFromCircuit = () => {
    const res = CrossProductBridge.bridgeComposerToAnalog(null);
    if (res) {
      setFeedback(`Loaded circuit "${res.circuitName}" (${res.qubitCount}Q, ${res.gateCount} Gates) — State: ${res.stateSummary}`);
    } else {
      setFeedback('No active circuit found in Composer.');
    }
  };

  const handleLoadFromEda = () => {
    const res = CrossProductBridge.bridgeEdaToAnalog(null);
    if (res) {
      if (res.isCoupledChip) {
        setFeedback(`Loaded coupled processor from Silicon EDA: ${res.chipTitle} (${res.qubitCount} Qubits, g=${res.g_MHz} MHz)`);
      } else if (res.category === 'resonator') {
        setFeedback(`Loaded resonator from Silicon EDA: ${res.componentName} (ω_r=${res.omega_r_GHz} GHz, length=${res.length_mm} mm)`);
      } else if (res.category === 'coupler') {
        setFeedback(`Loaded coupler from Silicon EDA: ${res.componentName} (g=${res.g_MHz} MHz, Cg=${res.Cg_fF} fF)`);
      } else {
        setFeedback(`Loaded ${res.componentName || 'transmon'} from Silicon EDA: Ec=${res.Ec_MHz} MHz, Ej=${res.Ej_MHz} MHz, ω₀₁=${res.omega01_GHz} GHz`);
      }
    } else {
      setFeedback('No component found in EDA layout. Place a component or load a published chip first.');
    }
  };

  const handleSyncToEda = () => {
    const store = useAnalogStore.getState();
    const ecNode = store.nodes.find(n => n.type === 'scalar' && n.data?.label?.includes('Ec'));
    const ejNode = store.nodes.find(n => n.type === 'scalar' && n.data?.label?.includes('Ej'));
    
    const ecVal = ecNode?.data?.value || store._tcadSource?.tcad?.Ec_MHz || 280;
    const ejVal = ejNode?.data?.value || store._tcadSource?.tcad?.Ej_MHz || 14200;
    
    const compId = store._tcadSource?.edaComponentId || null;
    const res = CrossProductBridge.bridgeAnalogToEda(ecVal, ejVal, compId);
    if (res) {
      setFeedback(`Synced Hamiltonian to EDA: ${res.componentName} pad_width=${res.newPadWidth_um}µm, inductance=${res.newInductance_nH}nH`);
    } else {
      setFeedback('No transmon component in EDA to update.');
    }
  };

  const handleCalibratePulses = () => {
    const store = useAnalogStore.getState();
    const tcad = store._tcadSource?.tcad || {
      Ec_MHz: 280,
      Ej_MHz: 14200,
      omega01_GHz: 5.12,
      anharmonicity_MHz: -280,
    };
    CrossProductBridge.bridgeAnalogToPulse(tcad);
    setFeedback(`Calibrated Pulse Engine: ω₀₁=${tcad.omega01_GHz} GHz, α=${tcad.anharmonicity_MHz} MHz`);
  };

  return (
    <div className="analog-composer-page" onKeyDown={onKeyDown} tabIndex={0}>
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="analog-toolbar">
        <div className="analog-toolbar-left">
          <button className="at-btn run-btn" onClick={runSimulation} disabled={isSimulating}>
            {isSimulating ? 'Solving...' : 'Run'}
          </button>
          {simulationResult && !isSimulating && (
            <span className="sim-status success">
              {simulationResult.execution_time_ms}ms
            </span>
          )}
          {simulationError && !isSimulating && (
            <span className="sim-status error" title={simulationError}>
              {simulationError}
            </span>
          )}
        </div>

        <div className="analog-toolbar-center">
          <button className="at-btn" onClick={clearGraph} title="Clear All">
            Clear
          </button>
          <button className="at-btn" onClick={deleteSelected} title="Delete Selected (Del)">
            Delete
          </button>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

          {/* Cross-Product Bridge Actions */}
          <button
            className="at-btn"
            onClick={handleLoadFromCircuit}
            title="Extract statevector and physical Hamiltonian from Composer circuit and simulate in Analog"
            style={{ color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.4)', fontWeight: '600' }}
          >
            ⚡ Load from Circuit
          </button>

          <button
            className="at-btn"
            onClick={handleLoadFromEda}
            title="Extract transmon TCAD geometry from EDA layout and construct Hamiltonian solver"
            style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            Load from EDA
          </button>

          <button
            className="at-btn"
            onClick={handleSyncToEda}
            title="Push updated Ec and Ej back to physical pad dimensions in EDA"
            style={{ color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.3)' }}
          >
            Sync to EDA
          </button>

          <button
            className="at-btn"
            onClick={handleCalibratePulses}
            title="Inject calculated frequency and anharmonicity into the Pulse Synthesis Engine"
            style={{ color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.3)' }}
          >
            Calibrate Pulses
          </button>
        </div>

        <div className="analog-toolbar-right">
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
            Nodes: {nodes.length} · Edges: {edges.length}
          </span>
        </div>
      </div>

      {/* Dismissible Feedback Banner */}
      {feedback && (
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.15)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '4px 16px',
            fontSize: '0.75rem',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Main Body: Tray + Canvas ───────────────────────────── */}
      <div className="analog-composer-body">
        <NodeTray />

        <div className="analog-flow-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            deleteKeyCode={null}
            colorMode="dark"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.06)" />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                switch (n.type) {
                  case 'spatialDimension': return '#f59e0b';
                  case 'potential': return '#3b82f6';
                  case 'hamiltonian': return '#8b5cf6';
                  case 'spectrum': return '#ec4899';
                  case 'linearCombination': return '#06b6d4';
                  case 'energyPlot': return '#10b981';
                  case 'scalar': return '#10b981';
                  default: return '#6b7280';
                }
              }}
              maskColor="rgba(0,0,0,0.7)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* ── AI Chat ────────────────────────────────────────────── */}
      <AIChatPanel />
      <button className="chat-bubble-ai" onClick={() => useAIChatStore.getState().toggleChat()}>
        <img src="/logo-2.jpg" alt="Alpha AI" className="chat-bubble-logo" />
      </button>

      {/* Unified Down Bar */}
      <UnifiedNavbar session={session} />
    </div>
  );
}
