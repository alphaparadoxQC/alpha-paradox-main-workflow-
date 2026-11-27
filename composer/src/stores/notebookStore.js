import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { executeInBrowser } from '../quantum-engine/browser-kernel';

// ─── Cell Factory ────────────────────────────────────────────────────────────
const createCell = (type = 'code', content = '') => ({
  id: uuidv4(),
  type,                    // 'code' | 'markdown'
  content,
  // Execution state (code cells only)
  executionCount: null,    // null = never run, number = execution order
  status: 'idle',          // 'idle' | 'queued' | 'running' | 'success' | 'error'
  outputs: [],             // array of output objects (see Output schema below)
  startedAt: null,
  completedAt: null,
  // UI state
  collapsed: false,
  editing: type === 'code', // markdown cells start in preview mode
});

/*
 * Output Schema (matches Jupyter nbformat v4):
 * {
 *   output_type: 'stream' | 'display_data' | 'execute_result' | 'error',
 *   // For stream:
 *   name: 'stdout' | 'stderr',
 *   text: string,
 *   // For display_data / execute_result:
 *   data: { 'text/plain': string, 'image/png': base64, 'text/html': string, 'text/latex': string },
 *   metadata: {},
 *   // For error:
 *   ename: string,
 *   evalue: string,
 *   traceback: string[],
 * }
 */

// ─── Global Execution Counter ────────────────────────────────────────────────
let globalExecutionCounter = 0;

// ─── Notebook Store ──────────────────────────────────────────────────────────
const useNotebookStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  cells: [
    createCell('markdown', '# Quantum Notebook\n\nWelcome to the interactive quantum computing environment.\n\nUse **Code** cells to write and execute Python against the quantum backend.\nUse **Markdown** cells to document your experiments with $\\LaTeX$ math support.'),
    createCell('code', '# Try running this cell!\nprint("Hello, Quantum World!")'),
  ],
  activeCellId: null,
  notebookName: 'Untitled Notebook',
  kernelStatus: 'disconnected', // 'disconnected' | 'connecting' | 'idle' | 'busy' | 'restarting' | 'error'
  dirty: false,                 // unsaved changes flag
  sessionId: 'session-default',
  secrets: [],                  // quantum provider keys/tokens
  resourceMetrics: {
    ram_percent: 35,
    disk_percent: 18,
    ram_used_gb: 1.06,
    ram_total_gb: 12.67,
    disk_used_gb: 20.09,
    disk_total_gb: 107.72,
  },
  isCommandPaletteOpen: false,

  // WebSocket connection
  _ws: null,
  _reconnectTimer: null,

  terminalHistory: [
    { type: 'system', text: 'Quantum Notebook Terminal — Python 3.11' },
    { type: 'system', text: 'Type commands to interact with the runtime.' },
  ],
  variables: [],

  // ── Kernel Connection ──────────────────────────────────────────────────────
  connectKernel: (sessionId = 'session-default') => {
    const state = get();
    if (state._ws && (state._ws.readyState === WebSocket.OPEN || state._ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const configuredWs = typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL;

    // If on HTTPS production domain and no explicit secure WSS backend is provided,
    // seamlessly activate the In-Browser Virtual Quantum Engine so users are never blocked.
    if (isHttps && !configuredWs) {
      console.log('[Notebook] Production HTTPS detected. Active: In-Browser Virtual Quantum Engine.');
      set({
        kernelStatus: 'idle',
        sessionId,
        _ws: null,
        _isVirtualKernel: true
      });
      return;
    }

    set({ kernelStatus: 'connecting', sessionId });
    const wsUrl = configuredWs || `ws://${window.location.hostname || 'localhost'}:8000/ws/kernel/${sessionId}`;
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        set({ _ws: ws, kernelStatus: 'idle', _isVirtualKernel: false });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== 'resource_metrics') {
            console.log('[ws.onmessage]', msg);
          }
          const currentCells = get().cells;

          if (msg.type === 'status') {
            set({ kernelStatus: msg.status });
            if (msg.status === 'idle' && msg.cell_id) {
              // Mark only the specific cell as completed
              set((s) => ({
                cells: s.cells.map(c => (c.id === msg.cell_id && c.status === 'running') ? {
                  ...c,
                  status: 'success',
                  completedAt: Date.now()
                } : c)
              }));
            }
          } else if (msg.type === 'output') {
            const targetCellId = msg.cell_id;
            
            if (targetCellId === 'terminal-cell') {
              if (msg.output.output_type === 'stream') {
                set((s) => ({
                  terminalHistory: [...s.terminalHistory, { type: 'output', text: msg.output.text }]
                }));
              } else if (msg.output.output_type === 'error') {
                set((s) => ({
                  terminalHistory: [...s.terminalHistory, { type: 'error', text: `${msg.output.ename}: ${msg.output.evalue}` }]
                }));
              }
            } else if (targetCellId === 'variables-cell') {
              if (msg.output.output_type === 'stream') {
                try {
                  const parsed = JSON.parse(msg.output.text);
                  if (parsed.__agy_variables__) {
                    set({ variables: parsed.__agy_variables__ });
                  }
                } catch (e) {
                  // Ignore JSON parse errors for normal stream text
                }
              }
            } else if (targetCellId) {
              set((s) => ({
                cells: s.cells.map(c => {
                  if (c.id === targetCellId) {
                    const newOutputs = [...c.outputs, msg.output];
                    const isErr = msg.output.output_type === 'error';
                    return {
                      ...c,
                      outputs: newOutputs,
                      status: isErr ? 'error' : c.status,
                      completedAt: isErr ? Date.now() : c.completedAt
                    };
                  }
                  return c;
                })
              }));
            }
          } else if (msg.type === 'execution_count') {
            if (msg.cell_id) {
              set((s) => ({
                cells: s.cells.map(c => c.id === msg.cell_id ? {
                  ...c,
                  executionCount: msg.execution_count
                } : c)
              }));
            }
          } else if (msg.type === 'resource_metrics') {
            set({ resourceMetrics: msg });
          }
        } catch (err) {
          console.error('[ws.onmessage error]', err, 'Event data:', event.data);
        }
      };

      ws.onclose = () => {
        // Fallback to in-browser virtual kernel so execution is never disrupted
        set({ _ws: null, kernelStatus: 'idle', _isVirtualKernel: true });
        if (!isHttps) {
          clearTimeout(get()._reconnectTimer);
          const timer = setTimeout(() => {
            get().connectKernel(sessionId);
          }, 4000);
          set({ _reconnectTimer: timer });
        }
      };

      ws.onerror = () => {
        set({ _ws: null, kernelStatus: 'idle', _isVirtualKernel: true });
      };

      set({ _ws: ws });
    } catch (e) {
      set({ _ws: null, kernelStatus: 'idle', _isVirtualKernel: true });
    }
  },

  // ── Cell CRUD ──────────────────────────────────────────────────────────────

  addCell: (type = 'code', afterId = null) => set((state) => {
    const newCell = createCell(type);
    const cells = [...state.cells];

    if (afterId) {
      const idx = cells.findIndex(c => c.id === afterId);
      cells.splice(idx + 1, 0, newCell);
    } else {
      cells.push(newCell);
    }

    return { cells, activeCellId: newCell.id, dirty: true };
  }),

  deleteCell: (id) => set((state) => {
    if (state.cells.length <= 1) return state; // keep at least one cell
    const cells = state.cells.filter(c => c.id !== id);
    const activeCellId = state.activeCellId === id
      ? (cells[0]?.id ?? null)
      : state.activeCellId;
    return { cells, activeCellId, dirty: true };
  }),

  updateCellContent: (id, content) => set((state) => ({
    cells: state.cells.map(c => c.id === id ? { ...c, content } : c),
    dirty: true,
  })),

  setCellType: (id, type) => set((state) => ({
    cells: state.cells.map(c => c.id === id ? { ...c, type, editing: type === 'code' } : c),
    dirty: true,
  })),

  // ── Cell Movement ──────────────────────────────────────────────────────────

  moveCell: (id, direction) => set((state) => {
    const idx = state.cells.findIndex(c => c.id === id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= state.cells.length) return state;

    const cells = [...state.cells];
    [cells[idx], cells[targetIdx]] = [cells[targetIdx], cells[idx]];
    return { cells, dirty: true };
  }),

  // ── Cell Merge & Split ─────────────────────────────────────────────────────

  mergeCellBelow: (id) => set((state) => {
    const idx = state.cells.findIndex(c => c.id === id);
    if (idx < 0 || idx >= state.cells.length - 1) return state;

    const current = state.cells[idx];
    const next = state.cells[idx + 1];
    if (current.type !== next.type) return state; // can only merge same types

    const merged = { ...current, content: current.content + '\n' + next.content };
    const cells = state.cells.filter((_, i) => i !== idx + 1);
    cells[idx] = merged;
    return { cells, dirty: true };
  }),

  splitCell: (id, cursorPosition) => set((state) => {
    const idx = state.cells.findIndex(c => c.id === id);
    if (idx < 0) return state;

    const cell = state.cells[idx];
    const before = cell.content.substring(0, cursorPosition);
    const after = cell.content.substring(cursorPosition);

    const updatedCell = { ...cell, content: before };
    const newCell = createCell(cell.type, after);

    const cells = [...state.cells];
    cells[idx] = updatedCell;
    cells.splice(idx + 1, 0, newCell);

    return { cells, activeCellId: newCell.id, dirty: true };
  }),

  // ── Cell Collapse ──────────────────────────────────────────────────────────

  toggleCollapse: (id) => set((state) => ({
    cells: state.cells.map(c => c.id === id ? { ...c, collapsed: !c.collapsed } : c),
  })),

  toggleEditing: (id) => set((state) => ({
    cells: state.cells.map(c => c.id === id ? { ...c, editing: !c.editing } : c),
  })),

  // ── Active Cell ────────────────────────────────────────────────────────────

  setActiveCell: (id) => set({ activeCellId: id }),

  focusNextCell: (currentId) => set((state) => {
    const idx = state.cells.findIndex(c => c.id === currentId);
    const nextCell = state.cells[idx + 1];
    return nextCell ? { activeCellId: nextCell.id } : state;
  }),

  focusPrevCell: (currentId) => set((state) => {
    const idx = state.cells.findIndex(c => c.id === currentId);
    const prevCell = state.cells[idx - 1];
    return prevCell ? { activeCellId: prevCell.id } : state;
  }),

  // ── Execution ──────────────────────────────────────────────────────────────

  runCell: async (id) => {
    const state = get();
    const cell = state.cells.find(c => c.id === id);
    if (!cell || cell.type !== 'code' || !cell.content.trim()) return;

    globalExecutionCounter++;
    const execCount = globalExecutionCounter;

    // Mark cell as running and clear previous outputs
    set((s) => ({
      cells: s.cells.map(c => c.id === id ? {
        ...c,
        status: 'running',
        executionCount: execCount,
        outputs: [],
        startedAt: Date.now(),
        completedAt: null,
      } : c),
    }));

    // Re-fetch ws from current state (not stale closure)
    const ws = get()._ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        action: 'execute',
        code: cell.content,
        cell_id: cell.id,
      });
      ws.send(payload);
    } else {
      // Execute via In-Browser Virtual Quantum Engine!
      try {
        const result = await executeInBrowser(cell.content, cell.id);
        set((s) => ({
          cells: s.cells.map(c => c.id === id ? {
            ...c,
            status: result.status,
            outputs: result.outputs,
            completedAt: Date.now()
          } : c),
          variables: result.variables && result.variables.length > 0
            ? [...s.variables.filter(v => !result.variables.some(nv => nv.name === v.name)), ...result.variables]
            : s.variables,
          kernelStatus: 'idle',
        }));
      } catch (err) {
        set((s) => ({
          cells: s.cells.map(c => c.id === id ? {
            ...c,
            status: 'error',
            outputs: [{
              output_type: 'error',
              ename: 'ExecutionError',
              evalue: err.message,
              traceback: [err.stack || err.message]
            }],
            completedAt: Date.now()
          } : c)
        }));
      }
    }

    // Auto-focus next cell
    get().focusNextCell(id);
  },

  runAll: async () => {
    const codeCells = get().cells.filter(c => c.type === 'code');
    for (const cell of codeCells) {
      await get().runCell(cell.id);
    }
  },

  interruptKernel: () => {
    const ws = get()._ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'interrupt' }));
    }
    set((state) => ({
      cells: state.cells.map(c => c.status === 'running' ? { ...c, status: 'idle', completedAt: Date.now() } : c),
      kernelStatus: 'idle',
    }));
  },

  restartKernel: () => {
    globalExecutionCounter = 0;
    const ws = get()._ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'restart' }));
    }
    set((state) => ({
      cells: state.cells.map(c => ({
        ...c,
        status: 'idle',
        executionCount: null,
        outputs: [],
        startedAt: null,
        completedAt: null,
      })),
      kernelStatus: 'restarting',
    }));
  },

  // ── Terminal & Variables ───────────────────────────────────────────────────

  runTerminalCommand: (cmd) => {
    const ws = get()._ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      set((s) => ({
        terminalHistory: [...s.terminalHistory, { type: 'input', text: `$ ${cmd}` }]
      }));
      
      const code = cmd.trim().startsWith('!') ? cmd : `!${cmd}`;
      ws.send(JSON.stringify({
        action: 'execute',
        code: code,
        cell_id: 'terminal-cell',
      }));
    }
  },

  refreshVariables: () => {
    const ws = get()._ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const code = `
import json
import sys
_agy_vars = []
for _k, _v in globals().items():
    if not _k.startswith('_') and _k not in ['In', 'Out', 'exit', 'quit', 'get_ipython']:
        _type = type(_v).__name__
        _shape = 'scalar'
        if hasattr(_v, 'shape'):
            _shape = str(_v.shape)
        elif hasattr(_v, '__len__'):
            _shape = f"len({len(_v)})"
        _agy_vars.append({'name': _k, 'type': _type, 'shape': _shape})
print(json.dumps({'__agy_variables__': _agy_vars}))
`;
      ws.send(JSON.stringify({
        action: 'execute',
        code: code,
        cell_id: 'variables-cell',
      }));
    }
  },

  // ── Output Management ──────────────────────────────────────────────────────

  clearOutputs: () => set((state) => ({
    cells: state.cells.map(c => c.type === 'code' ? {
      ...c,
      outputs: [],
      executionCount: null,
      status: 'idle',
    } : c),
  })),

  clearCellOutput: (id) => set((state) => ({
    cells: state.cells.map(c => c.id === id ? { ...c, outputs: [], status: 'idle' } : c),
  })),

  // ── Notebook Metadata ──────────────────────────────────────────────────────

  setNotebookName: (name) => set({ notebookName: name, dirty: true }),

  setKernelStatus: (status) => set({ kernelStatus: status }),

  setSecrets: (secrets) => set({ secrets, dirty: true }),

  markSaved: () => set({ dirty: false }),

  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),

  // ── Export to .ipynb (Jupyter nbformat v4) ─────────────────────────────────

  toIpynb: () => {
    const state = get();
    return {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        kernelspec: {
          display_name: 'Python 3 (Quantum)',
          language: 'python',
          name: 'python3',
        },
        language_info: {
          name: 'python',
          version: '3.11.0',
        },
      },
      cells: state.cells.map(cell => {
        if (cell.type === 'code') {
          return {
            cell_type: 'code',
            execution_count: cell.executionCount,
            metadata: {},
            source: cell.content.split('\n').map((line, i, arr) =>
              i < arr.length - 1 ? line + '\n' : line
            ),
            outputs: cell.outputs.map(o => {
              if (o.output_type === 'stream') {
                return { output_type: 'stream', name: o.name, text: [o.text] };
              }
              if (o.output_type === 'error') {
                return { output_type: 'error', ename: o.ename, evalue: o.evalue, traceback: o.traceback };
              }
              return { output_type: o.output_type, data: o.data, metadata: o.metadata || {} };
            }),
          };
        }
        return {
          cell_type: 'markdown',
          metadata: {},
          source: cell.content.split('\n').map((line, i, arr) =>
            i < arr.length - 1 ? line + '\n' : line
          ),
        };
      }),
    };
  },

  // ── Import from .ipynb ─────────────────────────────────────────────────────

  fromIpynb: (notebook) => {
    const cells = notebook.cells.map(cell => {
      const content = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      const type = cell.cell_type === 'code' ? 'code' : 'markdown';
      const newCell = createCell(type, content);

      if (cell.cell_type === 'code') {
        newCell.executionCount = cell.execution_count;
        newCell.outputs = (cell.outputs || []).map(o => {
          if (o.output_type === 'stream') {
            return { output_type: 'stream', name: o.name, text: Array.isArray(o.text) ? o.text.join('') : o.text };
          }
          if (o.output_type === 'error') {
            return { output_type: 'error', ename: o.ename, evalue: o.evalue, traceback: o.traceback };
          }
          return { output_type: o.output_type, data: o.data, metadata: o.metadata || {} };
        });
      }

      return newCell;
    });

    set({ cells, activeCellId: cells[0]?.id ?? null, dirty: false });
  },
}));

export { useNotebookStore };
export default useNotebookStore;
