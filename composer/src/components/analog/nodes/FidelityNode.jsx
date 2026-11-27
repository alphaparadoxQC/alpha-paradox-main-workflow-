import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function FidelityNode({ id, data }) {
  const result = useAnalogStore((s) => s.simulationResult);
  const fidelityValue = result?.fidelities?.[id] ??
    (result?.time_series?.fidelity?.[result.time_series.fidelity.length - 1]) ??
    null;

  return (
    <div className="analog-node fidelity-node">
      <div className="analog-node-header">Fidelity</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="psi" style={{ top: '35%', background: '#06b6d4' }} />
        <Handle type="target" position={Position.Left} id="phi" style={{ top: '65%', background: '#ec4899' }} />

        <div className="node-formula" style={{ fontSize: '0.8rem' }}>
          |⟨ψ|φ⟩|²
        </div>

        {fidelityValue !== null && (
          <div style={{
            textAlign: 'center',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#10b981',
            fontFamily: 'monospace',
            marginTop: '0.3rem',
          }}>
            {typeof fidelityValue === 'number' ? fidelityValue.toFixed(6) : '—'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="scalar" style={{ background: '#10b981' }} />
    </div>
  );
}
