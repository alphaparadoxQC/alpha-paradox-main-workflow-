import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Atom } from 'lucide-react';
import { MoleculeData } from '@/lib/chemistry/moleculeData';

interface ElectronConfigurationProps {
  molecule: MoleculeData;
}

// Electron shell configurations
const SHELL_CONFIG: Record<string, { shells: number[]; notation: string }> = {
  H: { shells: [1], notation: '1s¹' },
  He: { shells: [2], notation: '1s²' },
  Li: { shells: [2, 1], notation: '1s² 2s¹' },
  Be: { shells: [2, 2], notation: '1s² 2s²' },
  B: { shells: [2, 3], notation: '1s² 2s² 2p¹' },
  C: { shells: [2, 4], notation: '1s² 2s² 2p²' },
  N: { shells: [2, 5], notation: '1s² 2s² 2p³' },
  O: { shells: [2, 6], notation: '1s² 2s² 2p⁴' },
  F: { shells: [2, 7], notation: '1s² 2s² 2p⁵' },
  Ne: { shells: [2, 8], notation: '1s² 2s² 2p⁶' },
};

// Atomic numbers for elements
const ATOMIC_NUMBERS: Record<string, number> = {
  H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10,
};

export function ElectronConfiguration({ molecule }: ElectronConfigurationProps) {
  // Get unique atoms and their configurations
  const atomConfigs = useMemo(() => {
    const seen = new Set<string>();
    return molecule.atoms
      .filter(atom => {
        if (seen.has(atom.symbol)) return false;
        seen.add(atom.symbol);
        return true;
      })
      .map(atom => {
        const atomicNumber = ATOMIC_NUMBERS[atom.symbol] || 1;
        return {
          symbol: atom.symbol,
          config: SHELL_CONFIG[atom.symbol] || { shells: [atomicNumber], notation: `${atomicNumber}e⁻` },
          atomicNumber,
        };
      });
  }, [molecule]);
  
  // Calculate molecular orbital occupancy
  const moOccupancy = useMemo(() => {
    const totalElectrons = molecule.electrons;
    let remaining = totalElectrons;
    
    return molecule.orbitals.map(orbital => {
      // Each orbital can hold 2 electrons (spin up/down)
      const maxElectrons = orbital.type === 'antibonding' ? 2 : 2;
      const electrons = Math.min(remaining, maxElectrons);
      remaining -= electrons;
      
      return {
        ...orbital,
        electrons,
        isFilled: electrons === 2,
        isPartial: electrons === 1,
        isEmpty: electrons === 0,
      };
    });
  }, [molecule]);
  
  const bondOrder = useMemo(() => {
    let bonding = 0;
    let antibonding = 0;
    
    moOccupancy.forEach(mo => {
      if (mo.type === 'bonding') bonding += mo.electrons;
      else if (mo.type === 'antibonding') antibonding += mo.electrons;
    });
    
    return (bonding - antibonding) / 2;
  }, [moOccupancy]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Atom className="w-4 h-4 text-primary" />
            Electron Configuration
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {molecule.electrons} electrons
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Atomic Configurations */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Atomic Orbitals
          </div>
          <div className="flex flex-wrap gap-2">
            {atomConfigs.map((atom, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/30">
                <AtomDiagram symbol={atom.symbol} shells={atom.config.shells} />
                <div>
                  <div className="text-xs font-semibold">{atom.symbol}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {atom.config.notation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Molecular Orbital Filling */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Molecular Orbital Filling
          </div>
          <div className="flex flex-wrap gap-2">
            {moOccupancy.map((mo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`p-2 rounded-lg border ${
                  mo.type === 'bonding' ? 'bg-green-500/10 border-green-500/30' :
                  mo.type === 'antibonding' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Orbital box diagram */}
                  <div className="flex gap-0.5">
                    <OrbitalBox filled={mo.electrons >= 1} />
                    <OrbitalBox filled={mo.electrons >= 2} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-semibold">{mo.name}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {mo.type}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Bond Order */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Bond Order
            </div>
            <div className="text-lg font-bold text-primary">{bondOrder.toFixed(1)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">
              ½ × (bonding - antibonding)
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              Higher = stronger bond
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AtomDiagram({ symbol, shells }: { symbol: string; shells: number[] }) {
  const maxRadius = 16;
  const shellRadii = shells.map((_, i) => (i + 1) * (maxRadius / shells.length));
  
  return (
    <svg width={40} height={40} viewBox="-20 -20 40 40">
      {/* Nucleus */}
      <circle r={4} fill="hsl(var(--primary))" />
      <text 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize={5} 
        fill="hsl(var(--primary-foreground))"
        fontWeight="bold"
      >
        {symbol}
      </text>
      
      {/* Shells */}
      {shellRadii.map((r, i) => (
        <g key={i}>
          <circle 
            r={r} 
            fill="none" 
            stroke="hsl(var(--border))" 
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
          {/* Electrons */}
          {Array.from({ length: Math.min(shells[i], 8) }).map((_, j) => {
            const angle = (j / Math.min(shells[i], 8)) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={j}
                cx={Math.cos(angle) * r}
                cy={Math.sin(angle) * r}
                r={2}
                fill="hsl(var(--accent))"
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function OrbitalBox({ filled }: { filled: boolean }) {
  return (
    <div className={`w-4 h-5 border rounded-sm flex items-center justify-center ${
      filled ? 'border-primary bg-primary/20' : 'border-muted-foreground/30'
    }`}>
      {filled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-[8px] text-primary font-bold"
        >
          ↑
        </motion.div>
      )}
    </div>
  );
}
