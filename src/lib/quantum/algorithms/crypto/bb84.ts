import { QuantumGate } from '../../simulator';

export interface BB84Config {
  bits: number;
  aliceBits: number[];       // array of 0 or 1
  aliceBases: ('Z' | 'X')[]; // 'Z' = computational, 'X' = Hadamard
  bobBases: ('Z' | 'X')[];   // 'Z' = computational, 'X' = Hadamard
  eavesdropper?: boolean;
}

export const generateBB84Protocol = (config: BB84Config): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  const n = config.bits;
  let pos = 0;
  
  for (let i = 0; i < n; i++) {
    // 1. Alice prepares state
    if (config.aliceBits[i] === 1) {
      gates.push({ id: `bb84-A-X-${i}`, type: 'X', qubit: i, position: pos });
    }
    pos++;
    
    // Convert to X basis if Alice chose 'X'
    if (config.aliceBases[i] === 'X') {
      gates.push({ id: `bb84-A-H-${i}`, type: 'H', qubit: i, position: pos });
    }
    pos++;
    
    // 2. Eve intercepts (optional)
    if (config.eavesdropper) {
      // Eve measures in a random basis (for simplicity, let's say Eve always measures in Z)
      // This collapses the state.
      gates.push({ id: `bb84-E-M-${i}`, type: 'M', qubit: i, position: pos++ });
    }
    
    // 3. Bob measures in his chosen basis
    if (config.bobBases[i] === 'X') {
      // Rotate back to Z basis for measurement
      gates.push({ id: `bb84-B-H-${i}`, type: 'H', qubit: i, position: pos });
    }
    pos++;
    
    gates.push({ id: `bb84-B-M-${i}`, type: 'M', qubit: i, position: pos });
    pos++;
  }
  
  return gates;
};
