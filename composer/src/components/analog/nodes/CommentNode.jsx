import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function CommentNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node comment-node" style={{ borderColor: 'rgba(255,255,255,0.3)', minWidth: '150px' }}>
      <div className="analog-node-body" style={{ padding: '0.4rem' }}>
        <textarea
          value={data.text ?? ''}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
          placeholder="Comment..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.75rem',
            resize: 'vertical',
            outline: 'none'
          }}
          rows={3}
        />
      </div>
    </div>
  );
}
