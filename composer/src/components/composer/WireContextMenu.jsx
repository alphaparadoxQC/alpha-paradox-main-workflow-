import { useCircuitStore } from '../../stores/circuitStore';

export default function WireContextMenu({ x, y, gateId, onClose }) {
  const removeGate = useCircuitStore(state => state.removeGate);
  const circuit = useCircuitStore(state => state.circuit);
  
  const gateOp = circuit.operations.find(op => op.id === gateId);

  if (!gateOp) return null;

  const handleDelete = () => {
    removeGate(gateId);
    onClose();
  };

  return (
    <>
      {/* Invisible backdrop to close on click outside */}
      <div className="context-menu-backdrop" onClick={onClose}></div>
      
      <div 
        className="wire-context-menu" 
        style={{ left: x, top: y }}
      >
        <div className="menu-header">
          <strong>{gateOp.gate}</strong> Gate
        </div>
        
        <div className="menu-items">
          <button className="menu-item" onClick={() => {/* TODO: Edit params */}}>
            <span className="icon">✏️</span> Edit Parameters
          </button>
          
          <button className="menu-item" onClick={() => {/* TODO: Info */}}>
            <span className="icon">ℹ️</span> View Matrix
          </button>
          
          <div className="menu-divider"></div>
          
          <button className="menu-item danger" onClick={handleDelete}>
            <span className="icon">🗑️</span> Delete
          </button>
        </div>
      </div>
    </>
  );
}
