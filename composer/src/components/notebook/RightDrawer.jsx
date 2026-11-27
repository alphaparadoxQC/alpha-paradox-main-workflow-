import React, { useState, useEffect, useRef } from 'react';
import useNotebookStore from '../../stores/notebookStore';

/**
 * RightDrawer — Collapsible right panel with Terminal and Variables tabs.
 */
export default function RightDrawer({ isOpen, onClose, activeTab, onTabChange }) {
  const [terminalInput, setTerminalInput] = useState('');
  const [variableFilter, setVariableFilter] = useState('');
  const terminalOutputRef = useRef(null);

  const terminalHistory = useNotebookStore(s => s.terminalHistory);
  const variables = useNotebookStore(s => s.variables);
  const runTerminalCommand = useNotebookStore(s => s.runTerminalCommand);
  const refreshVariables = useNotebookStore(s => s.refreshVariables);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [terminalHistory, isOpen, activeTab]);

  // Auto-refresh variables
  useEffect(() => {
    if (isOpen && activeTab === 'variables') {
      refreshVariables();
      const interval = setInterval(refreshVariables, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab, refreshVariables]);

  const filteredVars = (variables || []).filter(v =>
    (v.name || '').toLowerCase().includes(variableFilter.toLowerCase())
  );

  const handleTerminalSubmit = (e) => {
    if (e.key !== 'Enter' || !terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    runTerminalCommand(cmd);
    setTerminalInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="nb-right-drawer">
      {/* Tab headers */}
      <div className="nb-right-drawer__header">
        <button
          className={`nb-right-drawer__tab ${activeTab === 'terminal' ? 'nb-right-drawer__tab--active' : ''}`}
          onClick={() => onTabChange('terminal')}
        >
          Terminal
        </button>
        <button
          className={`nb-right-drawer__tab ${activeTab === 'variables' ? 'nb-right-drawer__tab--active' : ''}`}
          onClick={() => onTabChange('variables')}
        >
          Variables
        </button>
        <button
          className={`nb-right-drawer__tab ${activeTab === 'resources' ? 'nb-right-drawer__tab--active' : ''}`}
          onClick={() => onTabChange('resources')}
        >
          Resources
        </button>
        <button className="nb-right-drawer__close" onClick={onClose}>✕</button>
      </div>

      {/* Terminal */}
      {activeTab === 'terminal' && (
        <div className="nb-right-drawer__terminal">
          <div className="nb-right-drawer__terminal-output" ref={terminalOutputRef}>
            {(terminalHistory || []).map((line, i) => (
              <div
                key={i}
                className={`nb-right-drawer__terminal-line nb-right-drawer__terminal-line--${line.type}`}
              >
                {line.text}
              </div>
            ))}
          </div>
          <div className="nb-right-drawer__terminal-input-row">
            <span className="nb-right-drawer__terminal-prompt">/content#</span>
            <input
              className="nb-right-drawer__terminal-input"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={handleTerminalSubmit}
              placeholder=""
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Variables */}
      {activeTab === 'variables' && (
        <div className="nb-right-drawer__variables">
          <div className="nb-right-drawer__variables-warning">
            ⚠️ Variable inspector may impact runtime performance while open.
          </div>
          <table className="nb-right-drawer__variables-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Shape</th>
              </tr>
            </thead>
            <tbody>
              {filteredVars.map((v, i) => (
                <tr key={i}>
                  <td>{v.name}</td>
                  <td>{v.type}</td>
                  <td>{v.shape}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="nb-right-drawer__variables-footer">
            <input
              className="nb-right-drawer__variables-filter"
              placeholder="Filter variables"
              value={variableFilter}
              onChange={(e) => setVariableFilter(e.target.value)}
            />
          </div>
        </div>
      )}
      {/* Resources */}
      {activeTab === 'resources' && (
        <div className="nb-right-drawer__resources" style={{ padding: '16px', color: '#e8eaed', fontSize: '0.85rem' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0' }}>You are not subscribed. <a href="#" style={{ color: '#8ab4f8', textDecoration: 'none' }}>Learn more</a></p>
            <p style={{ margin: '0 0 8px 0', lineHeight: '1.4' }}>
              You currently have zero compute units available. Resources offered free of charge are not guaranteed. 
              Purchase more units <a href="#" style={{ color: '#8ab4f8', textDecoration: 'none' }}>here</a>.
            </p>
            <p style={{ margin: '0 0 16px 0', lineHeight: '1.4' }}>
              At your current usage level, this runtime may last up to 72 hours 50 minutes.
            </p>
            <button style={{ 
              background: 'transparent', border: 'none', color: '#8ab4f8', 
              cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '0.85rem' 
            }}>
              Manage sessions
            </button>
          </div>

          <div style={{ 
            background: '#1a73e8', padding: '12px', borderRadius: '4px', 
            marginBottom: '20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span>ⓘ</span>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Want more memory and disk space?</div>
                <a href="#" style={{ color: '#fff', textDecoration: 'underline' }}>Upgrade to Colab Pro</a>
              </div>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>✕</button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 4px 0' }}>Python 3 Google Compute Engine backend</p>
            <p style={{ margin: '0 0 16px 0', color: '#9aa0a6' }}>Showing resources from 12:05 PM to 12:11 PM</p>
            
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>System RAM</span>
                  <span>1.0 / 12.7 GB</span>
                </div>
                <div style={{ height: '60px', background: '#3c4043', borderRadius: '2px', position: 'relative', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #10b981' }}>
                  <div style={{ width: '100%', height: '10%', background: 'rgba(16, 185, 129, 0.2)' }}></div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Disk</span>
                  <span>20.3 / 107.7 GB</span>
                </div>
                <div style={{ height: '60px', background: '#3c4043', borderRadius: '2px', position: 'relative', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #10b981' }}>
                  <div style={{ width: '100%', height: '20%', background: 'rgba(16, 185, 129, 0.2)' }}></div>
                </div>
              </div>
            </div>
          </div>

          <button style={{ 
            background: 'transparent', border: 'none', color: '#8ab4f8', 
            cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '0.85rem' 
          }}>
            Change runtime type
          </button>
        </div>
      )}
    </div>
  );
}
