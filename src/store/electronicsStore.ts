import { create } from 'zustand';
import { 
  CircuitComponent, 
  CircuitConnection, 
  SchematicState, 
  Command, 
  AddComponentCommand, 
  ConnectPinsCommand, 
  MoveComponentCommand, 
  RotateComponentCommand, 
  UpdatePropertyCommand, 
  DeleteComponentCommand 
} from '@/lib/electronics/commands';
import { validateCircuit, ValidationWarning } from '@/lib/electronics/validation';
import { toast } from 'sonner';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ElectronicsStore {
  // Core state
  components: CircuitComponent[];
  connections: CircuitConnection[];
  warnings: ValidationWarning[];
  
  // Command stacks
  past: SchematicState[];
  future: SchematicState[];
  
  // Interactive logs
  logs: LogEntry[];
  
  // Selection
  selectedComponentId: string | null;

  // Actions
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  clearWorkspace: () => void;
  
  // Visual/React Flow integrations
  updateComponentPosition: (id: string, x: number, y: number) => void;
  commitComponentPosition: (id: string, fromX: number, fromY: number, toX: number, toY: number) => void;
  selectComponent: (id: string | null) => void;
  addLog: (message: string, type?: LogEntry['type']) => void;
  
  // Helper checks
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const getTimestamp = () => new Date().toLocaleTimeString();

export const useElectronicsStore = create<ElectronicsStore>((set, get) => ({
  components: [],
  connections: [],
  warnings: [],
  past: [],
  future: [],
  logs: [{ timestamp: getTimestamp(), message: 'Schematic Designer engine initialized.', type: 'info' }],
  selectedComponentId: null,

  executeCommand: (command: Command) => {
    const { components, connections, past } = get();
    
    // Save current state to past stack
    const currentState: SchematicState = { components, connections };
    const newPast = [...past, JSON.parse(JSON.stringify(currentState))];

    // Execute the command to get the new state
    const nextState = command.execute({ components, connections });
    
    // Validate the new circuit
    const newWarnings = validateCircuit(nextState.components, nextState.connections);

    set({
      components: nextState.components,
      connections: nextState.connections,
      past: newPast,
      future: [], // Clear redo stack on new action
      warnings: newWarnings,
    });

    // Log the event
    get().addLog(`Executed: ${command.name} (${command.id.split('-')[0]})`, 'success');

    // Broadcast warning toasts if any new error severity warnings appeared
    const oldErrors = get().warnings.filter(w => w.severity === 'error').map(w => w.id);
    newWarnings.forEach(w => {
      if (w.severity === 'error' && !oldErrors.includes(w.id)) {
        toast.error(w.message, { duration: 5000 });
      } else if (w.severity === 'warning' && !get().warnings.some(prev => prev.id === w.id)) {
        toast.warning(w.message, { duration: 4000 });
      }
    });
  },

  undo: () => {
    const { past, future, components, connections } = get();
    if (past.length === 0) return;

    const previousState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    const currentState: SchematicState = { components, connections };
    const newFuture = [JSON.parse(JSON.stringify(currentState)), ...future];

    const newWarnings = validateCircuit(previousState.components, previousState.connections);

    set({
      components: previousState.components,
      connections: previousState.connections,
      past: newPast,
      future: newFuture,
      warnings: newWarnings,
    });

    get().addLog('Undo action performed.', 'info');
    toast('Undone last action');
  },

  redo: () => {
    const { past, future, components, connections } = get();
    if (future.length === 0) return;

    const nextState = future[0];
    const newFuture = future.slice(1);

    const currentState: SchematicState = { components, connections };
    const newPast = [...past, JSON.parse(JSON.stringify(currentState))];

    const newWarnings = validateCircuit(nextState.components, nextState.connections);

    set({
      components: nextState.components,
      connections: nextState.connections,
      past: newPast,
      future: newFuture,
      warnings: newWarnings,
    });

    get().addLog('Redo action performed.', 'info');
    toast('Redone action');
  },

  clearWorkspace: () => {
    const { components, connections, past } = get();
    if (components.length === 0 && connections.length === 0) return;

    const currentState: SchematicState = { components, connections };
    const newPast = [...past, JSON.parse(JSON.stringify(currentState))];

    set({
      components: [],
      connections: [],
      past: newPast,
      future: [],
      warnings: [],
      selectedComponentId: null,
    });

    get().addLog('Workspace cleared.', 'info');
    toast.success('Workspace cleared');
  },

  // Instant positioning update for drag operations (does not affect undo/redo until committed)
  updateComponentPosition: (id: string, x: number, y: number) => {
    set(state => ({
      components: state.components.map(c => (c.id === id ? { ...c, x, y } : c)),
    }));
  },

  // Commit a visual component drag to history
  commitComponentPosition: (id: string, fromX: number, fromY: number, toX: number, toY: number) => {
    if (fromX === toX && fromY === toY) return;

    const { past, components, connections } = get();
    const mockPrevState: SchematicState = {
      connections,
      components: components.map(c => (c.id === id ? { ...c, x: fromX, y: fromY } : c)),
    };

    set({
      past: [...past, JSON.parse(JSON.stringify(mockPrevState))],
      future: [],
    });

    get().addLog(`Moved component ${id} to (${Math.round(toX)}, ${Math.round(toY)})`, 'info');
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponentId: id });
  },

  addLog: (message: string, type: LogEntry['type'] = 'info') => {
    set(state => ({
      logs: [
        ...state.logs.slice(-99), // Cap logs at last 100 entries to prevent memory bloat
        { timestamp: getTimestamp(), message, type },
      ],
    }));
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
