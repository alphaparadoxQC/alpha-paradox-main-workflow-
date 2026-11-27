import React, { useState, useEffect } from 'react';
import { useCircuitStore } from '../../stores/circuitStore';
import useNotebookStore from '../../stores/notebookStore';
import CircuitCanvas from '../composer/CircuitCanvas';
import GatePalette from '../composer/GatePalette';
import { qasmToCircuit, circuitToPython } from '../../quantum-engine/qasm-parser';

export default function InteractiveCircuitWidget({ cellId, qasm }) {
  const [isActive, setIsActive] = useState(false);
  const [localCircuit, setLocalCircuit] = useState(null);

  // When activated by user click, load the parsed QASM into the global composer store
  const activateWidget = () => {
    try {
      const parsed = qasmToCircuit(qasm);
      useCircuitStore.getState().loadCircuit(parsed);
      setLocalCircuit(parsed);
      setIsActive(true);
    } catch (err) {
      console.error("Failed to parse interactive circuit QASM", err);
    }
  };

  // Subscribe to global circuit store changes when this widget is active
  useEffect(() => {
    if (!isActive) return;

    const unsub = useCircuitStore.subscribe(
      (state) => state.circuit,
      (newCircuit) => {
        // Only trigger update if the circuit actually mutated (e.g., gates added/removed)
        if (newCircuit !== localCircuit) {
          setLocalCircuit(newCircuit);
          
          // Generate new Alpha Python code
          const newQiskitCode = circuitToPython(newCircuit);
          
          // Overwrite the Python cell!
          useNotebookStore.getState().updateCellContent(cellId, newQiskitCode);
        }
      }
    );
    return unsub;
  }, [isActive, cellId, localCircuit]);

  if (!isActive) {
    return (
      <div 
        className="interactive-circuit-preview"
        onClick={activateWidget}
        style={{
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px dashed #3b82f6',
          borderRadius: '8px',
          color: '#60a5fa',
          textAlign: 'center',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>⚡</span> 
        <div style={{ fontWeight: 'bold' }}>Interactive Circuit Available</div>
        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Click to enable drag-and-drop editing (this will sync with your Python cell)</div>
      </div>
    );
  }

  return (
    <div className="interactive-circuit-active" style={{
      marginTop: '1rem',
      background: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '0.5rem 1rem', 
        background: '#161b22', 
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: '#8b949e'
      }}>
        <span>Interactive Circuit Editor (Syncing to Cell)</span>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsActive(false); }}
          style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <GatePalette />
        <div style={{ height: '300px', overflowY: 'auto' }}>
          <CircuitCanvas />
        </div>
      </div>
    </div>
  );
}
