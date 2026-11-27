import React, { useState } from 'react';

export default function ProbabilityChart({ probabilities, isLSB }) {
  const [hoveredState, setHoveredState] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const useSample = !probabilities || Object.keys(probabilities).length === 0;
  
  const data = useSample ? {
    '000': 0.49, '001': 0.49, '010': 0.0, '011': 0.0,
    '100': 0.0, '101': 0.0, '110': 0.0, '111': 0.0
  } : probabilities;

  const top100Entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 100);
  const sortedStates = top100Entries.map(e => e[0]).sort((a, b) => parseInt(a, 2) - parseInt(b, 2));
  
  // Dynamically calculate upper bound for Y-axis
  const maxProb = Math.max(0, ...Object.values(data));
  let maxPercent = Math.max(1, Math.ceil(maxProb * 100));
  
  // Round up to a nice clean number for the axis
  if (maxPercent <= 5) maxPercent = 5;
  else if (maxPercent <= 10) maxPercent = 10;
  else if (maxPercent <= 20) maxPercent = 20;
  else if (maxPercent <= 50) maxPercent = 50;
  else maxPercent = 100;

  // Generate 5 steps for Y-axis labels
  const yLabels = [];
  for (let i = 5; i >= 0; i--) {
    yLabels.push(Math.round((maxPercent * i) / 5));
  }
  
  const formatBitstring = (bs) => isLSB ? bs.split('').reverse().join('') : bs;

  return (
    <div className="probability-chart" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      {hoveredState && (
        <div style={{
          position: 'fixed',
          top: mousePos.y + 15, // Display below cursor to avoid top clipping
          left: mousePos.x + 15,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '0.75rem',
          color: '#e2e8f0',
          zIndex: 99999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #475569', paddingBottom: '2px' }}>State |{formatBitstring(hoveredState)}⟩</div>
          <div>Amplitude: {Math.sqrt(data[hoveredState]).toFixed(4)}</div>
          <div>Probability: {(data[hoveredState] * 100).toFixed(2)}%</div>
        </div>
      )}

      <div className="y-axis-title">Probability (%)</div>
      <div className="chart-y-axis">
        {yLabels.map(val => (
          <span key={val} className="chart-y-label">{val}</span>
        ))}
      </div>

      <div className="chart-body">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', zIndex: 10 }}>
            <div style={{ width: '28px', height: '10px', background: '#346d95', borderRadius: '1px' }}></div>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>probability</span>
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Fixed Horizontal Grid Lines */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '4px', zIndex: 0, pointerEvents: 'none' }}>
            {yLabels.map((val, i) => (
              <div key={`grid-${i}`} style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${(val / maxPercent) * 100}%`,
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }} />
            ))}
          </div>
          
          <div className="chart-bars" style={{ position: 'relative', zIndex: 1 }}>
          {sortedStates.map(state => {
            const prob = data[state];
            // Scale bar height relative to maxPercent
            const height = prob > 0 ? Math.max(1, (prob * 100 / maxPercent) * 100) : 0;
            
            return (
              <div 
                key={state} 
                className="bar-container"
                style={{ position: 'relative', zIndex: 2 }}
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
              >
                <div className="bar" style={{ justifyContent: 'center' }}>
                  <div className="bar-fill" style={{ height: `${height}%`, background: '#346d95', width: '65%', maxWidth: '90px' }}></div>
                </div>
                <div className="bar-label">{formatBitstring(state)}</div>
              </div>
            );
          })}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
          Computational basis states
        </div>
      </div>
    </div>
  );
}
