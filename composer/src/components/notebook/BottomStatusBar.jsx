import React from 'react';

/**
 * BottomStatusBar — Colab-style footer bar with Variables, Terminal links and runtime info.
 */
export default function BottomStatusBar({ onOpenTerminal, onOpenVariables }) {
  return (
    <div className="nb-status-bar">
      <div className="nb-status-bar__left">
        <button className="nb-status-bar__btn" onClick={onOpenVariables}>
          <span className="nb-status-bar__btn-icon">{'{ }'}</span>
          <span>Variables</span>
        </button>
        <button className="nb-status-bar__btn" onClick={onOpenTerminal}>
          <span className="nb-status-bar__btn-icon">▣</span>
          <span>Terminal</span>
        </button>
      </div>

      <div className="nb-status-bar__center">
        <button className="nb-status-bar__fab" title="AI Assistant">
          ✦
        </button>
      </div>

      <div className="nb-status-bar__right">
        <span className="nb-status-bar__runtime-icon">🐍</span>
        <span className="nb-status-bar__runtime-label">Python 3</span>
      </div>
    </div>
  );
}
