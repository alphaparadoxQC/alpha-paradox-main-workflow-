import { motion } from 'framer-motion';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { BarChart3, Circle, Loader2 } from 'lucide-react';

export const SimulationResults = () => {
  const { simulationResult, isSimulating, qubitCount, gates } = useQuantumCircuitStore();

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-secondary" />
          Results
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Simulation output
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Loading state */}
        {isSimulating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="text-muted-foreground mt-4">Running quantum simulation...</p>
            <div className="mt-4 w-full">
              <motion.div
                className="h-1 bg-primary/30 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!simulationResult && !isSimulating && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 opacity-30">📊</div>
            <p className="text-muted-foreground text-sm">
              {gates.length === 0 
                ? "Add gates to your circuit and run simulation"
                : "Click 'Simulate' to see results"
              }
            </p>
          </div>
        )}

        {/* Results */}
        {simulationResult && !isSimulating && (
          <>
            {/* Probability Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-quantum-cyan" />
                State Probabilities
              </h3>
              <div className="space-y-2">
                {simulationResult.probabilities.slice(0, 8).map((item, index) => (
                  <motion.div
                    key={item.state}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono text-foreground">{item.state}</span>
                      <span className="text-muted-foreground">
                        {(item.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.probability * 100}%` }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(to right, hsl(185, 100%, 50%), hsl(265, 100%, 65%))`
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Bloch Spheres */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Circle className="w-4 h-4 text-quantum-purple" />
                Bloch Spheres
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {simulationResult.blochVectors.slice(0, 5).map((vec, index) => (
                  <BlochSphere key={index} qubit={index} vector={vec} />
                ))}
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-lg p-3 border border-border"
            >
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                SUMMARY
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total states:</span>
                  <span className="font-mono text-foreground">{Math.pow(2, qubitCount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max probability:</span>
                  <span className="font-mono text-quantum-cyan">
                    {(simulationResult.probabilities[0]?.probability * 100 || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Likely outcome:</span>
                  <span className="font-mono text-quantum-purple">
                    {simulationResult.probabilities[0]?.state || '-'}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

// Bloch Sphere Component
const BlochSphere = ({ qubit, vector }: { qubit: number; vector: { x: number; y: number; z: number } }) => {
  const size = 60;
  const center = size / 2;
  const radius = size / 2 - 8;
  
  // Project 3D to 2D (simple orthographic)
  const projectedX = center + vector.x * radius * 0.7;
  const projectedY = center - vector.z * radius * 0.7;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="relative"
    >
      <svg width={size} height={size} className="mx-auto">
        {/* Sphere outline */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
        
        {/* Equator */}
        <ellipse
          cx={center}
          cy={center}
          rx={radius}
          ry={radius * 0.3}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
        
        {/* Axes */}
        <line
          x1={center}
          y1={center - radius}
          x2={center}
          y2={center + radius}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
        
        {/* State vector */}
        <line
          x1={center}
          y1={center}
          x2={projectedX}
          y2={projectedY}
          stroke="hsl(265, 100%, 65%)"
          strokeWidth="2"
        />
        
        {/* State point */}
        <motion.circle
          cx={projectedX}
          cy={projectedY}
          r="4"
          fill="hsl(265, 100%, 65%)"
          initial={{ r: 0 }}
          animate={{ r: 4 }}
          transition={{ delay: 0.5 }}
        />
        
        {/* Glow */}
        <circle
          cx={projectedX}
          cy={projectedY}
          r="6"
          fill="hsl(265, 100%, 65%)"
          fillOpacity="0.3"
        />
      </svg>
      <div className="text-center text-[10px] text-muted-foreground font-mono mt-1">
        q{qubit}
      </div>
    </motion.div>
  );
};
