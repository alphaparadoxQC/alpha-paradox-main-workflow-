import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCircuitStore } from '../../stores/circuitStore';
import { pulseEngine } from '../../quantum-engine/pulse-engine';
import CrossProductBridge from '../../quantum-engine/cross-product-bridge';
import useAnalogStore from '../../stores/analogStore';
import { useEdaStore } from '../../stores/edaStore';
import { loadTransmonAnalogPreset } from '../../utils/presetTemplates';
import '../../styles/pulsePanel.css';

export default function PulsePanel() {
  const navigate = useNavigate();
  const circuit = useCircuitStore(state => state.circuit);
  const canvasRef = useRef(null);
  const [schedule, setSchedule] = useState(null);
  const calibration = pulseEngine._calibration;

  useEffect(() => {
    if (!circuit || circuit.operations.length === 0) {
      setSchedule(null);
      return;
    }
    
    // Compile logical circuit to hardware pulse schedule
    const sched = pulseEngine.compile(circuit);
    setSchedule(sched);
  }, [circuit]);

  useEffect(() => {
    if (!schedule || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Geometry & Layout config
    const channels = Object.keys(schedule.channels).filter(c => schedule.channels[c].length > 0);
    if (channels.length === 0) return;
    
    const rowHeight = 80;
    const padding = 20;
    const labelWidth = 60;
    
    // Determine scale based on total duration
    const pixelsPerNs = 2.0; 
    const minWidth = 800;
    const drawWidth = Math.max(minWidth, schedule.totalDuration * pixelsPerNs);
    
    // High-DPI canvas scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (drawWidth + labelWidth + padding * 2) * dpr;
    canvas.height = (channels.length * rowHeight + padding * 2) * dpr;
    canvas.style.width = `${drawWidth + labelWidth + padding * 2}px`;
    canvas.style.height = `${channels.length * rowHeight + padding * 2}px`;
    
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = '#111116';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    // Draw channels
    channels.forEach((ch, idx) => {
      const yOffset = padding + idx * rowHeight;
      const xOffset = labelWidth + padding;
      
      // Draw channel label (e.g. 'd0', 'u0_1')
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(ch, labelWidth, yOffset + rowHeight / 2 + 4);
      
      // Draw center timeline axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xOffset, yOffset + rowHeight / 2);
      ctx.lineTo(xOffset + drawWidth, yOffset + rowHeight / 2);
      ctx.stroke();
      
      // Draw pulses
      const pulses = schedule.channels[ch];
      pulses.forEach(p => {
        if (p.type === 'frameChange') {
           // Draw a vertical marker for virtual Z gates (instantaneous phase shift)
           const px = xOffset + p.startTime * pixelsPerNs;
           ctx.strokeStyle = '#f59e0b'; // Amber for phase
           ctx.lineWidth = 2;
           ctx.beginPath();
           ctx.moveTo(px, yOffset + rowHeight/2 - 15);
           ctx.lineTo(px, yOffset + rowHeight/2 + 15);
           ctx.stroke();
           
           ctx.fillStyle = '#f59e0b';
           ctx.textAlign = 'center';
           ctx.font = '10px Inter';
           ctx.fillText(`⟳${p.label}`, px, yOffset + rowHeight/2 - 20);
        } else {
           // Draw analog waveform: I (Blue) & Q (Red)
           const numSamples = p.I.length;
           const ampScale = (rowHeight / 2) - 10;
           
           // Q component (Quadrature - Red)
           ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // #ef4444
           ctx.lineWidth = 1.5;
           ctx.beginPath();
           for (let i = 0; i < numSamples; i++) {
             const px = xOffset + (p.startTime + i * pulseEngine.dt) * pixelsPerNs;
             const py = yOffset + rowHeight/2 - (p.Q[i] * ampScale);
             if (i === 0) ctx.moveTo(px, py);
             else ctx.lineTo(px, py);
           }
           ctx.stroke();

           // I component (In-phase - Blue)
           ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)'; // #3b82f6
           ctx.lineWidth = 1.5;
           ctx.beginPath();
           for (let i = 0; i < numSamples; i++) {
             const px = xOffset + (p.startTime + i * pulseEngine.dt) * pixelsPerNs;
             const py = yOffset + rowHeight/2 - (p.I[i] * ampScale);
             if (i === 0) ctx.moveTo(px, py);
             else ctx.lineTo(px, py);
           }
           ctx.stroke();
           
           // Draw gate label
           ctx.fillStyle = 'rgba(255,255,255,0.8)';
           ctx.textAlign = 'center';
           ctx.font = '11px Inter';
           ctx.fillText(p.label, xOffset + (p.startTime + p.duration/2) * pixelsPerNs, yOffset + 14);
        }
      });
    });
    
  }, [schedule]);

  const handleExport = () => {
    if (!schedule) return;
    const json = JSON.stringify(schedule, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alpha-pulse-schedule.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pulse-panel-container">
      <div className="pulse-header">
        <div className="pulse-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#3b82f6' }}>〰</span>
          <span>Microwave Pulse Synthesis</span>
          {calibration && (
            <span
              style={{
                fontSize: '0.65rem',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
              title="Calibrated directly from Device Physics TCAD"
            >
              ● TCAD: ω₀₁={calibration.omega01_GHz} GHz (α={calibration.anharmonicity_MHz} MHz)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {schedule && (
            <span className="pulse-stats">
              Duration: {schedule.totalDuration} ns
            </span>
          )}
          <button 
            className="pulse-export-btn"
            style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(147, 51, 234, 0.25))', 
              borderColor: '#8b5cf6', 
              color: '#c084fc',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => {
              CrossProductBridge.bridgeComposerToAnalog(navigate);
            }}
            title="Open time-dependent physical Hamiltonian and state evolution in Analog Node Engine"
          >
            ⚡ Simulate in Analog (Hamiltonian)
          </button>
          <button className="pulse-export-btn" onClick={handleExport}>
            ↓ Export OpenPulse
          </button>
        </div>
      </div>
      
      <div className="pulse-canvas-wrapper">
        {!schedule ? (
          <div style={{ color: '#6b7280', textAlign: 'center', marginTop: '40px', fontSize: '0.9rem' }}>
            Add gates to the circuit to synthesize physical microwave pulses.
          </div>
        ) : (
          <canvas ref={canvasRef} className="pulse-canvas" />
        )}
      </div>
    </div>
  );
}
