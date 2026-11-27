import { Handle, Position } from '@xyflow/react';

export default function OperatorWavefunctionNode({ id, data }) {
  return (
    <div className="analog-node operator-wf-node">
      <div className="analog-node-header" style={{ background: 'rgba(6, 182, 212, 0.08)' }}>
        Operator on State <span style={{fontStyle:'italic', marginLeft: '0.3rem'}}>Ô·ψ</span>
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', position: 'relative' }}>
        <Handle type="target" position={Position.Left} id="O" style={{ top: '35%', background: '#a855f7' }} />
        <Handle type="target" position={Position.Left} id="psi" style={{ top: '65%', background: '#06b6d4' }} />
        <div style={{ textAlign: 'center', fontSize: '1rem', fontFamily: 'monospace' }}>
          Ô|ψ⟩
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="psi_out" style={{ background: '#06b6d4' }} />
    </div>
  );
}
