import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { GatesPalette } from './GatesPalette';
import { QuantumCanvas } from './QuantumCanvas';
import { SimulationResults } from './SimulationResults';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { AnonymousUserBanner } from './AnonymousUserBanner';
import { QuantumAssistant } from './QuantumAssistant';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { QubitWarningBanner } from './QubitWarningBanner';
import { QasmEditor } from './QasmEditor';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export const QuantumCircuitBuilder = () => {
  const { qubitCount, gates, simulationResult, activeTemplate } = useQuantumCircuitStore();

  useEffect(() => {
    if (window.assistantContext) {
      window.assistantContext.currentPage = 'quantum-builder';
      window.assistantContext.pageData = {
        Qubits: qubitCount,
        Gates: gates.length > 0 ? gates.map((g) => g.type).join(', ') : 'None',
        'Simulation result': simulationResult ? 'Available' : 'None',
        'Selected circuit': activeTemplate ? activeTemplate.name : 'Custom',
      };
    }
  }, [qubitCount, gates, simulationResult, activeTemplate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen flex flex-col bg-background overflow-hidden"
    >
      {/* Top Toolbar */}
      <Toolbar />
      
      {/* Anonymous user banner */}
      <AnonymousUserBanner />

      {/* Qubit count warning banner */}
      <QubitWarningBanner />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Gates Palette */}
        <GatesPalette />

        {/* Center - Circuit Canvas & QASM Editor */}
        <ResizablePanelGroup direction="vertical" className="flex-1 border-x border-border">
          <ResizablePanel defaultSize={75} minSize={30}>
            <QuantumCanvas />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            <QasmEditor />
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Right Sidebar - Results */}
        <SimulationResults />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
      
      {/* AI Assistant */}
      <QuantumAssistant />
      
      {/* Keyboard shortcuts overlay */}
      <KeyboardShortcutsDialog />
    </motion.div>
  );
};
