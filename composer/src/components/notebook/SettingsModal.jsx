import React, { useState } from 'react';

const TABS = ['Site', 'Editor', 'AI Assistance', 'Quantum Pro', 'GitHub', 'Miscellaneous'];

/**
 * SettingsModal — Colab-style multi-tab settings dialog.
 */
export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('Site');
  const [theme, setTheme] = useState('adaptive');
  const [layout, setLayout] = useState('horizontal');
  const [desktopNotif, setDesktopNotif] = useState(false);
  const [privateOutputs, setPrivateOutputs] = useState(false);
  const [scratchDefault, setScratchDefault] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [indentSize, setIndentSize] = useState(4);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="nb-modal-overlay" onClick={onClose}>
      <div className="nb-modal nb-settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="nb-modal__title">Settings</h2>

        <div className="nb-settings-modal__body">
          {/* Left tabs */}
          <div className="nb-settings-modal__tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`nb-settings-modal__tab ${activeTab === tab ? 'nb-settings-modal__tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                <span className="nb-settings-modal__tab-arrow">›</span>
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="nb-settings-modal__content">
            {activeTab === 'Site' && (
              <>
                <div className="nb-settings-field">
                  <label>Theme</label>
                  <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="adaptive">adaptive</option>
                    <option value="dark">dark</option>
                    <option value="light">light</option>
                  </select>
                </div>
                <div className="nb-settings-check">
                  <input type="checkbox" checked={desktopNotif} onChange={() => setDesktopNotif(!desktopNotif)} />
                  <span>Show desktop notifications for completed executions</span>
                </div>
                <div className="nb-settings-check">
                  <input type="checkbox" checked={privateOutputs} onChange={() => setPrivateOutputs(!privateOutputs)} />
                  <span>New notebooks use private outputs (omit outputs when saving)</span>
                </div>
                <div className="nb-settings-field">
                  <label>Default page layout</label>
                  <select value={layout} onChange={(e) => setLayout(e.target.value)}>
                    <option value="horizontal">horizontal</option>
                    <option value="vertical">vertical</option>
                  </select>
                </div>
                <div className="nb-settings-field">
                  <label>Custom snippet notebook URL</label>
                  <input type="text" placeholder="Custom snippet notebook URL" />
                </div>
                <div className="nb-settings-check">
                  <input type="checkbox" checked={scratchDefault} onChange={() => setScratchDefault(!scratchDefault)} />
                  <span>Use a temporary scratch notebook as the default landing page.</span>
                </div>
              </>
            )}

            {activeTab === 'Editor' && (
              <>
                <div className="nb-settings-field">
                  <label>Font size</label>
                  <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} min={10} max={24} />
                </div>
                <div className="nb-settings-field">
                  <label>Indent width</label>
                  <select value={indentSize} onChange={(e) => setIndentSize(Number(e.target.value))}>
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                    <option value={8}>8 spaces</option>
                  </select>
                </div>
                <div className="nb-settings-check">
                  <input type="checkbox" checked={lineNumbers} onChange={() => setLineNumbers(!lineNumbers)} />
                  <span>Show line numbers</span>
                </div>
                <div className="nb-settings-check">
                  <input type="checkbox" checked={wordWrap} onChange={() => setWordWrap(!wordWrap)} />
                  <span>Word wrap</span>
                </div>
              </>
            )}

            {activeTab === 'AI Assistance' && (
              <div className="nb-settings-placeholder">
                <p>AI assistance settings will be available in a future update.</p>
              </div>
            )}

            {activeTab === 'Quantum Pro' && (
              <div className="nb-settings-placeholder">
                <p>Quantum Pro subscription features coming soon.</p>
              </div>
            )}

            {activeTab === 'GitHub' && (
              <div className="nb-settings-placeholder">
                <p>Connect your GitHub account to save notebooks directly to repositories.</p>
              </div>
            )}

            {activeTab === 'Miscellaneous' && (
              <div className="nb-settings-placeholder">
                <p>Additional settings will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="nb-modal__footer">
          <button className="nb-modal__btn nb-modal__btn--secondary" onClick={onClose}>Cancel</button>
          <button className="nb-modal__btn nb-modal__btn--primary" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>
  );
}
