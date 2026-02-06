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
    // Simple estimation based on SMILES string length and character composition
    const smiles = formData.smiles;
    if (!smiles) return;

    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      // Very rough estimates based on SMILES parsing
      const carbonCount = (smiles.match(/C/g) || []).length;
      const oxygenCount = (smiles.match(/O/g) || []).length;
      const nitrogenCount = (smiles.match(/N/g) || []).length;
      const ringCount = (smiles.match(/[0-9]/g) || []).length / 2;
      
      const estimatedMW = carbonCount * 12 + oxygenCount * 16 + nitrogenCount * 14 + (smiles.length - carbonCount - oxygenCount - nitrogenCount) * 1.5;
      const estimatedLogP = (carbonCount - oxygenCount * 0.5 - nitrogenCount * 0.3) * 0.5;
      const estimatedHBD = Math.min(oxygenCount, 3);
      const estimatedHBA = oxygenCount + nitrogenCount;
      const estimatedRB = Math.max(0, carbonCount / 4 - ringCount);
      const estimatedPSA = oxygenCount * 20 + nitrogenCount * 25;

      setFormData(prev => ({
        ...prev,
        molecularWeight: estimatedMW.toFixed(1),
        logP: estimatedLogP.toFixed(2),
        hBondDonors: estimatedHBD.toString(),
        hBondAcceptors: estimatedHBA.toString(),
        rotableBonds: Math.round(estimatedRB).toString(),
        polarSurfaceArea: estimatedPSA.toFixed(1),
      }));

      setIsCalculating(false);
      toast.info('Properties estimated', {
        description: 'These are rough estimates. Enter exact values if known.',
      });
    }, 500);
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

// Helper functions
function generateFormula(smiles: string): string {
  const carbonCount = (smiles.match(/C/g) || []).length;
  const oxygenCount = (smiles.match(/O/g) || []).length;
  const nitrogenCount = (smiles.match(/N/g) || []).length;
  const sulfurCount = (smiles.match(/S/g) || []).length;
  
  let formula = '';
  if (carbonCount) formula += `C${carbonCount > 1 ? '₀₁₂₃₄₅₆₇₈₉'.split('').slice(0, carbonCount.toString().length).map((_, i) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(carbonCount.toString()[i])]).join('') : ''}`;
  if (nitrogenCount) formula += `N${nitrogenCount > 1 ? '₀₁₂₃₄₅₆₇₈₉'.split('').slice(0, nitrogenCount.toString().length).map((_, i) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(nitrogenCount.toString()[i])]).join('') : ''}`;
  if (oxygenCount) formula += `O${oxygenCount > 1 ? '₀₁₂₃₄₅₆₇₈₉'.split('').slice(0, oxygenCount.toString().length).map((_, i) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(oxygenCount.toString()[i])]).join('') : ''}`;
  if (sulfurCount) formula += `S${sulfurCount > 1 ? '₀₁₂₃₄₅₆₇₈₉'.split('').slice(0, sulfurCount.toString().length).map((_, i) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(sulfurCount.toString()[i])]).join('') : ''}`;
  
  return formula || 'C₁₀H₁₂O₂';
}

function generateAtoms(smiles: string) {
  const ATOM_COLORS: Record<string, { color: string; radius: number }> = {
    C: { color: '#909090', radius: 0.77 },
    H: { color: '#FFFFFF', radius: 0.37 },
    O: { color: '#FF0D0D', radius: 0.73 },
    N: { color: '#3050F8', radius: 0.75 },
    S: { color: '#FFFF30', radius: 1.02 },
  };

  const atoms: any[] = [];
  let x = 0;
  
  for (const char of smiles) {
    if ('CHONS'.includes(char.toUpperCase())) {
      const symbol = char.toUpperCase();
      atoms.push({
        symbol,
        position: [x * 1.4, Math.sin(x) * 0.5, Math.cos(x) * 0.3] as [number, number, number],
        charge: 0,
        ...ATOM_COLORS[symbol] || ATOM_COLORS.C,
      });
      x++;
    }
  }
  
  return atoms;
}
