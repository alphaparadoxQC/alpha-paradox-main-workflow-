import { QuantumGate } from '../../simulator';

export const generateBellState = (): QuantumGate[] => {
  return [
    { id: `bell-H`, type: 'H', qubit: 0, position: 0 },
    { id: `bell-CX`, type: 'CNOT', qubit: 0, targetQubit: 1, position: 1 },
  ];
};

export const generateGHZState = (qubitCount: number): QuantumGate[] => {
  if (qubitCount < 3) throw new Error("GHZ state requires at least 3 qubits.");
  
  const gates: QuantumGate[] = [
    { id: `ghz-H-0`, type: 'H', qubit: 0, position: 0 }
  ];
  
  for (let i = 0; i < qubitCount - 1; i++) {
    gates.push({
      id: `ghz-CX-${i}`,
      type: 'CNOT',
      qubit: i,
      targetQubit: i + 1,
      position: i + 1
    });
  }
  
  return gates;
};
