 import { motion } from 'framer-motion';
 
 interface PhaseWheelProps {
   phase: number; // in radians
   size?: number;
 }
 
 /**
  * Phase color wheel - maps phase angle to color
  * 0 = red, π/2 = yellow, π = cyan, 3π/2 = blue
  */
 export const phaseToColor = (phase: number): string => {
   // Normalize phase to [0, 2π]
   const normalizedPhase = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
   // Map to hue (0-360)
   const hue = (normalizedPhase / (2 * Math.PI)) * 360;
   return `hsl(${hue}, 80%, 55%)`;
 };
 
 export const PhaseWheel = ({ phase, size = 24 }: PhaseWheelProps) => {
   const normalizedPhase = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
   const degrees = (normalizedPhase * 180) / Math.PI;
   const color = phaseToColor(phase);
   
   return (
     <div 
       className="relative flex items-center justify-center"
       style={{ width: size, height: size }}
       title={`Phase: ${degrees.toFixed(1)}°`}
     >
       {/* Gradient wheel background */}
       <div 
         className="absolute inset-0 rounded-full"
         style={{
           background: `conic-gradient(
             hsl(0, 80%, 55%),
             hsl(60, 80%, 55%),
             hsl(120, 80%, 55%),
             hsl(180, 80%, 55%),
             hsl(240, 80%, 55%),
             hsl(300, 80%, 55%),
             hsl(360, 80%, 55%)
           )`,
           opacity: 0.3
         }}
       />
       
       {/* Inner circle */}
       <div 
         className="absolute rounded-full bg-background"
         style={{ 
           width: size * 0.6, 
           height: size * 0.6,
         }}
       />
       
       {/* Phase indicator needle */}
       <motion.div
         initial={{ rotate: 0 }}
         animate={{ rotate: degrees - 90 }} // Adjust so 0 phase points up
         className="absolute"
         style={{
           width: 2,
           height: size * 0.4,
           background: color,
           transformOrigin: 'bottom center',
           top: size * 0.1,
           boxShadow: `0 0 4px ${color}`
         }}
       />
       
       {/* Center dot */}
       <div 
         className="absolute rounded-full"
         style={{ 
           width: 4, 
           height: 4, 
           background: color,
           boxShadow: `0 0 6px ${color}`
         }}
       />
     </div>
   );
 };