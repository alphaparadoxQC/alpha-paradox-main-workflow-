import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { BarChart3, Circle, Loader2, Link2, Unlink, Activity, Target, Gauge, Table, Maximize2, Grid3X3, Network, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InteractiveBlochSphere } from './InteractiveBlochSphere';
import { BlochSphereGrid } from './BlochSphereGrid';
import { PhaseWheel, phaseToColor } from './PhaseWheel';
import { HardwareResults } from './HardwareResults';
import { DensityMatrixHeatmap } from './DensityMatrixHeatmap';
import { QubitMapping } from './QubitMapping';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useIBMQuantum } from '@/hooks/useIBMQuantum';
import { CircuitMetricsPanel } from './CircuitMetricsPanel';

export const SimulationResults = () => {
  const { simulationResult, isSimulating, qubitCount, gates, simulate } = useQuantumCircuitStore();
  const { currentJob } = useIBMQuantum();
  const [isProbabilityView, setIsProbabilityView] = useState(false);
  const [activeTab, setActiveTab] = useState('statevector');
  const [blochPage, setBlochPage] = useState(0);
  const [topN, setTopN] = useState(100);
  const circuitDepth = simulationResult?.circuitDepth ?? (gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0);

  // Derived data: fallback to sampling probabilities when amplitudes are empty (large circuits)
  const displayLimit = qubitCount > 13 ? topN : undefined;
  
  const displayedAmplitudes = useMemo(() => {
    if (!simulationResult?.amplitudes) return undefined;
    return displayLimit ? simulationResult.amplitudes.slice(0, displayLimit) : simulationResult.amplitudes;
  }, [simulationResult?.amplitudes, displayLimit]);

  const displayedProbabilities = useMemo(() => {
    if (!simulationResult?.probabilities) return undefined;
    return displayLimit ? simulationResult.probabilities.slice(0, displayLimit) : simulationResult.probabilities;
  }, [simulationResult?.probabilities, displayLimit]);

  const chartData = useMemo(() => {
    if (displayedAmplitudes && displayedAmplitudes.length > 0) {
      return displayedAmplitudes.map(a => ({
        state: a.state.replace(/[|⟩]/g, ''),
        probability: a.magnitude ** 2 * 100,
        re: a.re,
        im: a.im,
        phase: a.phase ?? 0,
        rawState: a.state,
        hasAmplitude: true,
      }));
    }
    if (displayedProbabilities && displayedProbabilities.length > 0) {
      return displayedProbabilities.map(p => ({
        state: p.state.replace(/[|⟩]/g, ''),
        probability: p.probability * 100,
        re: Math.sqrt(p.probability),
        im: 0,
        phase: 0,
        rawState: p.state,
        hasAmplitude: false,
      }));
    }
    return [];
  }, [displayedAmplitudes, displayedProbabilities]);

  const isSamplingMode = (simulationResult?.stateVector?.qubitCount || 0) > 15;
  const BLOCH_PAGE_SIZE = 8;
  const totalBlochPages = Math.ceil((simulationResult?.blochVectors?.length || 0) / BLOCH_PAGE_SIZE);
  const visibleBloch = simulationResult?.blochVectors?.slice(
    blochPage * BLOCH_PAGE_SIZE,
    (blochPage + 1) * BLOCH_PAGE_SIZE
  ) || [];
  
  // Auto-simulate whenever gates change
  useEffect(() => {
    if (gates.length > 0 && qubitCount <= 15) {
      const timer = setTimeout(() => simulate(), 400);
      return () => clearTimeout(timer);
    }
  }, [gates, qubitCount, simulate]);

  return (
    <div className="w-96 bg-sidebar border-l border-sidebar-border flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-secondary" />
            Results
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Simulation output
          </p>
        </div>
        
        {/* Fullscreen Expand Button */}
        {simulationResult && !isSimulating && (
          <Dialog>
            <DialogTrigger asChild>
              <button 
                className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                title="Expand Results"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] h-[800px] flex flex-col p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                  Expanded Simulation Results
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto mt-4 space-y-6">
                
                {/* Metrics Bar in Expanded View */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-card rounded-lg p-4 border border-border text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Depth</div>
                    <div className="text-3xl font-bold text-quantum-cyan">{circuitDepth}</div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">States</div>
                    <div className="text-3xl font-bold text-quantum-purple">{simulationResult.probabilities.length}</div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Max Probability</div>
                    <div className="text-3xl font-bold text-quantum-green">
                      {(simulationResult.probabilities[0]?.probability * 100 || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Most Likely</div>
                    <div className="text-3xl font-bold text-foreground">
                      {simulationResult.probabilities[0]?.state || '-'}
                    </div>
                  </div>
                </div>

                {/* Dynamic Expanded View based on activeTab */}
                {activeTab === 'statevector' && (
                  <div className="bg-card rounded-lg p-6 border border-border h-full flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground uppercase tracking-wide">
                          State Distribution
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Showing all non-zero computational basis states.
                        </p>
                      </div>
                      
                      {/* Toggle */}
                      <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border border-border">
                        <span className={`text-sm font-medium ${!isProbabilityView ? 'text-foreground' : 'text-muted-foreground'}`}>Statevector</span>
                        <Switch 
                          checked={isProbabilityView}
                          onCheckedChange={setIsProbabilityView}
                        />
                        <span className={`text-sm font-medium ${isProbabilityView ? 'text-foreground' : 'text-muted-foreground'}`}>Probability</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 mt-4 w-full min-h-[400px] overflow-x-auto pb-4">
                      <div style={{ minWidth: `max(100%, ${chartData.length * 24}px)`, height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={chartData}
                          margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                          barSize={16}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis 
                            dataKey="state" 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={10}
                            tickMargin={10}
                            angle={-45}
                            textAnchor="end"
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={10}
                            tickFormatter={(val) => isProbabilityView ? `${val}%` : val.toFixed(1)}
                            domain={isProbabilityView ? [0, 100] : [-1, 1]}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-popover text-popover-foreground text-xs p-3 rounded shadow-lg border border-border">
                                    <div className="font-mono font-bold mb-2">{data.rawState}</div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                      <span className="text-muted-foreground">Probability:</span>
                                      <span className="font-mono text-right">{data.probability.toFixed(2)}%</span>
                                      {!isProbabilityView && (
                                        <>
                                          <span className="text-muted-foreground">Real (Re):</span>
                                          <span className="font-mono text-right text-blue-500">{data.re.toFixed(3)}</span>
                                          <span className="text-muted-foreground">Imag (Im):</span>
                                          <span className="font-mono text-right text-red-500">{data.im.toFixed(3)}</span>
                                        </>
                                      )}
                                    </div>
                                    {isProbabilityView && (
                                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                                        <PhaseWheel phase={data.phase} size={12} />
                                        <span className="text-muted-foreground">Phase: {((data.phase * 180) / Math.PI).toFixed(0)}°</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={0} stroke="hsl(var(--border))" />
                          {isProbabilityView ? (
                            <Bar 
                              dataKey="probability" 
                              radius={[2, 2, 0, 0]}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="hsl(265, 100%, 65%)" />
                              ))}
                            </Bar>
                          ) : (
                            <>
                              <Bar dataKey="re" fill="#3b82f6" name="Real" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="im" fill="#ef4444" name="Imaginary" radius={[2, 2, 0, 0]} />
                            </>
                          )}
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                )}

                {activeTab === 'amplitudes' && (
                  <div className="bg-card rounded-lg p-6 border border-border h-full overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground uppercase tracking-wide mb-4">
                      All Amplitudes
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {chartData.map((item, index) => (
                        <div key={item.state} className="bg-muted/30 rounded-lg p-4 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <PhaseWheel phase={item.phase} size={24} />
                              <span className="font-mono text-lg text-foreground">{item.state}</span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: phaseToColor(item.phase) }}>
                              {item.probability.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ background: phaseToColor(item.phase), width: `${item.probability}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {item.re >= 0 ? '+' : ''}{item.re.toFixed(3)}{item.im >= 0 ? '+' : ''}{item.im.toFixed(3)}i
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'bloch' && (
                  <div className="bg-card rounded-lg p-6 border border-border h-full overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground uppercase tracking-wide mb-4">
                      All Bloch Spheres
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {simulationResult.blochVectors.map((vec, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <InteractiveBlochSphere qubitIndex={index} vector={vec} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'states' && (
                  <div className="bg-card rounded-lg p-6 border border-border h-full overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground uppercase tracking-wide mb-4">
                      State Vector Table
                    </h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 gap-px bg-border text-sm font-semibold text-muted-foreground">
                        <div className="bg-card p-3">State</div>
                        <div className="bg-card p-3">Amplitude</div>
                        <div className="bg-card p-3">Phase</div>
                        <div className="bg-card p-3">Probability</div>
                      </div>
                      <div className="max-h-[600px] overflow-y-auto">
                        {chartData.map((item, index) => (
                          <div key={item.state} className="grid grid-cols-4 gap-px bg-border text-sm">
                            <div className="bg-card p-3 font-mono text-foreground">{item.state}</div>
                            <div className="bg-card p-3 font-mono text-muted-foreground">{Math.sqrt(item.probability / 100).toFixed(4)}</div>
                            <div className="bg-card p-3 flex items-center gap-2">
                              <PhaseWheel phase={item.phase} size={16} />
                              <span className="text-muted-foreground">{((item.phase * 180) / Math.PI).toFixed(1)}°</span>
                            </div>
                            <div className="bg-card p-3 font-mono font-semibold" style={{ color: phaseToColor(item.phase) }}>
                              {item.probability.toFixed(2)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'density' && (
                  <div className="bg-card rounded-lg p-6 border border-border h-full flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold text-foreground uppercase tracking-wide mb-4 w-full text-left">
                      Density Matrix
                    </h3>
                    <div className="flex-1 w-full flex items-center justify-center">
                      <DensityMatrixHeatmap stateVector={simulationResult.stateVector as any} maxDim={64} />
                    </div>
                  </div>
                )}

                {activeTab === 'qmap' && (
                  <div className="bg-card rounded-lg p-6 border border-border h-full">
                    <h3 className="text-lg font-semibold text-foreground uppercase tracking-wide mb-4">
                      Physical Qubit Topology
                    </h3>
                    <div className="h-[500px]">
                      <QubitMapping result={simulationResult as any} qubitCount={qubitCount} gates={gates} />
                    </div>
                  </div>
                )}

              </div>
            </DialogContent>
          </Dialog>
        )}
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
            <p className="text-muted-foreground mt-4">
              {qubitCount > 15 
                ? `Running ${qubitCount}-qubit MPS simulation...`
                : 'Running quantum simulation...'}
            </p>
            {qubitCount > 30 && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Large circuits may take 10–60 seconds
              </p>
            )}
            <div className="mt-4 w-full">
              <motion.div
                className="h-1 bg-primary/30 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: qubitCount > 30 ? 10 : 1.5, ease: "easeInOut" }}
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

        {/* Manual simulation mode banner for large circuits */}
        {!simulationResult && !isSimulating && gates.length > 0 && qubitCount > 15 && (
          <div className="text-center py-8 space-y-3">
            <div className="text-4xl mb-2 opacity-40">⚡</div>
            <p className="text-muted-foreground text-sm font-medium">
              Manual Simulation Mode
            </p>
            <p className="text-muted-foreground/70 text-xs max-w-[280px] mx-auto">
              Auto-simulate is disabled for {qubitCount}-qubit circuits.
              Click <strong>"Simulate"</strong> in the toolbar to run.
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-1">
                <TabsTrigger value="statevector" className="text-xs">
                  <Gauge className="w-3 h-3 mr-1" />
                  Statevector
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
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="amplitudes" className="text-xs">
                  <Activity className="w-3 h-3 mr-1" />
                  Amps
                </TabsTrigger>
                <TabsTrigger value="density" className="text-xs">
                  <Grid3X3 className="w-3 h-3 mr-1" />
                  Density ρ
                </TabsTrigger>
                <TabsTrigger value="qmap" className="text-xs">
                  <Network className="w-3 h-3 mr-1" />
                  Qubit Map
                </TabsTrigger>
              </TabsList>
              
              {/* Top-N outcome selector for large circuits */}
              {qubitCount > 13 && ['statevector', 'amplitudes', 'states'].includes(activeTab) && (
                <div className="bg-card rounded-lg p-2.5 border border-border mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <SlidersHorizontal className="w-3 h-3" />
                      <span className="uppercase tracking-wider font-medium">Show Top Outcomes</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">{topN}</span>
                  </div>
                  <Slider
                    value={[topN]}
                    onValueChange={([v]) => setTopN(v)}
                    min={10}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>10</span>
                    <span>250</span>
                    <span>500</span>
                    <span>750</span>
                    <span>1000</span>
                  </div>
                  {isSamplingMode && (
                    <div className="text-[9px] text-amber-500 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 mt-2">
                      Showing top {Math.min(topN, simulationResult.probabilities.length)} sampled states (approximate • {qubitCount}-qubit circuit)
                    </div>
                  )}
                </div>
              )}
              
              {/* Statevector Bar Chart Tab */}
              <TabsContent value="statevector" className="mt-4 space-y-3">
                {/* Bar chart showing top 32 amplitudes to prevent lag */}
                <div className="bg-card rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      {isSamplingMode ? `Sampled Distribution (${chartData.length} top states)` : 'Distribution'}
                    </div>
                    {!isSamplingMode && (
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] ${!(isProbabilityView || isSamplingMode) ? 'text-foreground' : 'text-muted-foreground'}`}>Statevector</span>
                        <Switch 
                          checked={isProbabilityView || isSamplingMode}
                          onCheckedChange={setIsProbabilityView}
                          disabled={isSamplingMode}
                          className="scale-50 -mx-2"
                        />
                        <span className={`text-[9px] ${(isProbabilityView || isSamplingMode) ? 'text-foreground' : 'text-muted-foreground'}`}>Prob</span>
                      </div>
                    )}
                  </div>
                  <div className="h-40 mt-2 w-full overflow-x-auto pb-2">
                    <div style={{ minWidth: `max(100%, ${chartData.length * 16}px)`, height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={chartData}
                        margin={{ top: 10, right: 5, left: -20, bottom: 20 }}
                        barSize={8}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="state" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={8}
                          tickMargin={5}
                          angle={-45}
                          textAnchor="end"
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={8}
                          tickFormatter={(val) => (isProbabilityView || isSamplingMode) ? `${val}%` : val.toFixed(1)}
                          domain={(isProbabilityView || isSamplingMode) ? [0, 100] : [-1, 1]}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover text-popover-foreground text-[10px] p-2 rounded shadow-lg border border-border">
                                  <div className="font-mono font-bold mb-1">{data.rawState}</div>
                                  {(isProbabilityView || isSamplingMode) ? (
                                    <div>Prob: {data.probability.toFixed(1)}%</div>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-blue-500">Re: {data.re.toFixed(3)}</span>
                                      <span className="text-red-500">Im: {data.im.toFixed(3)}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" />
                        {(isProbabilityView || isSamplingMode) ? (
                          <Bar 
                            dataKey="probability" 
                            radius={[1, 1, 0, 0]}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="hsl(265, 100%, 65%)" />
                            ))}
                          </Bar>
                        ) : (
                          <>
                            <Bar dataKey="re" fill="#3b82f6" radius={[1, 1, 0, 0]} />
                            <Bar dataKey="im" fill="#ef4444" radius={[1, 1, 0, 0]} />
                          </>
                        )}
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                </div>
                
                {/* Raw statevector display */}
                <div className="bg-card rounded-lg p-2 border border-border">
                  <div className="text-[10px] text-muted-foreground mb-1">Statevector (non-zero amplitudes)</div>
                  <div className="font-mono text-[10px] text-foreground bg-muted/30 rounded p-2 max-h-40 overflow-y-auto">
                    [ {chartData.map(a => 
                      `${a.re >= 0 ? ' ' : ''}${a.re.toFixed(3)}${a.im >= 0 ? '+' : ''}${a.im.toFixed(3)}i`
                    ).join(', ')} ]
                  </div>
                </div>
                
                {/* Phase Legend */}
                <div className="bg-card rounded-lg p-2 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <PhaseWheel phase={0} size={24} />
                    <div className="text-[10px] text-muted-foreground">Phase Color Legend</div>
                  </div>
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
                    <span>0</span>
                    <span>π/2</span>
                    <span>π</span>
                    <span>3π/2</span>
                    <span>2π</span>
                  </div>
                </div>
              </TabsContent>
              
              {/* Amplitudes Tab */}
              <TabsContent value="amplitudes" className="mt-4 space-y-3">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {chartData.map((item, index) => (
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
                          {item.probability.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.probability}%` }}
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
              
              {/* Bloch Spheres Tab — GPU Instanced Rendering */}
              <TabsContent value="bloch" className="mt-4">
                {simulationResult.blochVectors.length > 8 ? (
                  <BlochSphereGrid 
                    blochVectors={simulationResult.blochVectors}
                    qubitCount={qubitCount}
                  />
                ) : (
                  /* For small circuits, use the original interactive spheres */
                  <>
                    <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {simulationResult.blochVectors.map((vec, index) => (
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
                  </>
                )}
              </TabsContent>
              
              {/* State Vector Table Tab — with sampling fallback */}
              <TabsContent value="states" className="mt-4">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-4 gap-px bg-border text-[10px] font-semibold text-muted-foreground">
                    <div className="bg-card p-2">State</div>
                    <div className="bg-card p-2">Amplitude</div>
                    <div className="bg-card p-2">Phase</div>
                    <div className="bg-card p-2">Prob</div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                  {chartData.map((item) => (
                    <div key={item.state} className="grid grid-cols-4 gap-px bg-border text-[10px]">
                      <div className="bg-card p-2 font-mono text-foreground">{item.state}</div>
                      <div className="bg-card p-2 font-mono text-muted-foreground">
                        {Math.sqrt(item.probability / 100).toFixed(3)}
                      </div>
                      <div className="bg-card p-2 flex items-center gap-1">
                        <PhaseWheel phase={item.phase} size={14} />
                        <span className="text-muted-foreground">
                          {((item.phase * 180) / Math.PI).toFixed(0)}°
                        </span>
                      </div>
                      <div className="bg-card p-2 font-mono" style={{ color: phaseToColor(item.phase) }}>
                        {item.probability.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </TabsContent>

              {/* Density Matrix Tab */}
              <TabsContent value="density" className="mt-4 space-y-3">
                <div className="bg-card/50 rounded-lg p-2 border border-border">
                  <div className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Grid3X3 className="w-3 h-3" />
                    Density Matrix Simulator
                  </div>
                  <div className="text-[9px] text-muted-foreground space-y-0.5">
                    <div>• Mixed states &amp; decoherence modelling</div>
                    <div>• Open quantum systems (Kraus operators)</div>
                    <div>• ρ = |ψ⟩⟨ψ| (pure) or Σₖ pₖ|ψₖ⟩⟨ψₖ| (mixed)</div>
                  </div>
                </div>
                {simulationResult.stateVector ? (
                  <DensityMatrixHeatmap
                    stateVector={simulationResult.stateVector as any}
                    maxDim={Math.min(simulationResult.stateVector.amplitudes.length, 8)}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs italic">
                    Run simulation to generate density matrix
                  </div>
                )}
              </TabsContent>

              {/* Qubit Mapping Tab */}
              <TabsContent value="qmap" className="mt-4 space-y-3">
                <div className="bg-card/50 rounded-lg p-2 border border-border">
                  <div className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Network className="w-3 h-3" />
                    Physical Qubit Topology
                  </div>
                  <div className="text-[9px] text-muted-foreground space-y-0.5">
                    <div>• MPS / PEPS / Tree Tensor architecture</div>
                    <div>• Gate connectivity &amp; virtual bonds</div>
                    <div>• Node colour = Bloch Z (|0⟩↔|1⟩)</div>
                  </div>
                </div>
                <QubitMapping
                  result={simulationResult as any}
                  qubitCount={qubitCount}
                  gates={gates}
                />
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
                <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                  {simulationResult.probabilities.map((item) => (
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

            {/* Circuit Metrics Panel */}
            <CircuitMetricsPanel />

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
                  <span className="font-mono text-foreground">
                    {qubitCount <= 53 ? Math.pow(2, qubitCount).toLocaleString() : `2^${qubitCount}`}
                  </span>
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
