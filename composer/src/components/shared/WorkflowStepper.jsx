import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCircuitStore } from '../../stores/circuitStore';
import { useEdaStore } from '../../stores/edaStore';
import useAnalogStore from '../../stores/analogStore';
import useNotebookStore from '../../stores/notebookStore';
import { useBackendStore } from '../../stores/backendStore';
import CrossProductBridge from '../../quantum-engine/cross-product-bridge';
import PipelineStatusModal from './PipelineStatusModal';

export default function WorkflowStepper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  const currentPath = location.pathname;

  // Read live state from stores
  const circuit = useCircuitStore((s) => s.circuit);
  const edaComponents = useEdaStore((s) => s.components || []);
  const analogNodes = useAnalogStore((s) => s.nodes || []);
  const tcadSource = useAnalogStore((s) => s._tcadSource);
  const notebookCells = useNotebookStore((s) => s.cells || []);
  const selectedBackend = useBackendStore((s) => s.selectedBackend);
  const customTopology = useBackendStore((s) => s.noiseConfig?.customTopology);

  const isNotebook = currentPath.startsWith('/lab');
  const isComposer = currentPath.startsWith('/composer') || currentPath.startsWith('/preview-composer');
  const isAnalog = currentPath.startsWith('/vqpu');
  const isEda = currentPath.startsWith('/eda');
  const isLabs = currentPath.startsWith('/labs');

  const steps = [
    {
      id: 'labs',
      label: 'Labs',
      sublabel: '6 Domain Labs',
      path: '/labs',
      active: isLabs,
      hasData: true,
      color: '#00E5FF',
    },
    {
      id: 'notebook',
      label: 'Algorithm',
      sublabel: `${notebookCells.length} cells`,
      path: '/lab',
      active: isNotebook,
      hasData: notebookCells.length > 0,
      color: '#3b82f6',
    },
    {
      id: 'composer',
      label: 'Circuit',
      sublabel: `${circuit.operations.length} gates`,
      path: '/composer',
      active: isComposer,
      hasData: circuit.operations.length > 0,
      color: '#8b5cf6',
    },
    {
      id: 'analog',
      label: 'Physics',
      sublabel: tcadSource ? (tcadSource.isCircuitBridge ? `${tcadSource.circuitName || 'Circuit'} Synced` : (tcadSource.isCoupledChip ? `${tcadSource.qubitCount}Q Chip` : 'TCAD Synced')) : `${analogNodes.length} nodes`,
      path: '/vqpu',
      active: isAnalog,
      hasData: analogNodes.length > 0 || !!tcadSource,
      color: '#f59e0b',
    },
    {
      id: 'eda',
      label: 'Silicon',
      sublabel: `${edaComponents.length} parts`,
      path: '/eda',
      active: isEda,
      hasData: edaComponents.length > 0,
      color: '#06b6d4',
    },
    {
      id: 'vqpu',
      label: 'Hardware',
      sublabel: customTopology ? 'EDA Layout' : 'vQPU 1.1k',
      path: '/composer',
      active: false,
      hasData: true,
      color: '#10b981',
    },
  ];

  return (
    <>
      <div
        className="wf-stepper"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '2px 6px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => navigate(step.path)}
              title={`${step.label}${step.sublabel ? `: ${step.sublabel}` : ''} — Click to switch`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '3px 9px',
                borderRadius: '4px',
                background: step.active
                  ? `rgba(255, 255, 255, 0.12)`
                  : 'transparent',
                border: step.active
                  ? `1px solid ${step.color}`
                  : '1px solid transparent',
                color: step.active ? '#ffffff' : '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: step.active ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: step.active ? `0 0 8px ${step.color}40` : 'none',
              }}
            >
              <span>{step.label}</span>
            </button>

            {idx < steps.length - 1 && (
              <span
                style={{
                  color: 'rgba(255, 255, 255, 0.25)',
                  fontSize: '0.6rem',
                  userSelect: 'none',
                  padding: '0 2px',
                }}
              >
                ➔
              </span>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => setModalOpen(true)}
          title="Open Unified Pipeline & Bridge Status Map"
          style={{
            marginLeft: '4px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: '#c084fc',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '0.68rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span>Bridges</span>
        </button>
      </div>

      {modalOpen && <PipelineStatusModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
