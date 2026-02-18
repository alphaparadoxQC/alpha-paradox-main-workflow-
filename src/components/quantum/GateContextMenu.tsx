 /**
  * ============================================================
  * GATE CONTEXT MENU COMPONENT
  * ============================================================
  * 
  * This component provides a right-click context menu for quantum gates.
  * 
  * Features:
  * - Delete: Removes the gate from the circuit
  * - Duplicate: Creates a copy at the next available position
  * - Properties: Opens a dialog to edit gate parameters (angle for Rx/Ry/Rz)
  * 
  * Implementation Notes:
  * - Uses Radix UI's ContextMenu for accessibility
  * - The menu is rendered as a wrapper around each gate in the canvas
  * - For rotation gates, the Properties option opens a slider dialog
  * ============================================================
  */
 
 import { ReactNode, useState } from 'react';
 import {
   ContextMenu,
   ContextMenuContent,
   ContextMenuItem,
   ContextMenuTrigger,
   ContextMenuSeparator,
   ContextMenuLabel,
 } from '@/components/ui/context-menu';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
 } from '@/components/ui/dialog';
 import { Slider } from '@/components/ui/slider';
 import { Label } from '@/components/ui/label';
 import { Trash2, Copy, Settings } from 'lucide-react';
import { QuantumGate, GATE_INFO, GateType } from '@/types/quantum';
import { EXTENDED_GATE_INFO } from '@/types/quantum-extended';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';

const getGateInfo = (type: string) =>
  GATE_INFO[type as GateType] ??
  EXTENDED_GATE_INFO[type as keyof typeof EXTENDED_GATE_INFO] ??
  { color: 'hsl(200, 80%, 60%)', symbol: type, name: type, description: 'Quantum gate' };
 
 interface GateContextMenuProps {
   gate: QuantumGate;
   children: ReactNode;
 }
 
 /**
  * ============================================================
  * ROTATION GATES CHECK
  * ============================================================
  * These gate types have an angle parameter that can be edited.
  * The angle is stored in radians and displayed in terms of π.
  * ============================================================
  */
 const ROTATION_GATES = ['Rx', 'Ry', 'Rz'];
 
 export const GateContextMenu = ({ gate, children }: GateContextMenuProps) => {
   const { removeGate, duplicateGate, updateGate } = useQuantumCircuitStore();
   const [showProperties, setShowProperties] = useState(false);
   
   const gateInfo = getGateInfo(gate.type);
   const isRotationGate = ROTATION_GATES.includes(gate.type);
   
   /**
    * ============================================================
    * ANGLE MANAGEMENT
    * ============================================================
    * Rotation gates store angle in radians.
    * Default is π/2 (1.5708 radians) if not specified.
    * UI displays as multiples of π for easier understanding.
    * ============================================================
    */
   const currentAngle = gate.angle ?? Math.PI / 2;
   
   const handleAngleChange = (value: number[]) => {
     updateGate(gate.id, { angle: value[0] });
   };
   
   /**
    * ============================================================
    * FORMAT ANGLE FOR DISPLAY
    * ============================================================
    * Converts radians to a readable format like "π/2" or "0.75π"
    * ============================================================
    */
   const formatAngle = (radians: number): string => {
     const piMultiple = radians / Math.PI;
     if (Math.abs(piMultiple - 0.25) < 0.01) return 'π/4';
     if (Math.abs(piMultiple - 0.5) < 0.01) return 'π/2';
     if (Math.abs(piMultiple - 0.75) < 0.01) return '3π/4';
     if (Math.abs(piMultiple - 1) < 0.01) return 'π';
     if (Math.abs(piMultiple - 1.5) < 0.01) return '3π/2';
     if (Math.abs(piMultiple - 2) < 0.01) return '2π';
     return `${piMultiple.toFixed(2)}π`;
   };
 
   return (
     <>
       {/* ============================================================
           CONTEXT MENU WRAPPER
           ============================================================
           Wraps the gate element and triggers on right-click.
           Uses Radix UI ContextMenu for proper accessibility.
           ============================================================ */}
       <ContextMenu>
         <ContextMenuTrigger asChild>
           {children}
         </ContextMenuTrigger>
         
         <ContextMenuContent className="w-48">
           <ContextMenuLabel className="flex items-center gap-2">
             <span 
               className="w-3 h-3 rounded-sm" 
               style={{ backgroundColor: gateInfo.color }} 
             />
             {gateInfo.name}
           </ContextMenuLabel>
           
           <ContextMenuSeparator />
           
           {/* ============================================================
               DELETE OPTION
               ============================================================
               Removes the gate from the circuit.
               Uses the removeGate action from the store.
               ============================================================ */}
           <ContextMenuItem 
             onClick={() => removeGate(gate.id)}
             className="text-destructive focus:text-destructive"
           >
             <Trash2 className="w-4 h-4 mr-2" />
             Delete
           </ContextMenuItem>
           
           {/* ============================================================
               DUPLICATE OPTION
               ============================================================
               Creates a copy of the gate at the next available position.
               The new gate inherits all properties from the original.
               ============================================================ */}
           <ContextMenuItem onClick={() => duplicateGate(gate.id)}>
             <Copy className="w-4 h-4 mr-2" />
             Duplicate
           </ContextMenuItem>
           
           {/* ============================================================
               PROPERTIES OPTION
               ============================================================
               Opens a dialog for editing gate properties.
               Currently only rotation gates (Rx, Ry, Rz) have editable
               properties (the rotation angle).
               ============================================================ */}
           <ContextMenuItem 
             onClick={() => setShowProperties(true)}
             disabled={!isRotationGate}
           >
             <Settings className="w-4 h-4 mr-2" />
             Properties
             {!isRotationGate && (
               <span className="ml-auto text-xs text-muted-foreground">N/A</span>
             )}
           </ContextMenuItem>
         </ContextMenuContent>
       </ContextMenu>
       
       {/* ============================================================
           PROPERTIES DIALOG
           ============================================================
           Modal dialog for editing gate parameters.
           For rotation gates, shows a slider to adjust the angle.
           Angle range: 0 to 2π radians.
           ============================================================ */}
       <Dialog open={showProperties} onOpenChange={setShowProperties}>
         <DialogContent className="sm:max-w-[400px]">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <span 
                 className="w-4 h-4 rounded" 
                 style={{ backgroundColor: gateInfo.color }} 
               />
               {gateInfo.name} Properties
             </DialogTitle>
             <DialogDescription>
               {gateInfo.description}
             </DialogDescription>
           </DialogHeader>
           
           {isRotationGate && (
             <div className="space-y-6 py-4">
               {/* ============================================================
                   ANGLE SLIDER
                   ============================================================
                   Allows user to adjust the rotation angle.
                   Range: 0 to 2π (0° to 360°)
                   Step: π/8 for precise common values
                   ============================================================ */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <Label>Rotation Angle</Label>
                   <span 
                     className="text-sm font-mono px-2 py-1 rounded"
                     style={{ 
                       backgroundColor: `${gateInfo.color}20`,
                       color: gateInfo.color 
                     }}
                   >
                     {formatAngle(currentAngle)}
                   </span>
                 </div>
                 
                 <Slider
                   value={[currentAngle]}
                   onValueChange={handleAngleChange}
                   min={0}
                   max={2 * Math.PI}
                   step={Math.PI / 8}
                   className="w-full"
                 />
                 
                 {/* ============================================================
                     ANGLE REFERENCE MARKS
                     ============================================================
                     Visual markers showing common angle values.
                     ============================================================ */}
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>0</span>
                   <span>π/2</span>
                   <span>π</span>
                   <span>3π/2</span>
                   <span>2π</span>
                 </div>
               </div>
               
               {/* ============================================================
                   DEGREES DISPLAY
                   ============================================================
                   Shows the angle in degrees for users who prefer that unit.
                   ============================================================ */}
               <div className="text-sm text-muted-foreground text-center">
                 = {((currentAngle * 180) / Math.PI).toFixed(1)}°
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
     </>
   );
 };