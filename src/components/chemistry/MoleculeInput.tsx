import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChemistryAPI, MoleculeResponse } from '@/lib/chemistry/apiClient';
import { parseSmilesClientSide } from '@/lib/chemistry/smilesParser';
import { Loader2, ArrowRight, Dna, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MoleculeInputProps {
  onMoleculeParsed: (mol: MoleculeResponse) => void;
}

export function MoleculeInput({ onMoleculeParsed }: MoleculeInputProps) {
  const [smiles, setSmiles] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!smiles.trim()) return;
    setLoading(true);
    setError('');
    
    // Use client-side parser directly since backend is unavailable
    try {
      const data = parseSmilesClientSide(smiles);
      onMoleculeParsed(data);
    } catch (err: any) {
      setError(err.message || 'Failed to parse SMILES');
    } finally {
      setLoading(false);
    }


  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Dna className="w-4 h-4 text-primary" />
          Molecule Parser
        </CardTitle>
        <CardDescription>
          Enter a SMILES string to parse coordinates and calculate properties.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input 
            placeholder="e.g. CCO (Ethanol), c1ccccc1 (Benzene)" 
            value={smiles}
            onChange={(e) => setSmiles(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleParse()}
            className="flex-1 font-mono"
            disabled={loading}
          />
          <Button onClick={handleParse} disabled={!smiles.trim() || loading} className="shrink-0 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Parse
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-muted-foreground mr-2 self-center">Examples:</span>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => setSmiles('O')}>Water (O)</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => setSmiles('N')}>Ammonia (N)</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => setSmiles('c1ccccc1')}>Benzene</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => setSmiles('CC(=O)Oc1ccccc1C(=O)O')}>Aspirin</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => setSmiles('CCO')}>Ethanol</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => setSmiles('Cn1cnc2c1c(=O)n(C)c(=O)n2C')}>Caffeine</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
