import { motion } from 'framer-motion';
import { GatesPalette } from './GatesPalette';
import { QuantumCanvas } from './QuantumCanvas';
import { SimulationResults } from './SimulationResults';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';

export const QuantumCircuitBuilder = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen flex flex-col bg-background overflow-hidden"
    >
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Gates Palette */}
        <GatesPalette />

        {/* Center - Circuit Canvas */}
        <QuantumCanvas />

        {/* Right Sidebar - Results */}
        <SimulationResults />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
    </motion.div>
  );
};
