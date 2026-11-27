import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function TransmonPocketNode({ data, selected }) {
  const rotation = data.orientation ? parseFloat(data.orientation) : 0;
  return (
    <div className={`analog-node ${selected ? 'selected' : ''}`} style={{ minWidth: '180px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.1s ease' }}>
      <div className="node-header" style={{ background: 'rgba(59, 130, 246, 0.2)', borderBottom: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa' }}>
        Transmon Pocket
      </div>
      <div className="node-content">
        <div className="prop-row">
          <span className="prop-label">Pad Width:</span>
          <span className="prop-value">{data.pad_width || '400um'}</span>
        </div>
        <div className="prop-row">
          <span className="prop-label">Gap:</span>
          <span className="prop-value">{data.pad_gap || '30um'}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Top} id="readout" style={{ background: '#3b82f6', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="control" style={{ background: '#ec4899', width: 8, height: 8 }} />
    </div>
  );
}
