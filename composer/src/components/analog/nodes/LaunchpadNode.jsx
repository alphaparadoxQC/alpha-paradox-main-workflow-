import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function LaunchpadNode({ data, selected }) {
  const rotation = data.orientation ? parseFloat(data.orientation) : 0;
  return (
    <div className={`analog-node ${selected ? 'selected' : ''}`} style={{ minWidth: '160px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.1s ease' }}>
      <div className="node-header" style={{ background: 'rgba(16, 185, 129, 0.2)', borderBottom: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399' }}>
        Launchpad
      </div>
      <div className="node-content">
        <div className="prop-row">
          <span className="prop-label">Pad Width:</span>
          <span className="prop-value">{data.pad_width || '200um'}</span>
        </div>
        <div className="prop-row">
          <span className="prop-label">Orientation:</span>
          <span className="prop-value">{data.orientation || '0'}°</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#34d399', width: 8, height: 8 }} />
    </div>
  );
}
