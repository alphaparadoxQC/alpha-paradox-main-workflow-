import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function PotentialNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node potential-node">
      <div className="analog-node-header">Potential</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="x" style={{ top: '30%', background: '#f59e0b' }} />
        <Handle type="target" position={Position.Left} id="a" style={{ top: '65%', background: '#10b981' }} />
        <div className="node-field">
          <input
            type="text"
            value={data.expression ?? '0.5*a**2*x**2'}
            onChange={(e) => updateNodeData(id, { expression: e.target.value })}
            className="expression-input"
            placeholder="e.g. 0.5*a^2*x^2"
            spellCheck={false}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="V" style={{ background: '#3b82f6' }} />
    </div>
  );
}
