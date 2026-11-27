import React, { useState, useRef, useEffect } from 'react';
import useAIChatStore from '../../stores/aiChatStore';
import useNotebookStore from '../../stores/notebookStore';
import { useCircuitStore } from '../../stores/circuitStore';
import { QuantumCircuit } from '../../quantum-engine/circuit';
import { SUGGESTED_PROMPTS } from '../../ai/quantumAIPrompt';
import { useNavigate } from 'react-router-dom';
import '../../styles/ai-chat.css';

/**
 * AIChatPanel — Slide-out AI assistant panel.
 * Appears from the right edge when the chat bubble is clicked.
 */
export default function AIChatPanel() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    isOpen,
    isLoading,
    streamingText,
    error,
    closeChat,
    sendMessage,
    clearChat,
  } = useAIChatStore();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (promptText) => {
    sendMessage(promptText);
  };

  const handleInsertToNotebook = (code) => {
    // Add the code as a new cell in the notebook
    const nbStore = useNotebookStore.getState();
    nbStore.addCell('code');
    // Update the new cell with the code
    setTimeout(() => {
      const cells = useNotebookStore.getState().cells;
      const newCell = cells[cells.length - 1];
      if (newCell) {
        useNotebookStore.getState().updateCellContent(newCell.id, code);
      }
    }, 50);
    // Navigate to notebook
    navigate('/lab');
  };

  const handleBuildInComposer = (code) => {
    try {
      const data = JSON.parse(code);
      const circuit = new QuantumCircuit(data.numQubits || 5, data.numClbits || 3);
      
      if (data.operations && Array.isArray(data.operations)) {
        for (const op of data.operations) {
          circuit.addGate(op.gate, op.qubits, op.params || {}, op.clbits || []);
        }
      }
      
      useCircuitStore.getState().loadCircuit(circuit);
      navigate('/composer');
    } catch (e) {
      console.error('Failed to parse circuit JSON:', e);
      alert('Could not parse circuit data. Please ask the AI to try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="ai-chat-backdrop" onClick={closeChat} />

      {/* Panel */}
      <div className="ai-chat-panel">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-left">
            <div className="ai-chat-avatar">
              <span className="ai-chat-avatar-icon">✦</span>
            </div>
            <div>
              <h3 className="ai-chat-title">Alpha AI</h3>
              <span className="ai-chat-subtitle">Quantum Computing Assistant</span>
            </div>
          </div>
          <div className="ai-chat-header-actions">
            <button className="ai-chat-btn-icon" onClick={clearChat} title="Clear chat">
              🗑️
            </button>
            <button className="ai-chat-btn-icon" onClick={closeChat} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="ai-chat-messages">
          {messages.length === 0 && !isLoading && (
            <div className="ai-chat-welcome">
              <div className="ai-chat-welcome-icon">✦</div>
              <h2>Alpha AI</h2>
              <p>Your quantum computing assistant. Ask me anything about quantum circuits, algorithms, or the Alpha-Paradox chip.</p>

              <div className="ai-chat-suggestions">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    className="ai-chat-suggestion"
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                  >
                    <span className="ai-chat-suggestion-icon">{prompt.icon}</span>
                    <span>{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`ai-chat-message ai-chat-message--${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="ai-chat-message-avatar">✦</div>
              )}
              <div className="ai-chat-message-content">
                <div className="ai-chat-message-text">
                  <MarkdownRenderer text={msg.text} />
                </div>

                {/* Code block action buttons */}
                {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                  <div className="ai-chat-code-actions">
                    {msg.codeBlocks.map((block, i) => {
                      if (block.language === 'json:composer') {
                        return (
                          <button
                            key={i}
                            className="ai-chat-insert-btn"
                            onClick={() => handleBuildInComposer(block.code)}
                          >
                            🛠️ Build in Composer
                          </button>
                        );
                      }
                      return (
                        <button
                          key={i}
                          className="ai-chat-insert-btn"
                          onClick={() => handleInsertToNotebook(block.code)}
                        >
                          📒 Insert to Notebook
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {isLoading && streamingText && (
            <div className="ai-chat-message ai-chat-message--ai">
              <div className="ai-chat-message-avatar">✦</div>
              <div className="ai-chat-message-content">
                <div className="ai-chat-message-text">
                  <MarkdownRenderer text={streamingText} />
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingText && (
            <div className="ai-chat-message ai-chat-message--ai">
              <div className="ai-chat-message-avatar">✦</div>
              <div className="ai-chat-message-content">
                <div className="ai-chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="ai-chat-error">
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="ai-chat-input-area">
          <div className="ai-chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about quantum computing..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className={`ai-chat-send-btn ${input.trim() && !isLoading ? 'ai-chat-send-btn--active' : ''}`}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              ➤
            </button>
          </div>
          <div className="ai-chat-disclaimer">
            Alpha AI can make mistakes. Verify important calculations.
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Simple Markdown Renderer
 * Handles: headers, bold, italic, code blocks, inline code, links, lists, tables, LaTeX
 */
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const renderMarkdown = (md) => {
    const elements = [];
    const lines = md.split('\n');
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code block
      if (line.startsWith('```')) {
        const lang = line.slice(3).trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        elements.push(
          <div key={key++} className="ai-code-block">
            {lang && <div className="ai-code-lang">{lang}</div>}
            <pre><code>{codeLines.join('\n')}</code></pre>
            <button
              className="ai-code-copy"
              onClick={() => navigator.clipboard.writeText(codeLines.join('\n'))}
            >
              📋 Copy
            </button>
          </div>
        );
        continue;
      }

      // Table detection
      if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s-:|]+\|$/)) {
        const headerCells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        i += 2; // skip header and separator
        const rows = [];
        while (i < lines.length && lines[i].includes('|')) {
          rows.push(lines[i].split('|').filter(c => c.trim()).map(c => c.trim()));
          i++;
        }
        elements.push(
          <table key={key++} className="ai-md-table">
            <thead>
              <tr>{headerCells.map((h, hi) => <th key={hi}>{renderInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        );
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(<h4 key={key++} className="ai-md-h3">{renderInline(line.slice(4))}</h4>);
        i++; continue;
      }
      if (line.startsWith('## ')) {
        elements.push(<h3 key={key++} className="ai-md-h2">{renderInline(line.slice(3))}</h3>);
        i++; continue;
      }
      if (line.startsWith('# ')) {
        elements.push(<h2 key={key++} className="ai-md-h1">{renderInline(line.slice(2))}</h2>);
        i++; continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        elements.push(<blockquote key={key++} className="ai-md-blockquote">{renderInline(line.slice(2))}</blockquote>);
        i++; continue;
      }

      // Unordered list
      if (line.match(/^[-*] /)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^[-*] /)) {
          listItems.push(lines[i].replace(/^[-*] /, ''));
          i++;
        }
        elements.push(
          <ul key={key++} className="ai-md-list">
            {listItems.map((item, li) => <li key={li}>{renderInline(item)}</li>)}
          </ul>
        );
        continue;
      }

      // Ordered list
      if (line.match(/^\d+\. /)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^\d+\. /)) {
          listItems.push(lines[i].replace(/^\d+\. /, ''));
          i++;
        }
        elements.push(
          <ol key={key++} className="ai-md-list">
            {listItems.map((item, li) => <li key={li}>{renderInline(item)}</li>)}
          </ol>
        );
        continue;
      }

      // Empty line
      if (!line.trim()) {
        i++; continue;
      }

      // Regular paragraph
      elements.push(<p key={key++} className="ai-md-p">{renderInline(line)}</p>);
      i++;
    }

    return elements;
  };

  /**
   * Render inline markdown (bold, italic, code, links, LaTeX)
   */
  const renderInline = (text) => {
    if (!text) return text;

    // Split by inline code first to avoid processing markdown inside code
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="ai-inline-code">{part.slice(1, -1)}</code>;
      }

      // Bold
      let processed = part;
      const boldParts = processed.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, j) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>;
        }
        // Italic
        const italicParts = bp.split(/(\*[^*]+\*)/g);
        return italicParts.map((ip, k) => {
          if (ip.startsWith('*') && ip.endsWith('*')) {
            return <em key={`${i}-${j}-${k}`}>{ip.slice(1, -1)}</em>;
          }
          // LaTeX (display)
          if (ip.includes('$$')) {
            return <span key={`${i}-${j}-${k}`} className="ai-md-latex">{ip}</span>;
          }
          // LaTeX (inline)
          const latexParts = ip.split(/(\$[^$]+\$)/g);
          return latexParts.map((lp, l) => {
            if (lp.startsWith('$') && lp.endsWith('$')) {
              return <span key={`${i}-${j}-${k}-${l}`} className="ai-md-latex-inline">{lp.slice(1, -1)}</span>;
            }
            return lp;
          });
        });
      });
    });
  };

  return <div className="ai-markdown">{renderMarkdown(text)}</div>;
}
