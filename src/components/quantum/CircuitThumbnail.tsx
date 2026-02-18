 import { useMemo } from 'react';
 import { QuantumGate, GATE_INFO, GateType } from '@/types/quantum';
 import { EXTENDED_GATE_INFO } from '@/types/quantum-extended';

const getGateInfo = (type: string) =>
  GATE_INFO[type as GateType] ??
  EXTENDED_GATE_INFO[type as keyof typeof EXTENDED_GATE_INFO] ??
  { color: 'hsl(200, 80%, 60%)', symbol: type, name: type };
 
 interface CircuitThumbnailProps {
   gates: QuantumGate[];
   qubitCount: number;
   className?: string;
 }
 
 export function CircuitThumbnail({ gates, qubitCount, className = '' }: CircuitThumbnailProps) {
   const maxPosition = useMemo(() => {
     if (gates.length === 0) return 3;
     return Math.max(...gates.map(g => g.position)) + 1;
   }, [gates]);
 
   const visibleQubits = Math.min(qubitCount, 5);
   const visiblePositions = Math.min(maxPosition, 6);
   
   const cellWidth = 100 / (visiblePositions + 1);
   const cellHeight = 100 / (visibleQubits + 0.5);
 
   return (
     <div 
       className={`relative w-full h-24 bg-background/50 rounded-md border border-border/50 overflow-hidden ${className}`}
     >
       {/* Qubit lines */}
       <svg className="absolute inset-0 w-full h-full">
         {Array.from({ length: visibleQubits }).map((_, i) => (
           <line
             key={i}
             x1="0"
             y1={`${(i + 0.5) * cellHeight}%`}
             x2="100%"
             y2={`${(i + 0.5) * cellHeight}%`}
             stroke="currentColor"
             strokeOpacity="0.2"
             strokeWidth="1"
           />
         ))}
       </svg>
 
       {/* Gates */}
       {gates
         .filter(gate => gate.qubit < visibleQubits && gate.position < visiblePositions)
         .map((gate) => {
           const gateInfo = getGateInfo(gate.type);
           const x = (gate.position + 0.5) * cellWidth;
           const y = (gate.qubit + 0.5) * cellHeight;
           const size = Math.min(cellWidth * 0.7, cellHeight * 0.7);
 
           // Handle multi-qubit gates
           if ((gate.type === 'CNOT' || gate.type === 'CZ') && gate.controlQubit !== undefined) {
             const controlY = (gate.controlQubit + 0.5) * cellHeight;
             const targetY = y;
 
             if (gate.controlQubit < visibleQubits) {
               return (
                 <svg key={gate.id} className="absolute inset-0 w-full h-full pointer-events-none">
                   {/* Control-target line */}
                   <line
                     x1={`${x}%`}
                     y1={`${controlY}%`}
                     x2={`${x}%`}
                     y2={`${targetY}%`}
                     stroke={gateInfo.color}
                     strokeWidth="2"
                   />
                   {/* Control dot */}
                   <circle
                     cx={`${x}%`}
                     cy={`${controlY}%`}
                     r="4"
                     fill={gateInfo.color}
                   />
                   {/* Target */}
                   <circle
                     cx={`${x}%`}
                     cy={`${targetY}%`}
                     r="6"
                     fill={gateInfo.color}
                     fillOpacity="0.2"
                     stroke={gateInfo.color}
                     strokeWidth="2"
                   />
                 </svg>
               );
             }
           }
 
           // Single qubit gates
           return (
             <div
               key={gate.id}
               className="absolute flex items-center justify-center text-[8px] font-bold rounded-sm"
               style={{
                 left: `${x}%`,
                 top: `${y}%`,
                 width: `${size}%`,
                 height: `${size}%`,
                 transform: 'translate(-50%, -50%)',
                 backgroundColor: gateInfo.color,
                 color: '#000',
               }}
             >
               {gateInfo.symbol}
             </div>
           );
         })}
 
       {/* Overflow indicator */}
       {(qubitCount > visibleQubits || maxPosition > visiblePositions) && (
         <div className="absolute bottom-1 right-1 text-[8px] text-muted-foreground bg-background/80 px-1 rounded">
           +more
         </div>
       )}
     </div>
   );
 }