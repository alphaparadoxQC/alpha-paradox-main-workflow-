import React, { useState, useRef, useMemo } from 'react';

const getPhaseColor = (deg) => {
  if (deg >= 0 && deg < 90) return `hsl(${190 - (deg / 90) * 115}, 100%, 45%)`; 
  if (deg >= 90 && deg < 180) return `hsl(${75 - ((deg - 90) / 90) * 75}, 100%, 50%)`;
  if (deg >= 180 && deg < 270) return `hsl(${((deg - 180) / 90) * 240}, 100%, 50%)`;
  let h = 240 + ((deg - 270) / 90) * 310; 
  return `hsl(${h % 360}, 100%, 50%)`;
};

const getHammingWeight = (bs) => bs.split('').filter(b => b === '1').length;

export default function QSphere({ data, numQubits, isLSB, radius = 80 }) {
  const [rotation, setRotation] = useState({ x: -15, y: -45 });
  const [isDragging, setIsDragging] = useState(false);
  const [showState, setShowState] = useState(true);
  const [showPhase, setShowPhase] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const sphereRef = useRef(null);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (sphereRef.current) sphereRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastPos.current.x;
    const deltaY = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (sphereRef.current) sphereRef.current.releasePointerCapture(e.pointerId);
  };

  const formatBitstring = (bs) => isLSB ? bs.split('').reverse().join('') : bs;

  const nodes = useMemo(() => {
    const weights = {};
    for (let i = 0; i <= numQubits; i++) weights[i] = [];
    
    const maxVal = Math.pow(2, numQubits);
    for (let i = 0; i < maxVal; i++) {
      const bs = i.toString(2).padStart(numQubits, '0');
      weights[getHammingWeight(bs)].push(bs);
    }

    const maxAmp = Math.max(...Object.values(data).map(d => d.amp || 0), 1e-10);

    const result = [];
    for (let w = 0; w <= numQubits; w++) {
      const states = weights[w].sort();
      const numStates = states.length;
      // Latitude: theta from 0 (North Pole) to 180 (South Pole)
      const theta = numQubits === 0 ? 90 : (w / numQubits) * 180;
      
      states.forEach((state, idx) => {
        const stateData = data[state];
        if (stateData && stateData.amp > 1e-10) {
          // Longitude: phi from 0 to 360
          const phi = (idx / numStates) * 360;
          result.push({
            state,
            theta,
            phi,
            amp: stateData.amp,
            normalizedAmp: stateData.amp / maxAmp, // for sizing
            phaseDeg: stateData.phaseDeg
          });
        }
      });
    }
    return result;
  }, [data, numQubits]);

  // Radius of the sphere in pixels
  const R = radius;
  const containerSize = R * 3;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      <div 
        ref={sphereRef}
        className="q-sphere-container" 
        style={{ 
          width: `${containerSize}px`, height: `${containerSize}px`, 
          position: 'relative', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          perspective: '800px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div 
          className="q-sphere-inner" 
          style={{ 
            width: `${R*2}px`, height: `${R*2}px`, 
            position: 'relative', 
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
          }}
        >
          {/* Sphere Shell (Glass Effect) */}
          <div className="q-sphere-shell" style={{ 
            position: 'absolute', inset: 0, borderRadius: '50%', 
            border: '1px solid rgba(255,255,255,0.2)', 
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(0,0,0,0.5))',
            boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.6), inset 10px 10px 20px rgba(255,255,255,0.15)'
          }}></div>
          
          {/* Longitudes (Wireframe) */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }}></div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotateY(45deg)' }}></div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotateY(90deg)' }}></div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotateY(135deg)' }}></div>
          
          {/* Equator & Latitudes */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', transform: 'rotateX(90deg)' }}></div>
          {numQubits > 2 && (
            <>
              <div style={{ position: 'absolute', inset: '15%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotateX(90deg) translateZ(40px)' }}></div>
              <div style={{ position: 'absolute', inset: '15%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotateX(90deg) translateZ(-40px)' }}></div>
            </>
          )}
          
          {/* X Axis */}
          <div style={{ position: 'absolute', width: '100%', height: '1px', top: '50%', left: 0, background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%)' }}></div>
          
          {/* Y Axis */}
          <div style={{ position: 'absolute', width: '100%', height: '1px', top: '50%', left: 0, background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%) rotateY(90deg)' }}></div>
          
          {/* Z Axis */}
          <div style={{ position: 'absolute', width: '1px', height: '100%', left: '50%', top: 0, background: 'rgba(255,255,255,0.2)', transform: 'translateX(-50%)' }}></div>
          
          {/* Axis Labels */}
          {/* +X (Right) */}
          <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', transformStyle: 'preserve-3d' }}>
            <div style={{ transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`, fontSize: '0.65rem', color: '#fff', fontWeight: 'bold' }}>+x</div>
          </div>
          {/* -X (Left) */}
          <div style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)', transformStyle: 'preserve-3d' }}>
            <div style={{ transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`, fontSize: '0.65rem', color: '#fff', fontWeight: 'bold' }}>-x</div>
          </div>
          
          {/* +Y (Towards viewer) */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) translateZ(${R + 20}px)`, transformStyle: 'preserve-3d' }}>
            <div style={{ transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`, fontSize: '0.65rem', color: '#fff', fontWeight: 'bold' }}>+y</div>
          </div>
          {/* -Y (Away from viewer) */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) translateZ(${-R - 20}px)`, transformStyle: 'preserve-3d' }}>
            <div style={{ transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`, fontSize: '0.65rem', color: '#fff', fontWeight: 'bold' }}>-y</div>
          </div>
          
          {/* +Z (Top) */}
          <div style={{ position: 'absolute', left: '50%', top: '-20px', transform: 'translateX(-50%)', transformStyle: 'preserve-3d' }}>
            <div style={{ transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`, fontSize: '0.65rem', color: '#fff', fontWeight: 'bold' }}>+z</div>
          </div>
          {/* -Z (Bottom) */}
          <div style={{ position: 'absolute', left: '50%', bottom: '-20px', transform: 'translateX(-50%)', transformStyle: 'preserve-3d' }}>
            <div style={{ transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`, fontSize: '0.65rem', color: '#fff', fontWeight: 'bold' }}>-z</div>
          </div>

          {/* Nodes */}
          {nodes.map(node => {
            const transform = `rotateY(${-node.phi}deg) rotateZ(${-node.theta}deg)`;
            const counterTransform = `rotateZ(${node.theta}deg) rotateY(${node.phi}deg) rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`;
            const dotSize = 8 + (node.normalizedAmp * 12); 
            const color = getPhaseColor(node.phaseDeg);

            return (
              <div key={node.state} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform }}>
                {/* Connecting Line from center to surface */}
                <div style={{ 
                  position: 'absolute', 
                  width: '2px', 
                  height: '50%', 
                  background: color, 
                  opacity: 0.6,
                  left: 'calc(50% - 1px)', 
                  top: 0,
                  transformOrigin: 'bottom center'
                }}></div>
                
                {/* Bubble on surface */}
                <div style={{ 
                  position: 'absolute', 
                  left: `calc(50% - ${dotSize/2}px)`, 
                  top: `-${dotSize/2}px`, 
                  width: `${dotSize}px`, 
                  height: `${dotSize}px`, 
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, ${color} 40%, rgba(0,0,0,0.6) 100%)`, 
                  borderRadius: '50%',
                  boxShadow: `0 0 8px ${color}`,
                  transform: counterTransform,
                  transformStyle: 'preserve-3d'
                }}>
                  {/* Label container (inherits camera-facing orientation) */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: '15px', 
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none'
                  }}>
                    {showState && (
                      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: '#e5e7eb', marginBottom: '2px' }}>
                        |{formatBitstring(node.state)}⟩
                      </div>
                    )}
                    {showPhase && (
                      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: color }}>
                        {Math.round(node.phaseDeg)}°
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Labels</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showState} onChange={e => setShowState(e.target.checked)} style={{ cursor: 'pointer' }} />
            State
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showPhase} onChange={e => setShowPhase(e.target.checked)} style={{ cursor: 'pointer' }} />
            Phase angle
          </label>
        </div>
      </div>

    </div>
  );
}
