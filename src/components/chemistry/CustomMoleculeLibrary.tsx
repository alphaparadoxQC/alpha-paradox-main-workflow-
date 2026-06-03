import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Atom as AtomIcon, FlaskConical, Plus, Trash2, Sparkles, Send, BookMarked, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ELEMENTS } from '@/lib/chemistry/periodicTable';
import { FAMOUS_MOLECULES, CATEGORY_LABELS, FamousMolecule } from '@/lib/chemistry/famousMolecules';
import { buildCustomMolecule } from '@/lib/chemistry/customMolecule';
import { generateParameterizedAnsatz } from '@/lib/chemistry/vqeOptimizer';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { MoleculeViewer3D } from './MoleculeViewer3D';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CATEGORIES: FamousMolecule['category'][] = [
  'fundamental', 'biological', 'pharmaceutical', 'industrial', 'energy', 'macromolecule',
];

export function CustomMoleculeLibrary() {
  const navigate = useNavigate();
  const { setQubitCount, setGates, clearCircuit } = useQuantumCircuitStore();

  const [atoms, setAtoms] = useState<string[]>(['H', 'H']);
  const [customName, setCustomName] = useState('');
  const [presetSmiles, setPresetSmiles] = useState<string | undefined>('[H][H]');

  const molecule = useMemo(() => {
    const m = buildCustomMolecule(atoms);
    if (m && presetSmiles) return { ...m, smiles: presetSmiles };
    return m;
  }, [atoms, presetSmiles]);

  const addAtom = (sym: string) => {
    if (atoms.length >= 2000) {
      toast.warning('Max 2000 atoms reached for the custom builder.');
      return;
    }
    setAtoms(prev => [...prev, sym]);
    // Once user starts editing, drop the preset SMILES so we re-derive from atoms
    setPresetSmiles(undefined);
  };

  const removeAt = (i: number) => {
    setAtoms(prev => prev.filter((_, idx) => idx !== i));
    setPresetSmiles(undefined);
  };
  const clearAtoms = () => {
    setAtoms([]);
    setPresetSmiles(undefined);
  };

  const loadPreset = (m: FamousMolecule) => {
    setAtoms([...m.atoms]);
    setCustomName(m.name);
    setPresetSmiles(m.smiles);
    toast.success(`Loaded ${m.name}`, { description: m.formula });
  };

  const sendToCircuitBuilder = () => {
    if (!molecule) {
      toast.error('Add at least one atom first');
      return;
    }
    // Use neutral parameters — user can run VQE on the page itself,
    // here we just hand them a ready-to-explore ansatz circuit.
    const params = new Array(molecule.qubitsRequired * molecule.vqeDepth).fill(0.1);
    const gates = generateParameterizedAnsatz(molecule, params);
    clearCircuit();
    setQubitCount(molecule.qubitsRequired);
    setGates(gates);
    toast.success(`Loaded ${customName || molecule.formula} into Circuit Builder`, {
      description: `${molecule.qubitsRequired} qubits • ${gates.length} gates`,
      action: {
        label: 'Open',
        onClick: () => navigate('/builder'),
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-card/50 to-accent/10 border-primary/20">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-primary" />
            Custom Molecule Workshop
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Pick any real-world compound from the library, then tweak the atoms to invent
            molecules that don't exist yet — and load the resulting VQE ansatz directly into the
            quantum circuit builder.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid grid-cols-2 w-full sm:w-[360px]">
          <TabsTrigger value="presets" className="text-xs gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Real Molecules
          </TabsTrigger>
          <TabsTrigger value="invent" className="text-xs gap-1">
            <FlaskConical className="w-3.5 h-3.5" /> Invent New
          </TabsTrigger>
        </TabsList>

        {/* PRESETS */}
        <TabsContent value="presets" className="mt-3 space-y-3">
          {CATEGORIES.map(cat => {
            const items = FAMOUS_MOLECULES.filter(m => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
                  {CATEGORY_LABELS[cat]}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map(m => {
                    const active = JSON.stringify(m.atoms) === JSON.stringify(atoms);
                    return (
                      <motion.button
                        key={m.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => loadPreset(m)}
                        className={`text-left p-2.5 rounded-lg border transition-colors ${
                          active
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background/50 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm text-primary">{m.formula}</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {m.atoms.length}a
                          </Badge>
                        </div>
                        <div className="text-xs font-medium text-foreground truncate mt-0.5">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                          {m.description}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* INVENT */}
        <TabsContent value="invent" className="mt-3">
          <Card className="bg-card/50 border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-xs flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-accent" />
                Invent a Compound
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Input
                placeholder="Compound name (optional, e.g. 'Wonderium-3')"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Tap atoms below to compose any combination — even ones not found in nature.
              </p>
              <ScrollArea className="h-36 rounded-md border border-border bg-background/40 p-2">
                <div className="flex flex-wrap gap-1">
                  {ELEMENTS.map(el => (
                    <button
                      key={el.symbol}
                      onClick={() => addAtom(el.symbol)}
                      title={`${el.name} — add`}
                      className="w-9 h-9 rounded-md text-xs font-bold border border-border hover:border-primary/60 hover:scale-110 transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${el.color}33, transparent)`,
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      {el.symbol}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Selection + Preview + Actions */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AtomIcon className="w-3.5 h-3.5 text-primary" />
              Current Selection
              {customName && (
                <span className="text-muted-foreground font-normal">— {customName}</span>
              )}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {atoms.length} atom{atoms.length === 1 ? '' : 's'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="min-h-[40px] rounded-md border border-dashed border-border bg-background/40 p-2 flex flex-wrap gap-1.5">
            {atoms.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1">No atoms yet — pick a preset or invent your own.</p>
            ) : (
              atoms.map((sym, i) => {
                const el = ELEMENTS.find(e => e.symbol === sym);
                return (
                  <button
                    key={`${sym}-${i}`}
                    onClick={() => removeAt(i)}
                    title="Click to remove"
                    className="px-2 py-0.5 rounded-md text-xs font-bold border hover:scale-105 transition-all"
                    style={{
                      backgroundColor: el ? `${el.color}22` : undefined,
                      borderColor: el ? `${el.color}66` : undefined,
                    }}
                  >
                    {sym} <span className="text-[9px] text-muted-foreground">×</span>
                  </button>
                );
              })
            )}
          </div>

          {atoms.length >= 50 && atoms.length < 200 && (
            <Alert className="border-amber-500/40 bg-amber-500/10 [&>svg]:text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs text-amber-500">
                Large molecule — 3D rendering may take a moment. VQE scaling automatically enabled.
              </AlertDescription>
            </Alert>
          )}
          {atoms.length >= 200 && (
            <Alert className="border-amber-500/40 bg-amber-500/10 [&>svg]:text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs text-amber-500">
                Very large molecule ({atoms.length} atoms) — VQE will utilize high-performance MPS tensor networks.
              </AlertDescription>
            </Alert>
          )}

          {molecule && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-background/40 overflow-hidden">
                <MoleculeViewer3D molecule={molecule} />
              </div>
              <div className="grid grid-cols-2 gap-2 content-start">
                <Stat label="Formula" value={molecule.formula} mono />
                <Stat label="Electrons" value={String(molecule.electrons)} />
                <Stat label="Qubits" value={String(molecule.qubitsRequired)} highlight />
                <Stat label="VQE Depth" value={String(molecule.vqeDepth)} />
                {molecule.smiles && (
                  <div className="col-span-2 p-2 rounded-md bg-background/40 border border-border">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">SMILES</div>
                    <div className="text-xs font-mono text-primary truncate" title={molecule.smiles}>
                      {molecule.smiles}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAtoms}
              disabled={atoms.length === 0}
              className="h-8 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Clear
            </Button>
            <Button
              size="sm"
              onClick={sendToCircuitBuilder}
              disabled={!molecule}
              className="h-8 text-xs bg-gradient-to-r from-primary to-accent ml-auto"
            >
              <Send className="w-3 h-3 mr-1" />
              Load into Circuit Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label, value, mono, highlight,
}: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className={`p-2 rounded-md ${highlight ? 'bg-primary/10 border border-primary/20' : 'bg-background/40 border border-border'}`}>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${mono ? 'font-mono' : ''} ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}
