import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function ForLoopNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  const fromI = data.fromI ?? 0;
  const toI = data.toI ?? 100;
  const deltaI = data.deltaI ?? 1;
  const pause = data.pauseDuration ?? 0;
  const currentI = data._currentI ?? fromI;

  return (
    <div className="analog-node for-loop-node">
      <div className="analog-node-header">
        For Loop
        {data._running && <span style={{ color: '#10b981', fontSize: '0.65rem', marginLeft: '0.3rem' }}>●</span>}
      </div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="trigger" style={{ top: '50%', background: '#f59e0b' }} />

        <div className="node-field">
          <label>From i</label>
          <input
            type="number"
            value={fromI}
            onChange={(e) => updateNodeData(id, { fromI: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div className="node-field">
          <label>Pause duration:</label>
        </div>
        <div className="node-field">
          <label>To i</label>
          <input
            type="number"
            value={toI}
            onChange={(e) => updateNodeData(id, { toI: parseInt(e.target.value, 10) || 100 })}
          />
        </div>
        <div className="node-field">
          <input
            type="number"
            value={pause}
            step="0.01"
            min="0"
            onChange={(e) => updateNodeData(id, { pauseDuration: parseFloat(e.target.value) || 0 })}
            style={{ width: '55px' }}
          />
        </div>
        <div className="node-field">
          <label>Δi</label>
          <input
            type="number"
            value={deltaI}
            min={1}
            onChange={(e) => updateNodeData(id, { deltaI: parseInt(e.target.value, 10) || 1 })}
          />
        </div>

        <div style={{
          fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)',
          textAlign: 'center', marginTop: '0.3rem',
          fontFamily: 'monospace',
        }}>
          i = {currentI}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="i" style={{ top: '50%', background: '#10b981' }} />
    </div>
  );
}
