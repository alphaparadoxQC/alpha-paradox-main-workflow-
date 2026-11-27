import React, { useState } from 'react';

export default function StateVectorChart({ statevector, isLSB }) {
  const [hoveredState, setHoveredState] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const useSample = !statevector || statevector.length === 0;
  
  // Sample data simulating a state vector
  let data = {};
  if (useSample) {
    data = {
      '000': { amp: 0.70710678, phaseDeg: 0 },
      '001': { amp: 0.70710678, phaseDeg: 90 },
      '010': { amp: 0.0, phaseDeg: 0 },
      '011': { amp: 0.0, phaseDeg: 0 },
      '100': { amp: 0.0, phaseDeg: 0 },
      '101': { amp: 0.0, phaseDeg: 0 },
      '110': { amp: 0.0, phaseDeg: 0 },
      '111': { amp: 0.0, phaseDeg: 0 }
    };
  } else {
    // statevector is an array of {re, im}
    const numQubits = Math.max(1, Math.log2(statevector.length));
    statevector.forEach((complex, idx) => {
      const bitstring = idx.toString(2).padStart(numQubits, '0');
      const amp = Math.sqrt(complex.re * complex.re + complex.im * complex.im);
      if (amp > 1e-10) {
        let phaseDeg = (Math.atan2(complex.im, complex.re) * 180) / Math.PI;
        if (phaseDeg < 0) phaseDeg += 360;
        data[bitstring] = { amp, phaseDeg };
      }
    });
  }

  const sortedStates = Object.keys(data).sort((a, b) => parseInt(a, 2) - parseInt(b, 2));
  const maxAmp = 1.0;
  
  const yLabels = ['1.0', '0.8', '0.6', '0.4', '0.2', '0'];

  const getPhaseColor = (deg) => {
    if (deg >= 0 && deg < 90) return `hsl(${190 - (deg / 90) * 115}, 100%, 45%)`; 
    if (deg >= 90 && deg < 180) return `hsl(${75 - ((deg - 90) / 90) * 75}, 100%, 50%)`;
    if (deg >= 180 && deg < 270) return `hsl(${((deg - 180) / 90) * 240}, 100%, 50%)`;
    let h = 240 + ((deg - 270) / 90) * 310; 
    return `hsl(${h % 360}, 100%, 50%)`;
  };

  const formatBitstring = (bs) => {
    return isLSB ? bs.split('').reverse().join('') : bs;
  };

  const numQubits = useSample ? 3 : Math.max(1, Math.log2(statevector.length));

  return (
    <div className="probability-chart" style={{ position: 'relative', display: 'flex', flexDirection: 'row' }} onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      
      {hoveredState && (
        <div style={{
          position: 'fixed',
          top: mousePos.y - 10,
          left: mousePos.x + 15,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '0.7rem',
          color: '#e2e8f0',
          zIndex: 99999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #475569', paddingBottom: '2px' }}>State |{formatBitstring(hoveredState)}⟩</div>
          <div>Amplitude: {data[hoveredState].amp.toFixed(4)}</div>
          <div>Probability: {(data[hoveredState].amp * data[hoveredState].amp * 100).toFixed(2)}%</div>
          <div>Phase: {data[hoveredState].phaseDeg.toFixed(1)}°</div>
        </div>
      )}

      {/* Phase Gradient Legend */}
      <div style={{ position: 'absolute', top: 0, right: '1rem', display: 'flex', gap: '2rem', alignItems: 'center', zIndex: 10 }}>
        <div style={{ width: '150px' }}>
          <div style={{ 
            height: '10px', 
            background: 'linear-gradient(to right, #06b6d4 0%, #84cc16 25%, #ef4444 50%, #3b82f6 75%, #06b6d4 100%)',
            borderRadius: '2px'
          }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
            <span>270°</span>
            <span>360°</span>
          </div>
        </div>
      </div>

      <div className="y-axis-title" style={{ marginTop: '2rem' }}>Amplitude</div>
      <div className="chart-y-axis" style={{ marginTop: '2rem' }}>
        {yLabels.map(val => (
          <span key={val} className="chart-y-label">{val}</span>
        ))}
      </div>

      <div className="chart-body" style={{ marginTop: '2rem' }}>
        <div className="chart-bars">
          {sortedStates.map(state => {
            const { amp, phaseDeg } = data[state];
            const height = amp > 0 ? Math.max(2, (amp / maxAmp) * 100) : 0;
            const barColor = getPhaseColor(phaseDeg);
            
            return (
              <div 
                key={state} 
                className="bar-container"
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
              >
                <div className="bar">
                  <div className="bar-fill" style={{ height: `${height}%`, background: barColor }}></div>
                </div>
                <div className="bar-label">{formatBitstring(state)}</div>
              </div>
            );
          })}
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
          Computational basis states
        </div>
      </div>
    </div>
  );
}
