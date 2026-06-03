/**
 * QubitMapping.tsx
 *
 * Renders a physical qubit topology graph showing:
 *  - Physical qubits as nodes (coloured by Bloch-sphere Z coordinate)
 *  - Two-qubit gate connections as edges (coloured by gate type)
 *  - CNOT, CZ, SWAP, CCX connections drawn as animated lines
 *
 * Layout: Row × Col grid that scales with qubit count.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SimulationOutput } from '@/lib/quantum/simulator';
import type { QuantumGate } from '@/types/quantum';

interface QubitMappingProps {
  result: SimulationOutput;
  qubitCount: number;
  gates: QuantumGate[];
}

const GATE_COLORS: Record<string, string> = {
  CNOT: '#a855f7',
  CZ:   '#3b82f6',
  SWAP: '#22c55e',
  CCX:  '#f59e0b',
};

const TWO_QUBIT_GATES = new Set(['CNOT', 'CZ', 'SWAP', 'CCX']);

/** Compute a grid layout position for qubit index */
function qubitPosition(
  index: number,
  total: number,
  cols: number,
  cellW: number,
  cellH: number,
  padding: number
): [number, number] {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return [padding + col * cellW, padding + row * cellH];
}

export function QubitMapping({ result, qubitCount, gates }: QubitMappingProps) {
  const { nodes, edges, svgW, svgH } = useMemo(() => {
    const cols = Math.min(qubitCount, 6);
    const rows = Math.ceil(qubitCount / cols);
    const cellW = 60;
    const cellH = 56;
    const padding = 28;
    const svgW = padding * 2 + cols * cellW;
    const svgH = padding * 2 + rows * cellH;

    const nodes = Array.from({ length: qubitCount }, (_, i) => {
      const [x, y] = qubitPosition(i, qubitCount, cols, cellW, cellH, padding);
      const blochZ = result.blochVectors[i]?.z ?? 1;
      // Colour node by Bloch Z: +1 = |0⟩ teal, -1 = |1⟩ rose
      const t = (blochZ + 1) / 2; // [0,1]
      const r = Math.round((1 - t) * 239 + t * 34);
      const g = Math.round((1 - t) * 68  + t * 211);
      const b = Math.round((1 - t) * 68  + t * 170);
      return { index: i, x, y, blochZ, color: `rgb(${r},${g},${b})` };
    });

    // Collect two-qubit gate pairs (deduplicate by pair string)
    const edgeMap = new Map<string, { q1: number; q2: number; type: string; count: number }>();
    for (const g of gates) {
      if (!TWO_QUBIT_GATES.has(g.type)) continue;
      const q2 = g.targetQubit ?? g.qubit + 1;
      if (q2 >= qubitCount) continue;
      const key = `${Math.min(g.qubit, q2)}-${Math.max(g.qubit, q2)}-${g.type}`;
      const existing = edgeMap.get(key);
      if (existing) { existing.count++; }
      else edgeMap.set(key, { q1: g.qubit, q2, type: g.type, count: 1 });
    }
    const edges = Array.from(edgeMap.values());

    return { nodes, edges, svgW, svgH };
  }, [result, qubitCount, gates]);

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgb(34,211,170)' }} />
          <span>|0⟩ state</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgb(239,68,68)' }} />
          <span>|1⟩ state</span>
        </div>
        {Object.entries(GATE_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1">
            <div className="w-6 h-0.5" style={{ background: color }} />
            <span>{name}</span>
          </div>
        ))}
      </div>

      {/* SVG topology */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto"
        >
          <defs>
            <filter id="qnode-glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges (gate connections) */}
          {edges.map(({ q1, q2, type, count }, idx) => {
            const n1 = nodes[q1];
            const n2 = nodes[q2];
            if (!n1 || !n2) return null;
            const color = GATE_COLORS[type] ?? '#888';
            return (
              <g key={idx}>
                <motion.line
                  x1={n1.x} y1={n1.y}
                  x2={n2.x} y2={n2.y}
                  stroke={color}
                  strokeWidth={1.5 + count * 0.5}
                  strokeOpacity={0.7}
                  strokeDasharray={type === 'SWAP' ? '4 3' : undefined}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                />
                {/* Gate type label at midpoint */}
                <text
                  x={(n1.x + n2.x) / 2}
                  y={(n1.y + n2.y) / 2 - 4}
                  textAnchor="middle"
                  fontSize="7"
                  fill={color}
                  fontWeight="bold"
                >
                  {type}{count > 1 ? `×${count}` : ''}
                </text>
              </g>
            );
          })}

          {/* Qubit nodes */}
          {nodes.map(({ index, x, y, color, blochZ }) => (
            <motion.g
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.04, type: 'spring', stiffness: 300 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              {/* Outer glow ring */}
              <circle cx={x} cy={y} r={16} fill={color} opacity={0.15} />
              {/* Main node */}
              <circle
                cx={x} cy={y} r={12}
                fill={color}
                filter="url(#qnode-glow)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
              />
              {/* Qubit label */}
              <text
                x={x} y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill="white"
                fontWeight="700"
              >
                q{index}
              </text>
              {/* Bloch Z value below */}
              <text
                x={x} y={y + 22}
                textAnchor="middle"
                fontSize="7"
                fill="hsl(var(--muted-foreground))"
              >
                z={blochZ.toFixed(2)}
              </text>
            </motion.g>
          ))}

          {/* Title labels */}
          <text x={svgW / 2} y={svgH - 6} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
            Physical Qubits
          </text>
        </svg>
      </div>

      {/* Connectivity table */}
      {edges.length > 0 ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="text-[9px] text-muted-foreground px-2 pt-2 pb-1 uppercase tracking-wide">
            Gate Connections
          </div>
          <div className="grid grid-cols-3 gap-px bg-border text-[9px] font-semibold text-muted-foreground">
            <div className="bg-card p-1.5">Gate</div>
            <div className="bg-card p-1.5">Qubits</div>
            <div className="bg-card p-1.5">Count</div>
          </div>
          {edges.map(({ q1, q2, type, count }, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-px bg-border text-[9px]">
              <div className="bg-card p-1.5 font-mono" style={{ color: GATE_COLORS[type] ?? 'inherit' }}>{type}</div>
              <div className="bg-card p-1.5 font-mono">q{q1} ↔ q{q2}</div>
              <div className="bg-card p-1.5 font-mono text-muted-foreground">×{count}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          No two-qubit gates detected. Add CNOT, CZ, SWAP or CCX gates to see connectivity.
        </p>
      )}

      {/* Bloch Z table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="text-[9px] text-muted-foreground px-2 pt-2 pb-1 uppercase tracking-wide">
          Qubit States (Bloch Z)
        </div>
        <div className="grid grid-cols-4 gap-1 p-2">
          {nodes.map(({ index, color, blochZ }) => (
            <div key={index} className="text-center">
              <div className="w-5 h-5 rounded-full mx-auto mb-0.5" style={{ background: color }} />
              <div className="text-[8px] text-muted-foreground font-mono">q{index}</div>
              <div className="text-[8px] font-mono" style={{ color }}>
                {blochZ >= 0.9 ? '|0⟩' : blochZ <= -0.9 ? '|1⟩' : 'sup'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
