import React, { useState } from 'react';
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
    qubitCount,
    moveGate,
    moveTargetNode,
    alignmentMode
  } = useQuantumCircuitStore();

  const [dragState, setDragState] = useState<{ id: string, type: 'full' | 'target', startY: number, currentY: number, startX: number, currentX: number } | null>(null);

  // Filter gates to only those visible (optimization for 100+ qubits)
  const visibleGates = gates.filter(gate => {
    const q = gate.qubit;
    const c = gate.controlQubit;
    const t = gate.targetQubit;
    
    if (q >= visibleStart && q <= visibleEnd) return true;
    if (c !== undefined && c >= visibleStart && c <= visibleEnd) return true;
    if (t !== undefined && t >= visibleStart && t <= visibleEnd) return true;
    
    if (c !== undefined && t !== undefined) {
      const min = Math.min(c, t);
      const max = Math.max(c, t);
      if (min <= visibleStart && max >= visibleEnd) return true;
    }
    
    return false;
  });

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>, gateId: string, type: 'full' | 'target') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({ id: gateId, type, startY: e.clientY, currentY: e.clientY, startX: e.clientX, currentX: e.clientX });
    handleGateDragStart(gateId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (dragState) {
      setDragState({ ...dragState, currentY: e.clientY, currentX: e.clientX });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement>) => {
    if (dragState) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      const deltaY = dragState.currentY - dragState.startY;
      const deltaRows = Math.round(deltaY / ROW_HEIGHT);
      
      const deltaX = dragState.currentX - dragState.startX;
      const deltaCols = Math.round(deltaX / COL_WIDTH);

      // If there was no significant movement (just a click), do not trigger a move/snap
      if (deltaRows === 0 && deltaCols === 0) {
        setDragState(null);
        setDraggingGateId(null);
        return;
      }
      
      const gate = gates.find(g => g.id === dragState.id);
      if (gate) {
        if (dragState.type === 'full') {
           const newQubit = gate.qubit + deltaRows;
           let newPosition = gate.position;
           if (alignmentMode === 'freedom') {
             newPosition = Math.max(0, gate.position + deltaCols);
           } else if (alignmentMode === 'left') {
             const newTarget = gate.targetQubit !== undefined ? gate.targetQubit + deltaRows : undefined;
             const occupiedWires = [newQubit];
             if (newTarget !== undefined) {
               const minWire = Math.min(newQubit, newTarget);
               const maxWire = Math.max(newQubit, newTarget);
               for (let w = minWire; w <= maxWire; w++) {
                 if (!occupiedWires.includes(w)) occupiedWires.push(w);
               }
             }
             let maxPos = -1;
             gates.forEach(g => {
               if (g.id === gate.id) return;
               const gMin = Math.min(g.qubit, g.targetQubit ?? g.qubit);
               const gMax = Math.max(g.qubit, g.targetQubit ?? g.qubit);
               const overlaps = occupiedWires.some(w => w >= gMin && w <= gMax);
               if (overlaps) {
                 maxPos = Math.max(maxPos, g.position);
               }
             });
             newPosition = maxPos + 1;
           }

           if (newQubit >= 0 && newQubit < qubitCount) {
              moveGate(gate.id, newQubit, newPosition);
           }
        } else if (dragState.type === 'target') {
           const targetQubit = (gate.targetQubit ?? 0) + deltaRows;
           if (targetQubit >= 0 && targetQubit < qubitCount && targetQubit !== gate.controlQubit) {
              moveTargetNode(gate.id, targetQubit);
           }
        }
      }
      setDragState(null);
      setDraggingGateId(null);
    }
  };

  const getRenderQubit = (gateId: string, originalQubit: number, type: 'full' | 'target') => {
    if (dragState && dragState.id === gateId && dragState.type === type) {
      const deltaY = dragState.currentY - dragState.startY;
      const deltaRows = Math.round(deltaY / ROW_HEIGHT);
      let newQubit = originalQubit + deltaRows;
      newQubit = Math.max(0, Math.min(newQubit, qubitCount - 1));
      return newQubit;
    }
    return originalQubit;
  };

  const getRenderPosition = (gateId: string, originalPosition: number) => {
    if (dragState && dragState.id === gateId && dragState.type === 'full') {
      if (alignmentMode === 'freedom') {
        const deltaX = dragState.currentX - dragState.startX;
        const deltaCols = Math.round(deltaX / COL_WIDTH);
        return Math.max(0, originalPosition + deltaCols);
      } else if (alignmentMode === 'left') {
        const gate = gates.find(g => g.id === gateId);
        if (gate) {
          const deltaY = dragState.currentY - dragState.startY;
          const deltaRows = Math.round(deltaY / ROW_HEIGHT);
          const newQubit = gate.qubit + deltaRows;
          const newTarget = gate.targetQubit !== undefined ? gate.targetQubit + deltaRows : undefined;
          const occupiedWires = [newQubit];
          if (newTarget !== undefined) {
            const minWire = Math.min(newQubit, newTarget);
            const maxWire = Math.max(newQubit, newTarget);
            for (let w = minWire; w <= maxWire; w++) {
              if (!occupiedWires.includes(w)) occupiedWires.push(w);
            }
          }
          let maxPos = -1;
          gates.forEach(g => {
            if (g.id === gateId) return;
            const gMin = Math.min(g.qubit, g.targetQubit ?? g.qubit);
            const gMax = Math.max(g.qubit, g.targetQubit ?? g.qubit);
            const overlaps = occupiedWires.some(w => w >= gMin && w <= gMax);
            if (overlaps) {
              maxPos = Math.max(maxPos, g.position);
            }
          });
          return maxPos + 1;
        }
      }
    }
    return originalPosition;
  };

  const isCollision = (gateId: string, qubit: number, position: number) => {
    return gates.some(g => g.id !== gateId && g.qubit === qubit && g.position === position);
  };

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
        const renderPosition = getRenderPosition(gate.id, gate.position);
        const x = CANVAS_PADDING + 40 + renderPosition * COL_WIDTH;
        
        const isSelected = selectedGateId === gate.id;
        const isDraggingFull = draggingGateId === gate.id && (!dragState || dragState.type === 'full');
        const isDraggingTarget = draggingGateId === gate.id && dragState?.type === 'target';
        const isMulti = gate.controlQubit !== undefined && gate.targetQubit !== undefined;
        
        // Compute rendered qubits (applying drag offsets)
        const renderQubit = getRenderQubit(gate.id, gate.qubit, 'full');
        const renderTargetQubit = isMulti ? getRenderQubit(gate.id, gate.targetQubit!, 'target') : undefined;
        const renderControlQubit = isMulti ? getRenderQubit(gate.id, gate.controlQubit!, 'full') : undefined;

        const y = CANVAS_PADDING + renderQubit * ROW_HEIGHT + ROW_HEIGHT / 2;
        const targetY = renderTargetQubit !== undefined ? CANVAS_PADDING + renderTargetQubit * ROW_HEIGHT + ROW_HEIGHT / 2 : undefined;
        const controlY = renderControlQubit !== undefined ? CANVAS_PADDING + renderControlQubit * ROW_HEIGHT + ROW_HEIGHT / 2 : undefined;
        
        const colliding = isDraggingFull && isCollision(gate.id, renderQubit, renderPosition);

        const displayData = simulationResult?.displays?.[gate.id] || { x: 0, y: 0, z: 1 };
        const prob = (1 - displayData.z) / 2;
        const phaseAngle = Math.atan2(displayData.y, displayData.x);
        const r = GATE_WIDTH / 2 - 4;
        
        const gateColor = colliding ? 'hsl(var(--destructive))' : gateInfo.color;

        return (
          <GateContextMenu key={gate.id} gate={gate}>
            <g>
              {/* Multi-qubit connection logic */}
              {isMulti && targetY !== undefined && controlY !== undefined && (
                <g>
                  {renderControlQubit !== renderTargetQubit && (
                    <motion.line
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      x1={x}
                      y1={controlY}
                      x2={x}
                      y2={targetY}
                      stroke={gateColor}
                      strokeWidth="2"
                      strokeOpacity="0.8"
                    />
                  )}
                  
                  {/* Control Node (IBM style dot, or cross for SWAP) */}
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: isDraggingFull ? 1.2 : 1 }}
                    cx={x}
                    cy={controlY}
                    r="6"
                    fill={gate.type === 'SWAP' ? 'transparent' : gateColor}
                    stroke={gate.type === 'SWAP' ? gateColor : 'none'}
                    strokeWidth={gate.type === 'SWAP' ? 0 : 0}
                    style={{ cursor: 'grab', pointerEvents: 'auto' }}
                    onClick={(e) => handleGateClick(gate.id, e as any)}
                    onPointerDown={(e) => handlePointerDown(e as any, gate.id, 'full')}
                    onPointerMove={handlePointerMove as any}
                    onPointerUp={handlePointerUp as any}
                  />
                  {gate.type === 'SWAP' && (
                    <motion.g style={{ pointerEvents: 'none' }}>
                      <line x1={x - 8} y1={controlY - 8} x2={x + 8} y2={controlY + 8} stroke={gateColor} strokeWidth="2" />
                      <line x1={x - 8} y1={controlY + 8} x2={x + 8} y2={controlY - 8} stroke={gateColor} strokeWidth="2" />
                    </motion.g>
                  )}

                  {/* Target Node (Interactive) */}
                  <motion.g
                    initial={{ scale: 0 }} 
                    animate={{ scale: isDraggingTarget ? 1.2 : 1 }}
                    style={{ cursor: 'ns-resize', pointerEvents: 'auto' }}
                    onPointerDown={(e) => handlePointerDown(e as any, gate.id, 'target')}
                    onPointerMove={handlePointerMove as any}
                    onPointerUp={handlePointerUp as any}
                  >
                    {gate.type === 'CNOT' ? (
                      <>
                        <circle cx={x} cy={targetY} r="14" fill="var(--background)" stroke={gateColor} strokeWidth="2" />
                        <line x1={x - 10} y1={targetY} x2={x + 10} y2={targetY} stroke={gateColor} strokeWidth="2" />
                        <line x1={x} y1={targetY - 10} x2={x} y2={targetY + 10} stroke={gateColor} strokeWidth="2" />
                      </>
                    ) : gate.type === 'CZ' ? (
                      <circle cx={x} cy={targetY} r="6" fill={gateColor} />
                    ) : gate.type === 'SWAP' ? (
                      <>
                        <line x1={x - 8} y1={targetY - 8} x2={x + 8} y2={targetY + 8} stroke={gateColor} strokeWidth="2" />
                        <line x1={x - 8} y1={targetY + 8} x2={x + 8} y2={targetY - 8} stroke={gateColor} strokeWidth="2" />
                      </>
                    ) : (
                      <>
                        <rect x={x - 12} y={targetY - 12} width="24" height="24" rx="4" fill="var(--card)" stroke={gateColor} strokeWidth="2" />
                        <text x={x} y={targetY + 4} fill={gateColor} fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                          {gateInfo.symbol.replace('C', '')}
                        </text>
                      </>
                    )}
                  </motion.g>

                  {/* Add visual selection indicator for control dot */}
                  {isSelected && (
                    <motion.circle
                      cx={x}
                      cy={controlY}
                      r="12"
                      fill="none"
                      stroke={gateColor}
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </g>
              )}

              {/* Only render the square block for single-qubit gates or measure/display */}
              {!isMulti && (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isDraggingFull ? 1.1 : 1, opacity: isDraggingFull ? 0.7 : 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ cursor: 'grab', pointerEvents: 'auto' }}
                  onClick={(e) => handleGateClick(gate.id, e as any)}
                  onPointerDown={(e) => handlePointerDown(e as any, gate.id, 'full')}
                  onPointerMove={handlePointerMove as any}
                  onPointerUp={handlePointerUp as any}
                >
                  {isSelected && (
                    <motion.rect
                      x={x - GATE_WIDTH / 2 - 6}
                      y={y - GATE_WIDTH / 2 - 6}
                      width={GATE_WIDTH + 12}
                      height={GATE_WIDTH + 12}
                      rx="10"
                      fill="none"
                      stroke={gateColor}
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
                    fill={gateColor}
                    fillOpacity={colliding ? "0.5" : "0.2"}
                    filter="url(#glow-cyan-layer)"
                  />
                  
                  {gate.type === 'DISPLAY' ? (
                    <g>
                      <circle cx={x} cy={y} r={GATE_WIDTH / 2} fill="hsl(var(--card))" stroke={gateColor} strokeWidth={isSelected ? 3 : 2} />
                      <clipPath id={`clip-${gate.id}`}>
                        <circle cx={x} cy={y} r={r} />
                      </clipPath>
                      <rect
                        x={x - r}
                        y={y + r - prob * 2 * r}
                        width={2 * r}
                        height={prob * 2 * r}
                        fill={gateColor}
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
                        stroke={gateColor}
                        strokeWidth={isSelected ? 3 : 2}
                        className="hover:stroke-[3]"
                        style={{ transition: 'stroke-width 0.2s' }}
                      />
                      <text x={x} y={y + 6} fill={gateColor} fontSize="18" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        {gateInfo.symbol}
                      </text>
                    </g>
                  )}
                  
                  {gate.angle !== undefined && (
                    <text x={x} y={y + 20} fill={gateColor} fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.8">
                      {(gate.angle / Math.PI).toFixed(1)}π
                    </text>
                  )}

                  <g 
                    className="cursor-pointer opacity-0 hover:opacity-100" 
                    style={{ transition: 'opacity 0.2s', pointerEvents: 'auto' }} 
                    onPointerDown={(e) => { 
                      e.stopPropagation(); 
                      removeGate(gate.id); 
                    }}
                  >
                    <circle cx={x + GATE_WIDTH / 2 - 5} cy={y - GATE_WIDTH / 2 + 5} r="8" fill="hsl(var(--destructive))" />
                    <foreignObject x={x + GATE_WIDTH / 2 - 11} y={y - GATE_WIDTH / 2 - 1} width="12" height="12">
                      <X className="w-3 h-3 text-destructive-foreground" />
                    </foreignObject>
                  </g>
                </motion.g>
              )}
            </g>
          </GateContextMenu>
        );
      })}
    </svg>
  );
};
