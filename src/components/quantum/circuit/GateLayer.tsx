import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { GateType, GATE_INFO, QuantumGate } from '@/types/quantum';
import { EXTENDED_GATE_INFO } from '@/types/quantum-extended';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { GateContextMenu } from '../GateContextMenu';
import { ROW_HEIGHT, COL_WIDTH, CANVAS_PADDING, GATE_WIDTH } from './constants';

interface GateLayerProps {
  width: number;
  height: number;
  draggingGateId: string | null;
  setDraggingGateId: (id: string | null) => void;
  handleGateClick: (id: string, e: React.MouseEvent) => void;
  handleGateDragStart: (id: string) => void;
  visibleStart: number;
  visibleEnd: number;
}

export const GateLayer: React.FC<GateLayerProps> = ({
  width,
  height,
  draggingGateId,
  setDraggingGateId,
  handleGateClick,
  handleGateDragStart,
  visibleStart,
  visibleEnd
}) => {
  const {
    gates,
    selectedGateId,
    removeGate,
    simulationResult,
    draggedGate,
    qubitCount
  } = useQuantumCircuitStore();

  // Filter gates to only those visible (optimization for 100+ qubits)
  // Include if any part of the gate (qubit, target, control) is in the visible range.
  const visibleGates = gates.filter(gate => {
    const q = gate.qubit;
    const c = gate.controlQubit;
    const t = gate.targetQubit;
    
    if (q >= visibleStart && q <= visibleEnd) return true;
    if (c !== undefined && c >= visibleStart && c <= visibleEnd) return true;
    if (t !== undefined && t >= visibleStart && t <= visibleEnd) return true;
    
    // Also include if the connection line passes through the visible area
    if (c !== undefined && t !== undefined) {
      const min = Math.min(c, t);
      const max = Math.max(c, t);
      if (min <= visibleStart && max >= visibleEnd) return true;
    }
    
    return false;
  });

  return (
    <svg width={width} height={height} className="absolute inset-0 pointer-events-none z-10">
      <defs>
        <filter id="glow-cyan-layer" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Multi-qubit gate visuals: connection lines */}
      {visibleGates.map((gate) => {
        if (gate.targetQubit === undefined || gate.controlQubit === undefined) return null;
        if (gate.controlQubit === gate.targetQubit) return null;
        
        const gateInfo = GATE_INFO[gate.type as GateType] ?? EXTENDED_GATE_INFO[gate.type as keyof typeof EXTENDED_GATE_INFO] ?? { color: 'hsl(265, 100%, 65%)' };
        const x = CANVAS_PADDING + 40 + gate.position * COL_WIDTH;
        const controlY = CANVAS_PADDING + gate.controlQubit * ROW_HEIGHT + ROW_HEIGHT / 2;
        const targetY = CANVAS_PADDING + gate.targetQubit * ROW_HEIGHT + ROW_HEIGHT / 2;
        
        return (
          <g key={`multi-${gate.id}`}>
            <motion.line
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              x1={x}
              y1={controlY}
              x2={x}
              y2={targetY}
              stroke={gateInfo.color}
              strokeWidth="2"
              strokeOpacity="0.8"
            />
            <motion.circle
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              cx={x}
              cy={controlY}
              r="6"
              fill={gateInfo.color}
            />
            <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <circle cx={x} cy={targetY} r="14" fill="none" stroke={gateInfo.color} strokeWidth="2" />
              <line x1={x - 10} y1={targetY} x2={x + 10} y2={targetY} stroke={gateInfo.color} strokeWidth="2" />
              <line x1={x} y1={targetY - 10} x2={x} y2={targetY + 10} stroke={gateInfo.color} strokeWidth="2" />
            </motion.g>
          </g>
        );
      })}

      {/* Drop Target Previews */}
      {draggedGate && Array.from({ length: Math.min(visibleEnd - visibleStart + 1, qubitCount) }).map((_, i) => {
        const qubitIndex = visibleStart + i;
        if (qubitIndex >= qubitCount) return null;
        
        return Array.from({ length: 8 }).map((_, posIndex) => {
          const isOccupied = gates.some(g => g.qubit === qubitIndex && g.position === posIndex);
          if (isOccupied) return null;
          
          const x = CANVAS_PADDING + 40 + posIndex * COL_WIDTH;
          const y = CANVAS_PADDING + qubitIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
          
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
        });
      })}

      {/* Gates */}
      {visibleGates.map((gate) => {
        const gateInfo = GATE_INFO[gate.type as GateType] ?? EXTENDED_GATE_INFO[gate.type as keyof typeof EXTENDED_GATE_INFO] ?? { color: 'hsl(200, 80%, 60%)', symbol: gate.type, name: gate.type };
        const x = CANVAS_PADDING + 40 + gate.position * COL_WIDTH;
        const y = CANVAS_PADDING + gate.qubit * ROW_HEIGHT + ROW_HEIGHT / 2;
        const isSelected = selectedGateId === gate.id;
        const isDragging = draggingGateId === gate.id;
        
        const displayData = simulationResult?.displays?.[gate.id] || { x: 0, y: 0, z: 1 };
        const prob = (1 - displayData.z) / 2;
        const phaseAngle = Math.atan2(displayData.y, displayData.x);
        const r = GATE_WIDTH / 2 - 4;

        return (
          <GateContextMenu key={gate.id} gate={gate}>
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: isDragging ? 1.1 : 1, opacity: isDragging ? 0.7 : 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ cursor: 'grab', pointerEvents: 'auto' }}
              onClick={(e) => handleGateClick(gate.id, e)}
              onMouseDown={(e) => {
                if (e.button === 0) handleGateDragStart(gate.id);
              }}
              onMouseUp={() => setDraggingGateId(null)}
            >
              {isSelected && (
                <motion.rect
                  x={x - GATE_WIDTH / 2 - 6}
                  y={y - GATE_WIDTH / 2 - 6}
                  width={GATE_WIDTH + 12}
                  height={GATE_WIDTH + 12}
                  rx="10"
                  fill="none"
                  stroke={gateInfo.color}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              
              <rect
                x={x - GATE_WIDTH / 2 - 2}
                y={y - GATE_WIDTH / 2 - 2}
                width={GATE_WIDTH + 4}
                height={GATE_WIDTH + 4}
                rx="8"
                fill={gateInfo.color}
                fillOpacity="0.2"
                filter="url(#glow-cyan-layer)"
              />
              
              {gate.type === 'DISPLAY' ? (
                <g>
                  <circle cx={x} cy={y} r={GATE_WIDTH / 2} fill="hsl(var(--card))" stroke={gateInfo.color} strokeWidth={isSelected ? 3 : 2} />
                  <clipPath id={`clip-${gate.id}`}>
                    <circle cx={x} cy={y} r={r} />
                  </clipPath>
                  <rect
                    x={x - r}
                    y={y + r - prob * 2 * r}
                    width={2 * r}
                    height={prob * 2 * r}
                    fill={gateInfo.color}
                    clipPath={`url(#clip-${gate.id})`}
                    opacity={0.8}
                  />
                  <circle cx={x} cy={y} r={r} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.5" />
                  {prob > 0.001 && (
                    <line x1={x} y1={y} x2={x + r * Math.cos(phaseAngle)} y2={y - r * Math.sin(phaseAngle)} stroke="hsl(var(--background))" strokeWidth="2" strokeLinecap="round" />
                  )}
                </g>
              ) : (
                <g>
                  <rect
                    x={x - GATE_WIDTH / 2}
                    y={y - GATE_WIDTH / 2}
                    width={GATE_WIDTH}
                    height={GATE_WIDTH}
                    rx="6"
                    fill="hsl(var(--card))"
                    stroke={gateInfo.color}
                    strokeWidth={isSelected ? 3 : 2}
                    className="hover:stroke-[3]"
                    style={{ transition: 'stroke-width 0.2s' }}
                  />
                  <text x={x} y={y + 6} fill={gateInfo.color} fontSize="18" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    {gateInfo.symbol}
                  </text>
                </g>
              )}
              
              {gate.angle !== undefined && (
                <text x={x} y={y + 20} fill={gateInfo.color} fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.8">
                  {(gate.angle / Math.PI).toFixed(1)}π
                </text>
              )}

              <g className="cursor-pointer opacity-0 hover:opacity-100" style={{ transition: 'opacity 0.2s' }} onClick={(e) => { e.stopPropagation(); removeGate(gate.id); }}>
                <circle cx={x + GATE_WIDTH / 2 - 5} cy={y - GATE_WIDTH / 2 + 5} r="8" fill="hsl(var(--destructive))" />
                <foreignObject x={x + GATE_WIDTH / 2 - 11} y={y - GATE_WIDTH / 2 - 1} width="12" height="12">
                  <X className="w-3 h-3 text-destructive-foreground" />
                </foreignObject>
              </g>
            </motion.g>
          </GateContextMenu>
        );
      })}
    </svg>
  );
};
