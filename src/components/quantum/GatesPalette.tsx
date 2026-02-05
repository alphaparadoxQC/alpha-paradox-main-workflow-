import { motion } from 'framer-motion';
import { GATE_INFO, GateType } from '@/types/quantum';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';

const gateOrder: GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'SWAP', 'CZ', 'CCX', 'M'];

export const GatesPalette = () => {
  const { setDraggedGate, draggedGate, addGate, gates, qubitCount } = useQuantumCircuitStore();

  const handleDragStart = (gateType: GateType) => {
    setDraggedGate(gateType);
  };

  const handleDragEnd = () => {
    setDraggedGate(null);
  };

  // Click to add gate to the next available position on qubit 0
  const handleClick = (gateType: GateType) => {
    // Find the next available position on the circuit
    const maxPosition = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
    
    const newGate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: gateType,
      qubit: 0, // Default to qubit 0 for control
      position: maxPosition,
      // Set targets for multi-qubit gates
      ...(gateType === 'CNOT' || gateType === 'SWAP' || gateType === 'CZ' 
        ? { targetQubit: 1 } 
        : {}),
      // For Toffoli, set both controls and target
      ...(gateType === 'CCX' 
        ? { controlQubit2: 1, targetQubit: 2 } 
        : {}),
    };
    
    addGate(newGate);
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="text-primary">⚛</span> Quantum Gates
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Click or drag gates to add
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {gateOrder.map((gateType, index) => {
            const gate = GATE_INFO[gateType];
            const isBeingDragged = draggedGate === gateType;
            
            return (
              <motion.div
                key={gateType}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                draggable
                onDragStart={() => handleDragStart(gateType)}
                onDragEnd={handleDragEnd}
                onClick={() => handleClick(gateType)}
                className={`
                  relative p-3 rounded-lg cursor-grab active:cursor-grabbing
                  bg-card border border-border hover:border-primary/50
                  transition-all duration-200 group
                  ${isBeingDragged ? 'opacity-50 scale-95' : ''}
                `}
                style={{
                  boxShadow: isBeingDragged 
                    ? `0 0 20px ${gate.color}40` 
                    : undefined
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: `0 0 15px ${gate.color}30`
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold"
                    style={{ 
                      backgroundColor: `${gate.color}20`,
                      color: gate.color,
                      border: `1px solid ${gate.color}50`
                    }}
                  >
                    {gate.symbol}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm">
                      {gate.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {gate.description}
                    </div>
                  </div>
                </div>
                
                {/* Glow effect on hover */}
                <div 
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 20px ${gate.color}10`
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30">
        <div className="text-xs text-muted-foreground text-center">
          <span className="text-primary">Tip:</span> Drag gates onto qubit lines
        </div>
      </div>
    </div>
  );
};
