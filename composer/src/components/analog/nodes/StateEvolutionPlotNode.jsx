import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import useAnalogStore from '../../../stores/analogStore';

export default function StateEvolutionPlotNode({ id, data }) {
  const canvasRef = useRef(null);
  const result = useAnalogStore((s) => s.simulationResult);

  useEffect(() => {
    if (!canvasRef.current || !result) return;
    drawHeatmap(canvasRef.current, result);
  }, [result]);

  return (
    <div className="analog-node state-evolution-plot-node" style={{ minWidth: '400px', borderColor: '#3b82f6' }}>
      <div className="analog-node-header" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
        State Evolution Plot
        {!result?.frames && <span className="node-warning" title="No frames to display">!</span>}
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem', display: 'flex', gap: '0.6rem' }}>
        <Handle type="target" position={Position.Left} id="psi_n" style={{ top: '50%', background: '#06b6d4' }} />

        {/* Canvas container with axis labels */}
        <div style={{ position: 'relative', background: '#ffffff', border: '1px solid #ccc', padding: '15px 35px 25px 35px', borderRadius: '2px' }}>
          
          <div style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)',
            fontSize: '10px', color: '#475569', fontFamily: 'sans-serif'
          }}>
            x
          </div>
          
          <canvas
            ref={canvasRef}
            width={240}
            height={200}
            style={{
              display: 'block',
              background: '#000033', // Dark blue base for heatmap
            }}
          />
          
          <div style={{
            position: 'absolute', bottom: '5px', left: '0', right: '0', textAlign: 'center',
            fontSize: '10px', color: '#475569', fontFamily: 'sans-serif'
          }}>
            t
          </div>
        </div>

        {/* Colorbar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '15px', height: '200px', marginTop: '15px',
            background: 'linear-gradient(to top, #000033 0%, #4b0082 25%, #cc0000 50%, #ff8c00 75%, #ffff66 100%)',
            border: '1px solid #ccc'
          }} />
          <div style={{ fontSize: '10px', color: '#e6edf3', marginTop: '5px', transform: 'rotate(90deg)', whiteSpace: 'nowrap', translate: '20px -100px' }}>
            |ψ(x, t)|²
          </div>
        </div>
        
      </div>
    </div>
  );
}

// ── Heatmap Drawing ───────────────────────────────────────────
function drawHeatmap(canvas, result) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  
  if (!result.frames || result.frames.length === 0) return;
  
  const frames = result.frames; // Array of superpositions over time
  const numTimeSteps = frames.length;
  const numSpatialSteps = frames[0].prob_density.length;
  
  const dx = W / numTimeSteps;
  const dy = H / numSpatialSteps;
  
  // Find global max probability for color scaling
  let maxProb = 0;
  for (let t = 0; t < numTimeSteps; t++) {
    for (let x = 0; x < numSpatialSteps; x++) {
      if (frames[t].prob_density[x] > maxProb) {
        maxProb = frames[t].prob_density[x];
      }
    }
  }
  
  if (maxProb === 0) maxProb = 1;
  
  // Color mapping (inferno-like: dark blue -> purple -> red -> orange -> yellow)
  const getColor = (value) => {
    const norm = Math.min(1, Math.max(0, value / maxProb));
    // Simple interpolation for heatmap
    if (norm < 0.25) {
      const p = norm / 0.25;
      return `rgb(${Math.floor(p*75)}, 0, ${Math.floor(51 + p*79)})`; // #000033 to #4b0082
    } else if (norm < 0.5) {
      const p = (norm - 0.25) / 0.25;
      return `rgb(${Math.floor(75 + p*129)}, 0, ${Math.floor(130 - p*130)})`; // #4b0082 to #cc0000
    } else if (norm < 0.75) {
      const p = (norm - 0.5) / 0.25;
      return `rgb(${Math.floor(204 + p*51)}, ${Math.floor(p*140)}, 0)`; // #cc0000 to #ff8c00
    } else {
      const p = (norm - 0.75) / 0.25;
      return `rgb(255, ${Math.floor(140 + p*115)}, ${Math.floor(p*102)})`; // #ff8c00 to #ffff66
    }
  };

  // Draw pixels
  for (let t = 0; t < numTimeSteps; t++) {
    const prob = frames[t].prob_density;
    for (let x = 0; x < numSpatialSteps; x++) {
      ctx.fillStyle = getColor(prob[x]);
      // Invert Y so x=0 is at bottom
      ctx.fillRect(t * dx, H - (x + 1) * dy, dx + 1, dy + 1); 
    }
  }
}
