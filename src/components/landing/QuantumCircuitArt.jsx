/**
 * Illustrative "futuristic UI" mockup of a quantum circuit simulator:
 * four qubit wires, gate blocks, a CNOT link, and pulsing readout
 * nodes. Built as inline SVG so it stays crisp and lightweight.
 */
export default function QuantumCircuitArt() {
  const wires = [54, 130, 206, 282];
  const gates = [
    { x: 90, label: 'H' },
    { x: 168, label: 'RZ' },
    { x: 246, label: 'X' },
    { x: 324, label: 'H' },
  ];

  return (
    <svg
      className="circuit-art"
      viewBox="0 0 560 340"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of a quantum gate circuit"
    >
      <rect x="0.5" y="0.5" width="559" height="339" rx="10" className="circuit-art-frame" />

      {/* Panel chrome */}
      <circle cx="24" cy="24" r="3.5" className="chrome-dot" />
      <circle cx="38" cy="24" r="3.5" className="chrome-dot" />
      <circle cx="52" cy="24" r="3.5" className="chrome-dot" />
      <text x="280" y="28" textAnchor="middle" className="circuit-art-label">
        QUBIT STATE · LIVE SIMULATION
      </text>

      {/* Wires */}
      {wires.map((y, i) => (
        <g key={y}>
          <text x="26" y={y + 5} className="circuit-art-qlabel">q{i}</text>
          <line x1="56" y1={y} x2="520" y2={y} className="circuit-wire" />
        </g>
      ))}

      {/* CNOT vertical link between q0 and q2 */}
      <line x1="246" y1={wires[0]} x2="246" y2={wires[2]} className="circuit-link" />
      <circle cx="246" cy={wires[0]} r="6" className="circuit-control" />
      <circle cx="246" cy={wires[2]} r="11" className="circuit-target" />
      <line x1="238" y1={wires[2]} x2="254" y2={wires[2]} className="circuit-target-cross" />
      <line x1="246" y1={wires[2] - 8} x2="246" y2={wires[2] + 8} className="circuit-target-cross" />

      {/* Gate blocks */}
      {gates.map((g, gi) =>
        wires.map((y, wi) => {
          if (gi === 2 && (wi === 0 || wi === 2)) return null; // skip wires used by CNOT
          if ((gi + wi) % 3 === 2) return null; // sparse, varied layout
          return (
            <g key={`${gi}-${wi}`} className="gate-group" style={{ animationDelay: `${(gi * 0.3 + wi * 0.15).toFixed(2)}s` }}>
              <rect x={g.x - 18} y={y - 18} width="36" height="36" rx="6" className="gate-box" />
              <text x={g.x} y={y + 5} textAnchor="middle" className="gate-label">{g.label}</text>
            </g>
          );
        })
      )}

      {/* Readout pulses at the end of each wire */}
      {wires.map((y, i) => (
        <circle key={`pulse-${i}`} cx="500" cy={y} r="5" className="readout-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}

      <text x="280" y="318" textAnchor="middle" className="circuit-art-caption">
        4-QUBIT REGISTER &middot; GATE-LEVEL VISUALIZATION
      </text>
    </svg>
  );
}
