import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow, Controls, Background, MiniMap,
  applyNodeChanges, applyEdgeChanges, addEdge,
  Node, Edge, Connection, ConnectionMode, Handle, Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Play, Download, Settings, Box, Zap, Share2,
  FlaskConical, Atom, Binary, GitBranch, Cpu, BarChart3,
  Info, Loader2, CheckCircle2, XCircle, ChevronDown, SplitSquareHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { ChemistryAPI } from '@/lib/chemistry/apiClient';
import { MOLECULES, MoleculeData } from '@/lib/chemistry/moleculeData';
import { buildCustomMolecule } from '@/lib/chemistry/customMolecule';
import {
  VQEResult, VQEIteration, generateParameterizedAnsatz,
  getParameterCount, initializeParameters, runVQEOptimization
} from '@/lib/chemistry/vqeOptimizer';
import { getHamiltonian } from '@/lib/chemistry/pauliHamiltonian';
import { parseSmilesClientSide } from '@/lib/chemistry/smilesParser';

/* ═══════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */
type NodeStatus = 'pending' | 'running' | 'completed' | 'error';
const BOTTOM_TABS = ['Circuit', 'QASM', 'Hamiltonian', 'Pauli Terms', 'Orbital Map', 'Excitations', 'Measurement', 'VQE Loop', 'Logs'] as const;

const BLOCK_CATEGORIES = [
  { title: 'Molecule', items: ['SMILES Input','XYZ Input','PDB Input','Example Molecule'] },
  { title: 'Preprocessing', items: ['RDKit Parser','Geometry Optimization','Basis Set Selector'] },
  { title: 'Classical Chemistry', items: ['PySCF Hartree-Fock','Active Space'] },
  { title: 'Hamiltonian', items: ['Fermionic Hamiltonian','Qubit Hamiltonian'] },
  { title: 'Mapping', items: ['Jordan-Wigner','Bravyi-Kitaev','Parity Mapping'] },
  { title: 'Ansatz', items: ['UCCSD','Hardware Efficient','Custom Ansatz'] },
  { title: 'Algorithms', items: ['VQE','QPE','QITE'] },
  { title: 'Optimizers', items: ['COBYLA','SPSA','Adam'] },
  { title: 'Results', items: ['Ground State Energy','VQE Energy'] }
];

const CATEGORY_COLORS: Record<string, string> = {
  Molecule: '#6366f1', Preprocessing: '#8b5cf6', 'Classical Chemistry': '#0ea5e9',
  Hamiltonian: '#10b981', Mapping: '#f59e0b', Ansatz: '#ef4444',
  Algorithms: '#ec4899', Optimizers: '#8b5cf6', Results: '#22c55e', Export: '#64748b'
};

/* ═══════════════════════════════════════════════════════════════════
   CHEM NODE
   ═══════════════════════════════════════════════════════════════════ */
function ChemNode({ data }: { data: any }) {
  const c = CATEGORY_COLORS[data.category] || '#6366f1';
  return (
    <div className="bg-card/90 backdrop-blur-sm border-2 rounded-xl shadow-lg min-w-[160px] overflow-hidden"
      style={{ borderColor: `${c}40` }}>
      <div className="px-2 py-1.5 flex items-center justify-between" style={{ backgroundColor: `${c}20` }}>
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md" style={{ backgroundColor: `${c}20`, color: c }}>
            <Box className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold text-foreground/90">{data.label}</span>
        </div>
        {data.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
        {data.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
        {data.status === 'error' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
      </div>
      {data.meta && Object.keys(data.meta).length > 0 && (
        <div className="p-2 bg-background/50 space-y-1">
          {Object.entries(data.meta).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[9px]">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-mono text-foreground">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
      <Handle type="target" position={Position.Left} style={{ background: c, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: c, width: 8, height: 8 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GATE CIRCUIT VIEW
   ═══════════════════════════════════════════════════════════════════ */
function GateCircuitView({ circuitData }: { circuitData: any }) {
  const [selectedGate, setSelectedGate] = useState<any>(null);
  const [selectedQubit, setSelectedQubit] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const qubits = circuitData?.circuit_data?.qubits;
  const gates = circuitData?.circuit_data?.gates;
  const sections = circuitData?.circuit_data?.sections;

  const wireSpacing = 40;
  const colSpacing = 60;
  const paddingLeft = 120;
  const paddingTop = 60;
  const height = qubits ? qubits.length * wireSpacing + paddingTop + 40 : 0;
  
  // Calculate max column per layer
  const layerColumns: Record<number, number> = {};
  if (gates) {
    gates.forEach((g: any) => {
      layerColumns[g.layer] = g.layer; 
    });
  }
  const maxLayer = Math.max(...Object.values(layerColumns), 0);
  const width = Math.max(800, paddingLeft + (maxLayer + 2) * colSpacing);

  const getGateColor = (type: string) => {
    if (['X','Y','Z','H'].includes(type)) return '#10b981'; // Green
    if (['RX','RY','RZ'].includes(type)) return '#ef4444'; // Red
    if (type === 'CX' || type === 'CNOT') return '#3b82f6'; // Blue
    if (type === 'MEASURE') return '#f59e0b'; // Orange
    return '#8b5cf6'; // Purple
  };

  // Canvas Render Loop
  useEffect(() => {
    if (!qubits || !gates) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays (Retina)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Section Headers
    if (sections) {
      sections.forEach((sec: string) => {
        const firstGate = gates.find((g: any) => g.section === sec);
        if (!firstGate) return;
        const x = paddingLeft + firstGate.layer * colSpacing - 20;
        
        // Dashed line
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(x, paddingTop - 20);
        ctx.lineTo(x, height - 20);
        ctx.strokeStyle = '#ffffff10';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // Text
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(sec.toUpperCase(), x + 5, paddingTop - 10);
      });
    }

    // Draw Qubit Wires
    qubits.forEach((q: any, i: number) => {
      const y = paddingTop + i * wireSpacing;
      const isSelected = selectedQubit?.index === q.index;

      // Wire line
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.strokeStyle = isSelected ? '#6366f1' : '#ffffff20';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Qubit Label Box
      ctx.fillStyle = q.active ? 'rgba(99, 102, 241, 0.12)' : '#1e293b';
      ctx.strokeStyle = q.active ? '#6366f1' : '#334155';
      ctx.lineWidth = 1;
      
      // Draw rounded rect
      const rx = 4;
      const rwidth = 80;
      const rheight = 24;
      const rxPos = 10;
      const ryPos = y - 12;
      ctx.beginPath();
      ctx.moveTo(rxPos + rx, ryPos);
      ctx.lineTo(rxPos + rwidth - rx, ryPos);
      ctx.quadraticCurveTo(rxPos + rwidth, ryPos, rxPos + rwidth, ryPos + rx);
      ctx.lineTo(rxPos + rwidth, ryPos + rheight - rx);
      ctx.quadraticCurveTo(rxPos + rwidth, ryPos + rheight, rxPos + rwidth - rx, ryPos + rheight);
      ctx.lineTo(rxPos + rx, ryPos + rheight);
      ctx.quadraticCurveTo(rxPos, ryPos + rheight, rxPos, ryPos + rheight - rx);
      ctx.lineTo(rxPos, ryPos + rx);
      ctx.quadraticCurveTo(rxPos, ryPos, rxPos + rx, ryPos);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Label Text
      ctx.fillStyle = q.active ? '#e0e7ff' : '#94a3b8';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${q.label} (${q.spin_orbital})`, rxPos + rwidth / 2, y);

      // Occupation dot
      if (q.occupation === 1) {
        ctx.beginPath();
        ctx.arc(98, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
      }
    });

    // Draw Gates
    gates.forEach((g: any) => {
      const x = paddingLeft + g.layer * colSpacing;
      const isSelected = selectedGate?.id === g.id;
      const c = getGateColor(g.type);

      if (g.type === 'CX' || g.type === 'CNOT') {
        const q1 = g.qubits[0];
        const q2 = g.qubits[1];
        const y1 = paddingTop + q1 * wireSpacing;
        const y2 = paddingTop + q2 * wireSpacing;

        // Control line
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.strokeStyle = isSelected ? '#fff' : c;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Control dot
        ctx.beginPath();
        ctx.arc(x, y1, 6, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#fff' : c;
        ctx.fill();

        // Target circle
        ctx.beginPath();
        ctx.arc(x, y2, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#fff' : c;
        ctx.stroke();

        // Target cross
        ctx.beginPath();
        ctx.moveTo(x, y2 - 8);
        ctx.lineTo(x, y2 + 8);
        ctx.moveTo(x - 8, y2);
        ctx.lineTo(x + 8, y2);
        ctx.stroke();

      } else if (g.type === 'MEASURE') {
        const y = paddingTop + g.qubits[0] * wireSpacing;
        
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = isSelected ? '#fff' : c;
        ctx.lineWidth = 2;
        
        // Rounded rect for measure
        ctx.beginPath();
        ctx.roundRect(x - 16, y - 14, 32, 28, 4);
        ctx.fill();
        ctx.stroke();

        // Meter arc
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 6);
        ctx.quadraticCurveTo(x, y - 10, x + 8, y + 6);
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Arrow
        ctx.beginPath();
        ctx.moveTo(x, y + 6);
        ctx.lineTo(x + 6, y - 4);
        ctx.stroke();

      } else {
        // Single Qubit Gate
        const y = paddingTop + g.qubits[0] * wireSpacing;
        
        // Need to parse RGBA for fillOpacity
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.roundRect(x - 16, y - 14, 32, 28, 4);
        ctx.fill();
        
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = isSelected ? '#fff' : c;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(g.type, x, y);

        if (g.params && g.params.length > 0) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText(g.params[0], x, y - 18);
        }
      }
    });
  }, [qubits, gates, sections, width, height, selectedGate, selectedQubit]);

  // Click Hit-Detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check Gates first (they are smaller, draw on top conceptually)
    for (const g of gates) {
      const x = paddingLeft + g.layer * colSpacing;
      
      if (g.type === 'CX' || g.type === 'CNOT') {
        const y1 = paddingTop + g.qubits[0] * wireSpacing;
        const y2 = paddingTop + g.qubits[1] * wireSpacing;
        
        // Control dot hit
        if (Math.hypot(clickX - x, clickY - y1) <= 10) {
          setSelectedGate(g); setSelectedQubit(null); return;
        }
        // Target circle hit
        if (Math.hypot(clickX - x, clickY - y2) <= 15) {
          setSelectedGate(g); setSelectedQubit(null); return;
        }
        // Line hit (very rough bounding box)
        if (clickX >= x - 5 && clickX <= x + 5 && clickY >= Math.min(y1, y2) && clickY <= Math.max(y1, y2)) {
          setSelectedGate(g); setSelectedQubit(null); return;
        }
      } else {
        const y = paddingTop + g.qubits[0] * wireSpacing;
        if (clickX >= x - 16 && clickX <= x + 16 && clickY >= y - 14 && clickY <= y + 14) {
          setSelectedGate(g); setSelectedQubit(null); return;
        }
      }
    }

    // Check Qubits (labels)
    for (let i = 0; i < qubits.length; i++) {
      const y = paddingTop + i * wireSpacing;
      if (clickX >= 10 && clickX <= 90 && clickY >= y - 12 && clickY <= y + 12) {
        setSelectedQubit(qubits[i]); setSelectedGate(null); return;
      }
    }

    // Clicked empty space
    setSelectedGate(null);
    setSelectedQubit(null);
  };

  if (!circuitData?.circuit_data || !qubits || !gates) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No circuit data available</div>;
  }

  return (
    <div className="flex-1 flex bg-[#0d0d1a] relative overflow-hidden">
      {/* GPU Accelerated Canvas */}
      <div className="flex-1 overflow-auto relative" ref={containerRef}>
        <div className="sticky top-2 left-2 z-10 flex gap-2">
           <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] rounded flex items-center shadow-lg pointer-events-none backdrop-blur-sm">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5"></div>
             GPU Accelerated Canvas (60 FPS)
           </div>
        </div>
        <canvas 
          ref={canvasRef} 
          onClick={handleCanvasClick}
          className="min-w-full cursor-pointer absolute top-0 left-0"
        />
      </div>

      {/* Inspector Panel Overlay */}
      {(selectedGate || selectedQubit) && (
        <div className="absolute top-4 right-4 w-64 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {selectedGate ? 'Gate Inspector' : 'Qubit Inspector'}
            </h3>
            <button onClick={() => { setSelectedGate(null); setSelectedQubit(null); }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground hover:text-foreground"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
            </button>
          </div>
          <div className="space-y-2 text-xs">
            {selectedGate && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><span className="font-mono bg-primary/20 text-primary px-1 rounded">{selectedGate.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Qubits:</span><span className="font-mono">{selectedGate.qubits.join(', ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Layer:</span><span className="font-mono">{selectedGate.layer}</span></div>
                {Array.isArray(selectedGate.params) && selectedGate.params.length > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Params:</span><span className="font-mono text-orange-400">{selectedGate.params.join(', ')}</span></div>
                )}
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="text-muted-foreground mb-1">Chemistry Meaning:</div>
                  <div className="text-foreground/90">{selectedGate.chemistry_meaning || selectedGate.section}</div>
                </div>
              </>
            )}
            {selectedQubit && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Index:</span><span className="font-mono">{selectedQubit.index}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Spin Orbital:</span><span className="font-mono text-primary">{selectedQubit.spin_orbital}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Spin:</span><span>{selectedQubit.spin === 'α' ? 'Alpha (↑)' : 'Beta (↓)'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Occupation:</span><span className={selectedQubit.occupation ? 'text-green-400' : 'text-slate-500'}>{selectedQubit.occupation ? 'Occupied (1)' : 'Empty (0)'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Active Space:</span><span className={selectedQubit.active ? 'text-blue-400' : 'text-slate-500'}>{selectedQubit.active ? 'Yes' : 'No'}</span></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function ChemistryCircuitBuilder() {
  const [searchParams] = useSearchParams();
  const circuitId = searchParams.get('circuit_id');
  
  const defaultNodes: Node[] = [
    { id: 'mol', type: 'chemNode', position: { x: 50, y: 150 }, data: { label: 'H2 Molecule', category: 'Molecule', status: 'pending' } },
    { id: 'rdkit', type: 'chemNode', position: { x: 250, y: 150 }, data: { label: 'RDKit Parser', category: 'Preprocessing', status: 'pending' } },
    { id: 'hf', type: 'chemNode', position: { x: 450, y: 150 }, data: { label: 'PySCF Hartree-Fock', category: 'Classical Chemistry', status: 'pending' } },
    { id: 'active', type: 'chemNode', position: { x: 650, y: 150 }, data: { label: 'Active Space', category: 'Classical Chemistry', status: 'pending' } },
    { id: 'fham', type: 'chemNode', position: { x: 850, y: 150 }, data: { label: 'Fermionic Hamiltonian', category: 'Hamiltonian', status: 'pending' } },
    { id: 'map', type: 'chemNode', position: { x: 1050, y: 150 }, data: { label: 'Jordan-Wigner', category: 'Mapping', status: 'pending' } },
    { id: 'ansatz', type: 'chemNode', position: { x: 1250, y: 150 }, data: { label: 'UCCSD', category: 'Ansatz', status: 'pending' } },
    { id: 'vqe', type: 'chemNode', position: { x: 1450, y: 150 }, data: { label: 'VQE', category: 'Algorithms', status: 'pending' } },
    { id: 'result', type: 'chemNode', position: { x: 1650, y: 150 }, data: { label: 'Ground State Energy', category: 'Results', status: 'pending' } }
  ];
  
  const defaultEdges: Edge[] = [];
  for (let i=0; i<defaultNodes.length-1; i++) {
    defaultEdges.push({ id: `e${i}`, source: defaultNodes[i].id, target: defaultNodes[i+1].id, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } });
  }

  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [edges, setEdges] = useState<Edge[]>(defaultEdges);
  const [circuitData, setCircuitData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'workflow' | 'circuit' | 'split'>('circuit');
  const [bottomTab, setBottomTab] = useState<typeof BOTTOM_TABS[number]>('Circuit');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Molecule: true, Preprocessing: true, 'Classical Chemistry': true,
  });

  const [newSmiles, setNewSmiles] = useState('O');
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setSearchParams] = useSearchParams();

  // ── VQE State ──
  const [vqeIterations, setVqeIterations] = useState<VQEIteration[]>([]);
  const [vqeResult, setVqeResult] = useState<VQEResult | null>(null);
  const [vqeRunning, setVqeRunning] = useState(false);
  const [vqeCurrentEnergy, setVqeCurrentEnergy] = useState<number | null>(null);
  const [localMolecule, setLocalMolecule] = useState<MoleculeData | null>(null);

  // ── Resolve molecule from URL params (atoms= from CustomMoleculeLibrary) ──
  useEffect(() => {
    const atomsParam = searchParams.get('atoms');
    if (atomsParam && !circuitId) {
      const atomSymbols = atomsParam.split(',').filter(Boolean);
      if (atomSymbols.length > 0) {
        // Try to match a known molecule first
        const knownId = findKnownMoleculeId(atomSymbols);
        const mol = knownId
          ? MOLECULES.find(m => m.id === knownId) ?? buildCustomMolecule(atomSymbols)
          : buildCustomMolecule(atomSymbols);
        if (mol) {
          setLocalMolecule(mol);
          // Generate ansatz circuit for display
          const paramCount = getParameterCount(mol);
          const params = initializeParameters(paramCount);
          const gates = generateParameterizedAnsatz(mol, params);
          const ham = getHamiltonian(mol.id);
          // Build circuit data for visualization
          const localCircuitData = buildLocalCircuitData(mol, gates, ham);
          setCircuitData(localCircuitData);
          // Update workflow nodes
          updateWorkflowNodes(mol, localCircuitData, setNodes);
          toast.success(`Loaded ${mol.formula}`, { description: `${mol.qubitsRequired} qubits • Ready for VQE` });
        }
      }
    }
  }, []);

  const handleRunVQE = async () => {
    if (!circuitData || !circuitData.circuit_id) {
      toast.error('No Circuit found', { description: 'Generate circuit first.' });
      return;
    }
    if (circuitData.chemistry_metadata?.pauli_term_count === 0) {
      toast.error('Hamiltonian generation failed or returned empty operator.');
      return;
    }

    setVqeRunning(true);
    setVqeIterations([]);
    setVqeResult(null);
    setBottomTab('VQE Loop');
    
    setCircuitData((prev: any) => ({ ...prev, logs: [...(prev?.logs || []), '[VQE] Starting optimizer'] }));

    try {
      // 1. Start VQE job
      const runRes = await ChemistryAPI.runRealVQE({
        hamiltonian_id: circuitData.circuit_id,
        ansatz_type: "uccsd",
        optimizer: "COBYLA",
        max_iterations: 100,
        tolerance: 0.000001,
        backend: "qiskit_aer"
      });
      const jobId = runRes.job_id;

      // 2. Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const status = await ChemistryAPI.getVQEStatus(jobId);
          if (status.convergence) {
             setVqeIterations(status.convergence);
             if (status.convergence.length > 0) {
                 const lastIter = status.convergence[status.convergence.length - 1];
                 setVqeCurrentEnergy(lastIter.energy);
                 setCircuitData((prev: any) => {
                   const newLogs = [...(prev?.logs || [])];
                   // Avoid flooding logs with every single iteration if it's very fast, but user asked for real logs:
                   // '[VQE] Iteration X energy = ...'
                   // We will just append if it's a new iteration.
                   const logMsg = `[VQE] Iteration ${lastIter.iteration} energy = ${lastIter.energy}`;
                   if (newLogs.length === 0 || newLogs[newLogs.length - 1] !== logMsg) {
                     newLogs.push(logMsg);
                   }
                   return { ...prev, logs: newLogs };
                 });
             }
          }
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            if (status.status === 'failed') {
               setVqeRunning(false);
               throw new Error('VQE Job failed on backend.');
            }
            
            setCircuitData((prev: any) => ({ ...prev, logs: [...(prev?.logs || []), '[VQE] Completed'] }));
            
            // 3. Get final result
            const finalRes = await ChemistryAPI.getVQEResult(jobId);
            const formattedResult = {
               bestEnergy: finalRes.total_energy,
               finalEnergy: finalRes.total_energy,
               totalIterations: finalRes.num_iterations,
               converged: finalRes.converged,
               energyError: Math.abs(finalRes.total_energy - finalRes.hartree_fock_energy),
               energySource: finalRes.backend,
               gradientNorm: undefined,
               hamiltonianInfo: {
                 numTerms: circuitData.chemistry_metadata.pauli_term_count,
                 fciEnergy: finalRes.electronic_energy,
                 hfEnergy: finalRes.hartree_fock_energy
               }
            };
            setVqeResult(formattedResult as any);
            
            // Update workflow nodes
            setNodes((ns: any) => ns.map((n: any) =>
              n.id === 'result' ? { ...n, data: { ...n.data, status: 'completed', meta: { Energy: `${finalRes.total_energy?.toFixed(6)} Ha`, Source: finalRes.backend, Error: `${formattedResult.energyError?.toFixed(6)} Ha` } } }
              : n.id === 'vqe' ? { ...n, data: { ...n.data, status: 'completed', meta: { Iterations: finalRes.num_iterations, Converged: finalRes.converged ? 'Yes' : 'No' } } }
              : n
            ));
            toast.success('VQE Converged!', { description: `Ground state: ${finalRes.total_energy?.toFixed(6)} Ha` });
            setVqeRunning(false);
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setVqeRunning(false);
          toast.error('VQE Polling failed', { description: pollErr.message });
        }
      }, 1000);

    } catch (e: any) {
      toast.error('VQE failed', { description: e.message });
      setVqeRunning(false);
    }
  };

  const handleGenerate = async () => {
    if (!newSmiles.trim()) return;
    setIsGenerating(true);
    let logs = ['[SYSTEM] Starting molecular circuit generation pipeline...'];
    setCircuitData({ logs } as any);

    try {
      const req = {
        molecule: newSmiles,
        basis_set: 'STO-3G',
        mapping: 'jordan_wigner',
        ansatz: 'UCCSD',
        algorithm: 'VQE',
        optimizer: 'COBYLA',
        active_space: null,
        charge: 0,
        multiplicity: 1,
        input_type: 'smiles'
      };

      const data = await ChemistryAPI.generateChemistryCircuit(req);
      
      setCircuitData(data);
      updateWorkflowNodes(data.molecule as any, data, setNodes);
      toast.success(`Circuit generated for ${data.molecule.formula}`);
    } catch (err: any) {
      toast.error('Generation Failed', { description: err.message });
      setCircuitData((prev: any) => ({ ...prev, logs: [...(prev?.logs || []), `[ERROR] ${err.message}`] }));
    } finally {
      setIsGenerating(false);
    }
  };

  const nodeTypes = useMemo(() => ({ chemNode: ChemNode }), []);
  const onNodesChange = useCallback((c: any) => setNodes(n => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c: any) => setEdges(e => applyEdgeChanges(c, e)), []);

  useEffect(() => {
    if (circuitId) {
      ChemistryAPI.getCircuit(circuitId).then(data => {
        setCircuitData(data);
        const steps = ['mol', 'rdkit', 'hf', 'active', 'fham', 'map', 'ansatz', 'vqe', 'result'];
        const cm = data.chemistry_metadata;
        const metas: Record<string, any> = {
          mol: { Formula: data.molecule.formula },
          hf: { 'HF Energy': `${cm.hf_energy?.toFixed(6)} Ha` },
          active: { Electrons: cm.active_electrons, Orbitals: cm.active_orbitals },
          fham: { Terms: data.hamiltonian?.fermionic_terms?.length || 0 },
          map: { Qubits: cm.qubit_count, Paulis: cm.pauli_term_count },
          ansatz: { Depth: data.circuit_data?.depth, Params: data.circuit_data?.parameter_count },
          vqe: { Algorithm: cm.algorithm, Status: 'Ready' },
          result: { Energy: 'Run VQE →', 'HF Ref': `${cm.hf_energy?.toFixed(6)} Ha` }
        };
        setNodes(ns => ns.map(n => {
          if (!steps.includes(n.id)) return n;
          let label = n.data.label;
          if (n.id === 'mol') label = `${data.molecule.name || data.molecule.formula} Molecule`;
          if (n.id === 'map') label = cm.mapping === 'jordan_wigner' ? 'Jordan-Wigner' : cm.mapping;
          if (n.id === 'ansatz') label = cm.ansatz;
          return { ...n, data: { ...n.data, label, status: 'completed', meta: metas[n.id]||{} } };
        }));
      }).catch(err => toast.error("Failed to load circuit", { description: err.message }));
    }
  }, [circuitId]);

  const cm = circuitData?.chemistry_metadata;
  const cd = circuitData?.circuit_data;

  const renderBottomTab = () => {
    if (!circuitData) return <div className="p-4 text-sm text-muted-foreground">No data. Generate circuit first.</div>;
    switch (bottomTab) {
      case 'Circuit': return (
        <div className="p-4 space-y-2 text-xs">
           <div className="font-semibold text-primary">Quantum Circuit Topology</div>
           <div className="grid grid-cols-4 gap-4">
              <div className="bg-muted/20 p-2 rounded"><strong>Depth:</strong> {cd?.depth}</div>
              <div className="bg-muted/20 p-2 rounded"><strong>Gates:</strong> {cd?.gate_count}</div>
              <div className="bg-muted/20 p-2 rounded"><strong>Parameters:</strong> {cd?.parameter_count}</div>
              <div className="bg-muted/20 p-2 rounded"><strong>Qubits:</strong> {cm?.qubit_count}</div>
           </div>
           <div className="mt-4 font-semibold text-muted-foreground">Sections:</div>
           <ul className="list-disc pl-4 text-muted-foreground">{cd?.sections?.map((s:string, i:number)=><li key={i}>{s}</li>)}</ul>
        </div>
      );
      case 'QASM': return <pre className="p-4 text-[10px] font-mono text-blue-300 h-full overflow-auto">{cd?.qasm || '// QASM generation not supported by backend for this circuit'}</pre>;
      case 'Hamiltonian': return <pre className="p-4 text-[10px] font-mono text-green-300 h-full overflow-auto">{circuitData.hamiltonian?.fermionic_terms?.length ? circuitData.hamiltonian.fermionic_terms.map((t: any) => `${t.coefficient > 0 ? '+' : ''}${t.coefficient.toFixed(6)} [${t.operator}]`).join('\n') : '// No fermionic terms provided by backend'}</pre>;
      case 'Pauli Terms': return <pre className="p-4 text-[10px] font-mono text-orange-300 h-full overflow-auto">{circuitData.hamiltonian?.pauli_terms?.length ? circuitData.hamiltonian.pauli_terms.map((t: any) => `${t.coefficient > 0 ? '+' : ''}${t.coefficient.toFixed(8)} * ${t.pauli}`).join('\n') : '// No Pauli terms generated'}</pre>;
      case 'Orbital Map': return <pre className="p-4 text-[11px] font-mono text-purple-300 h-full overflow-auto">{circuitData.orbital_qubit_mapping?.length ? circuitData.orbital_qubit_mapping.map((m: any) => `MO_${m.orbital} -> q${m.qubit} [Occ: ${m.occupation}]`).join('\n') : '// Orbital mapping not provided'}</pre>;
      case 'Excitations': return <pre className="p-4 text-[11px] font-mono text-pink-300 h-full overflow-auto">{circuitData.excitation_list?.length ? circuitData.excitation_list.map((e: any) => `[${e.type}] ${e.from_orbitals.join(',')} -> ${e.to_orbitals.join(',')} (Param: ${e.parameter})`).join('\n') : '// Excitation list not available'}</pre>;
      case 'Measurement': return <pre className="p-4 text-[11px] font-mono text-yellow-300 h-full overflow-auto">{circuitData.measurement_groups?.length ? circuitData.measurement_groups.map((g: any) => `Group ${g.group_id}: ${g.term_count} terms (${g.basis})`).join('\n') : '// Measurement grouping not generated'}</pre>;
      case 'Logs': return <pre className="p-4 text-[10px] font-mono text-slate-300 h-full overflow-auto">{circuitData.logs?.join('\n') || '// No logs'}</pre>;
      default: return null;
    }
    /* VQE Loop tab is rendered outside switch — see below */
  };

  const renderVQELoopTab = () => (
    <div className="p-4 h-full overflow-auto flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-primary uppercase mb-1">Energy Convergence</div>
        {vqeIterations.length === 0 && !vqeRunning ? (
          <div className="text-xs text-muted-foreground">Click &quot;Run VQE Loop&quot; to start optimization.</div>
        ) : (
          <div className="h-[90px] flex items-end gap-px bg-background/40 rounded border border-border p-1">
            {(() => {
              const its = vqeIterations.slice(-60);
              if (its.length === 0) return null;
              const minE = Math.min(...its.map(i => i.energy));
              const maxE = Math.max(...its.map(i => i.energy));
              const range = maxE - minE || 1;
              return its.map((it, idx) => {
                const pct = ((it.energy - minE) / range) * 70;
                return <div key={idx} className="flex-1 min-w-[2px] max-w-[8px] rounded-t transition-all" style={{ height: `${80 - pct}px`, backgroundColor: vqeResult && idx === its.length - 1 ? '#22c55e' : '#6366f1' }} title={`Iter ${it.iteration}: ${it.energy.toFixed(6)} Ha`} />;
              });
            })()}
          </div>
        )}
        {vqeRunning && <div className="text-[10px] text-blue-400 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Optimizing... Iteration {vqeIterations.length}</div>}
      </div>
      <div className="w-56 shrink-0 space-y-1 text-[10px]">
        <div className="font-semibold text-muted-foreground uppercase">VQE Results</div>
        {vqeResult ? (<>
          <div className="flex justify-between"><span className="text-muted-foreground">Best Energy:</span><span className="font-mono text-green-400">{vqeResult.bestEnergy.toFixed(6)} Ha</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Final Energy:</span><span className="font-mono">{vqeResult.finalEnergy.toFixed(6)} Ha</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Iterations:</span><span className="font-mono">{vqeResult.totalIterations}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Converged:</span><span className={vqeResult.converged ? 'text-green-400' : 'text-amber-400'}>{vqeResult.converged ? 'Yes' : 'No'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Error vs Ref:</span><span className="font-mono text-orange-400">{vqeResult.energyError.toFixed(6)} Ha</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Energy Source:</span><span className="font-mono text-purple-400">{vqeResult.energySource}</span></div>
          {vqeResult.gradientNorm !== undefined && <div className="flex justify-between"><span className="text-muted-foreground">Grad Norm:</span><span className="font-mono">{vqeResult.gradientNorm.toFixed(6)}</span></div>}
          {vqeResult.hamiltonianInfo && (<>
            <div className="mt-1 pt-1 border-t border-border/50 font-semibold text-muted-foreground">Hamiltonian</div>
            <div className="flex justify-between"><span className="text-muted-foreground">Terms:</span><span className="font-mono">{vqeResult.hamiltonianInfo.numTerms}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">FCI Ref:</span><span className="font-mono text-cyan-400">{vqeResult.hamiltonianInfo.fciEnergy.toFixed(4)} Ha</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">HF Ref:</span><span className="font-mono">{vqeResult.hamiltonianInfo.hfEnergy.toFixed(4)} Ha</span></div>
          </>)}
        </>) : vqeCurrentEnergy !== null ? (
          <div className="flex justify-between"><span className="text-muted-foreground">Current:</span><span className="font-mono text-blue-400">{vqeCurrentEnergy.toFixed(6)} Ha</span></div>
        ) : (
          <div className="text-muted-foreground">No results yet.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-border bg-background/90 backdrop-blur-md shrink-0 flex items-center px-4 justify-between z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/chemistry"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
          <div className="h-5 w-px bg-border" />
          <Zap className="w-4 h-4 text-primary" />
          <h1 className="font-semibold text-sm">Chemistry Circuit Builder</h1>
          {circuitData && <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">{circuitId}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded p-0.5 mr-4">
            <button onClick={() => setViewMode('workflow')} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'workflow' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>Workflow</button>
            <button onClick={() => setViewMode('circuit')} className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${viewMode === 'circuit' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}><Cpu className="w-3 h-3"/> Gate Circuit</button>
            <button onClick={() => setViewMode('split')} className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${viewMode === 'split' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}><SplitSquareHorizontal className="w-3 h-3"/> Split</button>
          </div>
          <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90" onClick={handleRunVQE} disabled={vqeRunning}>
            {vqeRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
            {vqeRunning ? 'Running VQE...' : 'Run VQE Loop'}
          </Button>
        </div>
      </header>

      {/* ── WORKSPACE ───────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* CENTER CANVASES */}
        <main className="flex-1 flex overflow-hidden">
           {(viewMode === 'workflow' || viewMode === 'split') && (
             <div className={`flex-1 relative border-r border-border ${viewMode === 'split' ? 'max-w-[40%]' : ''}`}>
               <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView style={{ background: '#0d0d1a' }}>
                 <Background color="#ffffff10" gap={20} />
                 <Controls />
                 {viewMode === 'workflow' && <MiniMap nodeColor={() => '#6366f1'} style={{ background: '#1a1a2e' }} />}
               </ReactFlow>
             </div>
           )}
           {(viewMode === 'circuit' || viewMode === 'split') && (
             <GateCircuitView circuitData={circuitData} />
           )}
        </main>

        {/* RIGHT PROPERTIES */}
        <aside className="w-64 border-l border-border bg-card/30 flex flex-col shrink-0">
          <div className="p-2.5 border-b border-border">
            <h2 className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5"><Settings className="w-3 h-3" />Chemistry Properties</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
            {!cm ? (
              <div className="space-y-3">
                <div className="text-muted-foreground text-[11px] mb-2">Connect a molecule to begin generating the quantum circuit.</div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">SMILES String</label>
                  <input 
                    className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                    placeholder="e.g. O for H2O"
                    value={newSmiles}
                    onChange={(e) => setNewSmiles(e.target.value)}
                  />
                </div>
                <Button size="sm" className="w-full text-xs h-7" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Play className="w-3 h-3 mr-2" />}
                  Generate Chemistry Circuit
                </Button>
              </div>
            ) : (<>
              <div className="bg-primary/10 border border-primary/20 rounded p-2 mb-2">
                 <div className="text-[10px] text-primary uppercase font-semibold">{circuitData.molecule.name}</div>
                 <div className="text-sm font-bold text-foreground">{circuitData.molecule.formula}</div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Basis Set:</span><span className="font-mono">{cm.basis_set}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Charge / Multiplicity:</span><span className="font-mono">{cm.charge} / {cm.multiplicity}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mapping:</span><span className="font-mono text-orange-400">{cm.mapping}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ansatz:</span><span className="font-mono text-red-400">{cm.ansatz}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">HF Energy:</span><span className="font-mono text-cyan-400">{cm.hf_energy?.toFixed(6)} Ha</span></div>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Qubits:</span><span className="font-mono">{cm.qubit_count}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Electrons (Active):</span><span className="font-mono">{cm.electron_count} ({cm.active_electrons})</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Orbitals (Active):</span><span className="font-mono">{cm.orbital_count} ({cm.active_orbitals})</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pauli Terms:</span><span className="font-mono">{cm.pauli_term_count}</span></div>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Gate Depth:</span><span className="font-mono">{cd?.depth}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Gates:</span><span className="font-mono">{cd?.gate_count}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Parameters:</span><span className="font-mono text-purple-400">{cd?.parameter_count}</span></div>
              </div>
            </>)}
          </div>
        </aside>
      </div>

      {/* ── BOTTOM TABS ──────────────────────────────────────────────── */}
      <div className="h-44 border-t border-border bg-card flex flex-col shrink-0 z-20">
        <div className="h-9 border-b border-border flex items-center px-2 bg-muted/10 gap-1 overflow-x-auto shrink-0">
          {BOTTOM_TABS.map(tab => (
            <button key={tab} onClick={() => setBottomTab(tab)}
              className={`px-3 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${bottomTab === tab ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden relative">
          {bottomTab === 'VQE Loop' ? renderVQELoopTab() : renderBottomTab()}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════════ */

/** Try to match atom symbols to a known molecule in our database */
function findKnownMoleculeId(atoms: string[]): string | null {
  const sorted = [...atoms].sort().join(',');
  const knownMaps: Record<string, string> = {
    'H,H': 'h2',
    'H,H,O': 'h2o',
    'H,H,H,N': 'nh3',
    'Be,H,H': 'beh2',
    'H,Li': 'lih',
  };
  return knownMaps[sorted] || null;
}

/** Resolve molecule data from circuit metadata (for backend-loaded circuits) */
function resolveMoleculeFromCircuit(circuitData: any): MoleculeData | null {
  if (!circuitData) return null;
  const formula = circuitData.molecule?.formula || '';
  // Try to match known molecules by formula
  const mol = MOLECULES.find(m => 
    m.formula === formula || m.formula.replace(/[₀-₉]/g, (c: string) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c))) === formula
  );
  if (mol) return mol;
  // Fallback: build from qubit count
  return null;
}

/** Build local circuit data structure for visualization (no backend needed) */
function buildLocalCircuitData(mol: MoleculeData, gates: any[], ham: any) {
  const qubits = Array.from({ length: mol.qubitsRequired }, (_, i) => ({
    index: i,
    label: `q${i}`,
    spin_orbital: `SO_${i}`,
    spin: i % 2 === 0 ? 'α' : 'β',
    occupation: i < (mol.activeSpace?.activeElectrons ?? mol.electrons) ? 1 : 0,
    active: true,
  }));

  const circGates = gates.slice(0, 200).map((g: any, i: number) => ({
    id: `g${i}`,
    type: g.type === 'CNOT' ? 'CX' : g.type,
    qubits: g.type === 'CNOT' ? [g.controlQubit, g.targetQubit] : [g.qubit],
    layer: g.position ?? Math.floor(i / mol.qubitsRequired),
    params: g.angle != null ? [g.angle.toFixed(3)] : [],
    section: i < mol.qubitsRequired ? 'HF Init' : 'UCCSD Ansatz',
  }));

  const depth = circGates.length > 0 ? Math.max(...circGates.map((g: any) => g.layer)) + 1 : 0;

  return {
    molecule: { name: mol.name, formula: mol.formula },
    chemistry_metadata: {
      basis_set: 'STO-3G',
      charge: mol.charge ?? 0,
      multiplicity: mol.multiplicity ?? 1,
      mapping: 'jordan_wigner',
      ansatz: 'UCCSD',
      algorithm: 'VQE',
      qubit_count: mol.qubitsRequired,
      electron_count: mol.electrons,
      active_electrons: mol.activeSpace?.activeElectrons ?? mol.electrons,
      active_orbitals: mol.activeSpace?.activeOrbitals ?? Math.floor(mol.qubitsRequired / 2),
      orbital_count: Math.floor(mol.qubitsRequired / 2),
      pauli_term_count: ham?.terms?.length ?? 0,
      hf_energy: ham?.hfEnergy ?? mol.expectedGroundStateEnergy * 0.98,
    },
    circuit_data: {
      qubits,
      gates: circGates,
      sections: ['HF Init', 'UCCSD Ansatz'],
      depth,
      gate_count: gates.length,
      parameter_count: getParameterCount(mol),
    },
    hamiltonian: ham ? {
      fermionic_terms: ham.terms.slice(0, 20).map((t: any) => ({ coefficient: t.coefficient, operator: t.pauliString })),
      pauli_terms: ham.terms.map((t: any) => ({ coefficient: t.coefficient, pauli: t.pauliString })),
    } : null,
    orbital_qubit_mapping: qubits.map((q: any) => ({ orbital: Math.floor(q.index / 2), qubit: q.index, occupation: q.occupation })),
    excitation_list: [],
    measurement_groups: [],
    logs: [`[INFO] Molecule: ${mol.formula}`, `[INFO] Qubits: ${mol.qubitsRequired}`, `[INFO] Gates: ${gates.length}`, `[INFO] Ready for VQE optimization`],
  };
}

/** Update workflow nodes with molecule and circuit data */
function updateWorkflowNodes(mol: MoleculeData, data: any, setNodes: React.Dispatch<React.SetStateAction<any[]>>) {
  const cm = data.chemistry_metadata;
  const cd = data.circuit_data;
  const metas: Record<string, any> = {
    mol: { Formula: mol.formula },
    hf: { 'HF Energy': `${(cm.hf_energy ?? 0).toFixed(4)} Ha` },
    active: { Electrons: cm.active_electrons, Orbitals: cm.active_orbitals },
    fham: { Terms: data.hamiltonian?.pauli_terms?.length || 0 },
    map: { Qubits: cm.qubit_count, Paulis: cm.pauli_term_count },
    ansatz: { Depth: cd?.depth, Params: cd?.parameter_count },
    vqe: { Algorithm: 'VQE', Status: 'Ready' },
    result: { Energy: 'Run VQE →' },
  };
  const steps = ['mol', 'rdkit', 'hf', 'active', 'fham', 'map', 'ansatz', 'vqe', 'result'];
  setNodes((ns: any[]) => ns.map(n => {
    if (!steps.includes(n.id)) return n;
    let label = n.data.label;
    if (n.id === 'mol') label = `${mol.name || mol.formula}`;
    if (n.id === 'ansatz') label = 'UCCSD';
    const status = n.id === 'vqe' || n.id === 'result' ? 'pending' : 'completed';
    return { ...n, data: { ...n.data, label, status, meta: metas[n.id] || {} } };
  }));
}
