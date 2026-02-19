import { useState, useMemo } from 'react';
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
import { toast } from 'sonner';
import {
  Cpu, Download, CheckCircle, AlertTriangle, ArrowRight,
  Shuffle, Minimize2, FileCode, Zap, XCircle
} from 'lucide-react';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import {
  HARDWARE_BACKENDS,
  transpileCircuit,
  TranspilationResult,
} from '@/lib/transpiler';

export const TranspilerPanel = () => {
  const { gates, qubitCount } = useQuantumCircuitStore();
  const [selectedBackendId, setSelectedBackendId] = useState(HARDWARE_BACKENDS[0].id);
  const [result, setResult] = useState<TranspilationResult | null>(null);
  const [isTranspiling, setIsTranspiling] = useState(false);

  const selectedBackend = useMemo(
    () => HARDWARE_BACKENDS.find(b => b.id === selectedBackendId)!,
    [selectedBackendId]
  );

  const handleTranspile = () => {
    if (gates.length === 0) {
      toast.error('No gates to transpile');
      return;
    }
    setIsTranspiling(true);
    // Small delay for UI feedback
    setTimeout(() => {
      const res = transpileCircuit(gates, qubitCount, selectedBackend);
      setResult(res);
      setIsTranspiling(false);
      toast.success('Transpilation complete', {
        description: `${res.optimizedGateCount} gates, depth ${res.optimizedDepth}`,
      });
    }, 300);
  };

  const handleDownloadQASM = () => {
    if (!result) return;
    const blob = new Blob([result.qasm], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circuit_${selectedBackend.id}.qasm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('QASM file downloaded');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="border-accent/30 hover:border-accent/50 shrink-0"
          disabled={gates.length === 0}
        >
          <Shuffle className="w-4 h-4 mr-2 text-accent" />
          Transpile
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[480px] sm:w-[540px] p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-accent" />
            Transpiler & QASM Export
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] px-6 pb-6">
          {/* Backend selector */}
          <div className="space-y-3 mb-6">
            <label className="text-sm font-medium text-foreground">Target Backend</label>
            <Select value={selectedBackendId} onValueChange={setSelectedBackendId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HARDWARE_BACKENDS.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    <div className="flex flex-col items-start">
                      <span>{b.name}</span>
                      <span className="text-xs text-muted-foreground">{b.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                <Cpu className="w-3 h-3 mr-1" />
                {selectedBackend.qubitCount} qubits
              </Badge>
              <Badge variant="outline" className="text-xs">
                Native: {selectedBackend.nativeGates.join(', ')}
              </Badge>
            </div>
          </div>

          {/* Transpile button */}
          <Button
            onClick={handleTranspile}
            disabled={isTranspiling || gates.length === 0}
            className="w-full mb-6 bg-gradient-to-r from-accent to-primary"
          >
            {isTranspiling ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Zap className="w-4 h-4 mr-2" />
              </motion.div>
            ) : (
              <Shuffle className="w-4 h-4 mr-2" />
            )}
            {isTranspiling ? 'Transpiling...' : 'Transpile Circuit'}
          </Button>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Before / After comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <ComparisonCard
                    title="Original"
                    gateCount={result.originalGateCount}
                    depth={result.originalDepth}
                    variant="before"
                  />
                  <ComparisonCard
                    title="Transpiled"
                    gateCount={result.optimizedGateCount}
                    depth={result.optimizedDepth}
                    variant="after"
                  />
                </div>

                {/* Pipeline steps */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Pipeline</h3>
                  <PipelineStep
                    icon={<Shuffle className="w-4 h-4" />}
                    label="Gate Decomposition"
                    detail={`${result.originalGateCount} → ${result.decomposedGateCount} gates`}
                  />
                  <PipelineStep
                    icon={<ArrowRight className="w-4 h-4" />}
                    label="Qubit Routing"
                    detail={`${result.swapCount} SWAP${result.swapCount !== 1 ? 's' : ''} inserted`}
                  />
                  <PipelineStep
                    icon={<Minimize2 className="w-4 h-4" />}
                    label="Optimization"
                    detail={`${result.routedGateCount} → ${result.optimizedGateCount} gates (${Math.round((1 - result.optimizedGateCount / Math.max(result.routedGateCount, 1)) * 100)}% reduction)`}
                  />
                </div>

                <Separator />

                {/* Metrics */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Metrics</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <MetricRow label="CNOT count" value={result.cnotCount} />
                    <MetricRow label="Single-qubit gates" value={result.singleQubitCount} />
                    <MetricRow label="Circuit depth" value={result.optimizedDepth} />
                    <MetricRow label="SWAP overhead" value={result.swapCount} />
                    <MetricRow label="Transpile time" value={`${result.transpileTimeMs.toFixed(1)}ms`} />
                  </div>
                </div>

                <Separator />

                {/* QASM Validation */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">QASM Validation</h3>
                  {result.qasmValidation.valid ? (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      Valid OpenQASM 2.0
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {result.qasmValidation.errors.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                          <XCircle className="w-3 h-3" /> {e}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.qasmValidation.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-accent">
                      <AlertTriangle className="w-3 h-3" /> {w}
                    </div>
                  ))}
                </div>

                <Separator />

                {/* QASM Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">OpenQASM 2.0</h3>
                    <Button size="sm" variant="outline" onClick={handleDownloadQASM}>
                      <Download className="w-3 h-3 mr-1" />
                      Download .qasm
                    </Button>
                  </div>
                  <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto border border-border">
                    {result.qasm}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

// --- Sub-components ---

function ComparisonCard({ title, gateCount, depth, variant }: {
  title: string;
  gateCount: number;
  depth: number;
  variant: 'before' | 'after';
}) {
  return (
    <div className={`rounded-lg border p-3 ${
      variant === 'before'
        ? 'border-muted-foreground/20 bg-muted/30'
        : 'border-accent/30 bg-accent/5'
    }`}>
      <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{gateCount}</p>
      <p className="text-xs text-muted-foreground">gates · depth {depth}</p>
    </div>
  );
}

function PipelineStep({ icon, label, detail }: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
      <div className="text-accent">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <CheckCircle className="w-4 h-4 text-primary" />
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between items-center p-1.5 rounded bg-muted/20">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}
