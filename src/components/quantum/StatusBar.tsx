import { motion } from 'framer-motion';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { Layers, Hash, Activity } from 'lucide-react';

export const StatusBar = () => {
  const { qubitCount, getGateCount, getCircuitDepth, isSimulating } = useQuantumCircuitStore();
  
  const gateCount = getGateCount();
  const depth = getCircuitDepth();

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
      className="h-10 bg-card border-t border-border flex items-center justify-between px-4"
    >
      {/* Stats */}
      <div className="flex items-center gap-6">
        {stats.map((stat, index) => (
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

      {/* Center info */}
      <div className="flex items-center gap-2">
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
        <span>2^{qubitCount} = {Math.pow(2, qubitCount)} states</span>
        <div className="w-px h-4 bg-border" />
        <span className="font-mono">v1.0.0</span>
      </div>
    </motion.div>
  );
};
