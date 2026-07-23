import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  ConnectionMode,
  Handle,
  Position,
  Node,
  Edge,
  Connection,
  addEdge,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  ArrowLeft, Play, Download, Settings, Box, Zap, Share2, 
  Trash2, RotateCw, Undo, Redo, RefreshCw, Sparkles, Send, 
  Check, AlertTriangle, Cpu, Terminal, FileCode, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { useElectronicsStore } from '@/store/electronicsStore';
import { ELECTRONIC_COMPONENTS, ComponentMetadata } from '@/lib/electronics/registry';
import { 
  AddComponentCommand, 
  ConnectPinsCommand, 
  DeleteComponentCommand, 
  RotateComponentCommand, 
  UpdatePropertyCommand,
  MoveComponentCommand
} from '@/lib/electronics/commands';
import { parseNaturalLanguageRoute, parseNaturalLanguageRouteAsync, ClarificationQuestion, NLPResult } from '@/lib/electronics/nlp';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Custom styling for the React Flow elements
const customEdgeStyle = {
  stroke: '#a855f7', // purple-500
  strokeWidth: 2,
};

/* ═══════════════════════════════════════════════════════════════════
   CUSTOM REACT FLOW NODE: ElectronicsNode
   ═══════════════════════════════════════════════════════════════════ */
function ElectronicsNode({ data }: { data: any }) {
  const { id, type, rotation, properties } = data;
  const meta = ELECTRONIC_COMPONENTS[type];
  
  // Get active warnings for this component from store
  const warnings = useElectronicsStore(state => state.warnings);
  const deleteComponent = useElectronicsStore(state => state.executeCommand);
  const selectComponent = useElectronicsStore(state => state.selectComponent);
  const selectedComponentId = useElectronicsStore(state => state.selectedComponentId);
  const executeCommand = useElectronicsStore(state => state.executeCommand);

  const isSelected = selectedComponentId === id;
  const hasError = warnings.some(w => w.affectedComponents.includes(id) && w.severity === 'error');
  const hasWarning = warnings.some(w => w.affectedComponents.includes(id) && w.severity === 'warning');

  if (!meta) return <div className="p-3 border border-red-500 bg-red-100 rounded text-red-700 text-xs">Unknown Component</div>;

  // Render direct visual SVG graphics for each component type
  const renderGraphics = () => {
    switch (type) {
      case 'arduino_uno':
        return (
          <div className="w-full h-full rounded-xl bg-slate-900 border-2 border-teal-500/80 p-3 shadow-lg flex flex-col justify-between text-white relative">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold tracking-wider text-teal-400">ARDUINO UNO R3</span>
              <div className="w-4 h-6 bg-slate-700 rounded border border-slate-600 flex items-center justify-center text-[7px] text-slate-300">USB</div>
            </div>
            {/* ATMEGA Chip shape */}
            <div className="bg-slate-950 border border-slate-800 rounded p-1.5 flex items-center justify-center my-1">
              <span className="text-[8px] font-mono text-slate-400 tracking-widest">ATMEGA328P</span>
            </div>
            <div className="flex justify-between text-[7px] font-mono text-slate-500">
              <span>POWER</span>
              <span>ANALOG IN</span>
              <span>DIGITAL IO</span>
            </div>
          </div>
        );
      case 'resistor':
        return (
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Leads */}
            <div className="absolute w-full h-[3px] bg-slate-500 top-1/2 left-0 -translate-y-1/2" />
            {/* Body */}
            <div className="w-[60%] h-[75%] rounded bg-amber-100 border-2 border-amber-600/70 relative z-10 flex items-center justify-around px-1">
              {/* Resistor color bands */}
              <div className="w-[4px] h-full bg-red-500" />
              <div className="w-[4px] h-full bg-red-500" />
              <div className="w-[4px] h-full bg-brown-500 bg-amber-900" />
              <div className="w-[4px] h-full bg-yellow-600 bg-amber-500" />
            </div>
            <span className="absolute -bottom-5 text-[9px] bg-slate-950/70 px-1 rounded font-mono text-amber-400 border border-amber-500/20">{properties.resistance || '220Ω'}</span>
          </div>
        );
      case 'led':
        const colorMap: Record<string, string> = {
          red: 'bg-red-500 shadow-red-500/50',
          green: 'bg-green-500 shadow-green-500/50',
          blue: 'bg-blue-500 shadow-blue-500/50',
          yellow: 'bg-yellow-500 shadow-yellow-500/50',
          white: 'bg-slate-200 shadow-slate-200/50',
        };
        const ledColor = properties.color || 'red';
        const isBurnedOut = warnings.some(w => w.type === 'led_burnout' && w.affectedComponents.includes(id));
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* LED Bulb */}
            <div className={`w-[36px] h-[36px] rounded-full border-2 ${isBurnedOut ? 'bg-zinc-800 border-zinc-700 shadow-none animate-pulse' : colorMap[ledColor] + ' border-white/30 shadow-md'} relative flex items-center justify-center`}>
              {/* Reflection */}
              <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/60" />
              {isBurnedOut && <span className="text-[8px] font-black text-red-500 z-10">💥</span>}
            </div>
            {/* Base ring */}
            <div className="w-[40px] h-[4px] bg-zinc-400 rounded-sm -mt-0.5" />
            <span className="text-[9px] mt-1 font-semibold uppercase tracking-wider text-muted-foreground">{ledColor}</span>
          </div>
        );
      case 'capacitor':
        return (
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="absolute w-full h-[2px] bg-slate-500 top-1/2 left-0 -translate-y-1/2" />
            <div className="w-[30px] h-[40px] bg-sky-900 border border-sky-600 rounded-sm relative z-10 flex flex-col justify-between py-1 text-center">
              <div className="h-[3px] bg-sky-400 w-full" />
              <span className="text-[6px] font-mono text-sky-200 leading-none">{properties.capacitance || '10µF'}</span>
              <div className="h-[3px] bg-slate-700 w-full" />
            </div>
          </div>
        );
      case 'battery_9v':
        return (
          <div className="w-full h-full rounded-lg bg-zinc-800 border border-zinc-700 p-2 shadow-lg flex flex-col justify-between text-white relative">
            <div className="flex justify-around items-center">
              <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-600 flex items-center justify-center text-[8px] font-black">+</div>
              <div className="w-4 h-4 rounded-full border-2 border-zinc-600 bg-zinc-900 flex items-center justify-center text-[8px] font-black">-</div>
            </div>
            <div className="text-center font-bold text-lg text-zinc-300 tracking-wider">9V</div>
            <div className="text-[6px] text-zinc-500 text-center font-mono">BATTERY SOURCE</div>
          </div>
        );
      case 'and_gate':
      case 'or_gate':
      case 'xor_gate':
        const gateLabel = type === 'and_gate' ? '74HC08 AND' : type === 'or_gate' ? '74HC32 OR' : '74HC86 XOR';
        return (
          <div className="w-full h-full rounded bg-neutral-900 border border-neutral-700 p-2 text-white flex flex-col justify-between font-mono relative">
            <div className="flex justify-between items-center text-[6px] text-neutral-500">
              <span>VCC</span>
              <span>74HCxx</span>
              <span>GND</span>
            </div>
            <div className="text-center text-[9px] font-bold text-neutral-300">{gateLabel}</div>
            <div className="flex justify-between text-[6px] text-neutral-600">
              <span>1A/1B</span>
              <span>1Y</span>
              <span>2Y</span>
            </div>
          </div>
        );
      default:
        return <div>{meta.name}</div>;
    }
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    executeCommand(new RotateComponentCommand(id));
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    executeCommand(new DeleteComponentCommand(id));
    selectComponent(null);
  };

  return (
    <div
      onClick={() => selectComponent(id)}
      className={`relative group rounded-xl p-1 transition-all duration-300 select-none ${
        isSelected 
          ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background' 
          : hasError 
            ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background'
            : hasWarning 
              ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background'
              : 'hover:ring-1 hover:ring-purple-500/50'
      }`}
      style={{
        width: meta.width,
        height: meta.height,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {/* Component Graphics */}
      {renderGraphics()}

      {/* Connection Handles (Pins) */}
      {meta.pins.map(pin => {
        // Correct pin position based on visual layout
        return (
          <Handle
            key={pin.id}
            type="source" // Loose connection mode connects any source to source
            position={
              pin.side === 'left' ? Position.Left :
              pin.side === 'right' ? Position.Right :
              pin.side === 'top' ? Position.Top : Position.Bottom
            }
            id={pin.id}
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              background: hasError ? '#ef4444' : '#10b981', // red or green pins
              width: 8,
              height: 8,
              border: '2px solid white',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}
            title={`${pin.name} (${pin.type})`}
          />
        );
      })}

      {/* Floating Action Menu on Hover */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700/80 rounded-md p-1 flex gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
        <button
          onClick={handleRotate}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          title="Rotate 90°"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 hover:bg-slate-800 rounded text-red-400 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Warning indicators */}
      {(hasError || hasWarning) && (
        <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 border border-white flex items-center justify-center shadow-lg animate-bounce z-50">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  electronicsNode: ElectronicsNode,
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN ELECTRONIC BUILDER VIEW COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export function ElectronicsBuilderView() {
  const {
    components,
    connections,
    warnings,
    past,
    future,
    logs,
    selectedComponentId,
    executeCommand,
    undo,
    redo,
    clearWorkspace,
    updateComponentPosition,
    commitComponentPosition,
    selectComponent
  } = useElectronicsStore();

  const reactFlowInstance = useReactFlow();

  // AI Copilot States
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    commands?: any[];
    questions?: ClarificationQuestion[];
    resolvedParams?: Record<string, string>;
    timestamp: string;
  }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your AI Schematic Copilot. Describe an electronic circuit you would like to build (e.g. "Connect an Arduino to a green LED with a resistor" or "Build a full adder"), and I will generate and compile the executable schematic commands for you!',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<ClarificationQuestion[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [pendingPrompt, setPendingPrompt] = useState('');
  
  // Modals
  const [spiceModalOpen, setSpiceModalOpen] = useState(false);
  const [pcbModalOpen, setPcbModalOpen] = useState(false);

  // Drag component helper coordinates
  const dragStartPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Map state to React Flow nodes & edges
  const flowNodes = useMemo(() => {
    return components.map(c => ({
      id: c.id,
      type: 'electronicsNode',
      position: { x: c.x, y: c.y },
      data: { 
        id: c.id, 
        type: c.type, 
        rotation: c.rotation, 
        properties: c.properties 
      },
    }));
  }, [components]);

  const flowEdges = useMemo(() => {
    return connections.map(conn => ({
      id: conn.id,
      source: conn.fromComponentId,
      sourceHandle: conn.fromPin,
      target: conn.toComponentId,
      targetHandle: conn.toPin,
      animated: true,
      style: customEdgeStyle,
    }));
  }, [connections]);

  // Handle visual dragging
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    dragStartPositionsRef.current[node.id] = { x: node.position.x, y: node.position.y };
  }, []);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    updateComponentPosition(node.id, node.position.x, node.position.y);
  }, [updateComponentPosition]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const start = dragStartPositionsRef.current[node.id];
    if (start) {
      commitComponentPosition(node.id, start.x, start.y, node.position.x, node.position.y);
      delete dragStartPositionsRef.current[node.id];
    }
  }, [commitComponentPosition]);

  // Handle wiring connections
  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target && params.sourceHandle && params.targetHandle) {
      const id = `wire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      executeCommand(new ConnectPinsCommand(
        id, 
        params.source, 
        params.sourceHandle, 
        params.target, 
        params.targetHandle
      ));
    }
  }, [executeCommand]);

  // Component click adds to canvas center
  const handleAddComponent = (type: string) => {
    const meta = ELECTRONIC_COMPONENTS[type];
    if (!meta) return;
    
    // Spawn in visible center or default coordinates
    const viewCenter = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 100,
    });
    
    const id = `${type.toUpperCase().split('_')[0]}_${Math.floor(Math.random() * 1000)}`;
    executeCommand(new AddComponentCommand(id, type, viewCenter.x, viewCenter.y, {}));
    toast.success(`Spawned ${meta.name}`);
  };

  // AI Command Pipeline Execution (cool step-by-step visual animation!)
  const executeCompiledCommands = async (commands: any[]) => {
    setIsProcessingAI(true);
    toast.info(`Executing ${commands.length} compiled schematic commands...`);

    // Let's clear workspace first if AI prompt starts with clear
    const firstCmd = commands[0];
    let startIdx = 0;
    if (firstCmd && firstCmd.action === 'CLEAR_ALL') {
      clearWorkspace();
      startIdx = 1;
      await new Promise(r => setTimeout(r, 400));
    }

    for (let i = startIdx; i < commands.length; i++) {
      const cmd = commands[i];
      await new Promise(resolve => setTimeout(resolve, 350)); // animation delay

      switch (cmd.action) {
        case 'ADD_COMPONENT':
          executeCommand(new AddComponentCommand(
            cmd.id, 
            cmd.type, 
            cmd.x, 
            cmd.y, 
            cmd.properties || {}
          ));
          break;
        case 'CONNECT_PINS':
          executeCommand(new ConnectPinsCommand(
            `wire-${Date.now()}-${i}`, 
            cmd.fromId, 
            cmd.fromPin, 
            cmd.toId, 
            cmd.toPin
          ));
          break;
        case 'UPDATE_PROPERTY':
          executeCommand(new UpdatePropertyCommand(
            cmd.id, 
            cmd.propertyName, 
            cmd.value
          ));
          break;
      }
    }

    setIsProcessingAI(false);
    toast.success('AI Circuit Generation Complete!');
  };

  // AI NLP Prompt Submit Handler
  const handleAISubmit = async (e?: React.FormEvent, overridePrompt?: string, answers: Record<string, string> = {}) => {
    if (e) e.preventDefault();
    const promptToParse = overridePrompt || chatPrompt;
    if (!promptToParse.trim()) return;

    if (!overridePrompt) {
      // Add user message to chat history
      setChatHistory(prev => [
        ...prev,
        { sender: 'user', text: promptToParse, timestamp: new Date().toLocaleTimeString() }
      ]);
      setChatPrompt('');
    }

    setIsProcessingAI(true);
    // Simulate AI parsing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const result: NLPResult = await parseNaturalLanguageRouteAsync(promptToParse, answers);

    if (result.status === 'clarification_needed') {
      // Render clarification form in chat
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: result.explanation,
          questions: result.questions,
          timestamp: new Date().toLocaleTimeString(),
        }
      ]);
      setPendingPrompt(promptToParse);
      setCurrentQuestions(result.questions || []);
      // Initialize answer choices with default values
      const initialAnswers: Record<string, string> = {};
      result.questions?.forEach(q => {
        initialAnswers[q.id] = q.defaultValue;
      });
      setQuestionAnswers(initialAnswers);
    } else if (result.status === 'success') {
      // Show success explanation and command block
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: result.explanation,
          commands: result.commands,
          resolvedParams: Object.keys(answers).length > 0 ? answers : undefined,
          timestamp: new Date().toLocaleTimeString(),
        }
      ]);
      // Auto-execute the commands
      executeCompiledCommands(result.commands);
    } else {
      // Error / Fallback
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: result.explanation,
          timestamp: new Date().toLocaleTimeString(),
        }
      ]);
    }

    setIsProcessingAI(false);
  };

  // Submit answers to clarification questions
  const handleClarificationSubmit = (historyIdx: number) => {
    // Submit prompt with answers filled
    handleAISubmit(undefined, pendingPrompt, questionAnswers);
    
    // Clear questions UI panel
    setCurrentQuestions([]);
    setPendingPrompt('');
  };

  // Select option in the clarification list
  const selectQuestionOption = (questionId: string, option: string) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  // SPICE NETLIST EXPORTER
  const generateSpiceNetlist = () => {
    let netlist = `* SPICE Netlist Generated by Alpha Paradox QC Schematic Designer\n`;
    netlist += `* Created: ${new Date().toLocaleString()}\n\n`;

    // Map each component
    components.forEach(c => {
      const meta = ELECTRONIC_COMPONENTS[c.type];
      if (!meta) return;

      if (c.type === 'resistor') {
        const val = (c.properties.resistance || '220').replace('Ω', '').replace('k', 'k');
        // Find nets for pins p1 and p2
        const p1Net = getPinNetName(c.id, 'p1');
        const p2Net = getPinNetName(c.id, 'p2');
        netlist += `R_${c.id} ${p1Net} ${p2Net} ${val}\n`;
      } else if (c.type === 'capacitor') {
        const val = (c.properties.capacitance || '10u').replace('µ', 'u');
        const p1Net = getPinNetName(c.id, 'p1');
        const p2Net = getPinNetName(c.id, 'p2');
        netlist += `C_${c.id} ${p1Net} ${p2Net} ${val}\n`;
      } else if (c.type === 'led') {
        const anodeNet = getPinNetName(c.id, 'anode');
        const cathodeNet = getPinNetName(c.id, 'cathode');
        netlist += `D_${c.id} ${anodeNet} ${cathodeNet} LED_MODEL\n`;
      } else if (c.type === 'battery_9v') {
        const posNet = getPinNetName(c.id, 'positive');
        const negNet = getPinNetName(c.id, 'negative');
        netlist += `V_${c.id} ${posNet} ${negNet} DC 9\n`;
      } else if (c.type === 'arduino_uno') {
        // Highlight IO nodes
        netlist += `* MCU Node: ${c.id}\n`;
        meta.pins.forEach(p => {
          const pinNet = getPinNetName(c.id, p.id);
          if (pinNet !== '0' && pinNet !== `NET_${c.id}_${p.id}`) {
            netlist += `* GPIO_${p.id} connected to net ${pinNet}\n`;
          }
        });
      }
    });

    netlist += `\n.model LED_MODEL D(IS=1e-14 RS=10 N=1.5)\n`;
    netlist += `.end\n`;
    return netlist;
  };

  // Helper to trace connection net name
  const getPinNetName = (componentId: string, pinId: string): string => {
    // If it's a GND pin, SPICE net name is "0"
    const isGnd = pinId.toLowerCase().includes('gnd') || pinId === 'negative' || pinId === '-';
    if (isGnd) return '0';

    // Find if this pin is connected to any wires
    const connectedWire = connections.find(
      c => (c.fromComponentId === componentId && c.fromPin === pinId) ||
           (c.toComponentId === componentId && c.toPin === pinId)
    );

    if (!connectedWire) {
      return `NET_${componentId}_${pinId}`;
    }

    // Return a stable net ID representing the wire
    return `NET_${connectedWire.fromComponentId}_${connectedWire.fromPin}`;
  };

  // PCB BOARD JSON EXPORT
  const generatePCBJSON = () => {
    const pcbData = {
      boardName: "alpha_paradox_custom_pcb",
      dimensions: { width: 100, height: 80, unit: "mm" },
      layers: 2,
      components: components.map(c => ({
        designator: c.id,
        footprint: c.type === 'arduino_uno' ? 'ARDUINO_UNO_R3' :
                   c.type === 'resistor' ? 'R_AXIAL_0.4' :
                   c.type === 'led' ? 'LED_D5.0mm' :
                   c.type === 'capacitor' ? 'CAP_CYL_D5.0' :
                   c.type === 'battery_9v' ? 'BAT_9V_CLIP' : 'DIP_14',
        position: { x: Math.round(c.x / 10), y: Math.round(c.y / 10) },
        rotation: c.rotation
      })),
      nets: connections.map((conn, idx) => ({
        id: `NET_${idx}`,
        name: `Wire_${conn.fromComponentId}_to_${conn.toComponentId}`,
        connections: [
          { component: conn.fromComponentId, pin: conn.fromPin },
          { component: conn.toComponentId, pin: conn.toPin }
        ]
      }))
    };
    return JSON.stringify(pcbData, null, 2);
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    toast.success(`Downloaded ${filename}!`);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f19] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-[#0d1527]/90 backdrop-blur-xl px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="hover:bg-slate-800 text-slate-400 hover:text-white rounded-full">
            <Link to="/builder" title="Back to Quantum Builder">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                AI Schematic Designer
                <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30 bg-purple-950/20 px-1 py-0 h-4">Beta</Badge>
              </h1>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Build electronic schematics with Natural Language</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={past.length === 0}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
              title="Undo Command"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={future.length === 0}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
              title="Redo Command"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearWorkspace}
            className="text-slate-400 hover:text-white border border-slate-850 hover:bg-slate-800 h-9"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Clear
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSpiceModalOpen(true)}
            className="border-purple-500/30 text-purple-300 bg-purple-950/10 hover:bg-purple-900/20 h-9"
          >
            <Terminal className="w-4 h-4 mr-1.5" />
            SPICE Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPcbModalOpen(true)}
            className="border-teal-500/30 text-teal-300 bg-teal-950/10 hover:bg-teal-900/20 h-9"
          >
            <FileCode className="w-4 h-4 mr-1.5" />
            PCB Netlist
          </Button>
        </div>
      </header>

      {/* Main Workbench Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Component Catalog */}
        <aside className="w-64 border-r border-slate-800 bg-[#070b13] flex flex-col">
          <div className="p-4 border-b border-slate-850">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Component Registry</h2>
            <p className="text-[10px] text-slate-500 mt-1">Select a component to place it in the center of the canvas.</p>
          </div>
          
          <ScrollArea className="flex-1 p-3">
            {/* Component Categories */}
            {['Microcontrollers', 'Passives', 'Actuators', 'Power', 'Logic'].map(category => {
              const comps = Object.values(ELECTRONIC_COMPONENTS).filter(c => c.category === category);
              if (comps.length === 0) return null;

              return (
                <div key={category} className="mb-4">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest px-2 mb-2 block">{category}</span>
                  <div className="space-y-1.5">
                    {comps.map(comp => (
                      <button
                        key={comp.type}
                        onClick={() => handleAddComponent(comp.type)}
                        className="w-full text-left p-2.5 rounded-lg border border-slate-850 bg-slate-900/30 hover:bg-slate-800/50 hover:border-slate-700/80 transition-all duration-200 group flex items-start gap-2.5"
                      >
                        <div className="p-1 rounded bg-slate-800 border border-slate-750 text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/30 shrink-0">
                          <Box className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-200 group-hover:text-white">{comp.name}</div>
                          <div className="text-[9px] text-slate-500 truncate mt-0.5">{comp.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 relative bg-[#06080e] flex flex-col">
          
          {/* React Flow Editor */}
          <div className="flex-1 w-full h-full relative">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              onNodeDragStart={onNodeDragStart}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              onConnect={onConnect}
              connectionMode={ConnectionMode.Loose} // loose connects pins bi-directionally
              fitView
              attributionPosition="bottom-right"
              className="electronics-flow"
            >
              <Background color="#1e293b" gap={20} size={1} />
              <Controls className="bg-slate-900 border border-slate-750 text-white rounded shadow-lg fill-white" />
              <MiniMap 
                nodeStrokeColor={(n) => '#8b5cf6'}
                nodeColor={(n) => '#1e293b'}
                maskColor="rgba(11, 15, 25, 0.7)"
                className="bg-slate-900 border border-slate-800 rounded overflow-hidden"
              />
            </ReactFlow>

            {/* Float Warning Alert Overlay (Bottom Left) */}
            {warnings.length > 0 && (
              <div className="absolute bottom-4 left-4 z-50 max-w-sm bg-slate-950/90 border border-red-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                  <span className="text-xs font-bold text-red-400">Electrical Validation Warnings ({warnings.length})</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {warnings.map(w => (
                    <div key={w.id} className="text-[10px] text-slate-300 bg-red-950/20 border border-red-950/50 p-1.5 rounded leading-relaxed">
                      {w.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Console / Event Log Panel (Collapsible footer) */}
          <footer className="h-44 border-t border-slate-800 bg-[#070b13] flex flex-col shrink-0">
            <div className="px-4 py-2 border-b border-slate-850 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-teal-400" />
                Live Command logs
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Status: Engine Running</span>
            </div>
            <ScrollArea className="flex-1 p-3 bg-slate-950/50 font-mono text-[10px]">
              <div className="space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    <span className={
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </footer>
        </main>

        {/* Right Side: AI Assistant Sidebar */}
        <aside className="w-80 border-l border-slate-800 bg-[#080d19] flex flex-col z-10">
          <div className="p-4 border-b border-slate-850 bg-gradient-to-r from-purple-950/10 to-indigo-950/10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">Circuit Copilot</h2>
              <p className="text-[9px] text-slate-400">Natural language parsing assistant</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl max-w-[90%] flex flex-col gap-1.5 ${
                  msg.sender === 'user'
                    ? 'self-end bg-purple-600 text-white rounded-tr-none'
                    : 'self-start bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none shadow-md'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-semibold mb-0.5">
                  {msg.sender === 'user' ? 'You' : 'Schematic Copilot'}
                </div>
                <div className="text-xs whitespace-pre-line leading-relaxed">{msg.text}</div>

                {/* Case: Clarification form needed */}
                {msg.questions && msg.questions.length > 0 && (
                  <div className="mt-2.5 p-2 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3">
                    {msg.questions.map(q => (
                      <div key={q.id} className="space-y-1.5">
                        <label className="text-[9px] font-bold text-teal-400 block">{q.text}</label>
                        <div className="flex flex-col gap-1">
                          {q.options.map(opt => {
                            const isChosen = questionAnswers[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => selectQuestionOption(q.id, opt)}
                                className={`text-left text-[10px] px-2 py-1.5 rounded transition-all duration-200 flex items-center justify-between border ${
                                  isChosen
                                    ? 'bg-purple-900/30 border-purple-500 text-purple-300'
                                    : 'bg-slate-900/40 border-slate-850 hover:bg-slate-800 text-slate-400'
                                }`}
                              >
                                <span>{opt}</span>
                                {isChosen && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      onClick={() => handleClarificationSubmit(idx)}
                      className="w-full text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 h-7"
                    >
                      Apply Answers
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Case: Generated commands DSL preview */}
                {msg.commands && (
                  <div className="mt-2 space-y-1.5">
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block">Compiled Command DSL</span>
                    <pre className="bg-black/60 border border-slate-800/80 rounded p-2 text-[9px] text-teal-400 overflow-x-auto max-h-40 font-mono">
                      {JSON.stringify(msg.commands, null, 2)}
                    </pre>
                  </div>
                )}

                <span className="text-[8px] text-slate-500 self-end mt-1">{msg.timestamp}</span>
              </div>
            ))}

            {isProcessingAI && (
              <div className="self-start bg-slate-900 border border-slate-800 p-3 rounded-xl rounded-tl-none text-slate-400 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Schematic Copilot compiling DSL...</span>
              </div>
            )}
          </div>

          {/* Example prompt pills helper */}
          <div className="p-2 border-t border-slate-850 space-y-1.5 bg-[#060a13]/30">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block px-1">Example Prompts</span>
            <div className="flex flex-wrap gap-1">
              {[
                'Build a full adder',
                'Connect Arduino to an LED',
                'Connect Arduino Uno to green LED with 220Ω resistor',
                'Connect 9V battery to a 10uF capacitor'
              ].map(ex => (
                <button
                  key={ex}
                  onClick={() => setChatPrompt(ex)}
                  className="text-[9px] text-left px-2 py-1 rounded bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-white truncate max-w-full"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Form */}
          <form onSubmit={(e) => handleAISubmit(e)} className="p-3 border-t border-slate-850 bg-slate-950/40 flex gap-1.5">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Describe circuit to build..."
              disabled={isProcessingAI}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isProcessingAI || !chatPrompt.trim()}
              className="bg-purple-600 text-white hover:bg-purple-700 rounded-lg h-9 w-9 shrink-0 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </aside>
      </div>

      {/* SPICE Netlist Modal */}
      <Dialog open={spiceModalOpen} onOpenChange={setSpiceModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-1.5">
              <Terminal className="w-5 h-5 text-purple-400" />
              Compiled SPICE Netlist
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Below is the SPICE simulation netlist compiled dynamically from your active canvas schematic.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 bg-black/60 border border-slate-800 rounded p-3 text-[10px] text-teal-400 font-mono overflow-auto max-h-72">
            <pre>{generateSpiceNetlist()}</pre>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setSpiceModalOpen(false)} className="text-slate-400 hover:text-white">
              Close
            </Button>
            <Button onClick={() => handleDownloadFile(generateSpiceNetlist(), "circuit.cir")} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Download className="w-4 h-4 mr-1.5" />
              Download Netlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PCB Netlist Modal */}
      <Dialog open={pcbModalOpen} onOpenChange={setPcbModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-1.5">
              <FileCode className="w-5 h-5 text-teal-400" />
              PCB Assembly Layout Netlist
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Below is the JSON structured design netlist ready to be exported to custom PCB routers or EDA tools.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 bg-black/60 border border-slate-800 rounded p-3 text-[10px] text-teal-400 font-mono overflow-auto max-h-72">
            <pre>{generatePCBJSON()}</pre>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setPcbModalOpen(false)} className="text-slate-400 hover:text-white">
              Close
            </Button>
            <Button onClick={() => handleDownloadFile(generatePCBJSON(), "pcb_layout.json")} className="bg-teal-600 hover:bg-teal-750 text-white">
              <Download className="w-4 h-4 mr-1.5" />
              Download PCB Design
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ElectronicsBuilder() {
  return (
    <ReactFlowProvider>
      <ElectronicsBuilderView />
    </ReactFlowProvider>
  );
}
