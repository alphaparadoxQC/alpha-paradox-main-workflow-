import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function SpectrumNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  return (
    <div className="analog-node spectrum-node">
      <div className="analog-node-header">Spectrum</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="H" style={{ top: '50%', background: '#8b5cf6' }} />
        <div className="node-field">
          <label>N<sub>eigenstates</sub></label>
          <input
            type="number"
            min={1}
            max={20}
            value={data.nEigenstates ?? 3}
            onChange={(e) =>
              updateNodeData(id, { nEigenstates: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="eigenstates" style={{ top: '35%', background: '#ec4899' }} />
      <Handle type="source" position={Position.Right} id="eigenvalues" style={{ top: '65%', background: '#f59e0b' }} />
    </div>
  );
}
