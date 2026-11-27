import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function ScalarNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node scalar-node">
      <div className="analog-node-body" style={{ padding: '0.5rem' }}>
        <div className="node-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="text"
            value={data.label ?? 'a'}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            className="scalar-label-input"
            style={{ minWidth: '40px', maxWidth: '90px', padding: '2px 4px', textAlign: 'center', fontWeight: 700, fontStyle: 'italic', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', color: '#38bdf8' }}
            title={data.title || data.label}
          />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>=</span>
          <input
            type="number"
            value={data.value ?? 0}
            step="0.01"
            onChange={(e) => updateNodeData(id, { value: parseFloat(e.target.value) || 0 })}
            style={{ width: '65px', padding: '2px 4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', color: '#f3f4f6' }}
            title={data.title || String(data.value)}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="value" style={{ background: '#10b981' }} />
    </div>
  );
}
