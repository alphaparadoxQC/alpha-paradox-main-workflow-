import { Handle, Position } from '@xyflow/react';

export default function MultiLinePlotNode({ id, data }) {
  return (
    <div className="analog-node multi-line-plot-node">
      <div className="analog-node-header" style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
        Multi-line Plot
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', textAlign: 'center', minWidth: '150px' }}>
        <Handle type="target" position={Position.Left} id="in1" style={{ top: '35%', background: '#3b82f6' }} />
        <Handle type="target" position={Position.Left} id="in2" style={{ top: '65%', background: '#ec4899' }} />
        
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
          (Under Construction)
        </div>
      </div>
    </div>
  );
}
