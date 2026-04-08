import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Trash2, Cpu, Zap, ChevronDown, FileCode, Undo2, Redo2, Save, FolderOpen, Globe, GitFork, History, Menu, Wand2, Blocks } from 'lucide-react';
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
import { NaturalLanguageBuilder } from './NaturalLanguageBuilder';
import { VisualFlowBuilder } from './VisualFlowBuilder';
import { BackendSelector, BackendType, getBackendById } from './BackendSelector';
import { useAuth } from '@/hooks/useAuth';
import { useCircuits, SavedCircuit } from '@/hooks/useCircuits';
import { BRANDING } from '@/config/branding';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCircuit, setCurrentCircuit] = useState<SavedCircuit | null>(null);
  const [forkedFrom, setForkedFrom] = useState<ForkedFromInfo | null>(null);
  const [selectedBackend, setSelectedBackend] = useState<BackendType>('local');

  const handleBackendChange = useCallback((backend: BackendType) => {
    setSelectedBackend(backend);
    const backendInfo = getBackendById(backend);
    if (backendInfo && backend !== 'local') {
      toast.info(`Backend: ${backendInfo.name}`, {
        description: `${backendInfo.estimatedCost} • ${backendInfo.estimatedWait}`,
        duration: 3000,
      });
    }
  }, []);
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
            {BRANDING.platformName}
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
      <div className="flex items-center gap-1 md:gap-2 overflow-x-auto">
         {/* Undo/Redo - always visible */}
         <div className="flex items-center gap-1 shrink-0">
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
         </div>

        {/* Templates Dropdown - always visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={isMobile ? "icon" : "default"} className="border-primary/30 hover:border-primary/50 shrink-0">
              <FileCode className="w-4 h-4 md:mr-2 text-primary" />
              {!isMobile && <span>Templates</span>}
              {!isMobile && <ChevronDown className="w-3 h-3 ml-2 opacity-60" />}
            </Button>
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

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={isMobile ? "icon" : "default"} className="border-secondary/30 hover:border-secondary/50 shrink-0">
              <Menu className="w-4 h-4 md:mr-2 text-secondary" />
              {!isMobile && <span>More</span>}
              {!isMobile && <ChevronDown className="w-3 h-3 ml-2 opacity-60" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Circuit
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleSaveClick} disabled={gates.length === 0}>
              <Save className="w-4 h-4 mr-2 text-primary" />
              Save Circuit
            </DropdownMenuItem>
            {user && (
              <DropdownMenuItem onClick={() => setSidebarOpen(true)}>
                <FolderOpen className="w-4 h-4 mr-2 text-secondary" />
                My Circuits
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={clearCircuit}
              disabled={gates.length === 0}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Circuit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              AI Builders
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <NaturalLanguageBuilder />
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <VisualFlowBuilder />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Navigation
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/gallery" className="flex items-center gap-2 w-full">
                <Globe className="w-4 h-4 text-accent" />
                Gallery
              </Link>
            </DropdownMenuItem>
            {user && (
              <DropdownMenuItem asChild>
                <Link to="/jobs" className="flex items-center gap-2 w-full">
                  <History className="w-4 h-4 text-accent" />
                  Jobs
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Backend Selector */}
        <BackendSelector onBackendChange={handleBackendChange} />

        {/* Simulate Button - always visible */}
        <Button
          onClick={simulate}
          disabled={isSimulating || gates.length === 0}
          size={isMobile ? "icon" : "default"}
          className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shrink-0"
        >
          {isSimulating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4 md:mr-2" />
              </motion.div>
              {!isMobile && <span>Simulating...</span>}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 md:mr-2" />
              {!isMobile && <span>Simulate</span>}
            </>
          )}
          
          {isSimulating && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </Button>

        {/* Hardware Panel - shows Run on Hardware when hardware backend selected */}
        <HardwarePanel globalBackend={selectedBackend} />
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
