import { useState, useMemo } from 'react';
import { getGate } from '../../quantum-engine/gates';
import { Complex } from '../../quantum-engine/complex';
import BlochSphere from './BlochSphere';

const GATE_MAPPINGS = {
  H: { '|0⟩': '|+⟩', '|1⟩': '|-⟩' },
  X: { '|0⟩': '|1⟩', '|1⟩': '|0⟩' },
  Y: { '|0⟩': 'i|1⟩', '|1⟩': '-i|0⟩' },
  Z: { '|0⟩': '|0⟩', '|1⟩': '-|1⟩' },
};

export default function GateVisualizer({ gateName }) {
  const [basis, setBasis] = useState('01');
  
  const effectiveGate = gateName || 'H';
  const gateDef = getGate(effectiveGate);
  const isValidGate = gateDef && (gateDef.qubits === 1 || gateDef.qubits === 'all');

  const getPhaseColor = (deg) => {
    const h = (180 + deg) % 360;
    return `hsl(${h}, 100%, 50%)`;
  };

  const getBubbleStyle = (complexVal) => {
    if (!complexVal || complexVal.magnitude() < 1e-5) {
      return { background: 'transparent' };
    }
    const amp = complexVal.magnitude();
    const phaseRad = complexVal.phase();
    let phaseDeg = (phaseRad * 180) / Math.PI;
    if (phaseDeg < 0) phaseDeg += 360;
    phaseDeg = Math.round(phaseDeg);

    return {
      background: getPhaseColor(phaseDeg),
      width: `${Math.max(6, 16 * amp)}px`,
      height: `${Math.max(6, 16 * amp)}px`,
      display: 'inline-block',
      borderRadius: '50%',
      margin: '0 auto'
    };
  };

  const rawMatrix = (isValidGate && gateDef.matrix) ? gateDef.matrix : [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.one()]
  ];

  const transformMatrix = (m, b) => {
    if (b === '01') return m;
    const m00 = m[0][0], m01 = m[0][1], m10 = m[1][0], m11 = m[1][1];
    
    if (b === '+-') {
      const half = 0.5;
      const t00 = m00.add(m01).add(m10).add(m11).mul(half);
      const t01 = m00.sub(m01).add(m10).sub(m11).mul(half);
      const t10 = m00.add(m01).sub(m10).sub(m11).mul(half);
      const t11 = m00.sub(m01).sub(m10).add(m11).mul(half);
      return [[t00, t01], [t10, t11]];
    }
    
    if (b === '+i') {
      const i = Complex.i();
      const half = 0.5;
      const t00 = m00.add(m11).add( i.mul(m01.sub(m10)) ).mul(half);
      const t01 = m00.sub(m11).sub( i.mul(m01.add(m10)) ).mul(half);
      const t10 = m00.sub(m11).add( i.mul(m01.add(m10)) ).mul(half);
      const t11 = m00.add(m11).sub( i.mul(m01.sub(m10)) ).mul(half);
      return [[t00, t01], [t10, t11]];
    }
    return m;
  };

  const m = transformMatrix(rawMatrix, basis);

  if (!isValidGate) {
    return <div className="empty-state">Only single-qubit gates can be visualized</div>;
  }

  return (
    <div className="gate-visualizer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'stretch' }}>
        
        {/* Column 1: Basis & Truth Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '0 0 auto' }}>
          <div className="viz-header-labels" style={{ padding: 0, justifyContent: 'flex-start' }}>
            <span>Change Basis</span>
          </div>
          <div className="basis-toggle" style={{ width: 'fit-content' }}>
            <button className={basis === '01' ? 'active' : ''} onClick={() => setBasis('01')}>01</button>
            <button className={basis === '+-' ? 'active' : ''} onClick={() => setBasis('+-')}>+-</button>
            <button className={basis === '+i' ? 'active' : ''} onClick={() => setBasis('+i')}>+i-i</button>
          </div>
          
          <div className="truth-table">
            <div className="tt-label">OUTPUT</div>
            <div className="tt-grid">
              <div className="tt-header-row">
                <span className="state-cell" style={{ border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem' }}>INPUT</span>
              </div>
              <div className="tt-header-row">
                <span className="state-cell">{basis === '+i' ? '+i' : basis === '+-' ? '+' : '0'}</span>
                <span className="state-cell">{basis === '+i' ? '-i' : basis === '+-' ? '-' : '1'}</span>
              </div>
              
              <div className="tt-row">
                <span className="state-cell">{basis === '+i' ? '+i' : basis === '+-' ? '+' : '0'}</span>
                <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={getBubbleStyle(m[0][0])}></span></span>
                <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={getBubbleStyle(m[0][1])}></span></span>
              </div>
              <div className="tt-row">
                <span className="state-cell">{basis === '+i' ? '-i' : basis === '+-' ? '-' : '1'}</span>
                <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={getBubbleStyle(m[1][0])}></span></span>
                <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={getBubbleStyle(m[1][1])}></span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Bloch Sphere */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BlochSphere alpha={m[0][0]} beta={m[1][0]} radius={50} />
        </div>

        {/* Column 3: Legends */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center', paddingRight: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Amplitude</span>
            <div className="sphere-small" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}></div>
          </div>
          
          {/* Phase Donut Legend */}
          <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: `conic-gradient(
                hsl(270, 100%, 50%) 0%, hsl(225, 100%, 50%) 12.5%,
                hsl(180, 100%, 50%) 25%, hsl(135, 100%, 50%) 37.5%,
                hsl(90, 100%, 50%) 50%, hsl(45, 100%, 50%) 62.5%,
                hsl(0, 100%, 50%) 75%, hsl(315, 100%, 50%) 87.5%,
                hsl(270, 100%, 50%) 100%
              )`,
              WebkitMask: 'radial-gradient(transparent 58%, black 60%)',
              mask: 'radial-gradient(transparent 58%, black 60%)'
            }}></div>
            
            <span style={{ position: 'absolute', fontSize: '0.6rem', color: '#fff', zIndex: 2 }}>Phase</span>
            
            <span style={{ position: 'absolute', right: '-2px', fontSize: '0.65rem', color: '#e5e7eb' }}>0</span>
            <span style={{ position: 'absolute', top: '-2px', fontSize: '0.65rem', color: '#e5e7eb' }}>π/2</span>
            <span style={{ position: 'absolute', left: '-2px', fontSize: '0.65rem', color: '#e5e7eb' }}>π</span>
            <span style={{ position: 'absolute', bottom: '-2px', fontSize: '0.65rem', color: '#e5e7eb' }}>3π/2</span>
          </div>
        </div>

      </div>
    </div>
  );
}
