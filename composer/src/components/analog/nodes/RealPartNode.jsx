import { Handle, Position } from '@xyflow/react';

export default function RealPartNode({ id, data }) {
  return (
    <div className="analog-node real-part-node">
      <div className="analog-node-header" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
        Real Part
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', position: 'relative' }}>
        <Handle type="target" position={Position.Left} id="complex" style={{ top: '50%', background: '#3b82f6' }} />
        <div style={{ textAlign: 'center', fontSize: '1rem', fontFamily: 'monospace' }}>
          Re
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="scalar" style={{ background: '#f59e0b' }} />
    </div>
  );
}
