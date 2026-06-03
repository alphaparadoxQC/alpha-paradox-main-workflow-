import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Atom, 
  FlaskConical, 
  Calculator,
  Loader2,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { DrugCandidate } from '@/lib/drugDiscovery/drugData';

interface CustomMoleculeInputProps {
  onAddMolecule: (molecule: DrugCandidate) => void;
}

const SMILES_EXAMPLES = [
  { name: 'Caffeine', smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C' },
  { name: 'Aspirin', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' },
  { name: 'Ibuprofen', smiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O' },
];

export function CustomMoleculeInput({ onAddMolecule }: CustomMoleculeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    smiles: '',
    molecularWeight: '',
    logP: '',
    hBondDonors: '',
    hBondAcceptors: '',
    rotableBonds: '',
    polarSurfaceArea: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const estimateProperties = useCallback(() => {
    const smiles = formData.smiles;
    if (!smiles) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      const atoms = parseSmilesAtoms(smiles);
      const counts: Record<string, number> = {};
      for (const a of atoms) counts[a] = (counts[a] || 0) + 1;
      
      const C = counts['C'] || 0;
      const O = counts['O'] || 0;
      const N = counts['N'] || 0;
      const S = counts['S'] || 0;
      const F = counts['F'] || 0;
      const Cl = counts['Cl'] || 0;
      const Br = counts['Br'] || 0;
      const I = counts['I'] || 0;
      const P = counts['P'] || 0;
      const explicitH = counts['H'] || 0;
      
      const heavyAtoms = atoms.filter(a => a !== 'H').length;
      
      // Count rings from ring-closure digits (each digit appears twice)
      const ringDigits = smiles.match(/(?<=[^%])([0-9])/g) || [];
      const percentRings = smiles.match(/%\d{2}/g) || [];
      const ringCount = Math.floor(ringDigits.length / 2) + Math.floor(percentRings.length / 2);
      
      // Count bonds for degree-of-unsaturation (DoU) calculation
      const doubleBonds = (smiles.match(/=/g) || []).length;
      const tripleBonds = (smiles.match(/#/g) || []).length;
      
      // Implicit hydrogen estimation using standard valences
      // Standard valences: C=4, N=3, O=2, S=2, P=3, F=1, Cl=1, Br=1, I=1
      // For aromatic atoms (lowercase in SMILES), valence may differ
      const aromaticAtoms = (smiles.match(/[cnos]/g) || []).length;
      
      // Degree of Unsaturation = (2C + 2 + N - H - Halogens) / 2
      // Use this to estimate H count more reliably
      const halogens = F + Cl + Br + I;
      
      // Better H estimation: sum of (default_valence - bonds_formed) for each heavy atom
      // Simplified: use molecular formula H count = 2*C + 2 + N - 2*DoU - halogens
      // where DoU = ringCount + doubleBonds + 2*tripleBonds
      const degreesOfUnsaturation = ringCount + doubleBonds + 2 * tripleBonds;
      const estimatedH = Math.max(0, 2 * C + 2 + N - 2 * degreesOfUnsaturation - halogens + explicitH);
      const totalH = Math.max(explicitH, Math.round(estimatedH));
      
      // Molecular weight using IUPAC atomic masses
      const MW = C * 12.011 + totalH * 1.008 + O * 15.999 + N * 14.007 
        + S * 32.065 + F * 18.998 + Cl * 35.453 + Br * 79.904 + I * 126.904 + P * 30.974;
      
      // LogP via Wildman-Crippen atom-type contributions (simplified)
      // Reference: Wildman & Crippen, J. Chem. Inf. Comput. Sci. 1999
      const logP = C * 0.1441 + totalH * 0.1230 - O * 0.2783 - N * 0.4157 
        + S * 0.6865 + F * 0.4118 + Cl * 0.6895 + Br * 0.8813 + I * 1.050 
        - ringCount * 0.15 + aromaticAtoms * 0.13;
      
      // H-bond donors: count N-H and O-H groups
      // From SMILES: bracket atoms with H ([NH], [OH]) and bare O/N not in C=O
      const nhPattern = smiles.match(/\[N[^]]*H/gi) || [];
      const bareNH = N - (smiles.match(/n/g) || []).length; // non-aromatic N likely has H
      const HBD = Math.min(
        Math.max(nhPattern.length, Math.min(bareNH, N)) + Math.min(O, 2),
        totalH
      );
      
      // H-bond acceptors: O and N atoms
      const HBA = O + N;
      
      // Rotatable bonds: single bonds between heavy atoms, excluding ring bonds and terminal groups
      const singleBondsEstimate = heavyAtoms - 1 - doubleBonds - tripleBonds * 2 - ringCount;
      const RB = Math.max(0, Math.min(singleBondsEstimate, heavyAtoms - ringCount * 2));
      
      // Polar Surface Area using Ertl's fragment contributions
      // Reference: Ertl et al., J. Med. Chem. 2000, 43, 3714
      // N: ~26.0 Å², O: ~20.2 Å², S: ~25.3 Å², P: ~34.1 Å²
      // Each H on N/O adds ~2-9 Å²
      const PSA = O * 17.07 + N * 23.85 + S * 25.30 + P * 34.14 
        + Math.min(HBD, O + N) * 7.0; // donor H contribution

      setFormData(prev => ({
        ...prev,
        molecularWeight: MW.toFixed(2),
        logP: logP.toFixed(2),
        hBondDonors: Math.min(HBD, 10).toString(),
        hBondAcceptors: Math.min(HBA, 15).toString(),
        rotableBonds: RB.toString(),
        polarSurfaceArea: PSA.toFixed(1),
      }));

      setIsCalculating(false);
      toast.info('Properties estimated from SMILES', {
        description: `${heavyAtoms} heavy atoms, ~${totalH} H, MW ≈ ${MW.toFixed(0)} Da, ${ringCount} ring(s)`,
      });
    }, 400);
  }, [formData.smiles]);

  const handleSubmit = () => {
    if (!formData.name || !formData.smiles) {
      toast.error('Name and SMILES are required');
      return;
    }

    const molecule: DrugCandidate = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      formula: generateFormula(formData.smiles),
      smiles: formData.smiles,
      molecularWeight: parseFloat(formData.molecularWeight) || 200,
      logP: parseFloat(formData.logP) || 1,
      hBondDonors: parseInt(formData.hBondDonors) || 1,
      hBondAcceptors: parseInt(formData.hBondAcceptors) || 2,
      rotableBonds: parseInt(formData.rotableBonds) || 2,
      polarSurfaceArea: parseFloat(formData.polarSurfaceArea) || 60,
      atoms: generateAtoms(formData.smiles),
      bonds: [],
    };

    onAddMolecule(molecule);
    setIsOpen(false);
    setFormData({
      name: '',
      smiles: '',
      molecularWeight: '',
      logP: '',
      hBondDonors: '',
      hBondAcceptors: '',
      rotableBonds: '',
      polarSurfaceArea: '',
    });

    toast.success(`${molecule.name} added`, {
      description: 'Custom compound ready for analysis',
    });
  };

  const loadExample = (example: typeof SMILES_EXAMPLES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: example.name + ' (Custom)',
      smiles: example.smiles,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Compound
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Atom className="w-5 h-5 text-primary" />
            Add Custom Molecule
          </DialogTitle>
          <DialogDescription>
            Enter molecular data for AI-powered drug prediction analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Compound Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., My Drug Candidate"
            />
          </div>

          {/* SMILES Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="smiles" className="flex items-center gap-1">
                SMILES Notation *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">
                        SMILES is a text representation of molecular structure.
                        Get SMILES from PubChem, ChEMBL, or draw tools.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={estimateProperties}
                disabled={!formData.smiles || isCalculating}
                className="h-6 text-xs"
              >
                {isCalculating ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Calculator className="w-3 h-3 mr-1" />
                )}
                Estimate Properties
              </Button>
            </div>
            <Input
              id="smiles"
              value={formData.smiles}
              onChange={(e) => handleInputChange('smiles', e.target.value)}
              placeholder="e.g., CC(=O)OC1=CC=CC=C1C(=O)O"
              className="font-mono text-xs"
            />
          </div>

          {/* Examples */}
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Examples:</span>
            {SMILES_EXAMPLES.map((ex) => (
              <button
                key={ex.name}
                onClick={() => loadExample(ex)}
                className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80"
              >
                {ex.name}
              </button>
            ))}
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="mw" className="text-xs">Molecular Weight (Da)</Label>
              <Input
                id="mw"
                type="number"
                value={formData.molecularWeight}
                onChange={(e) => handleInputChange('molecularWeight', e.target.value)}
                placeholder="e.g., 180.16"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="logp" className="text-xs">LogP</Label>
              <Input
                id="logp"
                type="number"
                step="0.01"
                value={formData.logP}
                onChange={(e) => handleInputChange('logP', e.target.value)}
                placeholder="e.g., 1.19"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hbd" className="text-xs">H-Bond Donors</Label>
              <Input
                id="hbd"
                type="number"
                value={formData.hBondDonors}
                onChange={(e) => handleInputChange('hBondDonors', e.target.value)}
                placeholder="e.g., 1"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hba" className="text-xs">H-Bond Acceptors</Label>
              <Input
                id="hba"
                type="number"
                value={formData.hBondAcceptors}
                onChange={(e) => handleInputChange('hBondAcceptors', e.target.value)}
                placeholder="e.g., 4"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rb" className="text-xs">Rotatable Bonds</Label>
              <Input
                id="rb"
                type="number"
                value={formData.rotableBonds}
                onChange={(e) => handleInputChange('rotableBonds', e.target.value)}
                placeholder="e.g., 3"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="psa" className="text-xs">Polar Surface Area (Å²)</Label>
              <Input
                id="psa"
                type="number"
                value={formData.polarSurfaceArea}
                onChange={(e) => handleInputChange('polarSurfaceArea', e.target.value)}
                placeholder="e.g., 63.6"
                className="h-8"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button onClick={handleSubmit} className="w-full">
            <FlaskConical className="w-4 h-4 mr-2" />
            Add to Drug Library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Proper SMILES atom parser ──────────────────────────────────────────────

/**
 * Parse a SMILES string into a list of explicit atom symbols.
 * Handles bracket atoms [NH], organic subset (B,C,N,O,P,S,F,Cl,Br,I),
 * ring digits, branch parens, and bond symbols.
 */
function parseSmilesAtoms(smiles: string): string[] {
  const atoms: string[] = [];
  let i = 0;
  const organic = new Set(['B', 'C', 'N', 'O', 'P', 'S', 'F', 'I']);
  const twoLetter: Record<string, string> = { Cl: 'Cl', Br: 'Br', Si: 'Si' };

  while (i < smiles.length) {
    const ch = smiles[i];

    // Bracket atom: [...]
    if (ch === '[') {
      const close = smiles.indexOf(']', i);
      if (close === -1) break;
      const inner = smiles.substring(i + 1, close);
      // Extract element symbol: optional charge/mass/H count inside
      const match = inner.match(/^(\d*)([A-Z][a-z]?)/);
      if (match) atoms.push(match[2]);
      i = close + 1;
      continue;
    }

    // Skip bond symbols, ring digits, dots, parens
    if ('=-#:./\\()%+'.includes(ch) || (ch >= '0' && ch <= '9')) {
      i++;
      continue;
    }

    // Two-letter atoms (Cl, Br, Si)
    if (i + 1 < smiles.length) {
      const pair = smiles.substring(i, i + 2);
      if (twoLetter[pair]) {
        atoms.push(twoLetter[pair]);
        i += 2;
        continue;
      }
    }

    // Single-letter organic atom
    if (organic.has(ch) || ch === 'c' || ch === 'n' || ch === 'o' || ch === 's') {
      atoms.push(ch.toUpperCase());
      i++;
      continue;
    }

    // Lowercase aromatic (already handled above), or unknown
    i++;
  }
  return atoms;
}

/**
 * Generate a proper molecular formula from SMILES
 */
function generateFormula(smiles: string): string {
  const atoms = parseSmilesAtoms(smiles);
  const counts: Record<string, number> = {};
  for (const a of atoms) counts[a] = (counts[a] || 0) + 1;

  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  };
  const sub = (n: number) => n === 1 ? '' : String(n).split('').map(d => subscripts[d]).join('');

  // Hill system: C first, H second, then alphabetical
  const parts: string[] = [];
  if (counts['C']) { parts.push('C' + sub(counts['C'])); delete counts['C']; }
  if (counts['H']) { parts.push('H' + sub(counts['H'])); delete counts['H']; }
  for (const sym of Object.keys(counts).sort()) {
    parts.push(sym + sub(counts[sym]));
  }
  return parts.join('') || 'Unknown';
}

/**
 * Generate atoms array from SMILES — used only for atom count metadata.
 * Actual 3D rendering is handled by RDKit/3Dmol.
 */
function generateAtoms(smiles: string) {
  const ATOM_COLORS: Record<string, { color: string; radius: number }> = {
    C: { color: '#909090', radius: 0.77 },
    H: { color: '#FFFFFF', radius: 0.37 },
    O: { color: '#FF0D0D', radius: 0.73 },
    N: { color: '#3050F8', radius: 0.75 },
    S: { color: '#FFFF30', radius: 1.02 },
    F: { color: '#90E050', radius: 0.57 },
    Cl: { color: '#1FF01F', radius: 1.02 },
    Br: { color: '#A62929', radius: 1.20 },
    I: { color: '#940094', radius: 1.39 },
    P: { color: '#FF8000', radius: 1.07 },
  };

  const parsed = parseSmilesAtoms(smiles);
  return parsed.map((symbol, idx) => {
    // Simple 3D spiral layout — only used as metadata, not for rendering
    const angle = idx * 2.39996; // golden angle
    const r = 1.5 + idx * 0.2;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = idx * 0.15;
    return {
      symbol,
      position: [x, y, z] as [number, number, number],
      charge: 0,
      ...(ATOM_COLORS[symbol] || ATOM_COLORS.C),
    };
  });
}

