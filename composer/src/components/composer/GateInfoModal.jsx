import { getGate } from '../../quantum-engine/gates';

/**
 * Gate descriptions for parameterized factories that don't have them in GATES object
 */
const PARAM_GATE_DESCRIPTIONS = {
  RX: 'Rotation-X gate. Rotates the qubit state by angle θ around the X-axis of the Bloch sphere.',
  RY: 'Rotation-Y gate. Rotates the qubit state by angle θ around the Y-axis of the Bloch sphere.',
  RZ: 'Rotation-Z gate. Rotates the qubit state by angle θ around the Z-axis of the Bloch sphere.',
  P: 'Phase gate. Applies a phase shift of λ to the |1⟩ state. Generalization of S and T gates.',
  U: 'Universal single-qubit gate. Parameterized by θ, φ, λ. Can represent any single-qubit rotation.',
  CP: 'Controlled-Phase gate. Applies a phase shift of θ to |11⟩ state. Generalization of CZ.',
  CRX: 'Controlled-RX gate. Applies RX(θ) to the target when control is |1⟩.',
  CRY: 'Controlled-RY gate. Applies RY(θ) to the target when control is |1⟩.',
  CRZ: 'Controlled-RZ gate. Applies RZ(θ) to the target when control is |1⟩.',
  CU: 'Controlled-U gate. Applies U(θ,φ,λ) to the target when control is |1⟩.',
  RXX: 'Ising XX coupling gate. Generates entanglement via simultaneous X-rotation on two qubits.',
  RYY: 'Ising YY coupling gate. Generates entanglement via simultaneous Y-rotation on two qubits.',
  RZZ: 'Ising ZZ coupling gate. Generates entanglement via simultaneous Z-rotation on two qubits.',
};

function formatComplex(c) {
  if (!c) return '0';
  const re = c.re !== undefined ? c.re : (c.real !== undefined ? c.real : 0);
  const im = c.im !== undefined ? c.im : (c.imag !== undefined ? c.imag : 0);
  
  if (Math.abs(re) < 1e-6 && Math.abs(im) < 1e-6) return '0';
  if (Math.abs(im) < 1e-6) return re.toFixed(3).replace(/\.?0+$/, '');
  if (Math.abs(re) < 1e-6) return `${im.toFixed(3).replace(/\.?0+$/, '')}i`;
  return `${re.toFixed(3).replace(/\.?0+$/, '')}${im >= 0 ? '+' : ''}${im.toFixed(3).replace(/\.?0+$/, '')}i`;
}

export default function GateInfoModal({ operation, onClose }) {
  const gateDef = getGate(operation.gate, operation.params);
  const description = gateDef?.description || PARAM_GATE_DESCRIPTIONS[operation.gate] || 'No description available.';
  const matrix = gateDef?.matrix;
  const category = gateDef?.category || 'unknown';
  const qubits = gateDef?.qubits;

  return (
    <div className="gate-modal-overlay" onClick={onClose}>
      <div className="gate-modal gate-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gate-modal-header">
          <h3>Gate Information</h3>
          <button className="gate-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="gate-modal-body">
          {/* Gate Identity */}
          <div className="gate-info-identity">
            <div className="gate-info-badge">{operation.gate}</div>
            <div className="gate-info-meta">
              <span className="gate-info-category">{category}</span>
              <span className="gate-info-qubits">
                {qubits === 'all' ? 'All qubits' : `${qubits}-qubit gate`}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="gate-info-section">
            <h4>Description</h4>
            <p>{description}</p>
          </div>

          {/* Applied to */}
          <div className="gate-info-section">
            <h4>Applied To</h4>
            <div className="gate-info-qubits-list">
              {operation.qubits.map((q, i) => (
                <span key={i} className="gate-info-qubit-chip">
                  q{q}
                  {operation.qubits.length > 1 && (
                    <small>{i < operation.qubits.length - 1 ? ' (ctrl)' : ' (tgt)'}</small>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Parameters */}
          {operation.params && Object.keys(operation.params).length > 0 && (
            <div className="gate-info-section">
              <h4>Parameters</h4>
              <div className="gate-info-params">
                {Object.entries(operation.params).map(([key, val]) => (
                  <div key={key} className="gate-info-param-row">
                    <span className="gate-info-param-key">
                      {key === 'theta' ? 'θ' : key === 'phi' ? 'φ' : key === 'lambda' ? 'λ' : key}
                    </span>
                    <span className="gate-info-param-val">
                      {typeof val === 'number' ? val.toFixed(4) : String(val)}
                      {typeof val === 'number' && (
                        <small> ({(val / Math.PI).toFixed(3)}π)</small>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matrix */}
          {matrix && (
            <div className="gate-info-section">
              <h4>Matrix</h4>
              <div className="gate-matrix-grid" style={{ 
                gridTemplateColumns: `repeat(${matrix[0].length}, 1fr)` 
              }}>
                {matrix.map((row, i) => 
                  row.map((cell, j) => (
                    <div key={`${i}-${j}`} className="gate-matrix-cell">
                      {formatComplex(cell)}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="gate-modal-footer">
          <button className="gate-modal-btn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
