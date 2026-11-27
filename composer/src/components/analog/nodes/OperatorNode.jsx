import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function OperatorNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);
  const opType = data.operatorType || 'x';

  return (
    <div className="analog-node operator-node">
      <div className="analog-node-header">Operator</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="psi" style={{ top: '50%', background: '#06b6d4' }} />

        <div className="node-field">
          <label>Type</label>
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
      </div>
      <Handle type="source" position={Position.Right} id="O" style={{ background: '#a855f7' }} />
    </div>
  );
}
