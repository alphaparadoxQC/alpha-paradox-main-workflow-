import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Cpu, Cloud, Zap, Clock, DollarSign, Check, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { BRANDING } from '@/config/branding';

export type BackendType = 
  | 'local'
  | 'ibm-quantum'
  | 'aws-braket-sv1'
  | 'aws-braket-rigetti'
  | 'aws-braket-ionq'
  | 'origin-quantum'
  | 'open-quantum';

interface BackendOption {
  id: BackendType;
  name: string;
  description: string;
  provider: string;
  icon: React.ReactNode;
  estimatedCost: string;
  estimatedWait: string;
  isHardware: boolean;
  isAvailable: boolean;
}

const BACKEND_OPTIONS: BackendOption[] = [
  {
    id: 'local',
    name: 'Local Simulator',
    description: 'JavaScript-based quantum simulation',
    provider: 'Browser',
    icon: <Cpu className="w-4 h-4" />,
    estimatedCost: 'Free',
    estimatedWait: 'Instant',
    isHardware: false,
    isAvailable: true,
  },
  {
    id: 'ibm-quantum',
    name: 'IBM Quantum',
    description: 'Real superconducting quantum hardware',
    provider: 'IBM',
    icon: <Atom className="w-4 h-4" />,
    estimatedCost: 'Free tier / Pay-per-use',
    estimatedWait: '1-30 min queue',
    isHardware: true,
    isAvailable: true,
  },
  {
    id: 'aws-braket-sv1',
    name: 'AWS Braket SV1',
    description: 'Cloud-based state vector simulator',
    provider: 'Amazon',
    icon: <Cloud className="w-4 h-4" />,
    estimatedCost: '$0.075/min',
    estimatedWait: '< 1 min',
    isHardware: false,
    isAvailable: true,
  },
  {
    id: 'aws-braket-rigetti',
    name: 'AWS Braket Rigetti',
    description: 'Superconducting quantum processor',
    provider: 'Rigetti',
    icon: <Zap className="w-4 h-4" />,
    estimatedCost: '$0.30/task + $0.00035/shot',
    estimatedWait: '5-60 min queue',
    isHardware: true,
    isAvailable: true,
  },
  {
    id: 'aws-braket-ionq',
    name: 'AWS Braket IonQ',
    description: 'Trapped ion quantum computer',
    provider: 'IonQ',
    icon: <Zap className="w-4 h-4" />,
    estimatedCost: '$0.30/task + $0.01/shot',
    estimatedWait: '5-120 min queue',
    isHardware: true,
    isAvailable: true,
  },
  {
    id: 'origin-quantum',
    name: 'Origin Quantum',
    description: 'QPanda3 superconducting processor (China)',
    provider: 'OriginQ',
    icon: <Atom className="w-4 h-4" />,
    estimatedCost: 'Free tier available',
    estimatedWait: '2-30 min queue',
    isHardware: true,
    isAvailable: true,
  },
  {
    id: 'open-quantum',
    name: 'Open Quantum',
    description: 'QPU access — IonQ, Rigetti, IQM, AQT',
    provider: 'OpenQuantum',
    icon: <Zap className="w-4 h-4" />,
    estimatedCost: 'Free tier available',
    estimatedWait: '1-15 min queue',
    isHardware: true,
    isAvailable: true,
  },
];

const STORAGE_KEY = 'quantum-preferred-backend';

interface BackendSelectorProps {
  onBackendChange?: (backend: BackendType) => void;
}

export function BackendSelector({ onBackendChange }: BackendSelectorProps) {
  const [selectedBackend, setSelectedBackend] = useState<BackendType>(() => {
    // Load saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as BackendType) || 'local';
  });

  const currentBackend = BACKEND_OPTIONS.find(b => b.id === selectedBackend) || BACKEND_OPTIONS[0];

  useEffect(() => {
    // Save preference
    localStorage.setItem(STORAGE_KEY, selectedBackend);
    onBackendChange?.(selectedBackend);
  }, [selectedBackend, onBackendChange]);

  const handleSelect = (backendId: BackendType) => {
    setSelectedBackend(backendId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            variant="outline" 
            className="border-primary/30 hover:border-primary/50 min-w-[160px] justify-between"
          >
            <div className="flex items-center gap-2">
              {currentBackend.icon}
              <span className="hidden sm:inline">{currentBackend.name}</span>
              <span className="sm:hidden">Backend</span>
            </div>
            <div className="flex items-center gap-1.5">
              {currentBackend.isHardware && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-accent/20 text-accent">
                  HW
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </div>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-80 bg-popover border border-border z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
          <Cpu className="w-3 h-3" />
          Select Execution Backend
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Simulators Section */}
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-1">
          Simulators
        </DropdownMenuLabel>
        {BACKEND_OPTIONS.filter(b => !b.isHardware).map((backend) => (
          <BackendMenuItem 
            key={backend.id}
            backend={backend}
            isSelected={selectedBackend === backend.id}
            onSelect={handleSelect}
          />
        ))}

        <DropdownMenuSeparator />
        
        {/* Hardware Section */}
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-1">
          Quantum Hardware
        </DropdownMenuLabel>
        {BACKEND_OPTIONS.filter(b => b.isHardware).map((backend) => (
          <BackendMenuItem 
            key={backend.id}
            backend={backend}
            isSelected={selectedBackend === backend.id}
            onSelect={handleSelect}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface BackendMenuItemProps {
  backend: BackendOption;
  isSelected: boolean;
  onSelect: (id: BackendType) => void;
}

function BackendMenuItem({ backend, isSelected, onSelect }: BackendMenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={() => onSelect(backend.id)}
      className="flex flex-col items-start py-2.5 px-3 cursor-pointer focus:bg-accent/10"
      disabled={!backend.isAvailable}
    >
      <div className="flex items-center gap-2 w-full">
        <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {backend.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground text-sm">{backend.name}</span>
            {isSelected && (
              <Check className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <span className="text-[11px] text-muted-foreground line-clamp-1">
            {backend.description}
          </span>
        </div>
        {backend.isHardware && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-accent/50 text-accent shrink-0">
            Real HW
          </Badge>
        )}
      </div>
      
      {/* Cost and Wait Time */}
      <div className="flex items-center gap-4 mt-1.5 ml-9 text-[10px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          <span>{backend.estimatedCost}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{backend.estimatedWait}</span>
        </div>
      </div>
    </DropdownMenuItem>
  );
}

// Export for use in other components
export { BACKEND_OPTIONS };
export function getBackendById(id: BackendType): BackendOption | undefined {
  return BACKEND_OPTIONS.find(b => b.id === id);
}
