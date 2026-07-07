import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Atom, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  ExtendedGateType, 
  EXTENDED_GATE_INFO, 
  GATE_CATEGORIES, 
  getGatesByCategory,
  GateCategory 
} from '@/types/quantum-extended';
import { GATE_INFO, GateType } from '@/types/quantum';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';


// Legacy gate order for backwards compatibility
const BASIC_GATES: GateType[] = [
  'H', 'X', 'Y', 'Z', 'S', 'T', 'Rx', 'Ry', 'Rz', 'CNOT', 'SWAP', 'CZ', 'CCX', 'M'
];

export const GatesPalette = () => {
  const { setDraggedGate, draggedGate, addGate, gates, qubitCount } = useQuantumCircuitStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<GateCategory>>(
    new Set(['standard', 'twoQubit'])
  );

  const toggleCategory = (category: GateCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragStart = (gateType: GateType | ExtendedGateType, e: React.DragEvent) => {
    setDraggedGate(gateType);
    
    // Create custom drag image (IBM style for CNOT/multi-qubit)
    const isMultiQubit = MULTI_QUBIT_GATES.has(gateType as string);
    const dragIcon = document.createElement('div');
    dragIcon.style.position = 'absolute';
    dragIcon.style.top = '-1000px';
    
    if (isMultiQubit) {
      const gate = GATE_INFO[gateType as GateType] || EXTENDED_GATE_INFO[gateType as ExtendedGateType] || { color: '#000' };
      dragIcon.innerHTML = `
        <svg width="40" height="80" viewBox="0 0 40 80">
          <line x1="20" y1="20" x2="20" y2="60" stroke="${gate.color}" stroke-width="2" />
          <circle cx="20" cy="20" r="6" fill="${gate.color}" />
          <circle cx="20" cy="60" r="14" fill="none" stroke="${gate.color}" stroke-width="2" />
          <line x1="10" y1="60" x2="30" y2="60" stroke="${gate.color}" stroke-width="2" />
          <line x1="20" y1="50" x2="20" y2="70" stroke="${gate.color}" stroke-width="2" />
        </svg>
      `;
    } else {
      const gate = GATE_INFO[gateType as GateType] || EXTENDED_GATE_INFO[gateType as ExtendedGateType];
      dragIcon.innerHTML = `
        <svg width="40" height="40">
          <rect x="2" y="2" width="36" height="36" rx="6" fill="hsl(var(--card))" stroke="${gate?.color}" stroke-width="2" />
          <text x="20" y="26" fill="${gate?.color}" font-size="18" font-family="monospace" font-weight="bold" text-anchor="middle">${gate?.symbol}</text>
        </svg>
      `;
    }
    document.body.appendChild(dragIcon);
    e.dataTransfer.setDragImage(dragIcon, 20, 20);
    
    // Cleanup after drag ends (or just leave it to garbage collection if small, but better to remove)
    setTimeout(() => {
      if (document.body.contains(dragIcon)) {
        document.body.removeChild(dragIcon);
      }
    }, 100);
  };

  const handleDragEnd = () => {
    setDraggedGate(null);
  };

  // Multi-qubit gate types that use the Selection Vibe workflow
  const MULTI_QUBIT_GATES = new Set([
    'CNOT', 'CY', 'CZ', 'CH', 'SWAP', 'iSWAP', 'SQSWAP', 'DCX', 'ECR',
    'CP', 'CRx', 'CRy', 'CRz', 'CCX', 'CCZ', 'CSWAP', 'C3X', 'C4X',
    'MCX', 'MCZ', 'MCRY', 'RXX', 'RYY', 'RZZ'
  ]);

  const handleClick = (gateType: GateType | ExtendedGateType) => {
    const maxPosition = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
    const extendedInfo = EXTENDED_GATE_INFO[gateType as ExtendedGateType];
    const isMulti = MULTI_QUBIT_GATES.has(gateType as string);
    
    const targetQubit = isMulti ? Math.min(1, qubitCount - 1) : undefined;
    
    const newGate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: gateType as GateType,
      qubit: 0,
      position: maxPosition,
      ...(isMulti ? { controlQubit: 0, targetQubit: targetQubit } : {}),
      // Rotation gates default angle (π/2)
      ...(['Rx', 'Ry', 'Rz', 'P', 'U1', 'CP', 'CRx', 'CRy', 'CRz'].includes(gateType) 
        ? { angle: extendedInfo?.defaultParams?.angle ?? Math.PI / 2 } 
        : {}),
    };
    
    addGate(newGate);
  };

  const renderGateButton = (gateType: GateType | ExtendedGateType, index: number) => {
    const gate = GATE_INFO[gateType as GateType] || EXTENDED_GATE_INFO[gateType as ExtendedGateType];
    if (!gate) return null;
    const isBeingDragged = draggedGate === gateType;
    
    return (
      <motion.div
        key={gateType}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        draggable
        onDragStart={(e) => handleDragStart(gateType, e as any)}
        onDragEnd={handleDragEnd}
        onClick={() => handleClick(gateType)}
        className={`
          relative p-2 rounded-lg cursor-grab active:cursor-grabbing
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
          boxShadow: `0 0 10px ${gate.color}30`
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0"
            style={{ 
              backgroundColor: `${gate.color}20`,
              color: gate.color,
              border: `1px solid ${gate.color}50`
            }}
          >
            {gate.symbol}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground text-xs truncate">
              {gate.name}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {gate.description}
            </div>
          </div>
        </div>
        
        {/* Glow effect on hover */}
        <div 
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            boxShadow: `inset 0 0 15px ${gate.color}10`
          }}
        />
      </motion.div>
    );
  };

  return (
        <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 48 : 288 }}
      className="bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden relative shrink-0 select-none"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>

      <div className={`flex flex-col h-full w-72 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex-1 flex flex-col m-0 overflow-hidden h-full">
          <div className="px-4 py-3 border-b border-sidebar-border bg-sidebar-accent/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Atom className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Gates Palette</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Click or drag gates</span>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {GATE_CATEGORIES.map((category) => {
                const categoryGates = getGatesByCategory(category.id);
                const availableGates = categoryGates.filter(g => 
                  GATE_INFO[g as GateType] || EXTENDED_GATE_INFO[g as ExtendedGateType]
                );
                
                if (availableGates.length === 0) return null;
                
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <Collapsible
                    key={category.id}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({availableGates.length})
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-1.5 pt-1 pb-2">
                        {availableGates.map((gateType, index) => 
                          renderGateButton(gateType, index)
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/30">
            <div className="text-xs text-muted-foreground text-center">
              <span className="text-primary">Tip:</span> Drag gates onto qubit lines
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
