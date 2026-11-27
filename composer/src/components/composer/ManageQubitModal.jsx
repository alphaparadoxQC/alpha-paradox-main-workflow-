import { useState } from 'react';

export default function ManageQubitModal({ qubitIndex, onClose }) {
  // Mock state for now
  const [alphaRe, setAlphaRe] = useState(1);
  const [alphaIm, setAlphaIm] = useState(0);
  const [betaRe, setBetaRe] = useState(0);
  const [betaIm, setBetaIm] = useState(0);

  return (
    <div className="modal-overlay">
      <div className="configure-modal small-modal">
        <div className="modal-header">
          <h2>Edit Qubit q{qubitIndex} State</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="formula-display">
            |ψ⟩ = α|0⟩ + β|1⟩
          </div>
          
          <div className="state-inputs">
            <div className="state-row">
              <label>α =</label>
              <input type="number" step="0.1" value={alphaRe} onChange={e => setAlphaRe(parseFloat(e.target.value))} />
              <span>+</span>
              <input type="number" step="0.1" value={alphaIm} onChange={e => setAlphaIm(parseFloat(e.target.value))} />
              <span>i</span>
            </div>
            
            <div className="state-row">
              <label>β =</label>
              <input type="number" step="0.1" value={betaRe} onChange={e => setBetaRe(parseFloat(e.target.value))} />
              <span>+</span>
              <input type="number" step="0.1" value={betaIm} onChange={e => setBetaIm(parseFloat(e.target.value))} />
              <span>i</span>
            </div>
          </div>
          
          <p className="validation-text" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
            Ensure |α|² + |β|² = 1
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose}>Save State</button>
        </div>
      </div>
    </div>
  );
}
