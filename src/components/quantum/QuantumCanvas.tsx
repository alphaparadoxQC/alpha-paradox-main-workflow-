 /**
  * ============================================================
  * QUANTUM CANVAS COMPONENT
  * ============================================================
  * 
  * This is the main circuit building area where users:
  * - Drag gates from the palette onto qubit lines
  * - Select gates by clicking (shows highlight)
  * - Delete gates with Delete/Backspace keys
  * - Drag existing gates to reposition them
  * - Right-click for context menu
  * 
  * Key Implementation Notes:
  * - Uses SVG for rendering gates and qubit lines
  * - Framer Motion for gate animations
  * - Keyboard events require focus (tabIndex on container)
  * - Two drag modes: NEW gates from palette, MOVE existing gates
  * ============================================================
  */
 
 import { useCallback, useRef, DragEvent, KeyboardEvent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { GateType, GATE_INFO } from '@/types/quantum';
import { EXTENDED_GATE_INFO } from '@/types/quantum-extended';
import { X } from 'lucide-react';
 import { GateContextMenu } from './GateContextMenu';

const QUBIT_SPACING = 80;
const GATE_WIDTH = 60;
const GATE_SPACING = 80;
const CANVAS_PADDING = 60;

export const QuantumCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
   const { 
     gates, 
     qubitCount, 
     addGate, 
     removeGate, 
     draggedGate,
     selectedGateId,
     selectGate,
     moveGate,
     undo,
     redo,
   } = useQuantumCircuitStore();
   
   /**
    * ============================================================
    * DRAG STATE FOR REPOSITIONING EXISTING GATES
    * ============================================================
    * When dragging an existing gate (not from palette), we track:
    * - draggingGateId: The ID of the gate being moved
    * 
    * This is different from `draggedGate` in the store which is
    * for NEW gates being added from the palette.
    * ============================================================
    */
   const [draggingGateId, setDraggingGateId] = useState<string | null>(null);
   
   /**
    * ============================================================
    * KEYBOARD EVENT HANDLER
    * ============================================================
    * Handles keyboard shortcuts when canvas is focused:
    * - Delete/Backspace: Remove selected gate
    * - Escape: Deselect current gate
    * - Ctrl+Z: Undo
    * - Ctrl+Shift+Z or Ctrl+Y: Redo
    * 
    * NOTE: Container needs tabIndex for keyboard focus
    * ============================================================
    */
   const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
     // Delete selected gate with Delete or Backspace
     if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGateId) {
       e.preventDefault();
       removeGate(selectedGateId);
     }
     
     // Escape to deselect
     if (e.key === 'Escape') {
       selectGate(null);
     }
     
     // Undo: Ctrl+Z (or Cmd+Z on Mac)
     if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
       e.preventDefault();
       undo();
     }
     
     // Redo: Ctrl+Shift+Z or Ctrl+Y
     if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
       e.preventDefault();
       redo();
     }
   }, [selectedGateId, removeGate, selectGate, undo, redo]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

   /**
    * ============================================================
    * DROP HANDLER
    * ============================================================
    * Handles two types of drops:
    * 1. NEW gate from palette (draggedGate in store)
    * 2. MOVE existing gate (draggingGateId in local state)
    * 
    * Calculates target qubit and position from mouse coordinates.
    * Validates that the position isn't already occupied.
    * ============================================================
    */
   const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
     if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;

     // Calculate target qubit from Y position
    const qubitIndex = Math.round((y - CANVAS_PADDING) / QUBIT_SPACING);
    if (qubitIndex < 0 || qubitIndex >= qubitCount) return;

     // Calculate target position from X position
    const position = Math.max(0, Math.floor((x - CANVAS_PADDING - 40) / GATE_SPACING));
     
     // ============================================================
     // CASE 1: Moving an existing gate
     // ============================================================
     if (draggingGateId) {
       moveGate(draggingGateId, qubitIndex, position);
       setDraggingGateId(null);
       return;
     }
     
     // ============================================================
     // CASE 2: Adding a new gate from palette
     // ============================================================
     if (!draggedGate) return;

     // Check if position is already occupied
    const existingGate = gates.find(g => g.qubit === qubitIndex && g.position === position);
    if (existingGate) return;

    const newGate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: draggedGate as GateType,
      qubit: qubitIndex,
      position,
       // For rotation gates, set default angle
       ...((['Rx', 'Ry', 'Rz'].includes(draggedGate)) && { angle: Math.PI / 2 }),
    };

    addGate(newGate);
   }, [draggedGate, draggingGateId, qubitCount, gates, addGate, moveGate]);
   
   /**
    * ============================================================
    * CANVAS CLICK HANDLER
    * ============================================================
    * Clicking on the canvas background deselects the current gate.
    * We check if the click target is the canvas itself (not a gate).
    * ============================================================
    */
   const handleCanvasClick = useCallback((e: React.MouseEvent) => {
     // Only deselect if clicking directly on the canvas, not on a gate
     const target = e.target as SVGElement;
     if (target.tagName === 'svg' || target.tagName === 'line') {
       selectGate(null);
     }
   }, [selectGate]);
   
   /**
    * ============================================================
    * GATE DRAG START HANDLER
    * ============================================================
    * Initiates dragging of an existing gate for repositioning.
    * Sets local state to track which gate is being moved.
    * ============================================================
    */
   const handleGateDragStart = useCallback((gateId: string) => {
     setDraggingGateId(gateId);
     selectGate(gateId);
   }, [selectGate]);
   
   /**
    * ============================================================
    * GATE CLICK HANDLER
    * ============================================================
    * Selects a gate when clicked.
    * Stops propagation to prevent canvas click from deselecting.
    * ============================================================
    */
   const handleGateClick = useCallback((gateId: string, e: React.MouseEvent) => {
     e.stopPropagation();
     selectGate(gateId);
   }, [selectGate]);

  // Calculate canvas dimensions
  const maxPosition = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 2 : 8;
  const canvasWidth = Math.max(800, CANVAS_PADDING * 2 + 40 + maxPosition * GATE_SPACING);
  const canvasHeight = CANVAS_PADDING * 2 + (qubitCount - 1) * QUBIT_SPACING;

  return (
    <div 
       className="flex-1 overflow-auto bg-background quantum-grid relative outline-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
       onKeyDown={handleKeyDown}
       onClick={handleCanvasClick}
       tabIndex={0}
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
          const gateInfo = GATE_INFO[gate.type as GateType] ?? EXTENDED_GATE_INFO[gate.type as keyof typeof EXTENDED_GATE_INFO] ?? { color: 'hsl(200, 80%, 60%)', symbol: gate.type, name: gate.type };
          const x = CANVAS_PADDING + 40 + gate.position * GATE_SPACING;
          const y = CANVAS_PADDING + gate.qubit * QUBIT_SPACING;
           const isSelected = selectedGateId === gate.id;
           const isDragging = draggingGateId === gate.id;

          return (
             <GateContextMenu key={gate.id} gate={gate}>
             <motion.g
              initial={{ scale: 0, opacity: 0 }}
               animate={{ 
                 scale: isDragging ? 1.1 : 1, 
                 opacity: isDragging ? 0.7 : 1 
               }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ cursor: 'grab' }}
               onClick={(e) => handleGateClick(gate.id, e)}
                onMouseDown={(e) => {
                  // Start drag tracking on mouse down
                  if (e.button === 0) { // Left click only
                    handleGateDragStart(gate.id);
                  }
                }}
                onMouseUp={() => setDraggingGateId(null)}
            >
               {/* ============================================================
                   SELECTION HIGHLIGHT
                   ============================================================
                   Shows a pulsing border when the gate is selected.
                   Uses the gate's color with reduced opacity.
                   ============================================================ */}
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
              
               {/* ============================================================
                   GATE BOX
                   ============================================================
                   The main gate rectangle.
                   Stroke width increases when selected for visual feedback.
                   ============================================================ */}
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
               
               {/* ============================================================
                   ANGLE DISPLAY FOR ROTATION GATES
                   ============================================================
                   Shows the current angle below the gate symbol.
                   Only displayed for Rx, Ry, Rz gates.
                   ============================================================ */}
               {gate.angle !== undefined && (
                 <text
                   x={x}
                   y={y + 20}
                   fill={gateInfo.color}
                   fontSize="9"
                   fontFamily="monospace"
                   textAnchor="middle"
                   opacity="0.8"
                 >
                   {(gate.angle / Math.PI).toFixed(1)}π
                 </text>
               )}

               {/* ============================================================
                   QUICK DELETE BUTTON
                   ============================================================
                   Small X button that appears on hover.
                   Alternative to Delete key or context menu.
                   ============================================================ */}
              <g
                className="cursor-pointer opacity-0 hover:opacity-100"
                style={{ transition: 'opacity 0.2s' }}
                 onClick={(e) => {
                   e.stopPropagation();
                   removeGate(gate.id);
                 }}
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
             </GateContextMenu>
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
