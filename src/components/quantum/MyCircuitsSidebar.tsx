 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { 
   FolderOpen, 
   X, 
   Trash2, 
   Loader2, 
   Calendar, 
   Layers,
   Globe,
   Lock,
   ChevronRight,
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { useCircuits, SavedCircuit } from '@/hooks/useCircuits';
import { getGatesFromCircuit } from '@/hooks/useCircuits';
 import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 import { formatDistanceToNow } from 'date-fns';
 
 interface MyCircuitsSidebarProps {
   open: boolean;
   onClose: () => void;
   onCircuitLoaded?: (circuit: SavedCircuit) => void;
 }
 
 export const MyCircuitsSidebar = ({
   open,
   onClose,
   onCircuitLoaded,
 }: MyCircuitsSidebarProps) => {
   const { user } = useAuth();
   const { circuits, isLoading, deleteCircuit, loadCircuit } = useCircuits();
   const { gates: storeGates } = useQuantumCircuitStore();
   const [loadingCircuitId, setLoadingCircuitId] = useState<string | null>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [circuitToDelete, setCircuitToDelete] = useState<SavedCircuit | null>(null);
 
   const handleLoadCircuit = async (circuit: SavedCircuit) => {
     setLoadingCircuitId(circuit.id);
     
     const loaded = await loadCircuit(circuit.id);
     
     if (loaded) {
       // Update the store with loaded gates
       const store = useQuantumCircuitStore.getState();
       
       // Clear and load new gates
       store.clearCircuit();
       
       // Add each gate from the loaded circuit
      const loadedGates = getGatesFromCircuit(loaded);
      loadedGates.forEach(gate => {
        store.addGate(gate);
      });
       
       toast.success(`Loaded "${loaded.name}"`);
       onCircuitLoaded?.(loaded);
       onClose();
     }
     
     setLoadingCircuitId(null);
   };
 
   const handleDeleteClick = (circuit: SavedCircuit, e: React.MouseEvent) => {
     e.stopPropagation();
     setCircuitToDelete(circuit);
     setDeleteDialogOpen(true);
   };
 
   const confirmDelete = async () => {
     if (circuitToDelete) {
       await deleteCircuit(circuitToDelete.id);
       setDeleteDialogOpen(false);
       setCircuitToDelete(null);
     }
   };
 
   if (!user) return null;
 
   return (
     <>
       <AnimatePresence>
         {open && (
           <>
             {/* Backdrop */}
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
               onClick={onClose}
             />
             
             {/* Sidebar */}
             <motion.div
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 300 }}
               className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
             >
               {/* Header */}
               <div className="flex items-center justify-between p-4 border-b border-border">
                 <div className="flex items-center gap-2">
                   <FolderOpen className="w-5 h-5 text-primary" />
                   <h2 className="font-semibold">My Circuits</h2>
                 </div>
                 <Button variant="ghost" size="icon" onClick={onClose}>
                   <X className="w-4 h-4" />
                 </Button>
               </div>
 
               {/* Content */}
               <ScrollArea className="flex-1">
                 <div className="p-4 space-y-2">
                   {isLoading ? (
                     <div className="flex items-center justify-center py-8">
                       <Loader2 className="w-6 h-6 animate-spin text-primary" />
                     </div>
                   ) : circuits.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                       <p className="text-sm">No saved circuits yet</p>
                       <p className="text-xs mt-1">Save a circuit to see it here</p>
                     </div>
                   ) : (
                     circuits.map((circuit) => (
                       <motion.div
                         key={circuit.id}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="group relative"
                       >
                         <button
                           onClick={() => handleLoadCircuit(circuit)}
                           disabled={loadingCircuitId === circuit.id}
                           className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
                         >
                           <div className="flex items-start justify-between gap-2">
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <span className="font-medium truncate">
                                   {circuit.name}
                                 </span>
                                 {circuit.is_public ? (
                                   <Globe className="w-3 h-3 text-primary flex-shrink-0" />
                                 ) : (
                                   <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                 )}
                               </div>
                               {circuit.description && (
                                 <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                   {circuit.description}
                                 </p>
                               )}
                               <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                 <span className="flex items-center gap-1">
                                   <Layers className="w-3 h-3" />
                                   {circuit.qubit_count} qubits
                                 </span>
                                 <span className="flex items-center gap-1">
                                   <Calendar className="w-3 h-3" />
                                   {formatDistanceToNow(new Date(circuit.updated_at), { addSuffix: true })}
                                 </span>
                               </div>
                             </div>
                             
                             {loadingCircuitId === circuit.id ? (
                               <Loader2 className="w-4 h-4 animate-spin text-primary" />
                             ) : (
                               <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                             )}
                           </div>
                         </button>
                         
                         {/* Delete button */}
                         <Button
                           variant="ghost"
                           size="icon"
                           className="absolute right-1 bottom-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                           onClick={(e) => handleDeleteClick(circuit, e)}
                         >
                           <Trash2 className="w-3 h-3" />
                         </Button>
                       </motion.div>
                     ))
                   )}
                 </div>
               </ScrollArea>
             </motion.div>
           </>
         )}
       </AnimatePresence>
 
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Circuit</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{circuitToDelete?.name}"? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={confirmDelete}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 };