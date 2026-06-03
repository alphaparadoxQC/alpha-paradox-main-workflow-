import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrbitalInfo } from '@/lib/chemistry/moleculeData';

interface MolecularOrbitalDiagramProps {
  orbitals: OrbitalInfo[];
  moleculeName: string;
}

export function MolecularOrbitalDiagram({ orbitals, moleculeName }: MolecularOrbitalDiagramProps) {
  // Sort orbitals by energy (lowest first)
  const sortedOrbitals = useMemo(() => 
    [...orbitals].sort((a, b) => a.energy - b.energy),
  [orbitals]);
  
  // Find HOMO and LUMO
  const { homo, lumo, homoIndex } = useMemo(() => {
    let lastOccupied = -1;
    for (let i = 0; i < sortedOrbitals.length; i++) {
      if (sortedOrbitals[i].electrons > 0) lastOccupied = i;
    }
    return {
      homo: lastOccupied >= 0 ? sortedOrbitals[lastOccupied] : null,
      lumo: lastOccupied + 1 < sortedOrbitals.length ? sortedOrbitals[lastOccupied + 1] : null,
      homoIndex: lastOccupied,
    };
  }, [sortedOrbitals]);

  const gap = homo && lumo ? lumo.energy - homo.energy : null;
  
  // Evenly space orbitals vertically for clarity
  const totalHeight = 280;
  const topPadding = 24;
  const bottomPadding = 24;
  const usableHeight = totalHeight - topPadding - bottomPadding;

  const getOrbitalColor = (type: OrbitalInfo['type']) => {
    switch (type) {
      case 'bonding': return { gradient: 'from-green-500 to-emerald-600', bg: 'bg-green-500/15', border: 'border-green-500/40', text: 'text-green-500' };
      case 'antibonding': return { gradient: 'from-red-500 to-rose-600', bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-500' };
      case 'nonbonding': return { gradient: 'from-yellow-500 to-amber-600', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-500' };
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Molecular Orbital Diagram
          </div>
          {gap !== null && (
            <Badge variant="outline" className="text-[10px] font-mono">
              HOMO-LUMO gap: {gap.toFixed(1)} eV
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative bg-background/30 rounded-lg border border-border/50 overflow-hidden" 
             style={{ height: totalHeight }}>
          
          {/* Energy axis */}
          <div className="absolute left-4 top-4 bottom-4 flex flex-col justify-between items-center">
            <span className="text-[9px] text-muted-foreground font-medium">E ↑</span>
            <div className="flex-1 w-px bg-gradient-to-b from-red-500/40 via-border to-green-500/40 my-2" />
            <span className="text-[8px] text-muted-foreground">Low</span>
          </div>
          
          {/* HOMO-LUMO gap indicator */}
          {homo && lumo && sortedOrbitals.length > 1 && (
            <div className="absolute right-3 flex flex-col items-center"
                 style={{
                   top: topPadding + (sortedOrbitals.length - 1 - (homoIndex + 1)) * (usableHeight / Math.max(sortedOrbitals.length - 1, 1)),
                   height: usableHeight / Math.max(sortedOrbitals.length - 1, 1),
                 }}>
              <div className="flex-1 w-px border-l-2 border-dashed border-primary/40" />
              <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30">
                <span className="text-[8px] font-mono text-primary font-bold">{gap?.toFixed(1)} eV</span>
              </div>
              <div className="flex-1 w-px border-l-2 border-dashed border-primary/40" />
            </div>
          )}
          
          {/* Orbitals */}
          <div className="absolute left-16 right-12 top-0 bottom-0">
            {sortedOrbitals.map((orbital, index) => {
              const colors = getOrbitalColor(orbital.type);
              // Position from top: highest energy at top, lowest at bottom
              const reverseIndex = sortedOrbitals.length - 1 - index;
              const yPos = sortedOrbitals.length === 1 
                ? topPadding + usableHeight / 2 
                : topPadding + reverseIndex * (usableHeight / Math.max(sortedOrbitals.length - 1, 1));
              
              const isHomo = homo === orbital;
              const isLumo = lumo === orbital;
              
              return (
                <motion.div
                  key={orbital.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className="absolute flex items-center gap-2"
                  style={{ top: yPos - 10, left: 0, right: 0 }}
                >
                  {/* Energy level line */}
                  <div className={`h-[3px] w-20 rounded-full bg-gradient-to-r ${colors.gradient} shadow-sm`} />
                  
                  {/* Electron dots on the line */}
                  <div className="absolute left-2 -top-1 flex gap-1">
                    {Array.from({ length: Math.min(orbital.electrons, orbital.type === 'nonbonding' ? 4 : 2) }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.08 + 0.15 + i * 0.08 }}
                        className={`w-3.5 h-3.5 rounded-full border-2 ${colors.border} bg-background flex items-center justify-center shadow-sm`}
                      >
                        <span className="text-[7px] font-bold">{i % 2 === 0 ? '↑' : '↓'}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Label */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-[10px] font-mono font-semibold text-foreground">
                      {orbital.name}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {orbital.energy.toFixed(1)} eV
                    </span>
                    {isHomo && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 bg-green-500/20 text-green-500 border-green-500/40">
                        HOMO
                      </Badge>
                    )}
                    {isLumo && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 bg-red-500/20 text-red-500 border-red-500/40">
                        LUMO
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600" />
            <span className="text-muted-foreground">Bonding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600" />
            <span className="text-muted-foreground">Non-bonding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600" />
            <span className="text-muted-foreground">Antibonding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 bg-background flex items-center justify-center">
              <span className="text-[7px]">↑</span>
            </div>
            <span className="text-muted-foreground">Electron</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
