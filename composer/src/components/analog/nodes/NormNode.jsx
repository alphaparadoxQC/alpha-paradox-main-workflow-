import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function NormNode({ id, data }) {
  const result = useAnalogStore((s) => s.simulationResult);
  
  let val = result?.math_scalars?.[id] ?? null;
  if (val === null && result?.math_scalars_time_series?.[id]) {
    const series = result.math_scalars_time_series[id];
    val = series[series.length - 1];
  }

  return (
    <div className="analog-node norm-node">
      <div className="analog-node-header" style={{ background: 'rgba(236, 72, 153, 0.08)' }}>
        Norm <span style={{fontStyle:'italic', marginLeft: '0.3rem'}}>∫|ψ|²</span>
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', position: 'relative' }}>
        <Handle type="target" position={Position.Left} id="psi" style={{ top: '50%', background: '#06b6d4' }} />
        <div style={{ textAlign: 'center', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          ∫ |ψ|² dx
        </div>
        {val !== null && (
          <div style={{
            textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b',
            fontFamily: 'monospace', marginTop: '0.3rem',
          }}>
            {typeof val === 'number' ? val.toFixed(4) : '—'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="scalar" style={{ background: '#f59e0b' }} />
    </div>
  );
}
