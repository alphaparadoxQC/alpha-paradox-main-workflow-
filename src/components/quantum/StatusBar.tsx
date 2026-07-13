import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { Layers, Hash, Activity, Plus, Minus, Clock, Cpu, MousePointer2, Target, Binary } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QUBIT_LIMITS } from '@/store/quantumCircuitStore';
import { GATE_INFO } from '@/types/quantum';
import { EXTENDED_GATE_INFO } from '@/types/quantum-extended';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const StatusBar = () => {
  const { 
    qubitCount, 
    classicalBitCount,
    getGateCount, 
    getCircuitDepth, 
    isSimulating,
    simulationMethod,
    executionTimeMs,
    incrementQubits,
    decrementQubits,
    incrementClassicalBits,
    decrementClassicalBits,
    setSimulationMethod,
    gpuAccelerated,
  } = useQuantumCircuitStore();
  
  const gateCount = getGateCount();
  const depth = getCircuitDepth();
  
  const maxQubits = simulationMethod === 'stateVector' 
    ? QUBIT_LIMITS.STATE_VECTOR_MAX 
    : QUBIT_LIMITS.MPS_MAX;   // Both 'mps' and 'auto' allow up to 100

  const stats = [
    { 
      icon: Layers, 
      label: 'Qubits', 
      value: qubitCount,
      color: 'text-quantum-cyan'
    },
    { 
      icon: Hash, 
      label: 'Gates', 
      value: gateCount,
      color: 'text-quantum-purple'
    },
    { 
      icon: Activity, 
      label: 'Depth', 
      value: depth,
      color: 'text-quantum-green'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-12 bg-card border-t border-border flex items-center justify-between px-4"
    >
      {/* Stats */}
      <div className="flex items-center gap-6">
        {/* Qubit controls */}
        <div className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-quantum-cyan" />
          <span className="text-xs text-muted-foreground">Qubits:</span>
          <div className="flex items-center gap-0.5 ml-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={decrementQubits}
                    disabled={qubitCount <= QUBIT_LIMITS.MIN}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove qubit</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <motion.span 
              key={qubitCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-sm font-mono font-bold text-quantum-cyan min-w-[1.5rem] text-center"
            >
              {qubitCount}
            </motion.span>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={incrementQubits}
                    disabled={qubitCount >= maxQubits}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add qubit (max {maxQubits})</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Classical Bit controls */}
        <div className="flex items-center gap-1">
          <Binary className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">C-Bits:</span>
          <div className="flex items-center gap-0.5 ml-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={decrementClassicalBits}
                    disabled={classicalBitCount <= 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove classical bit</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <motion.span 
              key={`cbit-${classicalBitCount}`}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-sm font-mono font-bold text-muted-foreground min-w-[1.5rem] text-center"
            >
              {classicalBitCount}
            </motion.span>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={incrementClassicalBits}
                    disabled={classicalBitCount >= 32}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add classical bit (max 32)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="w-px h-5 bg-border" />
        
        {stats.slice(1).map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}:</span>
            <motion.span 
              key={stat.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-xs font-mono font-bold ${stat.color}`}
            >
              {stat.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Center info - Simulation status */}
      <div className="flex items-center gap-4">
        {executionTimeMs !== null && !isSimulating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {executionTimeMs < 1 ? '<1' : Math.round(executionTimeMs)}ms
            </span>
          </motion.div>
        )}
        
        {isSimulating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ 
                boxShadow: ['0 0 5px hsl(var(--quantum-cyan))', '0 0 15px hsl(var(--quantum-cyan))', '0 0 5px hsl(var(--quantum-cyan))']
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-quantum-cyan"
            />
            <span className="text-xs text-quantum-cyan">Running simulation...</span>
          </motion.div>
        )}
      </div>

      {/* Right side info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {/* Simulation method indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSimulationMethod(
                  simulationMethod === 'stateVector' ? 'mps' : 
                  simulationMethod === 'mps' ? 'auto' : 'stateVector'
                )}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Cpu className="w-3 h-3" />
                <span className="font-mono uppercase text-[10px]">
                  {simulationMethod === 'auto' 
                    ? (qubitCount > 10 ? 'MPS' : 'SV') 
                    : simulationMethod === 'mps' ? 'MPS' : 'SV'}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">Simulation Method: {
                simulationMethod === 'auto' ? 'Auto' : 
                simulationMethod === 'mps' ? 'Tensor Network (MPS)' : 'State Vector'
              }</p>
              <p className="text-xs text-muted-foreground mt-1">
                {simulationMethod === 'mps' 
                  ? 'Efficient for 10+ qubits, approximate' 
                  : simulationMethod === 'stateVector'
                  ? 'Exact simulation, up to ~15 qubits'
                  : 'Auto-selects based on qubit count'}
              </p>
              <p className="text-xs text-muted-foreground">Click to cycle</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="w-px h-4 bg-border" />
        
        <span>
          {qubitCount <= 53 
            ? `2^${qubitCount} = ${Math.pow(2, qubitCount).toLocaleString()} states`
            : `2^${qubitCount} states (MPS sampling)`}
        </span>
        <div className="w-px h-4 bg-border" />
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
          gpuAccelerated 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {gpuAccelerated ? '⚡ GPU' : '🔧 CPU'}
        </span>
        <div className="w-px h-4 bg-border" />
        <span className="font-mono">v2.0.0</span>
      </div>
    </motion.div>
  );
};
