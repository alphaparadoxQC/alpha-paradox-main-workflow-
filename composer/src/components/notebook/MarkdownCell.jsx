import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import useNotebookStore from '../../stores/notebookStore';

/**
 * MarkdownCell — Colab-style Edit/Preview toggle cell with LaTeX math support.
 */
export default function MarkdownCell({ cell }) {
  const {
    activeCellId, setActiveCell, updateCellContent,
    deleteCell, moveCell, toggleEditing, addCell,
  } = useNotebookStore();

  const textareaRef = useRef(null);
  const isActive = activeCellId === cell.id;
  const isEditing = cell.editing;
  const [hovered, setHovered] = useState(false);

  const handleDoubleClick = () => {
    toggleEditing(cell.id);
    setActiveCell(cell.id);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      toggleEditing(cell.id);
    }
    if (e.key === 'Escape') {
      toggleEditing(cell.id);
    }
  };

  return (
    <div
      id={`cell-${cell.id}`}
      className={`nb-cell nb-cell--markdown ${isActive ? 'nb-cell--active' : ''}`}
      onClick={() => setActiveCell(cell.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left gutter */}
      <div className="nb-cell__gutter">
        <span className="nb-cell__badge nb-cell__badge--md">M</span>
      </div>

      {/* Main content */}
      <div className="nb-cell__body">
        {/* Edit mode */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="nb-md-editor"
            value={cell.content}
            onChange={(e) => updateCellContent(cell.id, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write Markdown here... (supports $LaTeX$ math)"
            rows={Math.max(3, cell.content.split('\n').length + 1)}
            autoFocus
          />
        ) : (
          /* Preview mode */
          <div className="nb-md-preview" onDoubleClick={handleDoubleClick}>
            {cell.content.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {cell.content}
              </ReactMarkdown>
            ) : (
              <p className="nb-md-preview__empty">Double-click to edit this cell</p>
            )}
          </div>
        )}

        {/* Add cell buttons */}
        <div className="nb-cell__add-row">
          <button onClick={() => addCell('code', cell.id)}>+ Code</button>
          <button onClick={() => addCell('markdown', cell.id)}>+ Text</button>
        </div>
      </div>

      {/* Floating action bar (Colab-style) */}
      {(hovered || isActive) && (
        <div className="nb-cell__float-actions">
          <button onClick={() => moveCell(cell.id, -1)} title="Move up">↑</button>
          <button onClick={() => moveCell(cell.id, 1)} title="Move down">↓</button>
          <button onClick={() => toggleEditing(cell.id)} title={isEditing ? 'Preview' : 'Edit'}>
            {isEditing ? '👁' : '✏️'}
          </button>
          <button className="nb-cell__float-delete" onClick={() => deleteCell(cell.id)} title="Delete">🗑</button>
        </div>
      )}
    </div>
  );
}
