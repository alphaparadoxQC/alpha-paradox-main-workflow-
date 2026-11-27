import { Handle, Position } from '@xyflow/react';
import useAnalogStore from '../../../stores/analogStore';

export default function LinearCombinationNode({ id, data }) {
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);

  const nEig = data.nEigenstates ?? 3;
  const coeffs = data.coefficients ?? [];

  // Ensure we always have the right number of coefficient rows
  while (coeffs.length < nEig) {
    coeffs.push({ re: 0, im: 0 });
  }

  const handleCoeffChange = (index, part, val) => {
    const updated = [...coeffs];
    updated[index] = { ...updated[index], [part]: parseFloat(val) || 0 };
    updateNodeData(id, { coefficients: updated });
  };

  const handleNChange = (val) => {
    const n = parseInt(val, 10) || 1;
    const newCoeffs = [...coeffs];
    while (newCoeffs.length < n) newCoeffs.push({ re: 0, im: 0 });
    updateNodeData(id, { nEigenstates: n, coefficients: newCoeffs.slice(0, n) });
  };

  const normalizeCoeffs = () => {
    let normSq = 0;
    for (const c of coeffs) {
      normSq += c.re * c.re + c.im * c.im;
    }
    if (normSq < 1e-15) return;
    const norm = Math.sqrt(normSq);
    const normalized = coeffs.map((c) => ({
      re: Math.round((c.re / norm) * 1e6) / 1e6,
      im: Math.round((c.im / norm) * 1e6) / 1e6,
    }));
    updateNodeData(id, { coefficients: normalized });
  };

  const resetCoeffs = () => {
    const reset = coeffs.map((_, i) => (i === 0 ? { re: 1, im: 0 } : { re: 0, im: 0 }));
    updateNodeData(id, { coefficients: reset });
  };

  return (
    <div className="analog-node linear-combination-node">
      <div className="analog-node-header">Linear Combination</div>
      <div className="analog-node-body">
        <Handle type="target" position={Position.Left} id="eigenstates" style={{ top: '30%', background: '#ec4899' }} />

        <div className="node-field" style={{ marginBottom: '0.3rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <input
              type="checkbox"
              checked={data.normalize !== false}
              onChange={(e) => updateNodeData(id, { normalize: e.target.checked })}
            />
            Normalize output
          </label>
        </div>

        <div className="node-field">
          <label>N<sub>eigenstates</sub></label>
          <input
            type="number"
            min={1}
            max={20}
            value={nEig}
            onChange={(e) => handleNChange(e.target.value)}
            style={{ width: '50px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem' }}>
          <button className="lc-btn" onClick={normalizeCoeffs}>Normalize coeff</button>
          <button className="lc-btn" onClick={resetCoeffs}>Reset coeff.</button>
        </div>

        <div className="coeff-grid">
          {coeffs.slice(0, nEig).map((c, i) => (
            <div key={i} className="coeff-row">
              <input
                type="number"
                step="0.1"
                value={c.re}
                onChange={(e) => handleCoeffChange(i, 're', e.target.value)}
              />
              <span>+</span>
              <input
                type="number"
                step="0.1"
                value={c.im}
                onChange={(e) => handleCoeffChange(i, 'im', e.target.value)}
              />
              <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}>i</span>
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="psi" style={{ background: '#06b6d4' }} />
    </div>
  );
}
