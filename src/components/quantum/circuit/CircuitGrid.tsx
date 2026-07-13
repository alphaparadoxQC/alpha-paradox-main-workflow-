import React, { useCallback, useRef, DragEvent, KeyboardEvent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { GateType } from '@/types/quantum';
import { ROW_HEIGHT, COL_WIDTH, CANVAS_PADDING } from './constants';
import { QubitRow } from './QubitRow';
import { GateLayer } from './GateLayer';
import { ClassicalRegister } from './ClassicalRegister';

export const CircuitGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    gates,
    qubitCount,
    classicalBitCount,
    addGate,
    removeGate,
    draggedGate,
    selectedGateId,
    selectGate,
    moveGate,
    undo,
    redo,
    alignmentMode,
  } = useQuantumCircuitStore();

  const [draggingGateId, setDraggingGateId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);

  // Virtualization calculations — aggressive buffer reduction for 1000 qubits
  const visibleStart = Math.max(0, Math.floor((scrollTop - CANVAS_PADDING) / ROW_HEIGHT) - 1);
  const visibleEnd = Math.min(
    qubitCount - 1,
    Math.ceil((scrollTop + viewportHeight - CANVAS_PADDING) / ROW_HEIGHT) + 1
  );

  useEffect(() => {
    if (scrollRef.current) {
      setViewportHeight(scrollRef.current.clientHeight);
    }
    const handleResize = () => {
      if (scrollRef.current) setViewportHeight(scrollRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGateId) {
      e.preventDefault();
      removeGate(selectedGateId);
    }
    if (e.key === 'Escape') {
      selectGate(null);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  }, [selectedGateId, removeGate, selectGate, undo, redo]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    // DOM-based drop zone detection
    const target = e.target as Element;
    const rowElement = target.closest('.qubit-row') as HTMLElement;
    
    // Fallback: if they dropped on a gate or between rows but still in the grid
    let qubitIndex = -1;
    if (rowElement && rowElement.dataset.qubit) {
      qubitIndex = parseInt(rowElement.dataset.qubit);
    } else {
      // Allow dropping slightly outside if we can infer it, but user requested strict DOM targeting.
      // If we don't find a row element, we can fallback to coordinate if necessary, or just abort.
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      qubitIndex = Math.floor((y - CANVAS_PADDING) / ROW_HEIGHT);
    }
    
    if (qubitIndex < 0 || qubitIndex >= qubitCount) return;

    const isMulti = ['CNOT', 'CY', 'CZ', 'CH', 'SWAP', 'iSWAP', 'SQSWAP', 'DCX', 'ECR', 'CP', 'CRx', 'CRy', 'CRz', 'CCX', 'CCZ', 'CSWAP', 'C3X', 'C4X', 'MCX', 'MCZ', 'MCRY', 'RXX', 'RYY', 'RZZ'].includes(draggedGate || draggingGateId?.split('-')[0] || '');
    let targetQubit = undefined;
    if (isMulti) {
      targetQubit = qubitIndex + 1 < qubitCount ? qubitIndex + 1 : qubitIndex - 1;
      if (targetQubit < 0) targetQubit = 1;
    }
    
    // Calculate effective occupied wires for this operation
    const occupiedWires = [qubitIndex];
    if (targetQubit !== undefined) {
      // If it's a gate like CNOT, it occupies control, target, and all wires in between
      const minWire = Math.min(qubitIndex, targetQubit);
      const maxWire = Math.max(qubitIndex, targetQubit);
      for (let w = minWire; w <= maxWire; w++) {
        if (!occupiedWires.includes(w)) occupiedWires.push(w);
      }
    }

    // Grid snapping for X coordinate based on alignmentMode
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let position = Math.max(0, Math.round((x - CANVAS_PADDING - 40) / COL_WIDTH));

    if (alignmentMode === 'left') {
      // Find the maximum position currently occupied on the involved wires
      let maxPos = -1;
      gates.forEach(g => {
        if (g.id === draggingGateId) return; // ignore self
        const gMin = Math.min(g.qubit, g.targetQubit ?? g.qubit);
        const gMax = Math.max(g.qubit, g.targetQubit ?? g.qubit);
        
        // check overlap of wires
        const overlaps = occupiedWires.some(w => w >= gMin && w <= gMax);
        if (overlaps) {
          maxPos = Math.max(maxPos, g.position);
        }
      });
      position = maxPos + 1;
    } else if (alignmentMode === 'layer') {
      // Find the first global position where none of the involved wires are occupied
      let testPos = 0;
      while (true) {
        const isOccupied = gates.some(g => {
          if (g.id === draggingGateId) return false;
          if (g.position !== testPos) return false;
          const gMin = Math.min(g.qubit, g.targetQubit ?? g.qubit);
          const gMax = Math.max(g.qubit, g.targetQubit ?? g.qubit);
          return occupiedWires.some(w => w >= gMin && w <= gMax);
        });
        if (!isOccupied) {
          position = testPos;
          break;
        }
        testPos++;
      }
    }

    if (draggingGateId) {
      moveGate(draggingGateId, qubitIndex, position);
      setDraggingGateId(null);
      return;
    }

    if (!draggedGate) return;

    const existingGate = gates.find(g => g.qubit === qubitIndex && g.position === position);
    if (existingGate) return;

    const newGate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: draggedGate as GateType,
      qubit: qubitIndex,
      position,
      ...(isMulti ? { controlQubit: qubitIndex, targetQubit } : {}),
      ...((['Rx', 'Ry', 'Rz'].includes(draggedGate)) && { angle: Math.PI / 2 }),
    };

    addGate(newGate);
  }, [draggedGate, draggingGateId, qubitCount, gates, addGate, moveGate]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    if (target.closest('.qubit-row') && !target.closest('g')) {
       // Only deselect if clicking on empty space in row
       selectGate(null);
    } else if (target.tagName === 'svg' || target.tagName === 'div') {
       selectGate(null);
    }
  }, [selectGate]);

  const maxPosition = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 2 : 8;
  const canvasWidth = Math.max(800, CANVAS_PADDING * 2 + 100 + maxPosition * COL_WIDTH);
  const quantumHeight = CANVAS_PADDING * 2 + qubitCount * ROW_HEIGHT;
  const classicalHeight = classicalBitCount > 0 ? classicalBitCount * 30 + 20 : 0;
  const canvasHeight = quantumHeight + classicalHeight;

  // Generate virtualized rows
  const visibleQubits = [];
  for (let i = visibleStart; i <= visibleEnd; i++) {
    visibleQubits.push(i);
  }

  return (
    <div 
      className="h-full w-full overflow-auto bg-background quantum-grid relative outline-none select-none"
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      onClick={handleCanvasClick}
      tabIndex={0}
      ref={scrollRef}
    >
      <div 
        ref={containerRef}
        className="relative min-w-full"
        style={{ width: canvasWidth, height: canvasHeight }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Render visible quantum rows */}
        {visibleQubits.map(i => (
          <QubitRow key={`qubit-${i}`} index={i} width={canvasWidth} />
        ))}

        {/* Render Gate Layer as an overlay */}
        <GateLayer 
          width={canvasWidth}
          height={quantumHeight}
          draggingGateId={draggingGateId}
          setDraggingGateId={setDraggingGateId}
          handleGateClick={(id, e) => {
            e.stopPropagation();
            selectGate(id);
          }}
          handleGateDragStart={(id) => {
            setDraggingGateId(id);
            selectGate(id);
          }}
          visibleStart={visibleStart}
          visibleEnd={visibleEnd}
        />

        {/* Separate container for Classical Register, positioned below quantum layer */}
        <div 
          className="absolute left-0 right-0" 
          style={{ top: quantumHeight }}
        >
           <ClassicalRegister classicalBitCount={classicalBitCount} width={canvasWidth} />
        </div>

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
    </div>
  );
};
