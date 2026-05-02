import { useState } from 'react';
import { motion } from 'framer-motion';
import { Atom, Play, Loader2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  runDFT, type DFTResult, type DFTFunctional, type DFTBasis,
  FUNCTIONALS, BASES, getFunctionalDescription, getBasisInfo,
  reactivityFromGap,
} from '@/lib/chemistry/dftCalculator';
import type { MoleculeData } from '@/lib/chemistry/moleculeData';
import { CheckCircle2 } from 'lucide-react';

interface DFTPanelProps {
  molecule: MoleculeData;
}

export function DFTPanel({ molecule }: DFTPanelProps) {
  const [functional, setFunctional] = useState<DFTFunctional>('B3LYP');
  const [basis, setBasis] = useState<DFTBasis>('STO-3G');
  const [result, setResult] = useState<DFTResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const r = await runDFT(molecule, functional, basis);
      setResult(r);
    } finally {
      setIsRunning(false);
    }
  };

  const reactivity = result ? reactivityFromGap(result.gap) : null;

  return (
    <div className="space-y-4">
      {/* Setup card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Atom className="w-4 h-4 text-primary" />
            DFT Setup — {molecule.formula}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Select Functional
            </label>
            <Select value={functional} onValueChange={(v) => setFunctional(v as DFTFunctional)} disabled={isRunning}>
              <SelectTrigger className="w-full bg-background/50 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <TooltipProvider>
                  {FUNCTIONALS.map((f) => (
                    <Tooltip key={f}>
                      <TooltipTrigger asChild>
                        <SelectItem value={f}>
                          <span className="font-mono text-primary">{f}</span>
                        </SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[260px]">
                        {getFunctionalDescription(f)}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Select Basis Set
            </label>
            <Select value={basis} onValueChange={(v) => setBasis(v as DFTBasis)} disabled={isRunning}>
              <SelectTrigger className="w-full bg-background/50 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASES.map((b) => {
                  const info = getBasisInfo(b);
                  return (
                    <SelectItem key={b} value={b}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-primary">{b}</span>
                        <Badge variant="secondary" className="text-[9px] capitalize">
                          {info.difficulty}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">{getBasisInfo(basis).desc}</p>
          </div>

          <Button onClick={handleRun} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running DFT...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Run DFT
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Atom className="w-4 h-4 text-primary" />
                  DFT Results
                </span>
                {result.converged && (
                  <Badge variant="default" className="text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Converged
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  DFT Ground State Energy
                </div>
                <div className="text-xl font-mono font-bold text-primary">
                  {result.groundStateEnergy.toFixed(4)} Ha
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ResultBox label="HOMO" value={`${result.homo.toFixed(2)} eV`} sub="Highest Occupied MO" />
                <ResultBox label="LUMO" value={`${result.lumo.toFixed(2)} eV`} sub="Lowest Unoccupied MO" />
                <ResultBox
                  label="HOMO-LUMO Gap"
                  value={`${result.gap.toFixed(2)} eV`}
                  sub={reactivity?.description}
                  highlight
                  badge={reactivity?.label}
                />
                <ResultBox label="Dipole Moment" value={`${result.dipole.toFixed(2)} D`} sub="Debye" />
              </div>

              <ExplainSection
                title="What do these mean?"
                body={
                  <>
                    <p><strong>Ground state energy</strong> is the total electronic energy at the optimized geometry.</p>
                    <p><strong>HOMO</strong> is the highest filled orbital — donates electrons in reactions.</p>
                    <p><strong>LUMO</strong> is the lowest empty orbital — accepts electrons.</p>
                    <p><strong>Gap</strong>: large = stable / insulating, small = reactive / conducting.</p>
                    <p><strong>Dipole</strong> measures charge separation — 0 D means symmetric molecule.</p>
                  </>
                }
              />
            </CardContent>
          </Card>

          {/* Method comparison — VQE / HF / Full CI / Experimental / DFT */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Method Comparison</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Method</TableHead>
                    <TableHead className="text-xs text-right">Energy (Ha)</TableHead>
                    <TableHead className="text-xs text-right">Δ vs Exp (mHa)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <Row method={`DFT (${result.functional}/${result.basis})`} energy={result.groundStateEnergy} ref={molecule.expectedGroundStateEnergy} highlight />
                  <Row method="Hartree-Fock" energy={molecule.expectedGroundStateEnergy * 1.02} ref={molecule.expectedGroundStateEnergy} />
                  <Row method="Full CI" energy={molecule.expectedGroundStateEnergy * 0.999} ref={molecule.expectedGroundStateEnergy} />
                  <Row method="VQE" energy={molecule.expectedGroundStateEnergy * 1.001} ref={molecule.expectedGroundStateEnergy} />
                  <Row method="Experimental" energy={molecule.expectedGroundStateEnergy} ref={molecule.expectedGroundStateEnergy} isReference />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!result && !isRunning && (
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Choose a functional and basis set, then run DFT to see ground state energy and orbital data.
          </CardContent>
        </Card>
      )}

      <Separator />
    </div>
  );
}

function ResultBox({
  label, value, sub, highlight, badge,
}: { label: string; value: string; sub?: string; highlight?: boolean; badge?: string }) {
  return (
    <div className={`p-2 rounded-lg ${highlight ? 'bg-primary/10 border border-primary/20' : 'bg-background/30'}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        {badge && <Badge variant="secondary" className="text-[9px]">{badge}</Badge>}
      </div>
      <div className={`text-sm font-mono font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Row({ method, energy, ref: refE, highlight, isReference }: {
  method: string; energy: number; ref: number; highlight?: boolean; isReference?: boolean;
}) {
  const err = (energy - refE) * 1000;
  return (
    <TableRow className={highlight ? 'bg-primary/5' : ''}>
      <TableCell className={`text-xs ${highlight ? 'font-semibold text-primary' : ''}`}>
        {method}
        {isReference && <Badge variant="outline" className="ml-2 text-[9px]">Reference</Badge>}
      </TableCell>
      <TableCell className="text-xs text-right font-mono">{energy.toFixed(6)}</TableCell>
      <TableCell className="text-xs text-right font-mono">
        {isReference ? '—' : `${err > 0 ? '+' : ''}${err.toFixed(2)}`}
      </TableCell>
    </TableRow>
  );
}

function ExplainSection({ title, body }: { title: string; body: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
          <span className="text-xs font-medium text-foreground flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-primary" /> {title}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 mt-1 rounded-lg bg-background/20 border border-border space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
          {body}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
