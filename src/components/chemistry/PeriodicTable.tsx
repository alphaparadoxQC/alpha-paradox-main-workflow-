import { motion } from 'framer-motion';
import { Trash2, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ELEMENTS, CATEGORY_COLORS, ElementData } from '@/lib/chemistry/periodicTable';
import { cn } from '@/lib/utils';

interface PeriodicTableProps {
  selected: string[]; // ordered list of symbols (with possible repeats)
  onAdd: (symbol: string) => void;
  onRemoveAt: (index: number) => void;
  onClear: () => void;
  onSimulate: () => void;
  canSimulate: boolean;
}

export function PeriodicTable({
  selected,
  onAdd,
  onRemoveAt,
  onClear,
  onSimulate,
  canSimulate,
}: PeriodicTableProps) {
  return (
    <div className="space-y-4">
      {/* Selection strip */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Your Molecule</h3>
            <Badge variant="secondary" className="text-[10px]">
              {selected.length} atom{selected.length === 1 ? '' : 's'}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={selected.length === 0}
              className="h-7 px-2 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={onSimulate}
              disabled={!canSimulate}
              className="h-7 px-3 text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Simulate
            </Button>
          </div>
        </div>

        <div className="min-h-[44px] rounded-lg border border-dashed border-border bg-background/40 p-2 flex flex-wrap gap-1.5 items-center">
          {selected.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2">
              Tap atoms below to compose a molecule, then press Simulate.
            </p>
          ) : (
            selected.map((sym, i) => {
              const el = ELEMENTS.find(e => e.symbol === sym);
              return (
                <motion.button
                  key={`${sym}-${i}`}
                  layout
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  onClick={() => onRemoveAt(i)}
                  title="Click to remove"
                  className="group relative px-2.5 py-1 rounded-md text-xs font-bold border transition-all hover:scale-105"
                  style={{
                    backgroundColor: el ? `${el.color}22` : undefined,
                    borderColor: el ? `${el.color}66` : undefined,
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  {sym}
                  <span className="ml-1 text-[9px] text-muted-foreground group-hover:text-destructive">×</span>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Periodic table grid */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-3 overflow-x-auto">
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: 'repeat(18, minmax(34px, 1fr))',
            gridTemplateRows: 'repeat(7, minmax(40px, auto))',
            minWidth: 612,
          }}
        >
          {ELEMENTS.map((el) => (
            <ElementCell key={el.symbol} element={el} onAdd={onAdd} />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(CATEGORY_COLORS).slice(0, 8).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span
                className="w-2.5 h-2.5 rounded-sm border border-border"
                style={{ backgroundColor: color }}
              />
              {cat.replace('-', ' ')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ElementCell({
  element,
  onAdd,
}: {
  element: ElementData;
  onAdd: (symbol: string) => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, zIndex: 5 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => onAdd(element.symbol)}
      title={`${element.name} (Z=${element.number}) — tap to add`}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-md border text-center',
        'transition-colors hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/40'
      )}
      style={{
        gridColumn: element.group,
        gridRow: element.period,
        backgroundColor: `${CATEGORY_COLORS[element.category]} / 0.18`,
        borderColor: 'hsl(var(--border))',
        background: `linear-gradient(135deg, ${CATEGORY_COLORS[element.category]}33, transparent)`,
        minHeight: 40,
        padding: 2,
      }}
    >
      <span className="text-[8px] leading-none text-muted-foreground">{element.number}</span>
      <span className="text-xs font-bold leading-tight text-foreground">{element.symbol}</span>
      <Plus className="w-2.5 h-2.5 absolute top-0.5 right-0.5 opacity-0 hover:opacity-100 text-primary" />
    </motion.button>
  );
}
