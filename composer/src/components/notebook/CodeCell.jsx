import React, { useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import OutputRenderer from './OutputRenderer';
import InteractiveChipWidget from './InteractiveChipWidget';
import useNotebookStore from '../../stores/notebookStore';
import { openNotebookCodeInComposer } from '../../utils/circuitBridge';
import CrossProductBridge from '../../quantum-engine/cross-product-bridge';

/**
 * CodeCell — Colab-style Monaco-powered Python code editor.
 * Features: Shift+Enter to run, floating action bar, execution counter.
 */
export default function CodeCell({ cell }) {
  const {
    activeCellId, setActiveCell, updateCellContent,
    runCell, deleteCell, moveCell, toggleCollapse,
    clearCellOutput, addCell,
  } = useNotebookStore();

  const navigate = useNavigate();
  const editorRef = useRef(null);
  const isActive = activeCellId === cell.id;
  const [hovered, setHovered] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showChipPreview, setShowChipPreview] = useState(false);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.addCommand(2048 | 3, () => runCell(cell.id));
    editor.onDidFocusEditorWidget(() => setActiveCell(cell.id));
  }, [cell.id, runCell, setActiveCell]);

  const handleChange = useCallback((value) => {
    updateCellContent(cell.id, value || '');
  }, [cell.id, updateCellContent]);

  const getBadge = () => {
    if (cell.status === 'running') return '*';
    if (cell.executionCount !== null) return cell.executionCount;
    return ' ';
  };

  const getDuration = () => {
    if (!cell.startedAt) return null;
    const end = cell.completedAt || Date.now();
    const ms = end - cell.startedAt;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const lineCount = (cell.content.split('\n').length);
  const editorHeight = Math.max(60, Math.min(lineCount * 20 + 20, 500));

  return (
    <div
      id={`cell-${cell.id}`}
      className={`nb-cell nb-cell--code ${isActive ? 'nb-cell--active' : ''}`}
      onClick={() => setActiveCell(cell.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMore(false); }}
    >
      {/* Left gutter — Play button (Colab style) */}
      <div className="nb-cell__gutter">
        <button
          className={`nb-cell__play-btn nb-cell__play-btn--${cell.status}`}
          onClick={(e) => { e.stopPropagation(); runCell(cell.id); }}
          title="Run cell (Shift+Enter)"
        >
          {cell.status === 'running' ? (
            <span className="nb-cell__spinner" />
          ) : (
            <span className="nb-cell__play-icon">▶</span>
          )}
        </button>
        <span className="nb-cell__exec-count">[{getBadge()}]</span>
      </div>

      {/* Main content */}
      <div className="nb-cell__body">
        {/* Editor */}
        {!cell.collapsed && (
          <div className="nb-cell__editor-wrap">
            <Editor
              height={editorHeight}
              language="python"
              theme="vs-dark"
              value={cell.content}
              onChange={handleChange}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'line',
                scrollbar: { vertical: 'hidden', horizontal: 'auto' },
                overviewRulerBorder: false,
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                padding: { top: 8, bottom: 8 },
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 4,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
              }}
            />
          </div>
        )}

        {/* Collapsed indicator */}
        {cell.collapsed && (
          <div className="nb-cell__collapsed-hint" onClick={() => toggleCollapse(cell.id)}>
            ⋯ {lineCount} lines hidden
          </div>
        )}

        {/* Alpha Metal Chip Design Quick Floorplan Preview */}
        {!cell.collapsed && (
          (cell.content || '').includes('alpha_metal') ||
          (cell.content || '').includes('DesignPlanar') ||
          (cell.content || '').includes('TransmonCross') ||
          (cell.content || '').includes('TransmonPocket')
        ) && (
          <div style={{ marginTop: '6px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChipPreview(!showChipPreview);
                }}
                style={{
                  background: showChipPreview ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>📐</span>
                <span>{showChipPreview ? 'Hide Inline Chip Floorplan ▲' : 'Preview Silicon EDA Floorplan ▼'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  CrossProductBridge.bridgeNotebookToEda(cell.content, navigate);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Open in Silicon EDA Studio →
              </button>
            </div>
            {showChipPreview && (
              <InteractiveChipWidget cellId={cell.id} code={cell.content} />
            )}
          </div>
        )}

        {/* Output area */}
        {!cell.collapsed && cell.outputs.length > 0 && (
          <OutputRenderer outputs={cell.outputs} cellId={cell.id} />
        )}

        {/* Add cell buttons (between cells) */}
        <div className="nb-cell__add-row">
          <button onClick={() => addCell('code', cell.id)} title="Add code cell below">+ Code</button>
          <button onClick={() => addCell('markdown', cell.id)} title="Add markdown cell below">+ Text</button>
        </div>
      </div>

      {/* Floating action bar (Colab-style, top-right) */}
      {(hovered || isActive) && (
        <div className="nb-cell__float-actions">
          <button onClick={() => moveCell(cell.id, -1)} title="Move up">↑</button>
          <button onClick={() => moveCell(cell.id, 1)} title="Move down">↓</button>
          <button onClick={() => toggleCollapse(cell.id)} title="Collapse">
            {cell.collapsed ? '▸' : '▾'}
          </button>
          <button onClick={() => clearCellOutput(cell.id)} title="Clear output">✕</button>
          <button 
            onClick={() => openNotebookCodeInComposer(cell.content, navigate)} 
            title="Export Circuit to Composer"
            style={{ color: '#c084fc', fontWeight: 'bold' }}
          >
            ⚛️
          </button>
          <button 
            onClick={() => CrossProductBridge.bridgeNotebookToEda(cell.content, navigate)} 
            title="Synthesize Chip into Silicon EDA Layout"
            style={{ 
              color: '#38bdf8', 
              fontWeight: 'bold',
              background: (cell.content || '').includes('alpha_metal') || (cell.content || '').includes('Transmon') ? 'rgba(6, 182, 212, 0.2)' : 'none',
              borderRadius: '3px'
            }}
          >
            📐
          </button>
          <button className="nb-cell__float-delete" onClick={() => deleteCell(cell.id)} title="Delete">🗑</button>
          <button onClick={() => setShowMore(!showMore)} title="More">⋮</button>
          {showMore && (
            <div className="nb-cell__float-more">
              <button onClick={() => addCell('code', cell.id)}>Add code cell below</button>
              <button onClick={() => addCell('markdown', cell.id)}>Add text cell below</button>
              {getDuration() && <span className="nb-cell__float-duration">Duration: {getDuration()}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
