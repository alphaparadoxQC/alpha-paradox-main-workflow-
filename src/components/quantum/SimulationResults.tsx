import { motion } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { BarChart3, Circle, Loader2, Activity, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SimulationResults = () => {
  const { simulationResult, isSimulating, qubitCount, gates } = useQuantumCircuitStore();

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
            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-2"
            >
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <div className="text-lg font-bold text-quantum-cyan">{simulationResult.circuitDepth}</div>
                <div className="text-[10px] text-muted-foreground">Depth</div>
              </div>
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <div className="text-lg font-bold text-quantum-purple">{Math.pow(2, qubitCount)}</div>
                <div className="text-[10px] text-muted-foreground">States</div>
              </div>
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <div className="text-lg font-bold text-quantum-green">{simulationResult.fidelity}%</div>
                <div className="text-[10px] text-muted-foreground">Fidelity</div>
              </div>
            </motion.div>

            <Tabs defaultValue="probabilities" className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-8">
                <TabsTrigger value="probabilities" className="text-xs">Probs</TabsTrigger>
                <TabsTrigger value="amplitudes" className="text-xs">State Vector</TabsTrigger>
                <TabsTrigger value="bloch" className="text-xs">Bloch</TabsTrigger>
              </TabsList>

              <TabsContent value="probabilities" className="mt-4 space-y-4">
                <ProbabilityDistribution probabilities={simulationResult.probabilities} />
                {simulationResult.measurementOutcomes && simulationResult.measurementOutcomes.length > 0 && (
                  <MeasurementOutcomes outcomes={simulationResult.measurementOutcomes} />
                )}
              </TabsContent>

              <TabsContent value="amplitudes" className="mt-4 space-y-4">
                <StateVectorTable amplitudes={simulationResult.amplitudes} />
                <PhaseColorLegend />
              </TabsContent>

              <TabsContent value="bloch" className="mt-4">
                <BlochSpheresSection vectors={simulationResult.blochVectors} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

// Probability Distribution Component
const ProbabilityDistribution = ({ probabilities }: { probabilities: { state: string; probability: number }[] }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <BarChart3 className="w-4 h-4 text-quantum-cyan" />
      State Probabilities
    </h3>
    <div className="space-y-2">
      {probabilities.slice(0, 10).map((item, index) => (
        <motion.div
          key={item.state}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative"
        >
          <div className="flex justify-between text-xs mb-1">
            <span className="font-mono text-foreground">{item.state}</span>
            <span className="text-muted-foreground">{(item.probability * 100).toFixed(2)}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.probability * 100}%` }}
              transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, hsl(185, 100%, 50%), hsl(265, 100%, 65%))` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// Measurement Outcomes Component
const MeasurementOutcomes = ({ outcomes }: { outcomes: { qubit: number; prob0: number; prob1: number }[] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-card rounded-lg p-3 border border-quantum-orange/30"
  >
    <h3 className="text-xs font-semibold text-quantum-orange mb-2 flex items-center gap-2">
      <Target className="w-3 h-3" />
      MEASUREMENT OUTCOMES
    </h3>
    <div className="space-y-2">
      {outcomes.map((outcome) => (
        <div key={outcome.qubit} className="flex items-center gap-2 text-xs">
          <span className="font-mono text-muted-foreground w-8">q{outcome.qubit}</span>
          <div className="flex-1 flex gap-1">
            <div className="flex-1 bg-muted rounded h-3 overflow-hidden">
              <div className="h-full bg-quantum-cyan" style={{ width: `${outcome.prob0 * 100}%` }} />
            </div>
            <div className="flex-1 bg-muted rounded h-3 overflow-hidden">
              <div className="h-full bg-quantum-purple" style={{ width: `${outcome.prob1 * 100}%` }} />
            </div>
          </div>
          <span className="font-mono text-muted-foreground text-[10px] w-20 text-right">
            0:{(outcome.prob0 * 100).toFixed(0)}% 1:{(outcome.prob1 * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

// State Vector Table Component
const StateVectorTable = ({ amplitudes }: { amplitudes: { state: string; re: number; im: number; magnitude: number; phase: number }[] }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <Activity className="w-4 h-4 text-quantum-purple" />
      State Vector
    </h3>
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_1.5fr_0.8fr_40px] gap-1 p-2 bg-muted/50 text-[10px] text-muted-foreground font-semibold">
        <div>State</div>
        <div>Amplitude</div>
        <div>|α|²</div>
        <div>φ</div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {amplitudes.slice(0, 16).map((amp, index) => (
          <motion.div
            key={amp.state}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className="grid grid-cols-[1fr_1.5fr_0.8fr_40px] gap-1 p-2 border-t border-border/50 items-center"
          >
            <span className="font-mono text-xs text-foreground">{amp.state}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{formatComplex(amp.re, amp.im)}</span>
            <span className="font-mono text-[10px] text-quantum-cyan">{(amp.magnitude * amp.magnitude * 100).toFixed(1)}%</span>
            <PhaseIndicator phase={amp.phase} />
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

// Format complex number as string
const formatComplex = (re: number, im: number): string => {
  const reStr = Math.abs(re) < 0.001 ? '0' : re.toFixed(3);
  const imAbs = Math.abs(im);
  const imStr = imAbs < 0.001 ? '' : (im >= 0 ? ` + ${imAbs.toFixed(3)}i` : ` - ${imAbs.toFixed(3)}i`);
  if (reStr === '0' && imStr === '') return '0';
  if (reStr === '0') return im >= 0 ? `${imAbs.toFixed(3)}i` : `-${imAbs.toFixed(3)}i`;
  return reStr + imStr;
};

// Phase indicator with color wheel
const PhaseIndicator = ({ phase }: { phase: number }) => {
  const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360;
  return (
    <div
      className="w-5 h-5 rounded-full border border-border/50"
      style={{
        background: `hsl(${hue}, 80%, 50%)`,
        boxShadow: `0 0 4px hsl(${hue}, 80%, 50%, 0.5)`,
      }}
      title={`Phase: ${((phase * 180) / Math.PI).toFixed(1)}°`}
    />
  );
};

// Phase Color Legend
const PhaseColorLegend = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3 }}
    className="flex items-center gap-2 text-[10px] text-muted-foreground"
  >
    <span>Phase:</span>
    <div
      className="flex-1 h-3 rounded-full overflow-hidden"
      style={{
        background:
          'linear-gradient(to right, hsl(0, 80%, 50%), hsl(60, 80%, 50%), hsl(120, 80%, 50%), hsl(180, 80%, 50%), hsl(240, 80%, 50%), hsl(300, 80%, 50%), hsl(360, 80%, 50%))',
      }}
    />
    <span>-π → π</span>
  </motion.div>
);

// Bloch Spheres Section
const BlochSpheresSection = ({ vectors }: { vectors: { x: number; y: number; z: number }[] }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <Circle className="w-4 h-4 text-quantum-purple" />
      Bloch Spheres
      <span className="text-[10px] text-muted-foreground font-normal">(drag to rotate)</span>
    </h3>
    <div className="grid grid-cols-2 gap-3">
      {vectors.slice(0, 5).map((vec, index) => (
        <InteractiveBlochSphere key={index} qubit={index} vector={vec} />
      ))}
    </div>
  </motion.div>
);

// Interactive Bloch Sphere Component with drag rotation
const InteractiveBlochSphere = ({ qubit, vector }: { qubit: number; vector: { x: number; y: number; z: number } }) => {
  const [rotation, setRotation] = useState({ theta: 0.4, phi: -0.3 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const size = 120;
  const center = size / 2;
  const radius = size / 2 - 15;

  const rotatePoint = useCallback(
    (x: number, y: number, z: number) => {
      const { theta, phi } = rotation;
      const x1 = x * Math.cos(phi) - z * Math.sin(phi);
      const z1 = x * Math.sin(phi) + z * Math.cos(phi);
      const y2 = y * Math.cos(theta) - z1 * Math.sin(theta);
      const z2 = y * Math.sin(theta) + z1 * Math.cos(theta);
      return { x: x1, y: y2, z: z2 };
    },
    [rotation]
  );

  const projected = rotatePoint(vector.x, vector.y, vector.z);
  const projectedX = center + projected.x * radius * 0.85;
  const projectedY = center - projected.y * radius * 0.85;
  const isInFront = projected.z > 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      setRotation((prev) => ({
        theta: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.theta + dy * 0.01)),
        phi: prev.phi + dx * 0.01,
      }));
    },
    [isDragging]
  );

  const handleMouseUp = () => setIsDragging(false);

  const equatorPoints: string[] = [];
  for (let i = 0; i <= 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const p = rotatePoint(Math.cos(angle), 0, Math.sin(angle));
    equatorPoints.push(`${center + p.x * radius * 0.85},${center - p.y * radius * 0.85}`);
  }

  const meridianPoints: string[] = [];
  for (let i = 0; i <= 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const p = rotatePoint(0, Math.cos(angle), Math.sin(angle));
    meridianPoints.push(`${center + p.x * radius * 0.85},${center - p.y * radius * 0.85}`);
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="relative"
    >
      <svg
        width={size}
        height={size}
        className="mx-auto cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <polyline points={equatorPoints.join(' ')} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeOpacity="0.5" />
        <polyline points={meridianPoints.join(' ')} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeOpacity="0.5" />
        <text x={center} y={8} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">|0⟩</text>
        <text x={center} y={size - 3} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">|1⟩</text>
        <line x1={center} y1={center} x2={projectedX} y2={projectedY} stroke={isInFront ? 'hsl(265, 100%, 65%)' : 'hsl(265, 50%, 45%)'} strokeWidth="2" strokeOpacity={isInFront ? 1 : 0.5} />
        <motion.circle cx={projectedX} cy={projectedY} r="5" fill={isInFront ? 'hsl(265, 100%, 65%)' : 'hsl(265, 50%, 45%)'} stroke="hsl(var(--background))" strokeWidth="1" initial={{ r: 0 }} animate={{ r: 5 }} transition={{ delay: 0.3 }} />
        <circle cx={projectedX} cy={projectedY} r="8" fill="hsl(265, 100%, 65%)" fillOpacity={isInFront ? 0.3 : 0.1} />
        <circle cx={center} cy={center} r="2" fill="hsl(var(--muted-foreground))" />
      </svg>
      <div className="text-center mt-1">
        <div className="font-mono text-xs text-foreground">q{qubit}</div>
        <div className="text-[9px] text-muted-foreground font-mono">
          ({vector.x.toFixed(2)}, {vector.y.toFixed(2)}, {vector.z.toFixed(2)})
        </div>
      </div>
    </motion.div>
  );
};
