import React, { useEffect, useCallback, useState } from 'react';
import useNotebookStore from '../stores/notebookStore';
import NotebookToolbar from '../components/notebook/NotebookToolbar';
import SecondaryToolbar from '../components/notebook/SecondaryToolbar';
import LeftSidebar from '../components/notebook/LeftSidebar';
import RightDrawer from '../components/notebook/RightDrawer';
import BottomStatusBar from '../components/notebook/BottomStatusBar';
import CodeCell from '../components/notebook/CodeCell';
import MarkdownCell from '../components/notebook/MarkdownCell';
import AIChatPanel from '../components/shared/AIChatPanel';
import CommandPalette from '../components/notebook/CommandPalette';
import UnifiedNavbar from '../components/shared/UnifiedNavbar';
import useAIChatStore from '../stores/aiChatStore';
import '../styles/notebook.css';

/**
 * NotebookPage — Colab-style 3-pane layout for the Quantum Notebook.
 * Layout: LeftSidebar | MainContent | RightDrawer
 */
export default function NotebookPage({ session }) {
  const { cells, activeCellId, addCell, setActiveCell, connectKernel } = useNotebookStore();
  const [showVideoBg, setShowVideoBg] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [rightDrawerTab, setRightDrawerTab] = useState('terminal');

  // Initialize live quantum kernel session on mount
  useEffect(() => {
    const userSessionId = session?.user?.id || 'session-user-1';
    connectKernel(userSessionId);
  }, [session, connectKernel]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      useNotebookStore.getState().toIpynb();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      useNotebookStore.getState().setCommandPaletteOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Snippet insert handler (from LeftSidebar)
  const handleInsertSnippet = (type, content) => {
    addCell(type);
    if (content) {
      // Update the new cell's content
      setTimeout(() => {
        const currentCells = useNotebookStore.getState().cells;
        useNotebookStore.getState().updateCellContent(
          currentCells[currentCells.length - 1].id,
          content
        );
      }, 50);
    }
  };

  return (
    <div className="nb-page">
      {/* Background Media */}
      {showVideoBg ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="notebook-bg-video"
        >
          <source src="/notebook-bg.mp4" type="video/mp4" />
        </video>
      ) : (
        <img
          src="/lullu2-no-logo.png"
          alt="Notebook Background"
          className="notebook-bg-video"
        />
      )}

      {/* Primary Toolbar (Colab header) */}
      <NotebookToolbar
        onToggleBg={() => setShowVideoBg(!showVideoBg)}
        showVideoBg={showVideoBg}
        onOpenResources={() => { setRightDrawerTab('resources'); setRightDrawerOpen(true); }}
      />

      {/* Secondary Action Bar */}
      <SecondaryToolbar
        onToggleBg={() => setShowVideoBg(!showVideoBg)}
        showVideoBg={showVideoBg}
      />

      {/* 3-Pane Body */}
      <div className="nb-body">
        {/* Left Sidebar */}
        <LeftSidebar onInsertSnippet={handleInsertSnippet} cells={cells} />

        {/* Main Editor Area */}
        <div className="nb-main-content">
          <div className="nb-content">
            {cells.length === 0 ? (
              <div className="nb-empty">
                <div className="nb-empty__icon">📒</div>
                <h2>Empty Notebook</h2>
                <p>Add a cell to get started.</p>
                <div className="nb-empty__actions">
                  <button className="nb-empty__btn" onClick={() => addCell('code')}>+ Code Cell</button>
                  <button className="nb-empty__btn" onClick={() => addCell('markdown')}>+ Markdown Cell</button>
                </div>
              </div>
            ) : (
              <>
                {cells.map((cell) => (
                  cell.type === 'code'
                    ? <CodeCell key={cell.id} cell={cell} />
                    : <MarkdownCell key={cell.id} cell={cell} />
                ))}
                <div className="nb-bottom-spacer" />
              </>
            )}
          </div>
        </div>

        {/* Right Drawer */}
        <RightDrawer
          isOpen={rightDrawerOpen}
          onClose={() => setRightDrawerOpen(false)}
          activeTab={rightDrawerTab}
          onTabChange={setRightDrawerTab}
        />
      </div>

      {/* Unified Down Bar */}
      <UnifiedNavbar
        session={session}
        extraActions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => { setRightDrawerTab('variables'); setRightDrawerOpen(true); }}
              style={{ background: 'none', border: 'none', color: '#9aa0a6', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px' }}
              title="View Active Variables"
            >
              <span>{'{ }'}</span>
              <span>Variables</span>
            </button>
            <button
              onClick={() => { setRightDrawerTab('terminal'); setRightDrawerOpen(true); }}
              style={{ background: 'none', border: 'none', color: '#9aa0a6', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px' }}
              title="Open Terminal"
            >
              <span>▣</span>
              <span>Terminal</span>
            </button>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <span style={{ fontSize: '0.68rem', color: '#9aa0a6' }}>🐍 Python 3</span>
          </div>
        }
      />

      {/* AI Chat */}
      <AIChatPanel />
      <button className="chat-bubble-ai" onClick={() => useAIChatStore.getState().toggleChat()}>
        <img src="/logo-2.jpg" alt="Alpha AI" className="chat-bubble-logo" />
      </button>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
