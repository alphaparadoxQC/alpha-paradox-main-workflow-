import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function ExpectationValueNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);
  const result = useAnalogStore((s) => s.simulationResult);
  const opType = data.operatorType || 'x';

  const expValue = result?.expectations?.[id] ?? null;

  const opLabels = {
    x: '⟨x̂⟩',
    p: '⟨p̂⟩',
    H: '⟨Ĥ⟩',
    custom: '⟨Ô⟩',
  };

  return (
    <div className="analog-node expectation-node">
      <div className="analog-node-header">{opLabels[opType] || '⟨O⟩'}</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="psi" style={{ top: '35%', background: '#06b6d4' }} />
        <Handle type="target" position={Position.Left} id="O" style={{ top: '65%', background: '#a855f7' }} />

        <div className="node-field">
          <label>Observable</label>
          <select
            value={opType}
            onChange={(e) => updateNodeData(id, { operatorType: e.target.value })}
            style={{
              background: '#1a1f2b', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '3px', color: '#e6edf3', fontSize: '0.72rem', padding: '0.2rem',
            }}
          >
            <option value="x">x̂ (Position)</option>
            <option value="p">p̂ (Momentum)</option>
            <option value="H">Ĥ (Energy)</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {opType === 'custom' && (
          <div className="node-field">
            <input
              type="text"
              value={data.expression ?? 'x**2'}
              onChange={(e) => updateNodeData(id, { expression: e.target.value })}
              className="expression-input"
              placeholder="e.g. x**2"
              spellCheck={false}
            />
          </div>
        )}

        {expValue !== null && (
          <div style={{
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#f59e0b',
            fontFamily: 'monospace',
            marginTop: '0.3rem',
          }}>
            {typeof expValue === 'number' ? expValue.toFixed(6) : '—'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="scalar" style={{ background: '#f59e0b' }} />
    </div>
  );
}
