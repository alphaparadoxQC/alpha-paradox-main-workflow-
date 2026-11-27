import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function CPWNode({ data, selected }) {
  return (
    <div className={`analog-node ${selected ? 'selected' : ''}`} style={{ minWidth: '160px' }}>
      <div className="node-header" style={{ background: 'rgba(139, 92, 246, 0.2)', borderBottom: '1px solid rgba(139, 92, 246, 0.4)', color: '#a78bfa' }}>
        <span className="node-icon">〰️</span>
        CPW Route
      </div>
      <div className="node-content">
        <div className="prop-row">
          <span className="prop-label">Length:</span>
          <span className="prop-value">{data.meander_length || '1.5mm'}</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#a78bfa', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#a78bfa', width: 8, height: 8 }} />
    </div>
  );
}
