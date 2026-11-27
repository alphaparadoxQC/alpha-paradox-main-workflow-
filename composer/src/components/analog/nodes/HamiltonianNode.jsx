import { Handle, Position } from '@xyflow/react';

export default function HamiltonianNode({ id, data }) {
  return (
    <div className="analog-node hamiltonian-node">
      <div className="analog-node-header">Hamiltonian</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="V" style={{ top: '40%', background: '#3b82f6' }} />
        <div className="node-formula">H = T + V</div>
      </div>
      <Handle type="source" position={Position.Right} id="H" style={{ top: '40%', background: '#8b5cf6' }} />
      <Handle type="source" position={Position.Right} id="V_out" style={{ top: '70%', background: '#3b82f6' }} />
    </div>
  );
}
