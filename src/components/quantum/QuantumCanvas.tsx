import { useCallback, useRef, DragEvent } from 'react';
import { motion } from 'framer-motion';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { GateType, GATE_INFO } from '@/types/quantum';
import { X } from 'lucide-react';

const QUBIT_SPACING = 80;
const GATE_WIDTH = 60;
const GATE_SPACING = 80;
const CANVAS_PADDING = 60;

export const QuantumCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { gates, qubitCount, addGate, removeGate, draggedGate } = useQuantumCircuitStore();

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!draggedGate || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;

    // Calculate which qubit line was targeted
    const qubitIndex = Math.round((y - CANVAS_PADDING) / QUBIT_SPACING);
    if (qubitIndex < 0 || qubitIndex >= qubitCount) return;

    // Calculate position along the circuit
    const position = Math.max(0, Math.floor((x - CANVAS_PADDING - 40) / GATE_SPACING));

    // Check if position is already occupied on this qubit
    const existingGate = gates.find(g => g.qubit === qubitIndex && g.position === position);
    if (existingGate) return;

    const newGate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: draggedGate as GateType,
      qubit: qubitIndex,
      position,
    };

    addGate(newGate);
  }, [draggedGate, qubitCount, gates, addGate]);

  // Calculate canvas dimensions
  const maxPosition = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 2 : 8;
  const canvasWidth = Math.max(800, CANVAS_PADDING * 2 + 40 + maxPosition * GATE_SPACING);
  const canvasHeight = CANVAS_PADDING * 2 + (qubitCount - 1) * QUBIT_SPACING;

  return (
    <div 
      className="flex-1 overflow-auto bg-background quantum-grid relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={canvasRef}
    >
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className="min-w-full min-h-full"
      >
        <defs>
          {/* Glow filters for different colors */}
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Gradient for qubit lines */}
          <linearGradient id="qubit-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0" />
            <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0.6" />
            <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Qubit lines */}
        {Array.from({ length: qubitCount }).map((_, i) => {
          const y = CANVAS_PADDING + i * QUBIT_SPACING;
          
          return (
            <g key={`qubit-${i}`}>
              {/* Line glow */}
              <line
                x1={CANVAS_PADDING}
                y1={y}
                x2={canvasWidth - CANVAS_PADDING}
                y2={y}
                stroke="url(#qubit-line-gradient)"
                strokeWidth="4"
                filter="url(#glow-cyan)"
              />
              
              {/* Main line */}
              <line
                x1={CANVAS_PADDING}
                y1={y}
                x2={canvasWidth - CANVAS_PADDING}
                y2={y}
                stroke="hsl(199, 89%, 48%)"
                strokeWidth="2"
                strokeOpacity="0.6"
              />
              
              {/* Qubit label */}
              <text
                x={CANVAS_PADDING - 25}
                y={y + 5}
                fill="hsl(199, 89%, 48%)"
                fontSize="14"
                fontFamily="monospace"
                fontWeight="bold"
              >
                q{i}
              </text>
              
              {/* Initial state */}
              <text
                x={CANVAS_PADDING + 10}
                y={y + 5}
                fill="hsl(var(--muted-foreground))"
                fontSize="12"
                fontFamily="monospace"
              >
                |0⟩
              </text>
            </g>
          );
        })}

        {/* Gates */}
        {gates.map((gate) => {
          const gateInfo = GATE_INFO[gate.type];
          const x = CANVAS_PADDING + 40 + gate.position * GATE_SPACING;
          const y = CANVAS_PADDING + gate.qubit * QUBIT_SPACING;

          return (
            <motion.g
              key={gate.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Gate background glow */}
              <rect
                x={x - GATE_WIDTH / 2 - 2}
                y={y - GATE_WIDTH / 2 - 2}
                width={GATE_WIDTH + 4}
                height={GATE_WIDTH + 4}
                rx="8"
                fill={gateInfo.color}
                fillOpacity="0.2"
                filter="url(#glow-cyan)"
              />
              
              {/* Gate box */}
              <rect
                x={x - GATE_WIDTH / 2}
                y={y - GATE_WIDTH / 2}
                width={GATE_WIDTH}
                height={GATE_WIDTH}
                rx="6"
                fill="hsl(var(--card))"
                stroke={gateInfo.color}
                strokeWidth="2"
                className="cursor-pointer hover:stroke-[3]"
                style={{ transition: 'stroke-width 0.2s' }}
              />
              
              {/* Gate symbol */}
              <text
                x={x}
                y={y + 6}
                fill={gateInfo.color}
                fontSize="18"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {gateInfo.symbol}
              </text>

              {/* Delete button */}
              <g
                className="cursor-pointer opacity-0 hover:opacity-100"
                style={{ transition: 'opacity 0.2s' }}
                onClick={() => removeGate(gate.id)}
              >
                <circle
                  cx={x + GATE_WIDTH / 2 - 5}
                  cy={y - GATE_WIDTH / 2 + 5}
                  r="8"
                  fill="hsl(var(--destructive))"
                />
                <foreignObject
                  x={x + GATE_WIDTH / 2 - 11}
                  y={y - GATE_WIDTH / 2 - 1}
                  width="12"
                  height="12"
                >
                  <X className="w-3 h-3 text-destructive-foreground" />
                </foreignObject>
              </g>
            </motion.g>
          );
        })}

        {/* Drop zones indicator when dragging */}
        {draggedGate && Array.from({ length: qubitCount }).map((_, qubitIndex) => (
          Array.from({ length: 8 }).map((_, posIndex) => {
            const isOccupied = gates.some(g => g.qubit === qubitIndex && g.position === posIndex);
            if (isOccupied) return null;
            
            const x = CANVAS_PADDING + 40 + posIndex * GATE_SPACING;
            const y = CANVAS_PADDING + qubitIndex * QUBIT_SPACING;
            
            return (
              <motion.rect
                key={`drop-${qubitIndex}-${posIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                x={x - GATE_WIDTH / 2}
                y={y - GATE_WIDTH / 2}
                width={GATE_WIDTH}
                height={GATE_WIDTH}
                rx="6"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })
        ))}
      </svg>

      {/* Empty state */}
      {gates.length === 0 && !draggedGate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">⚛</div>
            <p className="text-muted-foreground text-lg">
              Drag quantum gates from the left panel
            </p>
            <p className="text-muted-foreground/60 text-sm mt-2">
              Drop them on qubit lines to build your circuit
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
