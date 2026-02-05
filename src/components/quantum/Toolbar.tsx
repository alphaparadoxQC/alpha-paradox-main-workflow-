import { motion } from 'framer-motion';
import { Play, Trash2, Cpu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';

export const Toolbar = () => {
  const { simulate, clearCircuit, isSimulating, gates } = useQuantumCircuitStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-14 bg-card border-b border-border flex items-center justify-between px-4"
    >
      {/* Left side - Logo/Title */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center"
        >
          <Cpu className="w-4 h-4 text-background" />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Quantum Workload
          </h1>
          <p className="text-[10px] text-muted-foreground -mt-0.5">
            Circuit Builder
          </p>
        </div>
      </div>

      {/* Center - Actions */}
      <div className="flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={simulate}
            disabled={isSimulating || gates.length === 0}
            className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
          >
            {isSimulating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                </motion.div>
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Simulate
              </>
            )}
            
            {/* Animated background */}
            {isSimulating && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            )}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={clearCircuit}
            disabled={gates.length === 0}
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>
      </div>

      {/* Right side - Status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-quantum-orange animate-pulse' : 'bg-quantum-green'}`} />
        <span className="text-xs text-muted-foreground">
          {isSimulating ? 'Processing' : 'Ready'}
        </span>
      </div>
    </motion.div>
  );
};
