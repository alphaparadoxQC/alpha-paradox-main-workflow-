import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Layers, GitBranch, Clock, Zap } from 'lucide-react';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';

const CLIFFORD_GATES = new Set([
  'H', 'X', 'Y', 'Z', 'S', 'CNOT', 'CX', 'CZ', 'SWAP',
]);

export const CircuitMetricsPanel = () => {
  const { gates, getCircuitDepth } = useQuantumCircuitStore();
  const depth = getCircuitDepth();

  const metrics = useMemo(() => {
    const tCount = gates.filter((g) => g.type === 'T' || g.type === 'Tdg').length;
    const cnotCount = gates.filter((g) => g.type === 'CNOT' || g.type === 'CX').length;
    const total = gates.length;
    const cliffordCount = gates.filter((g) => CLIFFORD_GATES.has(g.type as string)).length;
    const cliffordFrac = total > 0 ? (cliffordCount / total) * 100 : 0;
    const runtimeMs = depth * 0.1;
    return { tCount, cnotCount, cliffordFrac, runtimeMs };
  }, [gates, depth]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-lg p-3 border border-border"
    >
      <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-quantum-cyan" />
        CIRCUIT METRICS
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <Metric
          icon={Zap}
          label="T-Gates"
          value={metrics.tCount.toString()}
          sub="Expensive for fault tolerance"
          color="text-quantum-orange"
        />
        <Metric
          icon={GitBranch}
          label="CNOT"
          value={metrics.cnotCount.toString()}
          sub="Two-qubit gates"
          color="text-quantum-purple"
        />
        <Metric
          icon={Layers}
          label="Depth"
          value={depth.toString()}
          sub="Circuit layers"
          color="text-quantum-green"
        />
        <Metric
          icon={Clock}
          label="QPU Runtime"
          value={`${metrics.runtimeMs.toFixed(2)}ms`}
          sub="depth × 0.1ms"
          color="text-quantum-cyan"
        />
        <Metric
          icon={Cpu}
          label="Clifford %"
          value={`${metrics.cliffordFrac.toFixed(0)}%`}
          sub="Easily simulable"
          color="text-quantum-cyan"
        />
        <Metric
          icon={Cpu}
          label="Total Gates"
          value={gates.length.toString()}
          sub="All operations"
          color="text-foreground"
        />
      </div>
    </motion.div>
  );
};

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-lg p-2 border border-border">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
        <Icon className={`w-3 h-3 ${color}`} />
        {label}
      </div>
      <div className={`text-sm font-mono font-bold mt-0.5 ${color}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5 truncate" title={sub}>
        {sub}
      </div>
    </div>
  );
}
