import { Handle, Position } from '@xyflow/react';

export default function PlaceholderPlotNode({ id, data }) {
  return (
    <div className="analog-node placeholder-plot-node">
      <div className="analog-node-header" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
        N/A Plot
      </div>
      <div className="analog-node-body" style={{ padding: '0.6rem', textAlign: 'center', minWidth: '100px' }}>
        <Handle type="target" position={Position.Left} id="in" style={{ top: '50%', background: '#9ca3af' }} />
        <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 'bold' }}>[N/A]</div>
        <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '0.2rem' }}>NO IMAGE AVAILABLE</div>
      </div>
    </div>
  );
}
