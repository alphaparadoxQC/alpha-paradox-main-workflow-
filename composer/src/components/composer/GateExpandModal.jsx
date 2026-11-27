import { getGate } from '../../quantum-engine/gates';
import { getGateUIParams } from './GatePalette';

export default function GateExpandModal({ operation, onClose }) {
  const gateDef = getGate(operation.gate, operation.params);
  const decomposition = gateDef?.decomposition;

  return (
    <div className="gate-modal-overlay" onClick={onClose}>
      <div className="gate-modal gate-expand-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gate-modal-header">
          <h3>Expand Gate — {operation.gate}</h3>
          <button className="gate-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="gate-modal-body">
          {!decomposition || decomposition.length === 0 ? (
            <div className="gate-expand-primitive">
              <div className="gate-expand-primitive-icon">⚛</div>
              <h4>Primitive Gate</h4>
              <p>
                <strong>{operation.gate}</strong> is a fundamental quantum gate and cannot 
                be decomposed further. It is directly implemented in hardware.
              </p>
            </div>
          ) : (
            <>
              <p className="gate-expand-intro">
                <strong>{operation.gate}</strong> can be decomposed into the following 
                sequence of simpler gates:
              </p>

              {/* Mini circuit diagram */}
              <div className="gate-expand-circuit">
                {decomposition.map((step, idx) => {
                  const ui = getGateUIParams(step.gate);
                  return (
                    <div key={idx} className="gate-expand-step">
                      <div className="gate-expand-step-number">{idx + 1}</div>
                      <div 
                        className="gate-expand-step-gate"
                        style={{ background: ui.color }}
                      >
                        {ui.symbol}
                      </div>
                      <div className="gate-expand-step-info">
                        <span className="gate-expand-step-name">{step.gate}</span>
                        <span className="gate-expand-step-target">
                          {step.control !== undefined && `ctrl: q${step.control} → `}
                          {step.controls && `ctrl: ${step.controls.map(c => `q${c}`).join(',')} → `}
                          {step.target !== undefined && `tgt: q${step.target}`}
                          {step.targets && `tgt: ${step.targets.map(t => `q${t}`).join(',')}`}
                          {step.params && ` (${step.params})`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="gate-expand-summary">
                <span>Total steps: <strong>{decomposition.length}</strong></span>
                <span>Unique gates: <strong>
                  {new Set(decomposition.map(s => s.gate)).size}
                </strong></span>
              </div>
            </>
          )}
        </div>

        <div className="gate-modal-footer">
          <button className="gate-modal-btn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
