import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function StringNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node string-node">
      <div className="analog-node-header" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
        String
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem' }}>
        <input
          type="text"
          value={data.value ?? 'Label'}
          onChange={(e) => updateNodeData(id, { value: e.target.value })}
          className="expression-input"
          placeholder="Text..."
        />
      </div>
      <Handle type="source" position={Position.Right} id="string" style={{ background: '#9ca3af' }} />
    </div>
  );
}
