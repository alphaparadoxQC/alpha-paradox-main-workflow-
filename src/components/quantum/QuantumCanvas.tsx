/**
 * ============================================================
 * QUANTUM CANVAS COMPONENT (Refactored)
 * ============================================================
 * 
 * This component has been refactored to use a modular, DOM-based
 * architecture to support 100+ qubits with virtualization and 
 * improved drag-and-drop mechanics.
 * 
 * The actual implementation is located in the `circuit` directory:
 * - CircuitGrid.tsx (Main container & virtualization)
 * - QubitRow.tsx (DOM-based drop zones)
 * - GateLayer.tsx (Overlay for rendering gates)
 * - ClassicalRegister.tsx
 * ============================================================
 */

import React from 'react';
import { CircuitGrid } from './circuit/CircuitGrid';

export const QuantumCanvas = () => {
  return <CircuitGrid />;
};
