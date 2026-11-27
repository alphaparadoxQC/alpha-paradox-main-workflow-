import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function WavefunctionNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);
  const wfType = data.wfType || 'gaussian';

  return (
    <div className="analog-node wavefunction-node">
      <div className="analog-node-header">ψ₀ Initial State</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="x" style={{ top: '25%', background: '#f59e0b' }} />

        <div className="node-field">
          <label>Type</label>
          <select
            value={wfType}
            onChange={(e) => updateNodeData(id, { wfType: e.target.value })}
            style={{
              background: '#1a1f2b', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '3px', color: '#e6edf3', fontSize: '0.72rem', padding: '0.2rem',
            }}
          >
            <option value="gaussian">Gaussian</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {wfType === 'gaussian' ? (
          <>
            <div className="node-field">
              <label>x₀</label>
              <input
                type="number" step="0.1"
                value={data.x0 ?? 0}
                onChange={(e) => updateNodeData(id, { x0: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="node-field">
              <label>σ</label>
              <input
                type="number" step="0.1" min="0.01"
                value={data.sigma ?? 0.5}
                onChange={(e) => updateNodeData(id, { sigma: parseFloat(e.target.value) || 0.5 })}
              />
            </div>
            <div className="node-field">
              <label>k₀</label>
              <input
                type="number" step="0.5"
                value={data.k0 ?? 0}
                onChange={(e) => updateNodeData(id, { k0: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </>
        ) : (
          <div className="node-field">
            <input
              type="text"
              value={data.expression ?? 'exp(-x**2)'}
              onChange={(e) => updateNodeData(id, { expression: e.target.value })}
              className="expression-input"
              placeholder="e.g. exp(-x**2)"
              spellCheck={false}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="psi0" style={{ background: '#06b6d4' }} />
    </div>
  );
}
