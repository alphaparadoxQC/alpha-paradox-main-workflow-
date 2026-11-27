import { Handle, Position } from '@xyflow/react';

export default function WavefunctionPlotNode({ id, data }) {
  return (
    <div className="analog-node wavefunction-plot-node">
      <div className="analog-node-header" style={{ background: 'rgba(6, 182, 212, 0.08)' }}>
        Wavefunction Plot
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', textAlign: 'center', minWidth: '150px' }}>
        <Handle type="target" position={Position.Left} id="in" style={{ top: '50%', background: '#06b6d4' }} />
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
          (Under Construction)
        </div>
      </div>
    </div>
  );
}
