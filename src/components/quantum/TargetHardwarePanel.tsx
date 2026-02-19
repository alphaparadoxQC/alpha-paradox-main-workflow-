import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Cpu, AlertTriangle, Network, Gauge, Timer, Activity, Plus, Trash2, Settings2
} from 'lucide-react';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { HARDWARE_BACKENDS, HardwareBackend, createCustomBackend } from '@/lib/transpiler/backends';

// Interactive coupling map graph rendered as SVG
function CouplingMapGraph({ 
  backend, 
  usedQubits 
}: { 
  backend: HardwareBackend; 
  usedQubits: Set<number>;
}) {
  const positions = useMemo(() => {
    const n = backend.qubitCount;
    const pos: { x: number; y: number }[] = [];

    if (backend.id === 'tcg-crest-5') {
      // Linear layout
      for (let i = 0; i < n; i++) {
        pos.push({ x: 40 + i * 70, y: 80 });
      }
    } else if (backend.id === 'generic-7') {
      // T-shape
      pos.push({ x: 40, y: 60 });   // 0
      pos.push({ x: 120, y: 60 });  // 1
      pos.push({ x: 200, y: 60 });  // 2
      pos.push({ x: 280, y: 60 });  // 3
      pos.push({ x: 120, y: 130 }); // 4
      pos.push({ x: 200, y: 130 }); // 5
      pos.push({ x: 120, y: 200 }); // 6
    } else if (n <= 10) {
      // Circle layout for small graphs
      const cx = 160, cy = 100, r = 70;
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        pos.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
    } else {
      // Grid layout for large
      const cols = Math.ceil(Math.sqrt(n));
      for (let i = 0; i < n; i++) {
        pos.push({
          x: 30 + (i % cols) * 50,
          y: 30 + Math.floor(i / cols) * 50,
        });
      }
    }
    return pos;
  }, [backend]);

  // Deduplicate edges
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const result: [number, number][] = [];
    for (const [a, b] of backend.couplingMap) {
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push([a, b]);
      }
    }
    return result;
  }, [backend.couplingMap]);

  const svgWidth = Math.max(...positions.map(p => p.x)) + 40;
  const svgHeight = Math.max(...positions.map(p => p.y)) + 40;

  if (backend.category === 'simulator' || backend.couplingMap.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-muted/20 rounded-lg border border-border/50">
        <p className="text-sm text-muted-foreground">All-to-all connectivity (no coupling constraints)</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/10 rounded-lg border border-border/50 p-2 overflow-auto">
      <svg width={svgWidth} height={svgHeight} className="w-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Edges */}
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={positions[a]?.x} y1={positions[a]?.y}
            x2={positions[b]?.x} y2={positions[b]?.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
            strokeOpacity="0.4"
          />
        ))}
        {/* Nodes */}
        {positions.map((pos, i) => {
          const isUsed = usedQubits.has(i);
          return (
            <g key={i}>
              <motion.circle
                cx={pos.x} cy={pos.y} r={isUsed ? 16 : 12}
                fill={isUsed ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                stroke={isUsed ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                strokeWidth={isUsed ? 2 : 1}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.03 }}
              />
              <text
                x={pos.x} y={pos.y + 4}
                textAnchor="middle"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill={isUsed ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'}
              >
                {i}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Custom backend editor
function CustomBackendEditor({
  onSave
}: {
  onSave: (backend: HardwareBackend) => void;
}) {
  const [name, setName] = useState('My Backend');
  const [qubits, setQubits] = useState('5');
  const [couplingText, setCouplingText] = useState('0-1, 1-2, 2-3, 3-4');
  const [nativeGatesText, setNativeGatesText] = useState('Rz, SX, CNOT');

  const handleSave = () => {
    const qubitCount = parseInt(qubits);
    if (isNaN(qubitCount) || qubitCount < 1 || qubitCount > 50) {
      toast.error('Qubit count must be 1-50');
      return;
    }

    const couplingMap: [number, number][] = [];
    const pairs = couplingText.split(',').map(s => s.trim()).filter(Boolean);
    for (const pair of pairs) {
      const [a, b] = pair.split('-').map(Number);
      if (!isNaN(a) && !isNaN(b)) {
        couplingMap.push([a, b], [b, a]);
      }
    }

    const nativeGates = nativeGatesText.split(',').map(s => s.trim()).filter(Boolean);

    const backend = createCustomBackend(name, qubitCount, couplingMap, nativeGates);
    onSave(backend);
    toast.success('Custom backend created');
  };

  return (
    <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/50">
      <div className="space-y-1.5">
        <Label className="text-xs">Backend Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Number of Qubits</Label>
        <Input type="number" value={qubits} onChange={e => setQubits(e.target.value)} className="h-8 text-sm" min={1} max={50} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Coupling Map (comma-separated pairs)</Label>
        <Textarea
          value={couplingText}
          onChange={e => setCouplingText(e.target.value)}
          className="text-xs font-mono h-16"
          placeholder="0-1, 1-2, 2-3"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Native Gates (comma-separated)</Label>
        <Input value={nativeGatesText} onChange={e => setNativeGatesText(e.target.value)} className="h-8 text-xs font-mono" />
      </div>
      <Button size="sm" onClick={handleSave} className="w-full">
        <Plus className="w-3 h-3 mr-1" />
        Create Backend
      </Button>
    </div>
  );
}

export const TargetHardwarePanel = () => {
  const { gates, qubitCount } = useQuantumCircuitStore();
  const [selectedBackendId, setSelectedBackendId] = useState(HARDWARE_BACKENDS[0].id);
  const [customBackend, setCustomBackend] = useState<HardwareBackend | null>(null);
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  const allBackends = useMemo(() => {
    const list = [...HARDWARE_BACKENDS];
    if (customBackend) list.push(customBackend);
    return list;
  }, [customBackend]);

  const selectedBackend = useMemo(
    () => allBackends.find(b => b.id === selectedBackendId) ?? HARDWARE_BACKENDS[0],
    [selectedBackendId, allBackends]
  );

  const usedQubits = useMemo(() => {
    const set = new Set<number>();
    gates.forEach(g => {
      set.add(g.qubit);
      if (g.targetQubit !== undefined) set.add(g.targetQubit);
    });
    return set;
  }, [gates]);

  const maxQubitUsed = useMemo(() => Math.max(0, ...Array.from(usedQubits)), [usedQubits]);
  const needsMoreQubits = qubitCount > selectedBackend.qubitCount;

  const handleCustomSave = useCallback((backend: HardwareBackend) => {
    setCustomBackend(backend);
    setSelectedBackendId('custom');
    setShowCustomEditor(false);
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="border-accent/30 hover:border-accent/50 shrink-0"
        >
          <Network className="w-4 h-4 mr-2 text-accent" />
          Hardware
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[480px] sm:w-[540px] p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-accent" />
            Target Hardware
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] px-6 pb-6">
          {/* Backend selector */}
          <div className="space-y-3 mb-5">
            <Label className="text-sm font-medium">Select Backend</Label>
            <Select value={selectedBackendId} onValueChange={setSelectedBackendId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allBackends.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    <div className="flex items-center gap-2">
                      <span>{b.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                        {b.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomEditor(!showCustomEditor)}
                className="text-xs"
              >
                <Settings2 className="w-3 h-3 mr-1" />
                {showCustomEditor ? 'Hide Custom Editor' : 'Custom Backend'}
              </Button>
              {customBackend && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomBackend(null);
                    if (selectedBackendId === 'custom') setSelectedBackendId(HARDWARE_BACKENDS[0].id);
                  }}
                  className="text-xs text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove Custom
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showCustomEditor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <CustomBackendEditor onSave={handleCustomSave} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Qubit warning */}
          {needsMoreQubits && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-destructive/10 border border-destructive/30"
            >
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Qubit mismatch</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Circuit uses {qubitCount} qubits but {selectedBackend.name} only has {selectedBackend.qubitCount}.
                </p>
              </div>
            </motion.div>
          )}

          {/* Backend info badges */}
          <div className="flex gap-2 flex-wrap mb-5">
            <Badge variant="outline" className="text-xs">
              <Cpu className="w-3 h-3 mr-1" />
              {selectedBackend.qubitCount} qubits
            </Badge>
            <Badge variant="outline" className="text-xs">
              {selectedBackend.category === 'simulator' ? 'Simulator' : 'Hardware'}
            </Badge>
            {usedQubits.size > 0 && (
              <Badge variant="secondary" className="text-xs">
                {usedQubits.size} used
              </Badge>
            )}
          </div>

          {/* Coupling Map Graph */}
          <div className="space-y-2 mb-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Network className="w-4 h-4 text-accent" />
              Coupling Map
            </h3>
            <p className="text-xs text-muted-foreground">{selectedBackend.description}</p>
            <CouplingMapGraph backend={selectedBackend} usedQubits={usedQubits} />
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                Used qubits
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-muted border border-border inline-block" />
                Available
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Native Gate Set */}
          <div className="space-y-2 mb-5">
            <h3 className="text-sm font-semibold text-foreground">Native Gate Set</h3>
            <div className="flex gap-1.5 flex-wrap">
              {selectedBackend.nativeGates.map(gate => (
                <Badge key={gate} className="font-mono text-xs bg-accent/10 text-accent border-accent/30">
                  {gate}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Hardware Specs */}
          {selectedBackend.category !== 'simulator' && (
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Gauge className="w-4 h-4 text-accent" />
                Hardware Specifications
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedBackend.avgT1 != null && (
                  <SpecCard
                    icon={<Timer className="w-3.5 h-3.5" />}
                    label="Avg T1"
                    value={`${selectedBackend.avgT1} µs`}
                  />
                )}
                {selectedBackend.avgT2 != null && (
                  <SpecCard
                    icon={<Timer className="w-3.5 h-3.5" />}
                    label="Avg T2"
                    value={`${selectedBackend.avgT2} µs`}
                  />
                )}
                {selectedBackend.avgGateFidelity != null && (
                  <SpecCard
                    icon={<Activity className="w-3.5 h-3.5" />}
                    label="Gate Fidelity"
                    value={`${(selectedBackend.avgGateFidelity * 100).toFixed(2)}%`}
                    good={selectedBackend.avgGateFidelity > 0.99}
                  />
                )}
                {selectedBackend.avgReadoutError != null && (
                  <SpecCard
                    icon={<Activity className="w-3.5 h-3.5" />}
                    label="Readout Error"
                    value={`${(selectedBackend.avgReadoutError * 100).toFixed(2)}%`}
                    good={selectedBackend.avgReadoutError < 0.02}
                  />
                )}
                {selectedBackend.singleQubitGateTime != null && (
                  <SpecCard
                    icon={<Cpu className="w-3.5 h-3.5" />}
                    label="1Q Gate Time"
                    value={`${selectedBackend.singleQubitGateTime} ns`}
                  />
                )}
                {selectedBackend.twoQubitGateTime != null && (
                  <SpecCard
                    icon={<Cpu className="w-3.5 h-3.5" />}
                    label="2Q Gate Time"
                    value={`${selectedBackend.twoQubitGateTime} ns`}
                  />
                )}
              </div>

              {/* Per-qubit specs */}
              {selectedBackend.qubitSpecs && selectedBackend.qubitSpecs.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-muted-foreground">Per-Qubit Details</h4>
                  <div className="max-h-40 overflow-auto rounded-md border border-border/50">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">Q</th>
                          <th className="px-2 py-1 text-right font-medium text-muted-foreground">T1 (µs)</th>
                          <th className="px-2 py-1 text-right font-medium text-muted-foreground">T2 (µs)</th>
                          <th className="px-2 py-1 text-right font-medium text-muted-foreground">Fidelity</th>
                          <th className="px-2 py-1 text-right font-medium text-muted-foreground">Readout Err</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBackend.qubitSpecs.map((spec, i) => (
                          <tr
                            key={i}
                            className={usedQubits.has(i) ? 'bg-primary/5' : ''}
                          >
                            <td className="px-2 py-1 font-mono font-medium">
                              {usedQubits.has(i) ? <span className="text-primary">q{i}</span> : `q${i}`}
                            </td>
                            <td className="px-2 py-1 text-right font-mono">{spec.t1}</td>
                            <td className="px-2 py-1 text-right font-mono">{spec.t2}</td>
                            <td className="px-2 py-1 text-right font-mono">{(spec.gateFidelity * 100).toFixed(2)}%</td>
                            <td className="px-2 py-1 text-right font-mono">{(spec.readoutError * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedBackend.category === 'simulator' && (
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 text-center">
              <p className="text-sm text-muted-foreground">
                Ideal simulator — no noise, perfect fidelity, all-to-all connectivity.
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

function SpecCard({ icon, label, value, good }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border/30">
      <div className="text-accent">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-mono font-medium ${
          good === true ? 'text-primary' : good === false ? 'text-destructive' : 'text-foreground'
        }`}>
          {value}
        </p>
      </div>
    </div>
  );
}
