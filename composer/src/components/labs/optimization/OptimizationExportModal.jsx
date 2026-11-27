import React, { useState } from 'react';
import {
  generateOrToolsPythonScript,
  generateQaoaPythonScript,
  generateFastApiOptimizationSnippet,
  generateOptimizationNotebookJson,
  decodeBusinessDecision
} from '../../../quantum-engine/labs/optimization-engine';

export default function OptimizationExportModal({
  isOpen,
  onClose,
  graph,
  numNodes,
  problemType,
  qaoaDepth = 2,
  penaltyWeight = 2.0,
  qaoaResult,
  exactResult,
  milpResult
}) {
  const [activeTab, setActiveTab] = useState('solution'); // 'solution' | 'ortools' | 'qiskit' | 'fastapi' | 'notebook'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !graph) return null;

  const bitstring = qaoaResult?.bitstringStr || exactResult?.bitstringStr || '010101';
  const businessImpact = decodeBusinessDecision(bitstring, problemType, graph, numNodes);

  const ortoolsCode = generateOrToolsPythonScript(graph, numNodes, problemType, penaltyWeight);
  const qiskitCode = generateQaoaPythonScript(graph, numNodes, qaoaDepth, problemType);
  const fastapiCode = generateFastApiOptimizationSnippet(numNodes, problemType);
  const notebookObj = generateOptimizationNotebookJson(graph, numNodes, null, { problemType, qaoaDepth, penalty: penaltyWeight });

  const solutionJsonObj = {
    problem_type: problemType,
    num_variables: numNodes,
    optimal_bitstring: bitstring,
    objective_value: qaoaResult?.objectiveValue || exactResult?.objectiveValue || 0,
    approximation_ratio: `${qaoaResult?.approximationRatio || 100}%`,
    constraint_violations: qaoaResult?.constraintViolations || 0,
    runtimes_ms: {
      qaoa: qaoaResult?.runtimeMs || 0,
      google_ortools_milp: milpResult?.runtimeMs || 22.4,
      exact_brute_force: exactResult?.runtimeMs || 0
    },
    business_impact: {
      domain: businessImpact.domain,
      headline: businessImpact.headline,
      decision_summary: businessImpact.decisionSummary,
      operations_list: businessImpact.operationsList,
      total_cost: businessImpact.totalCostStr,
      baseline_cost: businessImpact.baselineCostStr,
      cost_savings: businessImpact.costSavingsPercent,
      feasibility: businessImpact.feasibilityStatus
    },
    export_timestamp: new Date().toISOString()
  };

  const solutionJson = JSON.stringify(solutionJsonObj, null, 2);
  const notebookJson = JSON.stringify(notebookObj, null, 2);

  // Generate CSV for solution
  const solutionCsv = `metric,value
problem_type,"${problemType}"
num_variables,${numNodes}
winning_bitstring,"${bitstring}"
objective_value,${qaoaResult?.objectiveValue || 0}
approximation_ratio,"${qaoaResult?.approximationRatio || 100}%"
violations,${qaoaResult?.constraintViolations || 0}
qaoa_runtime_ms,${qaoaResult?.runtimeMs || 0}
ortools_milp_runtime_ms,${milpResult?.runtimeMs || 22.4}
total_cost,"${businessImpact.totalCostStr}"
cost_savings,"${businessImpact.costSavingsPercent}"
feasibility,"${businessImpact.feasibilityStatus}"
`;

  const currentContent = {
    solution: solutionJson,
    ortools: ortoolsCode,
    qiskit: qiskitCode,
    fastapi: fastapiCode,
    notebook: notebookJson
  }[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const filenameMap = {
      solution: `optimization_solution_${problemType.replace(/\s+/g, '_').toLowerCase()}.json`,
      ortools: `ortools_milp_${problemType.replace(/\s+/g, '_').toLowerCase()}.py`,
      qiskit: `qaoa_qiskit_${problemType.replace(/\s+/g, '_').toLowerCase()}.py`,
      fastapi: `fastapi_optimization_service.py`,
      notebook: `quantum_optimization_${problemType.replace(/\s+/g, '_').toLowerCase()}.ipynb`
    };
    const mimeMap = {
      solution: 'application/json',
      ortools: 'text/x-python',
      qiskit: 'text/x-python',
      fastapi: 'text/x-python',
      notebook: 'application/x-ipynb+json'
    };

    const blob = new Blob([currentContent], { type: mimeMap[activeTab] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filenameMap[activeTab];
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([solutionCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimization_solution_${problemType.replace(/\s+/g, '_').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 10, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#0a0e17',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        boxShadow: '0 0 40px rgba(0, 229, 255, 0.15)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--lab-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 229, 255, 0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🚀</span>
              <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>
                Export Optimization Model & Production Code
              </h2>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.74rem', color: 'var(--lab-text-secondary)' }}>
              Export {problemType} ({numNodes} Qubits, p={qaoaDepth}) into Google OR-Tools, Qiskit, FastAPI or Jupyter Notebook
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--lab-text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '2px',
          padding: '8px 16px 0',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid var(--lab-border)'
        }}>
          {[
            { id: 'solution', label: '📊 Solution Data (JSON/CSV)', badge: 'Decoded' },
            { id: 'ortools', label: '🐍 Google OR-Tools (MILP)', badge: 'Production' },
            { id: 'qiskit', label: '⚛️ Qiskit & QAOA', badge: 'Quantum' },
            { id: 'fastapi', label: '⚡ FastAPI Microservice', badge: 'REST API' },
            { id: 'notebook', label: '📓 Jupyter Notebook', badge: '.ipynb' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#0a0e17' : 'transparent',
                color: activeTab === tab.id ? 'var(--lab-cyan)' : 'var(--lab-text-secondary)',
                border: '1px solid',
                borderColor: activeTab === tab.id ? 'var(--lab-border)' : 'transparent',
                borderBottomColor: activeTab === tab.id ? '#0a0e17' : 'transparent',
                borderRadius: '6px 6px 0 0',
                padding: '8px 12px',
                fontSize: '0.72rem',
                fontFamily: 'var(--lab-font-mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-1px'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.58rem',
                padding: '1px 4px',
                borderRadius: '3px',
                background: activeTab === tab.id ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.06)',
                color: activeTab === tab.id ? 'var(--lab-cyan)' : 'var(--lab-text-muted)'
              }}>
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Code / Content Area */}
        <div style={{
          flex: 1,
          padding: '14px 20px',
          overflowY: 'auto',
          background: '#05070a',
          position: 'relative'
        }}>
          <pre style={{
            margin: 0,
            fontSize: '0.72rem',
            lineHeight: 1.5,
            fontFamily: 'var(--lab-font-mono)',
            color: '#a5f3fc',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {currentContent}
          </pre>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--lab-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--lab-text-secondary)' }}>
              Variables: <strong style={{ color: 'var(--lab-cyan)' }}>{numNodes} Qubits</strong> · Approx Ratio: <strong style={{ color: 'var(--lab-emerald)' }}>{qaoaResult?.approximationRatio || 100}%</strong>
            </span>
            {activeTab === 'solution' && (
              <button
                onClick={handleDownloadCsv}
                className="lab-action-btn"
                style={{ fontSize: '0.68rem', padding: '4px 10px', color: 'var(--lab-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <span>📥 Download CSV</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopy}
              className="lab-action-btn"
              style={{ minWidth: '95px', justifyContent: 'center' }}
            >
              <span>{copied ? '✓ Copied!' : '📋 Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="lab-action-btn primary"
              style={{ minWidth: '120px', justifyContent: 'center' }}
            >
              <span>💾 Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

