import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function TimeEvolutionNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node time-evolution-node">
      <div className="analog-node-header">Time Evolution</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="H" style={{ top: '25%', background: '#8b5cf6' }} />
        <Handle type="target" position={Position.Left} id="psi0" style={{ top: '55%', background: '#06b6d4' }} />
        <Handle type="target" position={Position.Left} id="dt_in" style={{ top: '85%', background: '#f59e0b' }} />

        <div className="node-field">
          <label>dt</label>
          <input
            type="number"
            step="0.001"
            min="0.0001"
            value={data.dt ?? 0.01}
            onChange={(e) => updateNodeData(id, { dt: parseFloat(e.target.value) || 0.01 })}
          />
        </div>

        <div className="node-formula" style={{ fontSize: '0.75rem' }}>
          ψ(t+dt) = e<sup>-iHdt</sup>ψ(t)
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="psi_t" style={{ top: '35%', background: '#06b6d4' }} />
      <Handle type="source" position={Position.Right} id="H_out" style={{ top: '65%', background: '#8b5cf6' }} />
    </div>
  );
}
