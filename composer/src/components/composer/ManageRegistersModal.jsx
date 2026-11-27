import { useState } from 'react';
import { useCircuitStore } from '../../stores/circuitStore';

export default function ManageRegistersModal({ onClose }) {
  const circuit = useCircuitStore(state => state.circuit);
  const setRegisters = useCircuitStore(state => state.setRegisters);
  
  const [numQubits, setNumQubits] = useState(circuit.numQubits);
  const [numClbits, setNumClbits] = useState(circuit.numClbits);

  const handleSave = () => {
    setRegisters(numQubits, numClbits);
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.3)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#22272e',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3rem',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.2s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '500', color: '#e6edf3' }}>Manage Registers</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#8b949e' }}>Quantum Register (Qubits)</label>
            <input 
              type="number" 
              value={numQubits} 
              onChange={e => setNumQubits(Math.max(1, Math.min(130, parseInt(e.target.value) || 1)))}
              min="1" max="130"
              style={{
                background: '#1c2128',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#e6edf3',
                padding: '0.5rem 0.75rem',
                width: '80px',
                fontSize: '1rem',
                textAlign: 'center'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#8b949e' }}>Classical Register (Bits)</label>
            <input 
              type="number" 
              value={numClbits} 
              onChange={e => setNumClbits(Math.max(0, Math.min(130, parseInt(e.target.value) || 0)))}
              min="0" max="130"
              style={{
                background: '#1c2128',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#e6edf3',
                padding: '0.5rem 0.75rem',
                width: '80px',
                fontSize: '1rem',
                textAlign: 'center'
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.5rem 1.5rem', background: '#373e47', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '6px', color: '#c9d1d9', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '0.5rem 1.5rem', background: '#2563eb', border: 'none', 
              borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500'
            }}
          >
            Apply Changes
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
