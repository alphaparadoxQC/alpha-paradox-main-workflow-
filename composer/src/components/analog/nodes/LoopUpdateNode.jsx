import { Handle, Position } from '@xyflow/react';

export default function LoopUpdateNode({ id, data }) {
  return (
    <div className="analog-node loop-update-node" style={{ borderRadius: '50%', minWidth: '40px', minHeight: '40px', padding: 0 }}>
      <div className="analog-node-body" style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Handle type="target" position={Position.Left} id="in" style={{ background: '#10b981' }} />
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#10b981' }}>Step</div>
        <Handle type="source" position={Position.Right} id="out" style={{ background: '#10b981' }} />
      </div>
    </div>
  );
}
