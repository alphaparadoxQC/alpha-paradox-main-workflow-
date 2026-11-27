import { useState } from 'react';
import { useCircuitStore } from '../../stores/circuitStore';

const PARAM_GATES = ['RX', 'RY', 'RZ', 'P', 'U', 'CP', 'CRX', 'CRY', 'CRZ', 'CU', 'RXX', 'RYY', 'RZZ'];

const PARAM_FIELDS = {
  RX: ['theta'], RY: ['theta'], RZ: ['theta'],
  P: ['lambda'], U: ['theta', 'phi', 'lambda'],
  CP: ['theta'], CRX: ['theta'], CRY: ['theta'], CRZ: ['theta'],
  CU: ['theta', 'phi', 'lambda'],
  RXX: ['theta'], RYY: ['theta'], RZZ: ['theta'],
};

export default function EditGateModal({ operation, onClose }) {
  const circuit = useCircuitStore(state => state.circuit);
  const editGateQubit = useCircuitStore(state => state.editGateQubit);
  const editGateParams = useCircuitStore(state => state.editGateParams);

  const isMultiQubit = operation.qubits.length > 1;

  const [selectedQubits, setSelectedQubits] = useState(
    operation.qubits.map(q => q)
  );
  const [params, setParams] = useState({ ...operation.params });

  const paramFields = PARAM_FIELDS[operation.gate] || [];
  const hasParams = paramFields.length > 0;

  const handleQubitChange = (index, value) => {
    const updated = [...selectedQubits];
    updated[index] = parseInt(value, 10);
    setSelectedQubits(updated);
  };

  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const formatParamLabel = (key) => {
    const labels = { theta: 'θ (theta)', phi: 'φ (phi)', lambda: 'λ (lambda)' };
    return labels[key] || key;
  };

  const handleSave = () => {
    // Validate qubits are unique and in range
    const uniqueQubits = new Set(selectedQubits);
    if (uniqueQubits.size !== selectedQubits.length) {
      alert('Qubits must be unique');
      return;
    }
    for (const q of selectedQubits) {
      if (q < 0 || q >= circuit.numQubits) {
        alert(`Qubit q${q} is out of range`);
        return;
      }
    }

    editGateQubit(operation.id, selectedQubits);

    if (hasParams) {
      editGateParams(operation.id, params);
    }

    onClose();
  };

  return (
    <div className="gate-modal-overlay" onClick={onClose}>
      <div className="gate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gate-modal-header">
          <h3>Edit Gate</h3>
          <button className="gate-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="gate-modal-body">
          {/* Qubit selectors */}
          {selectedQubits.map((q, idx) => (
            <div key={idx} className="gate-modal-field">
              <label>
                {isMultiQubit
                  ? (idx < selectedQubits.length - 1 ? `Control ${idx}` : 'Target')
                  : 'Quantum bit'}
              </label>
              <select
                value={q}
                onChange={(e) => handleQubitChange(idx, e.target.value)}
              >
                {Array.from({ length: circuit.numQubits }, (_, i) => (
                  <option key={i} value={i}>q{i}</option>
                ))}
              </select>
            </div>
          ))}

          {/* Parameter inputs */}
          {hasParams && (
            <>
              <div className="gate-modal-divider" />
              {paramFields.map(key => (
                <div key={key} className="gate-modal-field">
                  <label>{formatParamLabel(key)}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={params[key] ?? 0}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                  />
                  <span className="gate-modal-hint">
                    π = {Math.PI.toFixed(4)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="gate-modal-footer">
          <button className="gate-modal-btn secondary" onClick={onClose}>Close</button>
          <button className="gate-modal-btn primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
