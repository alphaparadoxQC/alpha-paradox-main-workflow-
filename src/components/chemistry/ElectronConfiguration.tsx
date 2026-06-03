import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Atom } from 'lucide-react';
import { MoleculeData } from '@/lib/chemistry/moleculeData';

interface ElectronConfigurationProps {
  molecule: MoleculeData;
}

// ─── Complete Aufbau-order electron configuration ──────────────────────
// Orbital filling order following Madelung's rule (n+l ordering)
const AUFBAU_ORDER = [
  { name: '1s', n: 1, l: 0, max: 2 },
  { name: '2s', n: 2, l: 0, max: 2 },
  { name: '2p', n: 2, l: 1, max: 6 },
  { name: '3s', n: 3, l: 0, max: 2 },
  { name: '3p', n: 3, l: 1, max: 6 },
  { name: '4s', n: 4, l: 0, max: 2 },
  { name: '3d', n: 3, l: 2, max: 10 },
  { name: '4p', n: 4, l: 1, max: 6 },
  { name: '5s', n: 5, l: 0, max: 2 },
  { name: '4d', n: 4, l: 2, max: 10 },
  { name: '5p', n: 5, l: 1, max: 6 },
  { name: '6s', n: 6, l: 0, max: 2 },
  { name: '4f', n: 4, l: 3, max: 14 },
  { name: '5d', n: 5, l: 2, max: 10 },
  { name: '6p', n: 6, l: 1, max: 6 },
  { name: '7s', n: 7, l: 0, max: 2 },
  { name: '5f', n: 5, l: 3, max: 14 },
  { name: '6d', n: 6, l: 2, max: 10 },
  { name: '7p', n: 7, l: 1, max: 6 },
];

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '10': '¹⁰', '11': '¹¹', '12': '¹²', '13': '¹³', '14': '¹⁴',
};

function superscript(n: number): string {
  return SUPERSCRIPTS[String(n)] || String(n).split('').map(d => SUPERSCRIPTS[d] || d).join('');
}

// Atomic numbers for elements
const ATOMIC_NUMBERS: Record<string, number> = {
  H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10,
  Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18,
  K: 19, Ca: 20, Sc: 21, Ti: 22, V: 23, Cr: 24, Mn: 25, Fe: 26,
  Co: 27, Ni: 28, Cu: 29, Zn: 30, Ga: 31, Ge: 32, As: 33, Se: 34,
  Br: 35, Kr: 36, Rb: 37, Sr: 38, Y: 39, Zr: 40, Nb: 41, Mo: 42,
  Tc: 43, Ru: 44, Rh: 45, Pd: 46, Ag: 47, Cd: 48, In: 49, Sn: 50,
  Sb: 51, Te: 52, I: 53, Xe: 54, Cs: 55, Ba: 56,
  // Lanthanides
  La: 57, Ce: 58, Pr: 59, Nd: 60, Pm: 61, Sm: 62, Eu: 63, Gd: 64,
  Tb: 65, Dy: 66, Ho: 67, Er: 68, Tm: 69, Yb: 70, Lu: 71,
  // 6th period
  Hf: 72, Ta: 73, W: 74, Re: 75, Os: 76, Ir: 77, Pt: 78, Au: 79,
  Hg: 80, Tl: 81, Pb: 82, Bi: 83, Po: 84, At: 85, Rn: 86,
  // Actinides
  Fr: 87, Ra: 88, Ac: 89, Th: 90, Pa: 91, U: 92, Np: 93, Pu: 94,
  Am: 95, Cm: 96, Bk: 97, Cf: 98, Es: 99, Fm: 100,
};

// Noble gas core notation
const NOBLE_GAS_CORES: { symbol: string; Z: number }[] = [
  { symbol: '[Rn]', Z: 86 },
  { symbol: '[Xe]', Z: 54 },
  { symbol: '[Kr]', Z: 36 },
  { symbol: '[Ar]', Z: 18 },
  { symbol: '[Ne]', Z: 10 },
  { symbol: '[He]', Z: 2 },
];

function getElectronConfiguration(Z: number): { full: string; abbreviated: string; shells: { name: string; electrons: number; max: number }[] } {
  const shells: { name: string; electrons: number; max: number }[] = [];
  let remaining = Z;

  for (const orbital of AUFBAU_ORDER) {
    if (remaining <= 0) break;
    const e = Math.min(remaining, orbital.max);
    shells.push({ name: orbital.name, electrons: e, max: orbital.max });
    remaining -= e;
  }

  const full = shells.map(s => `${s.name}${superscript(s.electrons)}`).join(' ');

  // Abbreviated with noble gas core
  let abbreviated = full;
  for (const core of NOBLE_GAS_CORES) {
    if (Z > core.Z) {
      let coreElectrons = 0;
      const coreShells: string[] = [];
      let remaining2 = core.Z;
      for (const orbital of AUFBAU_ORDER) {
        if (remaining2 <= 0) break;
        const e = Math.min(remaining2, orbital.max);
        coreShells.push(`${orbital.name}${superscript(e)}`);
        coreElectrons += e;
        remaining2 -= e;
      }
      if (coreElectrons === core.Z) {
        const valenceShells = shells.slice(coreShells.length);
        abbreviated = `${core.symbol} ${valenceShells.map(s => `${s.name}${superscript(s.electrons)}`).join(' ')}`;
        break;
      }
    }
  }

  return { full, abbreviated, shells };
}

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
        const Z = ATOMIC_NUMBERS[atom.symbol] || 1;
        const config = getElectronConfiguration(Z);
        return { symbol: atom.symbol, Z, config };
      });
  }, [molecule]);
  
  // Calculate molecular orbital occupancy
  const moOccupancy = useMemo(() => {
    let remaining = molecule.electrons;
    
    return molecule.orbitals.map(orbital => {
      const maxElectrons = orbital.electrons; // use defined occupancy from data
      const electrons = Math.min(remaining, maxElectrons || 2);
      remaining = Math.max(0, remaining - electrons);
      
      return {
        ...orbital,
        electrons,
        isFilled: electrons >= 2,
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
        {/* Atomic Configurations — research grade */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Atomic Electron Configurations
          </div>
          <div className="space-y-2">
            {atomConfigs.map((atom, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-2.5 rounded-lg bg-background/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <AtomDiagram symbol={atom.symbol} Z={atom.Z} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{atom.symbol}</span>
                      <Badge variant="outline" className="text-[9px]">Z = {atom.Z}</Badge>
                    </div>
                    <div className="text-[10px] font-mono text-primary mt-0.5 break-all leading-relaxed">
                      {atom.config.abbreviated}
                    </div>
                  </div>
                </div>
                {/* Orbital filling visualization */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {atom.config.shells.slice(-6).map((shell, j) => (
                    <div key={j} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background/50 border border-border/30">
                      <span className="text-[9px] font-mono text-muted-foreground">{shell.name}</span>
                      <div className="flex gap-px">
                        {Array.from({ length: Math.ceil(shell.max / 2) }).map((_, k) => {
                          const filled = shell.electrons > k * 2;
                          const half = shell.electrons === k * 2 + 1;
                          return (
                            <div key={k} className={`w-2.5 h-3 border rounded-[2px] flex items-center justify-center ${
                              filled ? 'border-primary/60 bg-primary/15' : 'border-muted-foreground/20'
                            }`}>
                              {filled && <span className="text-[6px] text-primary">{half ? '↑' : '↑↓'}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Molecular Orbital Filling */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Molecular Orbital Filling (Aufbau)
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
                  {/* Orbital box diagram with spin arrows */}
                  <div className="flex gap-0.5">
                    <OrbitalBox filled={mo.electrons >= 1} spin="up" />
                    <OrbitalBox filled={mo.electrons >= 2} spin="down" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-semibold">{mo.name}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {mo.energy.toFixed(1)} eV • {mo.type}
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
              ½ × (bonding e⁻ − antibonding e⁻)
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              {bondOrder > 2 ? 'Triple bond character' : bondOrder > 1 ? 'Double bond character' : bondOrder > 0 ? 'Single bond' : 'No net bonding'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AtomDiagram({ symbol, Z }: { symbol: string; Z: number }) {
  // Determine shell electron counts for Bohr model visualization
  const shellCapacities = [2, 8, 18, 32, 32, 18, 8];
  const shellElectrons: number[] = [];
  let remaining = Z;
  for (const cap of shellCapacities) {
    if (remaining <= 0) break;
    const e = Math.min(remaining, cap);
    shellElectrons.push(e);
    remaining -= e;
  }
  
  const maxRadius = 16;
  const shellRadii = shellElectrons.map((_, i) => (i + 1) * (maxRadius / Math.max(shellElectrons.length, 1)));
  
  return (
    <svg width={40} height={40} viewBox="-20 -20 40 40">
      {/* Nucleus */}
      <circle r={4} fill="hsl(var(--primary))" />
      <text 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize={symbol.length > 1 ? 4 : 5} 
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
          {/* Electrons — show max 8 per shell for readability */}
          {Array.from({ length: Math.min(shellElectrons[i], 8) }).map((_, j) => {
            const angle = (j / Math.min(shellElectrons[i], 8)) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={j}
                cx={Math.cos(angle) * r}
                cy={Math.sin(angle) * r}
                r={1.5}
                fill="hsl(var(--accent))"
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function OrbitalBox({ filled, spin }: { filled: boolean; spin: 'up' | 'down' }) {
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
          {spin === 'up' ? '↑' : '↓'}
        </motion.div>
      )}
    </div>
  );
}
