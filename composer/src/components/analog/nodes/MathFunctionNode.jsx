import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function MathFunctionNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node math-function-node">
      <div className="analog-node-header" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
        Function <span style={{fontStyle:'italic', marginLeft: '0.3rem'}}>f(...)</span>
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', position: 'relative' }}>
        <Handle type="target" position={Position.Left} id="input" style={{ top: '50%', background: '#9ca3af' }} />
        <input
          type="text"
          value={data.expression ?? 'sin(x)'}
          onChange={(e) => updateNodeData(id, { expression: e.target.value })}
          className="expression-input"
          placeholder="sin(x)"
        />
      </div>
      <Handle type="source" position={Position.Right} id="output" style={{ background: '#f59e0b' }} />
    </div>
  );
}
