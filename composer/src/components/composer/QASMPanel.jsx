import { useState, useEffect, useRef } from 'react';
import { useCircuitStore } from '../../stores/circuitStore';
import CustomDropdown from './CustomDropdown';
import { 
  circuitToQASM, 
  circuitToTranspiledQASM,
  circuitToHardwareAssembly,
  circuitToQiskitTranspiled,
  circuitToOpenPulseSchedule,
  circuitToPython, 
  circuitToCirq, 
  circuitToCudaQ, 
  circuitToQulacs, 
  circuitToQuEst,
  qasmToCircuit
} from '../../quantum-engine/qasm-parser';

// ... (highlightQASM function remains unchanged) ...

function highlightQASM(line) {
  // Return an array of spans with syntax highlighting
  if (!line || line.trim() === '') return <span>&nbsp;</span>;
  
  // Comments
  if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
    return <span className="qasm-comment">{line}</span>;
  }

  // Directive: OPENQASM
  if (line.startsWith('OPENQASM') || line.startsWith('import') || line.startsWith('from') || line.startsWith('#include')) {
    return <span className="qasm-directive">{line}</span>;
  }

  // Include
  if (line.startsWith('include')) {
    const parts = line.match(/(include\s+)(".*")(;?)/);
    if (parts) {
      return (
        <>
          <span className="qasm-directive">{parts[1]}</span>
          <span className="qasm-string">{parts[2]}</span>
          <span className="qasm-bracket">{parts[3]}</span>
        </>
      );
    }
    return <span className="qasm-directive">{line}</span>;
  }

  // Register declarations
  if (line.match(/^(qreg|creg)\s/)) {
    const parts = line.match(/(qreg|creg)(\s+\w+)(\[)(\d+)(\])(;)/);
    if (parts) {
      return (
        <>
          <span className="qasm-register">{parts[1]}</span>
          <span className="qasm-keyword">{parts[2]}</span>
          <span className="qasm-bracket">{parts[3]}</span>
          <span className="qasm-number">{parts[4]}</span>
          <span className="qasm-bracket">{parts[5]}{parts[6]}</span>
        </>
      );
    }
    return <span className="qasm-register">{line}</span>;
  }

  // Gate operations
  const gateMatch = line.match(/^(\w+)(\(.*?\))?\s+(.*)(;)$/);
  if (gateMatch) {
    return (
      <>
        <span className="qasm-gate">{gateMatch[1]}</span>
        {gateMatch[2] && <span className="qasm-number">{gateMatch[2]}</span>}
        <span className="qasm-keyword"> {gateMatch[3]}</span>
        <span className="qasm-bracket">{gateMatch[4]}</span>
      </>
    );
  }

  return <span className="qasm-keyword">{line}</span>;
}

export default function QASMPanel() {
  const circuit = useCircuitStore(state => state.circuit);
  const loadCircuit = useCircuitStore(state => state.loadCircuit);
  const setCustomEditMode = useCircuitStore(state => state.setCustomEditMode);
  
  const [qasmCode, setQasmCode] = useState('');
  const [version, setVersion] = useState('2.0');
  const [isFocused, setIsFocused] = useState(false);
  const bgRef = useRef(null);
  
  const handleScroll = (e) => {
    if (bgRef.current) {
      bgRef.current.scrollTop = e.target.scrollTop;
      bgRef.current.scrollLeft = e.target.scrollLeft;
    }
  };
  
  useEffect(() => {
    if (isFocused) return; // Don't overwrite while user is typing
    
    let code = '';
    switch (version) {
      case '2.0': code = circuitToQASM(circuit); break;
      case 'transpiled': code = circuitToHardwareAssembly(circuit); break;
      case 'qiskit_transpiled': code = circuitToQiskitTranspiled(circuit); break;
      case 'pulse': code = circuitToOpenPulseSchedule(circuit); break;
      case 'alpha': case 'qiskit_edit': code = circuitToPython(circuit); break;
      case 'cirq': case 'cirq_edit': code = circuitToCirq(circuit); break;
      case 'cudaq': case 'cudaq_edit': code = circuitToCudaQ(circuit); break;
      case 'quest': case 'quest_edit': code = circuitToQuEst(circuit); break;
      case 'qulacs': case 'qulacs_edit': code = circuitToQulacs(circuit); break;
      default: code = circuitToQASM(circuit);
    }
    setQasmCode(code);
  }, [circuit, version]);

  const lines = qasmCode.split('\n');
  
  const versionOptions = [
    { label: 'OpenQASM 2.0', value: '2.0' },
    { label: 'Transpiled (Hardware Assembly / eQASM)', value: 'transpiled' },
    { label: 'Transpiled (Qiskit Python SDK)', value: 'qiskit_transpiled' },
    { label: 'Transpiled (OpenPulse Schedule)', value: 'pulse' },
    { label: 'Alpha(v1.1.1)', value: 'alpha' },
    { label: 'Alpha(v1.1.1 Edit)', value: 'qiskit_edit' },
    { label: 'Cirq(v1.5.0)', value: 'cirq' },
    { label: 'Cirq(v1.5.0 Edit)', value: 'cirq_edit' },
    { label: 'CudaQ(v0.11.0)', value: 'cudaq' },
    { label: 'CudaQ(v0.11.0 Edit)', value: 'cudaq_edit' },
    { label: 'QuEst(v3.7.0)', value: 'quest' },
    { label: 'QuEst(v3.7.0 Edit)', value: 'quest_edit' },
    { label: 'Qulacs(v0.6.13)', value: 'qulacs' },
    { label: 'Qulacs(v0.6.13 Edit)', value: 'qulacs_edit' }
  ];

  return (
    <div className="qasm-panel-container">
      <div className="panel-header">
        <div className="panel-header-left">
          <CustomDropdown 
            options={versionOptions}
            value={version}
            onChange={(v) => {
              setVersion(v);
              if (v === '2.0') {
                setCustomEditMode(false);
              } else if (v.endsWith('_edit')) {
                setCustomEditMode(true);
              } else {
                setCustomEditMode(false);
              }
            }}
          />
        </div>
        <div className="panel-header-right">
          <button className="panel-icon-btn" title="Info">ⓘ</button>
          <button 
            className="panel-icon-btn" 
            title="Copy"
            onClick={() => navigator.clipboard.writeText(qasmCode)}
          >
            📋
          </button>
          <button className="panel-icon-btn" title="More">⋮</button>
        </div>
      </div>
      
      <div className="qasm-editor" style={{ position: 'relative', overflow: 'hidden' }}>
        
        {/* Background Syntax Highlighted Layer */}
        <div 
          ref={bgRef}
          className="qasm-lines" 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none', 
            whiteSpace: 'pre',
            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
            margin: 0,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '11px',
            lineHeight: '1.5',
            boxSizing: 'border-box'
          }}
        >
          {lines.map((line, idx) => (
            <div key={idx} className="qasm-line" style={{ display: 'block', height: '1.5em' }}>
              <span className="qasm-line-num" style={{ position: 'absolute', left: '0.5rem', width: '1.5rem', textAlign: 'right', color: 'rgba(255,255,255,0.3)', userSelect: 'none' }}>{idx + 1}</span>
              <span className="qasm-line-content">{highlightQASM(line)}</span>
            </div>
          ))}
        </div>

        {/* Foreground Editable Textarea */}
        <textarea
          readOnly={version !== '2.0' && !version.endsWith('_edit')}
          value={qasmCode}
          onChange={(e) => {
            const newCode = e.target.value;
            setQasmCode(newCode);
            if (version === '2.0' || version.endsWith('_edit')) {
              try {
                const newCircuit = qasmToCircuit(newCode);
                loadCircuit(newCircuit);
                if (version.endsWith('_edit')) {
                  setCustomEditMode(true);
                } else {
                  setCustomEditMode(false);
                }
              } catch (err) {
                // ignore intermediate parse errors
              }
            }
          }}
          onScroll={handleScroll}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          spellCheck={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            color: 'transparent',
            caretColor: 'white',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
            margin: 0,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '11px',
            lineHeight: '1.5',
            whiteSpace: 'pre',
            overflow: 'auto',
            boxSizing: 'border-box',
            zIndex: 1
          }}
        />
      </div>
    </div>
  );
}
