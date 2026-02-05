import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Trash2, Cpu, Zap, ChevronDown, FileCode, Undo2, Redo2, Save, FolderOpen, Globe, GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { CIRCUIT_TEMPLATES } from '@/lib/quantum/templates';
import { toast } from 'sonner';
import { UserMenu } from './UserMenu';
import { SaveCircuitDialog } from './SaveCircuitDialog';
import { MyCircuitsSidebar } from './MyCircuitsSidebar';
import { HardwarePanel } from './HardwarePanel';
import { useAuth } from '@/hooks/useAuth';
import { useCircuits, SavedCircuit } from '@/hooks/useCircuits';
 
 interface ForkedFromInfo {
   id: string;
   name: string;
 }

export const Toolbar = () => {
   /**
    * ============================================================
    * STORE CONNECTIONS
    * ============================================================
    * We pull in additional actions for undo/redo functionality.
    * canUndo/canRedo are functions that check history availability.
    * ============================================================
    */
   const { 
     simulate, 
     clearCircuit, 
     isSimulating, 
     gates, 
     loadTemplate, 
     activeTemplate,
     undo,
     redo,
     canUndo,
     canRedo,
      setGates,
      setQubitCount,
   } = useQuantumCircuitStore();

  const { user } = useAuth();
  const { saveCircuit } = useCircuits();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCircuit, setCurrentCircuit] = useState<SavedCircuit | null>(null);
   const [forkedFrom, setForkedFrom] = useState<ForkedFromInfo | null>(null);

  // Auto-save draft every 30 seconds
  const lastAutoSaveRef = useRef<string>('');
 
   // Check for circuit loaded from gallery
   useEffect(() => {
     const loadedCircuit = sessionStorage.getItem('loadCircuit');
     if (loadedCircuit) {
       try {
         const { gates: loadedGates, qubitCount, name, isCopy, forkedFrom: forkId, forkedFromName } = JSON.parse(loadedCircuit);
         setGates(loadedGates);
         if (qubitCount) setQubitCount(qubitCount);
         sessionStorage.removeItem('loadCircuit');
         
         // Track fork origin
         if (forkId && forkedFromName) {
           setForkedFrom({ id: forkId, name: forkedFromName });
         }
         
         toast.success(`Loaded: ${name}`, {
           description: isCopy ? `Forked from "${forkedFromName}" - feel free to modify!` : undefined,
           duration: 3000,
         });
       } catch (e) {
         console.error('Failed to load circuit from gallery:', e);
       }
     }
   }, [setGates, setQubitCount]);
 
   // Keyboard shortcuts
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       // Ctrl/Cmd + S = Save
       if ((e.ctrlKey || e.metaKey) && e.key === 's') {
         e.preventDefault();
         if (user && gates.length > 0) {
           handleSaveClick();
         }
       }
       
       // Ctrl/Cmd + O = Open My Circuits
       if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
         e.preventDefault();
         if (user) {
           setSidebarOpen(true);
         }
       }
       
       // Ctrl/Cmd + Z = Undo
       if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
         e.preventDefault();
         if (canUndo()) {
           undo();
         }
       }
       
       // Ctrl/Cmd + Shift + Z = Redo
       if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
         e.preventDefault();
         if (canRedo()) {
           redo();
         }
       }
       
       // Ctrl/Cmd + Y = Redo (alternative)
       if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
         e.preventDefault();
         if (canRedo()) {
           redo();
         }
       }
     };
 
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [user, gates, undo, redo, canUndo, canRedo]);

  useEffect(() => {
    if (!user || gates.length === 0) return;

    const autoSaveInterval = setInterval(async () => {
      const currentGatesJson = JSON.stringify(gates);

      // Only auto-save if there are changes
      if (currentGatesJson !== lastAutoSaveRef.current && gates.length > 0) {
        lastAutoSaveRef.current = currentGatesJson;

        // Save as draft (auto-save)
        const draftName = currentCircuit?.name || `Draft - ${new Date().toLocaleString()}`;
        const result = await saveCircuit(
          draftName,
          'Auto-saved draft',
          gates,
          5,
          false,
          currentCircuit?.id
        );

        if (result) {
          setCurrentCircuit(result);
          toast.success('Auto-saved!', {
            description: 'Your circuit has been saved automatically.',
            duration: 2000,
          });
        }
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [user, gates, currentCircuit, saveCircuit]);

  const handleCircuitLoaded = (circuit: SavedCircuit) => {
    setCurrentCircuit(circuit);
    lastAutoSaveRef.current = JSON.stringify(circuit.circuit_data);
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = CIRCUIT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      loadTemplate(template);
      toast.success(`Loaded: ${template.name}`, {
        description: template.description,
        duration: 4000,
      });
    }
  };

  const handleSaveClick = () => {
    if (!user) {
      toast.error('Please sign in to save circuits');
      return;
    }
    setSaveDialogOpen(true);
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-14 bg-card border-b border-border flex items-center justify-between px-4"
    >
      {/* Left side - Logo/Title */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center"
        >
          <Cpu className="w-4 h-4 text-background" />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Quantum Workload
          </h1>
          <p className="text-[10px] text-muted-foreground -mt-0.5">
            {forkedFrom ? (
              <span className="flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                Forked from {forkedFrom.name}
              </span>
            ) : (
              'Circuit Builder'
            )}
          </p>
        </div>
      </div>

      {/* Center - Actions */}
      <div className="flex items-center gap-2">
         {/* ============================================================
             UNDO/REDO BUTTONS
             ============================================================
             These buttons navigate through the circuit history.
             - Undo: Reverts to the previous circuit state
             - Redo: Re-applies a previously undone change
             
             Buttons are disabled when there's no history in that direction.
             Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Shift+Z (Redo)
             ============================================================ */}
         <div className="flex items-center gap-1 mr-2">
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
             <Button
               variant="ghost"
               size="icon"
               onClick={undo}
               disabled={!canUndo()}
               className="h-8 w-8"
               title="Undo (Ctrl+Z)"
             >
               <Undo2 className="w-4 h-4" />
             </Button>
           </motion.div>
           
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
             <Button
               variant="ghost"
               size="icon"
               onClick={redo}
               disabled={!canRedo()}
               className="h-8 w-8"
               title="Redo (Ctrl+Shift+Z)"
             >
               <Redo2 className="w-4 h-4" />
             </Button>
           </motion.div>
         </div>
 
        {/* Templates Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="border-primary/30 hover:border-primary/50">
                <FileCode className="w-4 h-4 mr-2 text-primary" />
                Templates
                <ChevronDown className="w-3 h-3 ml-2 opacity-60" />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-72">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Pre-built Quantum Circuits
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CIRCUIT_TEMPLATES.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleLoadTemplate(template.id)}
                className="flex flex-col items-start py-2 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium text-foreground">{template.name}</span>
                  {activeTemplate?.id === template.id && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {template.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={handleSaveClick}
            disabled={gates.length === 0}
            className="border-primary/30 hover:border-primary/50"
          >
            <Save className="w-4 h-4 mr-2 text-primary" />
            Save
          </Button>
        </motion.div>

        {/* My Circuits Button */}
        {user && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={() => setSidebarOpen(true)}
              className="border-secondary/30 hover:border-secondary/50"
            >
              <FolderOpen className="w-4 h-4 mr-2 text-secondary" />
              My Circuits
            </Button>
          </motion.div>
        )}

         {/* Gallery Link */}
         <Link to="/gallery">
           <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
             <Button
               variant="outline"
               className="border-accent/30 hover:border-accent/50"
             >
               <Globe className="w-4 h-4 mr-2 text-accent" />
               Gallery
             </Button>
           </motion.div>
         </Link>
 
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={simulate}
            disabled={isSimulating || gates.length === 0}
            className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
          >
            {isSimulating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                </motion.div>
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Simulate
              </>
            )}
            
            {/* Animated background */}
            {isSimulating && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            )}
          </Button>
        </motion.div>

        {/* IBM Quantum Hardware Panel */}
        <HardwarePanel />

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={clearCircuit}
            disabled={gates.length === 0}
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>
      </div>

      {/* Right side - Status indicator */}
      <div className="flex items-center gap-2">
        <UserMenu />
        <div className="h-6 w-px bg-border mx-1" />
        <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-quantum-orange animate-pulse' : 'bg-quantum-green'}`} />
        <span className="text-xs text-muted-foreground">
          {isSimulating ? 'Processing' : 'Ready'}
        </span>
      </div>
    </motion.div>

      {/* Dialogs and Sidebars */}
      <SaveCircuitDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        existingCircuit={currentCircuit}
        forkedFromId={forkedFrom?.id}
      />

      <MyCircuitsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCircuitLoaded={handleCircuitLoaded}
      />
    </>
  );
};
