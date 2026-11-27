import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function ArrayNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node array-node">
      <div className="analog-node-header" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
        Array <span style={{fontStyle:'italic', marginLeft: '0.3rem'}}>{'{aₙ}'}</span>
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem' }}>
        <input
          type="text"
          value={data.values ?? '1, 2, 3'}
          onChange={(e) => updateNodeData(id, { values: e.target.value })}
          className="expression-input"
          placeholder="1, 2, 3"
        />
      </div>
      <Handle type="source" position={Position.Right} id="array" style={{ background: '#f59e0b' }} />
    </div>
  );
}
