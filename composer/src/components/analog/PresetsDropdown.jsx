import React, { useState } from 'react';
import useAnalogStore from '../../stores/analogStore';

const PRESETS = [
  {
    id: 'silicon_spin',
    label: 'Silicon Spin Qubit',
    description: 'Double-well potential in Silicon, showing tunnel coupling.'
  },
  {
    id: 'kronig_penney',
    label: 'Kronig-Penney Lattice',
    description: 'Periodic rectangular barriers showing band structure.'
  },
  {
    id: 'transmon_cpb',
    label: 'Transmon CPB',
    description: 'Cooper pair box potential (cosine well).'
  },
  {
    id: 'quantum_well',
    label: 'Quantum Well',
    description: 'Finite square well in InGaAs showing bound states.'
  },
  {
    id: 'hardware_chip_2q',
    label: '2-Qubit Chip Layout',
    description: 'Hardware EDA design with two Transmons and CPW bus.'
  }
];

export default function PresetsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const loadPreset = useAnalogStore(state => state.loadPreset);

  const handleSelect = (presetId) => {
    loadPreset(presetId);
    setIsOpen(false);
  };

  return (
    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(59, 130, 246, 0.2)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          color: '#60a5fa',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.85rem'
        }}
      >
        <span>Load TCAD Preset</span>
        <span>{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && (
        <div style={{
          marginTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleSelect(preset.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, color: '#e5e7eb', fontSize: '0.85rem' }}>
                <span>{preset.label}</span>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '4px', lineHeight: 1.3 }}>
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
