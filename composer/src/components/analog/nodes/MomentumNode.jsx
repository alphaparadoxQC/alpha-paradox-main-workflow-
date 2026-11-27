import { Handle, Position } from '@xyflow/react';

export default function MomentumNode({ id, data }) {
  return (
    <div className="analog-node momentum-node">
      <div className="analog-node-header" style={{ background: 'rgba(168, 85, 247, 0.08)' }}>
        Momentum <span style={{fontStyle:'italic', marginLeft: '0.3rem'}}>p̂</span>
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', textAlign: 'center', fontSize: '0.8rem', color: '#e6edf3' }}>
        -iℏ(∂/∂x)
      </div>
      <Handle type="source" position={Position.Right} id="operator" style={{ background: '#a855f7' }} />
    </div>
  );
}
