import { useState } from 'react';
import { useNotebookStore } from '../../stores/notebookStore';

// Simple markdown parser for educational notebook
// In a production app, we'd use marked.js or react-markdown
const renderMarkdown = (text) => {
  if (!text) return { __html: '<p class="placeholder-text">Double-click to edit markdown</p>' };
  
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
    .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>")
    .replace(/\n$/gim, '<br />');

  // Basic paragraph wrapping (very naive)
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    if (line.match(/^<h|^<b|^<u|^<l/)) return line;
    if (line.trim() === '') return '<br/>';
    return `<p>${line}</p>`;
  });

  return { __html: processedLines.join('') };
};

export default function TextCell({ cell }) {
  const { updateCell, deleteCell, moveCell, setActiveCell, activeCellId } = useNotebookStore();
  const [isEditing, setIsEditing] = useState(false);
  const isActive = activeCellId === cell.id;

  const handleDoubleClick = () => {
    setActiveCell(cell.id);
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <div 
      className={`notebook-cell text-cell ${isActive ? 'active' : ''} ${isEditing ? 'editing' : ''}`}
      onClick={() => setActiveCell(cell.id)}
      onDoubleClick={handleDoubleClick}
    >
      <div className="cell-controls">
        <div className="cell-execution-count"></div>
        {isActive && !isEditing && (
          <div className="cell-actions">
            <button onClick={() => setIsEditing(true)} title="Edit">✏️</button>
            <button onClick={() => moveCell(cell.id, -1)} title="Move Up">↑</button>
            <button onClick={() => moveCell(cell.id, 1)} title="Move Down">↓</button>
            <button onClick={() => deleteCell(cell.id)} title="Delete" className="danger">🗑️</button>
          </div>
        )}
      </div>

      <div className="cell-content">
        {isEditing ? (
          <textarea
            className="markdown-editor"
            value={cell.content}
            onChange={(e) => updateCell(cell.id, e.target.value)}
            onBlur={handleBlur}
            autoFocus
            rows={Math.max(3, cell.content.split('\n').length + 1)}
          />
        ) : (
          <div 
            className="markdown-preview"
            dangerouslySetInnerHTML={renderMarkdown(cell.content)}
          />
        )}
      </div>
    </div>
  );
}
