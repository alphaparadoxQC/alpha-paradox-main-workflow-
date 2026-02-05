import { motion } from 'framer-motion';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { BarChart3, Circle, Loader2, Link2, Unlink, Activity, Target, Gauge, Table } from 'lucide-react';
import { InteractiveBlochSphere } from './InteractiveBlochSphere';
import { PhaseWheel, phaseToColor } from './PhaseWheel';
import { HardwareResults } from './HardwareResults';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIBMQuantum } from '@/hooks/useIBMQuantum';

export const SimulationResults = () => {
  const { simulationResult, isSimulating, qubitCount, gates } = useQuantumCircuitStore();
  const { currentJob } = useIBMQuantum();
  const circuitDepth = simulationResult?.circuitDepth ?? (gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0);

  return (
    <div className="w-96 bg-sidebar border-l border-sidebar-border flex flex-col h-full">
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
            {/* Metrics Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-2"
            >
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Depth</div>
                <div className="text-lg font-bold text-quantum-cyan">{circuitDepth}</div>
              </div>
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Fidelity</div>
                <div className="text-lg font-bold text-quantum-green">100%</div>
              </div>
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <div className="text-[10px] text-muted-foreground uppercase">States</div>
                <div className="text-lg font-bold text-quantum-purple">{simulationResult.probabilities.length}</div>
              </div>
            </motion.div>

            {/* Tabbed Results */}
            <Tabs defaultValue="amplitudes" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="amplitudes" className="text-xs">
                  <Activity className="w-3 h-3 mr-1" />
                  Amplitudes
                </TabsTrigger>
                <TabsTrigger value="bloch" className="text-xs">
                  <Circle className="w-3 h-3 mr-1" />
                  Bloch
                </TabsTrigger>
                <TabsTrigger value="states" className="text-xs">
                  <Table className="w-3 h-3 mr-1" />
                  States
                </TabsTrigger>
              </TabsList>
              
              {/* Amplitudes Tab */}
              <TabsContent value="amplitudes" className="mt-4 space-y-3">
                <div className="space-y-2">
                  {simulationResult.amplitudes?.slice(0, 8).map((item, index) => (
                    <motion.div
                      key={item.state}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-lg p-2 border border-border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <PhaseWheel phase={item.phase} size={20} />
                          <span className="font-mono text-sm text-foreground">{item.state}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: phaseToColor(item.phase) }}>
                          {(item.magnitude ** 2 * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.magnitude ** 2 * 100}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ background: phaseToColor(item.phase) }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground min-w-[80px] text-right">
                          {item.re >= 0 ? '+' : ''}{item.re.toFixed(3)}{item.im >= 0 ? '+' : ''}{item.im.toFixed(3)}i
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Phase Legend */}
                <div className="bg-card rounded-lg p-2 border border-border">
                  <div className="text-[10px] text-muted-foreground mb-1">Phase Color Legend</div>
                  <div 
                    className="h-3 rounded-full"
                    style={{
                      background: `linear-gradient(to right, 
                        hsl(0, 80%, 55%), 
                        hsl(90, 80%, 55%), 
                        hsl(180, 80%, 55%), 
                        hsl(270, 80%, 55%), 
                        hsl(360, 80%, 55%)
                      )`
                    }}
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>0°</span>
                    <span>90°</span>
                    <span>180°</span>
                    <span>270°</span>
                    <span>360°</span>
                  </div>
                </div>
              </TabsContent>
              
              {/* Bloch Spheres Tab */}
              <TabsContent value="bloch" className="mt-4">
                <div className="grid grid-cols-3 gap-3">
                  {simulationResult.blochVectors.slice(0, 6).map((vec, index) => (
                    <InteractiveBlochSphere 
                      key={index} 
                      qubitIndex={index} 
                      vector={vec} 
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Drag to rotate • Green = |0⟩ • Red = |1⟩
                </p>
              </TabsContent>
              
              {/* State Vector Table Tab */}
              <TabsContent value="states" className="mt-4">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-4 gap-px bg-border text-[10px] font-semibold text-muted-foreground">
                    <div className="bg-card p-2">State</div>
                    <div className="bg-card p-2">Amplitude</div>
                    <div className="bg-card p-2">Phase</div>
                    <div className="bg-card p-2">Prob</div>
                  </div>
                  {simulationResult.amplitudes?.slice(0, 10).map((item, index) => (
                    <div key={item.state} className="grid grid-cols-4 gap-px bg-border text-[10px]">
                      <div className="bg-card p-2 font-mono text-foreground">{item.state}</div>
                      <div className="bg-card p-2 font-mono text-muted-foreground">
                        {item.magnitude.toFixed(3)}
                      </div>
                      <div className="bg-card p-2 flex items-center gap-1">
                        <PhaseWheel phase={item.phase} size={14} />
                        <span className="text-muted-foreground">
                          {((item.phase * 180) / Math.PI).toFixed(0)}°
                        </span>
                      </div>
                      <div className="bg-card p-2 font-mono" style={{ color: phaseToColor(item.phase) }}>
                        {(item.magnitude ** 2 * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Measurement Outcomes */}
            {simulationResult.hasMeasurement && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-lg p-3 border border-quantum-orange/30"
              >
                <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-quantum-orange" />
                  Measurement Outcomes
                </h3>
                <div className="space-y-1">
                  {simulationResult.probabilities.slice(0, 4).map((item) => (
                    <div key={item.state} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-foreground">{item.state}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-quantum-orange rounded-full"
                            style={{ width: `${item.probability * 100}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-12 text-right">
                          {(item.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Expected measurement distribution
                </p>
              </motion.div>
            )}

            {/* Entanglement Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-lg p-3 border ${
                simulationResult.isEntangled 
                  ? 'bg-quantum-purple/10 border-quantum-purple/30' 
                  : 'bg-card border-border'
              }`}
            >
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                {simulationResult.isEntangled ? (
                  <Link2 className="w-4 h-4 text-quantum-purple" />
                ) : (
                  <Unlink className="w-4 h-4 text-muted-foreground" />
                )}
                ENTANGLEMENT
              </h3>
              {simulationResult.isEntangled ? (
                <div className="space-y-2">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-quantum-purple font-bold text-sm">
                      ⚛ Entangled State Detected
                    </span>
                  </motion.div>
                  <div className="flex flex-wrap gap-1">
                    {simulationResult.entangledPairs?.map(([q1, q2], idx) => (
                      <motion.span
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 * idx }}
                        className="px-2 py-0.5 rounded-full text-xs font-mono 
                                   bg-quantum-purple/20 text-quantum-purple border border-quantum-purple/30"
                      >
                        q{q1} ↔ q{q2}
                      </motion.span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Qubits are quantum correlated
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No entanglement detected. Qubits are separable.
                </p>
              )}
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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
                  <span className="text-muted-foreground">Circuit depth:</span>
                  <span className="font-mono text-foreground">{circuitDepth}</span>
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

            {/* Hardware Results (if job exists) */}
            {currentJob && (
              <HardwareResults job={currentJob} />
            )}
          </>
        )}
      </div>
    </div>
  );
};
