import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChemistryAPI } from '@/lib/chemistry/apiClient';
import { Loader2, ArrowRight, GitMerge } from 'lucide-react';
import { toast } from 'sonner';

interface QuantumMappingPanelProps {
  smiles: string;
  onHamiltonianGenerated: (data: any) => void;
}

export function QuantumMappingPanel({ smiles, onHamiltonianGenerated }: QuantumMappingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState('jordan_wigner');
  const [activeElec, setActiveElec] = useState('');
  const [activeOrb, setActiveOrb] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const elec = activeElec ? parseInt(activeElec) : undefined;
      const orb = activeOrb ? parseInt(activeOrb) : undefined;
      const data = await ChemistryAPI.generateHamiltonian(smiles, mapping, elec, orb);
      onHamiltonianGenerated(data);
      toast.success('Hamiltonian mapping complete!');
    } catch (err: any) {
      toast.error('Hamiltonian Generation Failed', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      <CardHeader className="py-4 border-b border-border/50">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-purple-400" />
            Quantum Mapping (OpenFermion)
          </span>
        </CardTitle>
        <CardDescription>Generate the Fermionic Hamiltonian and map it to Qubit Pauli Operators.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Active Electrons</Label>
            <Input 
              type="number" 
              placeholder="e.g. 2 (optional)" 
              value={activeElec}
              onChange={(e) => setActiveElec(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Active Spatial Orbitals</Label>
            <Input 
              type="number" 
              placeholder="e.g. 2 (optional)" 
              value={activeOrb}
              onChange={(e) => setActiveOrb(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Mapping Strategy</Label>
          <Select value={mapping} onValueChange={setMapping}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jordan_wigner">Jordan-Wigner</SelectItem>
              <SelectItem value="bravyi_kitaev">Bravyi-Kitaev</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-2">
          <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Generate Qubit Hamiltonian
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
