import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, FlaskConical, Atom, Pill, ExternalLink } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChemistryTab } from '@/components/chemistry/ChemistryTab';

// Legacy gate order for backwards compatibility
const BASIC_GATES: GateType[] = [
  'H', 'X', 'Y', 'Z', 'S', 'T', 'Rx', 'Ry', 'Rz', 'CNOT', 'SWAP', 'CZ', 'CCX', 'M'
];

export const GatesPalette = () => {
  const { setDraggedGate, draggedGate, addGate, gates, qubitCount, startSelectionVibe, selectionVibeStep } = useQuantumCircuitStore();
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

  const handleDragStart = (gateType: GateType | ExtendedGateType) => {
    setDraggedGate(gateType);
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
    // Multi-qubit gates use Selection Vibe workflow
    if (MULTI_QUBIT_GATES.has(gateType)) {
      startSelectionVibe(gateType);
      return;
    }
    
    // Single-qubit gates: add directly
    const maxPosition = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
    const extendedInfo = EXTENDED_GATE_INFO[gateType as ExtendedGateType];
    
    const newGate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: gateType as GateType,
      qubit: 0,
      position: maxPosition,
      // Rotation gates default angle (π/2)
      ...(['Rx', 'Ry', 'Rz', 'P', 'U1'].includes(gateType) 
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
        onDragStart={() => handleDragStart(gateType)}
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
    <div className="w-72 max-w-[40vw] bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="gates" className="flex flex-col h-full">
        <div className="p-3 border-b border-sidebar-border">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="gates" className="text-xs gap-1">
              <Atom className="w-3 h-3" />
              Gates
            </TabsTrigger>
            <TabsTrigger value="chemistry" className="text-xs gap-1">
              <FlaskConical className="w-3 h-3" />
              Chem
            </TabsTrigger>
            <TabsTrigger value="drugs" className="text-xs gap-1">
              <Pill className="w-3 h-3" />
              Drugs
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="gates" className="flex-1 flex flex-col m-0 overflow-hidden">
          <div className="px-4 py-2 border-b border-sidebar-border/50">
            <p className="text-xs text-muted-foreground">
              Click or drag gates to add
            </p>
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
        </TabsContent>
        
        <TabsContent value="chemistry" className="flex-1 m-0 overflow-hidden">
          <ChemistryTab />
        </TabsContent>
        
        <TabsContent value="drugs" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Pill className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Pharma & Drug Discovery</h3>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Open the dedicated workspace for structured docking, ADMET and Lipinski outputs.
              </p>
            </div>
            <Link
              to="/pharma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Open Pharma Workspace
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
