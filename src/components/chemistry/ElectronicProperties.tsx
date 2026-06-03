import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface ElectronicPropertiesProps {
  /** HOMO eV (negative number) */
  homo?: number;
  /** LUMO eV */
  lumo?: number;
}

const DEFAULT_HOMO = -15.4;
const DEFAULT_LUMO = 4.8;

export function ElectronicProperties({ homo = DEFAULT_HOMO, lumo = DEFAULT_LUMO }: ElectronicPropertiesProps) {
  const gap = lumo - homo;
  const reactivity =
    gap > 6 ? { label: 'Low', desc: 'Stable molecule — wide band gap (> 6 eV)', color: '#22c55e', glow: 'rgba(34,197,94,0.3)' }
    : gap >= 3 ? { label: 'Medium', desc: 'Moderate reactivity — 3–6 eV gap', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' }
    : { label: 'High', desc: 'Highly reactive — narrow gap (< 3 eV)', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' };

  // Visualization constants
  const barW = 260;
  const homoY = 180;
  const lumoY = 60;
  const gapH = homoY - lumoY;
  const bandX = 80;
  const bandW = 180;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border overflow-hidden relative">
      {/* Subtle background glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(ellipse at 50% 70%, ${reactivity.glow} 0%, transparent 60%)`,
        }}
      />
      
      <CardHeader className="py-3 relative z-10">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Activity className="w-4 h-4 text-primary" />
            </motion.div>
            Electronic Properties
          </span>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Badge 
              variant="secondary" 
              className="text-[10px] border"
              style={{ borderColor: reactivity.color, color: reactivity.color }}
            >
              {reactivity.label} Reactivity
            </Badge>
          </motion.div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 relative z-10">
        <svg viewBox={`0 0 ${barW + 60} 240`} className="w-full h-auto">
          <defs>
            {/* HOMO gradient */}
            <linearGradient id="homoGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(265, 100%, 65%)" />
              <stop offset="100%" stopColor="hsl(220, 100%, 65%)" />
            </linearGradient>
            {/* LUMO gradient */}
            <linearGradient id="lumoGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(45, 100%, 55%)" />
              <stop offset="100%" stopColor="hsl(25, 100%, 60%)" />
            </linearGradient>
            {/* Band gap gradient */}
            <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(45, 100%, 55%)" stopOpacity="0.15" />
              <stop offset="50%" stopColor={reactivity.color} stopOpacity="0.08" />
              <stop offset="100%" stopColor="hsl(265, 100%, 65%)" stopOpacity="0.15" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Band gap region (shimmering fill) */}
          <motion.rect 
            x={bandX} y={lumoY + 4} 
            width={bandW} height={gapH - 8}
            fill="url(#gapGrad)"
            rx="4"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Δ gap label */}
          <text x={bandX + bandW / 2} y={(lumoY + homoY) / 2 - 8} textAnchor="middle" fontSize="11" fill={reactivity.color} fontWeight="bold">
            Δ = {gap.toFixed(2)} eV
          </text>
          <text x={bandX + bandW / 2} y={(lumoY + homoY) / 2 + 8} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
            HOMO–LUMO Gap
          </text>

          {/* LUMO energy band */}
          <motion.rect 
            x={bandX} y={lumoY - 3} 
            width={bandW} height={6}
            fill="url(#lumoGrad)"
            rx="3"
            filter="url(#glow)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ transformOrigin: `${bandX}px ${lumoY}px` }}
          />
          <text x={bandX + bandW + 10} y={lumoY - 6} fontSize="10" fill="hsl(var(--foreground))" fontWeight="600">
            LUMO
          </text>
          <text x={bandX + bandW + 10} y={lumoY + 8} fontSize="9" fill="hsl(var(--muted-foreground))">
            {lumo.toFixed(2)} eV
          </text>

          {/* HOMO energy band */}
          <motion.rect 
            x={bandX} y={homoY - 3} 
            width={bandW} height={6}
            fill="url(#homoGrad)"
            rx="3"
            filter="url(#glow)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ transformOrigin: `${bandX}px ${homoY}px` }}
          />
          <text x={bandX + bandW + 10} y={homoY - 6} fontSize="10" fill="hsl(var(--foreground))" fontWeight="600">
            HOMO
          </text>
          <text x={bandX + bandW + 10} y={homoY + 8} fontSize="9" fill="hsl(var(--muted-foreground))">
            {homo.toFixed(2)} eV
          </text>

          {/* Electron arrows on HOMO — spin up ↑ */}
          <motion.g
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <line x1={bandX + 50} y1={homoY + 10} x2={bandX + 50} y2={homoY - 14} stroke="hsl(265, 100%, 65%)" strokeWidth={2} />
            <polygon points={`${bandX + 47},${homoY - 10} ${bandX + 53},${homoY - 10} ${bandX + 50},${homoY - 16}`} fill="hsl(265, 100%, 65%)" />
          </motion.g>
          {/* Electron arrows on HOMO — spin down ↓ */}
          <motion.g
            animate={{ y: [0, 2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <line x1={bandX + 70} y1={homoY - 10} x2={bandX + 70} y2={homoY + 14} stroke="hsl(220, 100%, 65%)" strokeWidth={2} />
            <polygon points={`${bandX + 67},${homoY + 10} ${bandX + 73},${homoY + 10} ${bandX + 70},${homoY + 16}`} fill="hsl(220, 100%, 65%)" />
          </motion.g>

          {/* Side gap arrows */}
          <line x1={bandX - 20} y1={lumoY} x2={bandX - 20} y2={homoY} stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="3 3" />
          <polygon points={`${bandX - 23},${lumoY + 6} ${bandX - 17},${lumoY + 6} ${bandX - 20},${lumoY}`} fill="hsl(var(--muted-foreground))" />
          <polygon points={`${bandX - 23},${homoY - 6} ${bandX - 17},${homoY - 6} ${bandX - 20},${homoY}`} fill="hsl(var(--muted-foreground))" />

          {/* Energy axis label */}
          <text x={15} y={120} fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle" transform="rotate(-90, 15, 120)">
            Energy (eV)
          </text>

          {/* Electron legend */}
          <circle cx={bandX + 48} cy={215} r={4} fill="hsl(265, 100%, 65%)" />
          <text x={bandX + 58} y={218} fontSize="8" fill="hsl(var(--muted-foreground))">Spin ↑</text>
          <circle cx={bandX + 108} cy={215} r={4} fill="hsl(220, 100%, 65%)" />
          <text x={bandX + 118} y={218} fontSize="8" fill="hsl(var(--muted-foreground))">Spin ↓</text>
        </svg>

        {/* Bottom stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-background/30 border border-border/50">
            <div className="text-[9px] text-muted-foreground uppercase">HOMO</div>
            <div className="text-sm font-bold font-mono" style={{ color: 'hsl(265, 100%, 65%)' }}>{homo.toFixed(2)}</div>
            <div className="text-[8px] text-muted-foreground">eV</div>
          </div>
          <div className="text-center p-2 rounded-lg border" style={{ borderColor: reactivity.color + '40', background: reactivity.color + '10' }}>
            <div className="text-[9px] text-muted-foreground uppercase">Gap</div>
            <div className="text-sm font-bold font-mono" style={{ color: reactivity.color }}>{gap.toFixed(2)}</div>
            <div className="text-[8px] text-muted-foreground">eV</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/30 border border-border/50">
            <div className="text-[9px] text-muted-foreground uppercase">LUMO</div>
            <div className="text-sm font-bold font-mono" style={{ color: 'hsl(45, 100%, 55%)' }}>{lumo.toFixed(2)}</div>
            <div className="text-[8px] text-muted-foreground">eV</div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center italic">{reactivity.desc}</p>
      </CardContent>
    </Card>
  );
}
