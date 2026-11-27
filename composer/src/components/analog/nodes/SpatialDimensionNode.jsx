import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function SpatialDimensionNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  const handleChange = (field, val) => {
    updateNodeData(id, { [field]: parseFloat(val) || 0 });
  };

  return (
    <div className="analog-node spatial-dimension-node">
      <div className="analog-node-header">Spatial Dimension</div>
      <div className="analog-node-body">
        <div className="node-field">
          <label>x<sub>min</sub></label>
          <input
            type="number"
            value={data.xmin ?? -5}
            onChange={(e) => handleChange('xmin', e.target.value)}
          />
        </div>
        <div className="node-field">
          <label>x<sub>max</sub></label>
          <input
            type="number"
            value={data.xmax ?? 5}
            onChange={(e) => handleChange('xmax', e.target.value)}
          />
        </div>
        <div className="node-field">
          <label>n</label>
          <input
            type="number"
            value={data.n ?? 256}
            onChange={(e) => handleChange('n', e.target.value)}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="x" style={{ top: '35%', background: '#f59e0b' }} />
      <Handle type="source" position={Position.Right} id="grid" style={{ top: '65%', background: '#10b981' }} />
    </div>
  );
}
