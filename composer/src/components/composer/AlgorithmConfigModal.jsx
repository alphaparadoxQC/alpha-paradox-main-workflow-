import { useState } from 'react';

/**
 * Algorithm-specific parameter configuration modal.
 * Shows different parameter editors depending on the algorithm type.
 */
export default function AlgorithmConfigModal({ algorithm, onLoad, onClose }) {
  // State parameters (for teleportation-like algorithms)
  const [alphaRe, setAlphaRe] = useState(1);
  const [alphaIm, setAlphaIm] = useState(0);
  const [betaRe, setBetaRe] = useState(0);
  const [betaIm, setBetaIm] = useState(0);
  const [alphaSign, setAlphaSign] = useState('+');
  const [betaSign, setBetaSign] = useState('+');
  const [alphaImSign, setAlphaImSign] = useState('+');
  const [betaImSign, setBetaImSign] = useState('+');

  // Generic parameters
  const [numQubits, setNumQubits] = useState(2);
  const [oracle, setOracle] = useState('balanced');
  const [secretString, setSecretString] = useState('101');
  const [inputBits, setInputBits] = useState('00');
  const [numberToFactor, setNumberToFactor] = useState(15);
  const [molecule, setMolecule] = useState('H2');
  const [graphType, setGraphType] = useState('random');
  const [walkSteps, setWalkSteps] = useState(5);
  const [layers, setLayers] = useState(1);
  const [stateType, setStateType] = useState('ghz');

  const getConfigType = () => {
    const id = algorithm.id;
    
    // State-vector input algorithms
    if (['teleportation-1', 'teleportation-n'].includes(id)) return 'state-vector';
    
    // Oracle-based algorithms
    if (['deutsch', 'deutsch-jozsa'].includes(id)) return 'oracle';
    
    // Secret-string algorithms
    if (['bernstein-vazirani', 'simon'].includes(id)) return 'secret-string';
    
    // Bit-input algorithms
    if (['superdense-coding'].includes(id)) return 'bit-input';
    
    // QFT / QPE
    if (['qft', 'qpe'].includes(id)) return 'qubit-count';
    
    // Grover's search
    if (['grover'].includes(id)) return 'grover';
    
    // Shor's factorization
    if (['shor'].includes(id)) return 'shor';
    
    // VQE
    if (['vqe'].includes(id)) return 'vqe';
    
    // QAOA / Max-Cut / Portfolio
    if (['portfolio-qaoa', 'max-cut'].includes(id)) return 'qaoa';
    
    // Quantum Walks
    if (['quantum-walks'].includes(id)) return 'walks';
    
    // N-qubit teleportation with state type
    if (['teleportation-n'].includes(id)) return 'state-vector';
    
    // Error correction codes
    if (['steane-code', 'repetition-code', 'shor-code'].includes(id)) return 'error-correction';
    
    // ML algorithms
    if (['qnn', 'qperceptron', 'qsvm', 'qkmean', 'qknn', 'qhc', 'qpca'].includes(id)) return 'ml-config';
    
    // Algorithms with no special config
    return 'simple';
  };

  const configType = getConfigType();

  const handleLoad = () => {
    const params = {};
    
    switch (configType) {
      case 'state-vector':
        params.alpha = { re: (alphaSign === '+' ? 1 : -1) * Math.sqrt(alphaRe), im: (alphaImSign === '+' ? 1 : -1) * Math.sqrt(alphaIm) };
        params.beta = { re: (betaSign === '+' ? 1 : -1) * Math.sqrt(betaRe), im: (betaImSign === '+' ? 1 : -1) * Math.sqrt(betaIm) };
        params.numQubits = numQubits;
        params.stateType = stateType;
        break;
      case 'oracle':
        params.oracle = oracle;
        params.numQubits = numQubits;
        break;
      case 'secret-string':
        params.secret = secretString;
        params.numQubits = numQubits;
        break;
      case 'bit-input':
        params.inputBits = inputBits;
        break;
      case 'qubit-count':
        params.numQubits = numQubits;
        break;
      case 'grover':
        params.numQubits = numQubits;
        params.oracle = oracle;
        break;
      case 'shor':
        params.number = numberToFactor;
        break;
      case 'vqe':
        params.molecule = molecule;
        params.layers = layers;
        break;
      case 'qaoa':
        params.graphType = graphType;
        params.numQubits = numQubits;
        params.layers = layers;
        break;
      case 'walks':
        params.numQubits = numQubits;
        params.steps = walkSteps;
        break;
      case 'error-correction':
        params.numQubits = numQubits;
        break;
      case 'ml-config':
        params.numQubits = numQubits;
        params.layers = layers;
        break;
      default:
        break;
    }
    
    onLoad(algorithm.id, params);
  };

  const renderStateVectorConfig = () => (
    <div className="acm-section">
      <div className="acm-state-equation">
        State : &nbsp;&nbsp; |ψ⟩ = α|0⟩ + β|1⟩ &nbsp;
        <span className="acm-info-icon" title="The initial quantum state to teleport">ⓘ</span>
      </div>
      
      <div className="acm-state-row">
        <span className="acm-state-label">α :</span>
        <button className="acm-sign-btn" onClick={() => setAlphaSign(s => s === '+' ? '-' : '+')}>{alphaSign}</button>
        <span className="acm-sqrt">√</span>
        <input type="number" className="acm-num-input" value={alphaRe} min={0} max={1} step={0.1} onChange={e => setAlphaRe(parseFloat(e.target.value) || 0)} />
        <button className="acm-sign-btn" onClick={() => setAlphaImSign(s => s === '+' ? '-' : '+')}>{alphaImSign}</button>
        <span className="acm-sqrt">√</span>
        <input type="number" className="acm-num-input" value={alphaIm} min={0} max={1} step={0.1} onChange={e => setAlphaIm(parseFloat(e.target.value) || 0)} />
        <span className="acm-i-label">i</span>
      </div>
      
      <div className="acm-state-row">
        <span className="acm-state-label">β :</span>
        <button className="acm-sign-btn" onClick={() => setBetaSign(s => s === '+' ? '-' : '+')}>{betaSign}</button>
        <span className="acm-sqrt">√</span>
        <input type="number" className="acm-num-input" value={betaRe} min={0} max={1} step={0.1} onChange={e => setBetaRe(parseFloat(e.target.value) || 0)} />
        <button className="acm-sign-btn" onClick={() => setBetaImSign(s => s === '+' ? '-' : '+')}>{betaImSign}</button>
        <span className="acm-sqrt">√</span>
        <input type="number" className="acm-num-input" value={betaIm} min={0} max={1} step={0.1} onChange={e => setBetaIm(parseFloat(e.target.value) || 0)} />
        <span className="acm-i-label">i</span>
      </div>

      {algorithm.id === 'teleportation-n' && (
        <>
          <div className="acm-field-row">
            <label>Number of Qubits:</label>
            <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
              <option value={2}>2 Qubits</option>
              <option value={3}>3 Qubits</option>
              <option value={4}>4 Qubits</option>
            </select>
          </div>
          <div className="acm-field-row">
            <label>State Type:</label>
            <select className="acm-select" value={stateType} onChange={e => setStateType(e.target.value)}>
              <option value="ghz">GHZ State (Sampled)</option>
              <option value="w">W State (Sampled)</option>
            </select>
          </div>
        </>
      )}
    </div>
  );

  const renderOracleConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Number of Qubits:</label>
        <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
          <option value={2}>2 Qubits</option>
          <option value={3}>3 Qubits</option>
          <option value={4}>4 Qubits</option>
          <option value={5}>5 Qubits</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>Oracle Function:</label>
        <select className="acm-select" value={oracle} onChange={e => setOracle(e.target.value)}>
          <option value="constant-0">f(x) = 0 (Constant)</option>
          <option value="constant-1">f(x) = 1 (Constant)</option>
          <option value="balanced">f(x) = Balanced</option>
          {algorithm.id === 'deutsch' && <option value="identity">f(x) = x (Identity)</option>}
          {algorithm.id === 'deutsch' && <option value="negation">f(x) = NOT x</option>}
        </select>
      </div>
    </div>
  );

  const renderSecretStringConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Number of Qubits:</label>
        <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
          <option value={2}>2 Qubits</option>
          <option value={3}>3 Qubits</option>
          <option value={4}>4 Qubits</option>
          <option value={5}>5 Qubits</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>Secret String:</label>
        <input 
          type="text" 
          className="acm-text-input" 
          value={secretString} 
          onChange={e => setSecretString(e.target.value)}
          placeholder="Enter binary string (e.g. 101)"
          maxLength={numQubits}
        />
      </div>
      <div className="acm-hint">
        String length should be ≤ {numQubits} bits
      </div>
    </div>
  );

  const renderBitInputConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Input Bits:</label>
        <input 
          type="text" 
          className="acm-text-input" 
          value={inputBits} 
          onChange={e => setInputBits(e.target.value)}
          placeholder="Enter input bits (e.g. 00, 01, 10, 11)"
          maxLength={2}
        />
      </div>
      <div className="acm-hint">
        Input bit length should be equal to 2
      </div>
    </div>
  );

  const renderQubitCountConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Number of Qubits:</label>
        <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
          <option value={2}>2 Qubits</option>
          <option value={3}>3 Qubits</option>
          <option value={4}>4 Qubits</option>
          <option value={5}>5 Qubits</option>
          <option value={6}>6 Qubits</option>
        </select>
      </div>
    </div>
  );

  const renderGroverConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Number of Qubits:</label>
        <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
          <option value={2}>2 Qubits</option>
          <option value={3}>3 Qubits</option>
          <option value={4}>4 Qubits</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>Target State (Oracle):</label>
        <select className="acm-select" value={oracle} onChange={e => setOracle(e.target.value)}>
          <option value="11">|{numQubits === 2 ? '11' : numQubits === 3 ? '111' : '1111'}⟩</option>
          <option value="01">|{numQubits === 2 ? '01' : numQubits === 3 ? '010' : '0101'}⟩</option>
          <option value="10">|{numQubits === 2 ? '10' : numQubits === 3 ? '101' : '1010'}⟩</option>
        </select>
      </div>
    </div>
  );

  const renderShorConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Number to Factor:</label>
        <input 
          type="number" 
          className="acm-text-input" 
          value={numberToFactor} 
          onChange={e => setNumberToFactor(parseInt(e.target.value) || 15)}
          min={4}
          max={100}
        />
      </div>
      <div className="acm-hint">
        Enter a composite number (e.g. 15, 21, 35)
      </div>
    </div>
  );

  const renderVQEConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Molecule:</label>
        <select className="acm-select" value={molecule} onChange={e => setMolecule(e.target.value)}>
          <option value="H2">H₂ (Hydrogen)</option>
          <option value="LiH">LiH (Lithium Hydride)</option>
          <option value="BeH2">BeH₂ (Beryllium Hydride)</option>
          <option value="H2O">H₂O (Water)</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>Ansatz Layers:</label>
        <select className="acm-select" value={layers} onChange={e => setLayers(parseInt(e.target.value))}>
          <option value={1}>1 Layer</option>
          <option value={2}>2 Layers</option>
          <option value={3}>3 Layers</option>
        </select>
      </div>
    </div>
  );

  const renderQAOAConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Graph Type:</label>
        <select className="acm-select" value={graphType} onChange={e => setGraphType(e.target.value)}>
          <option value="random">Random</option>
          <option value="regular">Regular</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>Number of Qubits:</label>
        <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
          <option value={3}>3 Qubits</option>
          <option value={4}>4 Qubits</option>
          <option value={5}>5 Qubits</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>QAOA Layers (p):</label>
        <select className="acm-select" value={layers} onChange={e => setLayers(parseInt(e.target.value))}>
          <option value={1}>p = 1</option>
          <option value={2}>p = 2</option>
          <option value={3}>p = 3</option>
        </select>
      </div>
    </div>
  );

  const renderWalksConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Number of Qubits:</label>
        <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
          <option value={2}>2 Qubits</option>
          <option value={3}>3 Qubits</option>
          <option value={4}>4 Qubits</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>Walk Steps:</label>
        <input 
          type="number" 
          className="acm-text-input" 
          value={walkSteps} 
          onChange={e => setWalkSteps(parseInt(e.target.value) || 5)}
          min={1}
          max={20}
        />
      </div>
    </div>
  );

  const renderErrorCorrectionConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Error Type to Inject:</label>
        <select className="acm-select" value={oracle} onChange={e => setOracle(e.target.value)}>
          <option value="bit-flip">Bit-flip (X error)</option>
          <option value="phase-flip">Phase-flip (Z error)</option>
          <option value="both">Both (Y error)</option>
          <option value="none">No error</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>Error on Qubit:</label>
        <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
          <option value={0}>Qubit 0</option>
          <option value={1}>Qubit 1</option>
          <option value={2}>Qubit 2</option>
        </select>
      </div>
    </div>
  );

  const renderMLConfig = () => (
    <div className="acm-section">
      <div className="acm-field-row">
        <label>Feature Qubits:</label>
        <select className="acm-select" value={numQubits} onChange={e => setNumQubits(parseInt(e.target.value))}>
          <option value={2}>2 Qubits</option>
          <option value={3}>3 Qubits</option>
          <option value={4}>4 Qubits</option>
        </select>
      </div>
      <div className="acm-field-row">
        <label>Variational Layers:</label>
        <select className="acm-select" value={layers} onChange={e => setLayers(parseInt(e.target.value))}>
          <option value={1}>1 Layer</option>
          <option value={2}>2 Layers</option>
          <option value={3}>3 Layers</option>
          <option value={4}>4 Layers</option>
        </select>
      </div>
    </div>
  );

  const renderSimpleConfig = () => (
    <div className="acm-section">
      <div className="acm-simple-message" style={{ lineHeight: '1.6', color: '#cbd5e1', fontSize: '13px' }}>
        {algorithm.description || 'This algorithm will be loaded with default parameters.'}
      </div>
      <div style={{ marginTop: '16px', padding: '12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#94a3b8', fontSize: '12px' }}>
        <div style={{ fontWeight: '600', color: '#38bdf8', marginBottom: '4px' }}>Ready to Synthesize:</div>
        Click <strong>Load</strong> to generate the theoretical quantum circuit topology directly onto the circuit canvas.
      </div>
    </div>
  );

  const renderConfig = () => {
    switch (configType) {
      case 'state-vector': return renderStateVectorConfig();
      case 'oracle': return renderOracleConfig();
      case 'secret-string': return renderSecretStringConfig();
      case 'bit-input': return renderBitInputConfig();
      case 'qubit-count': return renderQubitCountConfig();
      case 'grover': return renderGroverConfig();
      case 'shor': return renderShorConfig();
      case 'vqe': return renderVQEConfig();
      case 'qaoa': return renderQAOAConfig();
      case 'walks': return renderWalksConfig();
      case 'error-correction': return renderErrorCorrectionConfig();
      case 'ml-config': return renderMLConfig();
      default: return renderSimpleConfig();
    }
  };

  return (
    <div className="acm-overlay" onClick={onClose}>
      <div className="acm-dialog" onClick={e => e.stopPropagation()}>
        
        <div className="acm-dialog-header">
          <h3>{algorithm.title}</h3>
          <button className="acm-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="acm-dialog-body">
          {renderConfig()}
        </div>
        
        <div className="acm-dialog-footer">
          <button className="acm-btn-close" onClick={onClose}>Close</button>
          <button className="acm-btn-load" onClick={handleLoad}>Load</button>
        </div>

        <div className="acm-tooltip">
          Set parameters to load a circuit
        </div>
      </div>
    </div>
  );
}
