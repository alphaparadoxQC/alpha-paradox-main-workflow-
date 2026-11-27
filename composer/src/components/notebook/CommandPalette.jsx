import React, { useState, useEffect, useRef } from 'react';
import useNotebookStore from '../../stores/notebookStore';
import '../../styles/commandPalette.css'; // We will create this

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    addCell,
    runAll,
    interruptKernel,
    restartKernel,
    clearOutputs,
    toIpynb,
    activeCellId,
    runCell
  } = useNotebookStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Define commands
  const commands = [
    { id: 'add-code', label: 'Add code cell', shortcut: '⌘/Ctrl+M B', action: () => addCell('code') },
    { id: 'add-text', label: 'Add text cell', shortcut: '⌘/Ctrl+M M', action: () => addCell('markdown') },
    { id: 'open-settings', label: 'Open notebook settings', shortcut: '', action: () => console.log('Settings opened') },
    { id: 'open-scratch', label: 'Open scratch code cell', shortcut: '⌘/Ctrl+Alt+N', action: () => console.log('Scratch cell opened') },
    { id: 'open-secrets', label: 'Open user secrets tab', shortcut: '', action: () => console.log('Secrets opened') },
    { id: 'prev-cell', label: 'Previous cell', shortcut: '⌘/Ctrl+M P', action: () => activeCellId && useNotebookStore.getState().focusPrevCell(activeCellId) },
    { id: 'print', label: 'Print notebook', shortcut: '⌘/Ctrl+P', action: () => window.print() },
    { id: 'reconnect', label: 'Reconnect', shortcut: '', action: () => restartKernel() },
    { id: 'rename', label: 'Rename notebook', shortcut: '', action: () => console.log('Rename') },
    { id: 'report-bug', label: 'Report a bug', shortcut: '', action: () => window.open('https://github.com/AlphaParadox', '_blank') },
    { id: 'run-all', label: 'Run all cells in notebook', shortcut: '⌘/Ctrl+F9', action: runAll },
    { id: 'run-insert', label: 'Run cell and insert new cell', shortcut: 'Alt+Enter', action: () => { if (activeCellId) runCell(activeCellId); addCell('code', activeCellId); } },
    { id: 'run-next', label: 'Run cell and select next cell', shortcut: 'Shift+Enter', action: () => { if (activeCellId) runCell(activeCellId); } },
    { id: 'run-before', label: 'Run cells before the current', shortcut: '⌘/Ctrl+F8', action: () => console.log('Run before') },
    { id: 'run-after', label: 'Run focused cell and all cells below', shortcut: '⌘/Ctrl+F10', action: () => console.log('Run after') },
    { id: 'run-focused', label: 'Run focused cell', shortcut: 'Ctrl+Enter', action: () => activeCellId && runCell(activeCellId) },
    { id: 'save', label: 'Save notebook', shortcut: '⌘/Ctrl+S', action: toIpynb },
    { id: 'select-all', label: 'Select all cells', shortcut: '⌘/Ctrl+Shift+A', action: () => console.log('Select all') },
    { id: 'select-focused', label: 'Select focused cell', shortcut: '⌘/Ctrl+Shift+S', action: () => activeCellId && useNotebookStore.getState().setActiveCell(activeCellId) },
    { id: 'show-snippets', label: 'Show code snippets pane', shortcut: '⌘/Ctrl+Alt+P', action: () => console.log('Snippets pane') },
    { id: 'show-stack', label: 'Show execution stack frames', shortcut: '', action: () => console.log('Stack frames') },
    { id: 'show-shortcuts', label: 'Show keyboard shortcuts', shortcut: '⌘/Ctrl+M H', action: () => console.log('Shortcuts') },
    { id: 'toggle-output', label: 'Show/hide output', shortcut: '⌘/Ctrl+M O', action: () => activeCellId && useNotebookStore.getState().toggleCollapse(activeCellId) },
    { id: 'toggle-line-numbers', label: 'Toggle line numbers', shortcut: '⌘/Ctrl+M L', action: () => console.log('Toggle line numbers') },
    { id: 'undo', label: 'Undo last cell action', shortcut: '⌘/Ctrl+M Z', action: () => console.log('Undo') },
    { id: 'unfocus', label: 'Unfocus current cell', shortcut: 'Esc', action: () => useNotebookStore.getState().setActiveCell(null) },
    { id: 'restart-run', label: 'Restart session and run all', shortcut: '', action: () => { restartKernel(); setTimeout(runAll, 1000); } },
    { id: 'interrupt', label: 'Interrupt execution', shortcut: '', action: interruptKernel },
    { id: 'clear-outputs', label: 'Clear all outputs', shortcut: '', action: clearOutputs },
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  // Reset state when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Handle Keyboard navigation inside palette
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        const cmd = filteredCommands[selectedIndex];
        cmd.action();
        setCommandPaletteOpen(false);
      }
    }
  };

  // Click outside to close
  const handleBackdropClick = (e) => {
    if (e.target.className === 'nb-command-palette-backdrop') {
      setCommandPaletteOpen(false);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="nb-command-palette-backdrop" onClick={handleBackdropClick}>
      <div className="nb-command-palette-modal">
        <div className="nb-command-palette-header">
          <input
            ref={inputRef}
            type="text"
            className="nb-command-palette-input"
            placeholder="Type to search commands..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="nb-command-palette-list">
          {filteredCommands.length === 0 ? (
            <div className="nb-command-palette-empty">No commands found.</div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`nb-command-palette-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => { cmd.action(); setCommandPaletteOpen(false); }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="nb-command-palette-label">{cmd.label}</span>
                {cmd.shortcut && <span className="nb-command-palette-shortcut">{cmd.shortcut}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
