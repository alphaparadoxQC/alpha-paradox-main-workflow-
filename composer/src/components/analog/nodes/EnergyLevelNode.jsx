import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function EnergyLevelNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node energy-level-node">
      <div className="analog-node-header" style={{ background: 'rgba(6, 182, 212, 0.08)' }}>
        Energy Level <span style={{fontStyle:'italic', marginLeft: '0.3rem'}}>Eₘ</span>
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', position: 'relative' }}>
        <Handle type="target" position={Position.Left} id="spectrum" style={{ top: '50%', background: '#ec4899' }} />
        
        <div className="node-field">
          <label>m =</label>
          <input
            type="number"
            value={data.m ?? 0}
            min={0}
            onChange={(e) => updateNodeData(id, { m: parseInt(e.target.value, 10) || 0 })}
            style={{ width: '50px' }}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="scalar" style={{ top: '30%', background: '#f59e0b' }} />
      <Handle type="source" position={Position.Right} id="psi_m" style={{ top: '70%', background: '#06b6d4' }} />
    </div>
  );
}
