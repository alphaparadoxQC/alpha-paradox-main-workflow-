import { motion } from 'framer-motion';
import { OrbitalInfo } from '@/lib/chemistry/moleculeData';

interface MolecularOrbitalDiagramProps {
  orbitals: OrbitalInfo[];
  moleculeName: string;
}

export function MolecularOrbitalDiagram({ orbitals, moleculeName }: MolecularOrbitalDiagramProps) {
  // Sort orbitals by energy (lowest first)
  const sortedOrbitals = [...orbitals].sort((a, b) => a.energy - b.energy);
  
  // Calculate scale for visualization
  const minEnergy = Math.min(...sortedOrbitals.map(o => o.energy));
  const maxEnergy = Math.max(...sortedOrbitals.map(o => o.energy));
  const range = maxEnergy - minEnergy || 1;
  
  const getYPosition = (energy: number) => {
    // Map energy to 0-100% range (inverted so lower energy is at bottom)
    return 100 - ((energy - minEnergy) / range) * 80 - 10;
  };

  const getOrbitalColor = (type: OrbitalInfo['type']) => {
    switch (type) {
      case 'bonding': return 'from-green-500 to-emerald-600';
      case 'antibonding': return 'from-red-500 to-rose-600';
      case 'nonbonding': return 'from-yellow-500 to-amber-600';
    }
  };

  const getOrbitalBorderColor = (type: OrbitalInfo['type']) => {
    switch (type) {
      case 'bonding': return 'border-green-500/50';
      case 'antibonding': return 'border-red-500/50';
      case 'nonbonding': return 'border-yellow-500/50';
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Molecular Orbital Diagram
      </h3>
      
      <div className="relative h-[200px] bg-background/30 rounded-lg border border-border/50 overflow-hidden">
        {/* Energy axis */}
        <div className="absolute left-2 top-2 bottom-2 w-px bg-border">
          <div className="absolute -top-1 -left-1 text-[10px] text-muted-foreground">E</div>
          <div className="absolute -left-1 top-0 w-2 h-px bg-muted-foreground" />
          <div className="absolute -left-1 bottom-0 w-2 h-px bg-muted-foreground" />
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] text-muted-foreground whitespace-nowrap">
            Energy (eV)
          </div>
        </div>
        
        {/* Zero line (HOMO-LUMO gap indicator) */}
        <div className="absolute left-8 right-4 top-1/2 border-t border-dashed border-muted-foreground/30">
          <span className="absolute -top-2 right-0 text-[8px] text-muted-foreground">0 eV</span>
        </div>
        
        {/* Orbitals */}
        <div className="absolute left-12 right-4 top-0 bottom-0">
          {sortedOrbitals.map((orbital, index) => (
            <motion.div
              key={orbital.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="absolute"
              style={{ top: `${getYPosition(orbital.energy)}%` }}
            >
              {/* Orbital line */}
              <div 
                className={`h-1 w-16 rounded-full bg-gradient-to-r ${getOrbitalColor(orbital.type)} shadow-lg`}
              />
              
              {/* Electrons */}
              <div className="absolute -top-2 left-1 flex gap-0.5">
                {Array.from({ length: Math.min(orbital.electrons, 2) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 + i * 0.1 }}
                    className={`w-3 h-3 rounded-full border-2 ${getOrbitalBorderColor(orbital.type)} bg-background flex items-center justify-center`}
                  >
                    <span className="text-[8px]">{i === 0 ? '↑' : '↓'}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Label */}
              <div className="absolute left-20 -top-1.5 flex items-center gap-2">
                <span className="text-[10px] font-mono text-foreground">{orbital.name}</span>
                <span className="text-[9px] text-muted-foreground">
                  {orbital.energy.toFixed(1)} eV
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600" />
          <span className="text-muted-foreground">Bonding</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600" />
          <span className="text-muted-foreground">Non-bonding</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600" />
          <span className="text-muted-foreground">Antibonding</span>
        </div>
      </div>
    </div>
  );
}
