import ProbabilityChart from './ProbabilityChart';

export default function MultiChipResults({ results }) {
  if (!results) return null;

  const backendNames = Object.keys(results);
  if (backendNames.length === 0) return null;

  // We assume the first backend is the "baseline" for comparisons (usually ideal statevector)
  const baselineResult = results[backendNames[0]].result;

  return (
    <div className="multi-chip-results">
      <div className="results-grid">
        {backendNames.map((name, index) => {
          const { result, error } = results[name];
          const isBaseline = index === 0;
          
          let fidelity = null;
          let tvd = null;
          
          if (!isBaseline && result && baselineResult) {
            try {
              fidelity = result.fidelityWith(baselineResult);
              tvd = result.tvdWith(baselineResult);
            } catch (e) {
              console.error('Error calculating metrics:', e);
            }
          }

          return (
            <div key={name} className="backend-result-card">
              <div className="card-header">
                <span className="backend-name">{result?.metadata?.backend || name}</span>
                {isBaseline && <span className="badge baseline">Baseline</span>}
                {result?.metadata?.method === 'qldpc_virtual' && <span className="badge vqpu">VQPU Corrected</span>}
              </div>
              
              <div className="card-body">
                {error ? (
                  <div className="error-state">{error}</div>
                ) : (
                  <>
                    <div className="chart-wrapper">
                      <ProbabilityChart probabilities={result.probabilities} />
                    </div>
                    
                    <div className="metrics-row">
                      <div className="metric">
                        <span className="label">Time</span>
                        <span className="value">{result.metadata.executionTime}ms</span>
                      </div>
                      
                      {!isBaseline && fidelity !== null && (
                        <div className="metric">
                          <span className="label">Fidelity</span>
                          <span className="value">{(fidelity * 100).toFixed(2)}%</span>
                        </div>
                      )}
                      
                      {!isBaseline && tvd !== null && (
                        <div className="metric">
                          <span className="label">TVD</span>
                          <span className="value">{tvd.toFixed(4)}</span>
                        </div>
                      )}
                    </div>

                    {/* VQPU specific metadata */}
                    {result.metadata.encoding && (
                      <div className="vqpu-metrics">
                        <div className="metric-row">
                          <span>Physical Qubits:</span>
                          <span>{result.metadata.encoding.physicalQubits}</span>
                        </div>
                        <div className="metric-row">
                          <span>Logical Error Rate:</span>
                          <span>{result.metadata.encoding.logicalErrorRate}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
