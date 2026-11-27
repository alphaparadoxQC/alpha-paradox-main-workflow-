import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotebookStore from '../../stores/notebookStore';
import { openNotebookCodeInComposer } from '../../utils/circuitBridge';

/**
 * SecondaryToolbar — Colab-style action bar with +Code, +Text, Run all, and resource meters.
 */
export default function SecondaryToolbar({ onToggleBg, showVideoBg }) {
  const navigate = useNavigate();
  const {
    cells, activeCellId,
    addCell, runAll, interruptKernel, restartKernel, clearOutputs,
    resourceMetrics, kernelStatus, setCommandPaletteOpen
  } = useNotebookStore();
  const [showRunMenu, setShowRunMenu] = useState(false);
  const [showResourcePopover, setShowResourcePopover] = useState(false);

  const handleOpenInComposer = () => {
    const activeCell = cells.find(c => c.id === activeCellId) || cells.find(c => c.type === 'code');
    const code = activeCell ? activeCell.content : cells.filter(c => c.type === 'code').map(c => c.content).join('\n');
    openNotebookCodeInComposer(code, navigate);
  };

  const ramPct = resourceMetrics?.ram_percent || 0;
  const diskPct = resourceMetrics?.disk_percent || 0;
  const isConnected = kernelStatus === 'idle' || kernelStatus === 'busy';

  return (
    <div className="nb-secondary-toolbar">
      <div className="nb-secondary-toolbar__left">
        <button className="nb-secondary-toolbar__search" title="Commands (Cmd/Ctrl+Shift+P)" onClick={() => setCommandPaletteOpen(true)}>
          🔍 Commands
        </button>

        <div className="nb-secondary-toolbar__separator" />

        <button className="nb-secondary-toolbar__btn" onClick={() => addCell('code')}>
          + Code
        </button>
        <button className="nb-secondary-toolbar__btn" onClick={() => addCell('markdown')}>
          + Text
        </button>

        <div className="nb-secondary-toolbar__separator" />

        <div className="nb-secondary-toolbar__run-group">
          <button className="nb-secondary-toolbar__run-btn" onClick={runAll}>
            ▶ Run all
          </button>
          <button
            className="nb-secondary-toolbar__run-arrow"
            onClick={(e) => { e.stopPropagation(); setShowRunMenu(!showRunMenu); }}
          >
            ▾
          </button>
          {showRunMenu && (
            <div className="nb-secondary-toolbar__dropdown" onClick={() => setShowRunMenu(false)}>
              <button className="nb-toolbar-dropdown-btn" onClick={restartKernel}>Restart session</button>
              <button className="nb-toolbar-dropdown-btn" onClick={() => { restartKernel(); runAll(); }}>Restart session and run all</button>
              <button className="nb-toolbar-dropdown-btn" onClick={runAll}>Run focused cell and all cells below</button>
              <button className="nb-toolbar-dropdown-btn" onClick={interruptKernel}>Interrupt execution</button>
              <button className="nb-toolbar-dropdown-btn" onClick={clearOutputs}>Clear all outputs</button>
            </div>
          )}
        </div>

        <div className="nb-secondary-toolbar__separator" />

        <button
          className="nb-secondary-toolbar__btn"
          style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(59, 130, 246, 0.2))',
            borderColor: 'rgba(168, 85, 247, 0.6)',
            color: '#d8b4fe',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          onClick={handleOpenInComposer}
          title="Export active circuit from notebook cell directly into Alpha Composer"
        >
          <span>🚀</span>
          <span>Open in Composer</span>
        </button>
      </div>

      <div className="nb-secondary-toolbar__right">
        {/* Background toggle */}
        {onToggleBg && (
          <button className="nb-secondary-toolbar__btn" onClick={onToggleBg} title="Toggle background">
            {showVideoBg ? '🖼️' : '🎥'}
          </button>
        )}

        {/* Resource meter */}
        <div
          className="nb-secondary-toolbar__resources"
          onMouseEnter={() => setShowResourcePopover(true)}
          onMouseLeave={() => setShowResourcePopover(false)}
        >
          <span className="nb-resource-check" style={{ color: isConnected ? '#10b981' : '#f59e0b' }}>
            {isConnected ? '✓' : '●'}
          </span>
          <div className="nb-resource-meters">
            <div className="nb-resource-meter">
              <span className="nb-resource-meter__label">RAM</span>
              <div className="nb-resource-meter__bar">
                <div className="nb-resource-meter__fill" style={{ width: `${ramPct}%` }} />
              </div>
            </div>
            <div className="nb-resource-meter">
              <span className="nb-resource-meter__label">Disk</span>
              <div className="nb-resource-meter__bar">
                <div className="nb-resource-meter__fill" style={{ width: `${diskPct}%` }} />
              </div>
            </div>
          </div>
          <button className="nb-resource-expand" title="Expand">▾</button>

          {showResourcePopover && (
            <div className="nb-resource-popover">
              <p><strong>Connected to</strong></p>
              <p>Python 3.13 (IPython Kernel Gateway)</p>
              <p>Status: <span style={{ color: isConnected ? '#8ab4f8' : '#fbbf24', textTransform: 'capitalize' }}>{kernelStatus}</span></p>
              <p>RAM: {resourceMetrics?.ram_used_gb || 0} GB / {resourceMetrics?.ram_total_gb || 0} GB ({ramPct}%)</p>
              <p>Disk: {resourceMetrics?.disk_used_gb || 0} GB / {resourceMetrics?.disk_total_gb || 0} GB ({diskPct}%)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
