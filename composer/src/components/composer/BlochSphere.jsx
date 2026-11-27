import React, { useState, useRef, useMemo } from 'react';
import { Complex } from '../../quantum-engine/complex';

// Converts spherical coordinates to a CSS 3D transform.
export default function BlochSphere({ alpha, beta, radius = 60 }) {
  const [rotation, setRotation] = useState({ x: -15, y: -45 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
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
    if (containerRef.current) containerRef.current.releasePointerCapture(e.pointerId);
  };

  // Calculate Bloch vector angles
  const { theta, phi, color } = useMemo(() => {
    const aMag = alpha.magnitude();
    const bMag = beta.magnitude();
    // Normalize just in case
    const norm = Math.sqrt(aMag*aMag + bMag*bMag) || 1;
    const aNorm = aMag / norm;
    const bNorm = bMag / norm;

    // θ = 2 * acos(|α|)
    let thetaRad = 2 * Math.acos(aNorm);
    let thetaDeg = (thetaRad * 180) / Math.PI;

    // φ = phase(β) - phase(α)
    let phiRad = beta.phase() - alpha.phase();
    let phiDeg = (phiRad * 180) / Math.PI;
    if (phiDeg < 0) phiDeg += 360;

    // Get color based on phase for visual flair (optional, standard bloch is often solid color)
    let h = 240 + ((phiDeg - 270) / 90) * 310;
    if (phiDeg >= 0 && phiDeg < 90) h = 190 - (phiDeg / 90) * 115;
    else if (phiDeg >= 90 && phiDeg < 180) h = 75 - ((phiDeg - 90) / 90) * 75;
    else if (phiDeg >= 180 && phiDeg < 270) h = ((phiDeg - 180) / 90) * 240;
    
    // For purely real vectors on Z axis, color is undefined technically, just use blue
    const finalColor = (aMag < 1e-6 || bMag < 1e-6) ? '#3b82f6' : `hsl(${h % 360}, 100%, 50%)`;

    return { theta: thetaDeg, phi: phiDeg, color: finalColor };
  }, [alpha, beta]);

  const R = radius;
  const containerSize = R * 2.5;

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div 
        ref={containerRef}
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
          style={{ 
            width: `${R*2}px`, height: `${R*2}px`, 
            position: 'relative', 
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
          }}
        >
          {/* Sphere Shell (Glass Effect) */}
          <div style={{ 
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

          {/* Equator */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', transform: 'rotateX(90deg)' }}></div>
          
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
          <div style={{ position: 'absolute', left: '50%', top: '-30px', transform: 'translateX(-50%)', transformStyle: 'preserve-3d' }}>
            <div style={{ transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`, fontSize: '0.65rem', color: '#fff', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>|0⟩</span>
              <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>+z</span>
            </div>
          </div>
          {/* -Z (Bottom) */}
          <div style={{ position: 'absolute', left: '50%', bottom: '-30px', transform: 'translateX(-50%)', transformStyle: 'preserve-3d' }}>
            <div style={{ transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`, fontSize: '0.65rem', color: '#fff', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>-z</span>
              <span style={{ fontWeight: 'bold' }}>|1⟩</span>
            </div>
          </div>

          {/* Bloch Vector */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            transformStyle: 'preserve-3d', 
            transform: `rotateY(${-phi}deg) rotateZ(${-theta}deg)` 
          }}>
            {/* The line */}
            <div style={{ 
              position: 'absolute', 
              width: '2px', 
              height: '50%', 
              background: '#ef4444', 
              left: 'calc(50% - 1px)', 
              top: 0,
              transformOrigin: 'bottom center',
              boxShadow: '0 0 8px #ef4444'
            }}></div>
            
            {/* The arrowhead / dot at the surface */}
            <div style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, #ef4444 40%, rgba(0,0,0,0.6) 100%)`,
              borderRadius: '50%',
              left: '50%',
              top: '-5px',
              transform: `translateX(-50%) rotateZ(${theta}deg) rotateY(${phi}deg) rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`,
              boxShadow: '0 0 10px #ef4444'
            }}></div>
          </div>

        </div>
      </div>
    </div>
  );
}
