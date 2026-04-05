import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
  { category: 'Circuit', items: [
    { keys: ['Ctrl', 'Z'], description: 'Undo' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
    { keys: ['Ctrl', 'S'], description: 'Save circuit' },
    { keys: ['Ctrl', 'O'], description: 'Open my circuits' },
    { keys: ['Delete'], description: 'Remove selected gate' },
  ]},
  { category: 'Simulation', items: [
    { keys: ['Enter'], description: 'Run simulation' },
    { keys: ['Esc'], description: 'Cancel gate placement' },
  ]},
  { category: 'Navigation', items: [
    { keys: ['?'], description: 'Toggle this dialog' },
  ]},
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {SHORTCUTS.map(group => (
                <div key={group.category}>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2.5">{group.category}</h3>
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <div key={item.description} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.description}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((key, i) => (
                            <span key={i}>
                              <kbd className="px-2 py-1 rounded-md bg-muted border border-border text-xs font-mono text-muted-foreground">
                                {key}
                              </kbd>
                              {i < item.keys.length - 1 && <span className="text-muted-foreground mx-0.5">+</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground mt-6 text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">?</kbd> to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
