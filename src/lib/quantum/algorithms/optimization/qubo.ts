import { PauliTerm } from '../../../chemistry/pauliHamiltonian';

/**
 * QUBO to Ising Mapping
 * 
 * Maps a Quadratic Unconstrained Binary Optimization (QUBO) matrix Q
 * into an Ising Hamiltonian suitable for QAOA or Annealing.
 * 
 * QUBO formulation: min x^T Q x, where x_i in {0, 1}
 * Ising formulation: min sum J_ij s_i s_j + sum h_i s_i, where s_i in {-1, 1}
 * Mapping: x_i = (1 - Z_i) / 2
 */
export const mapQuboToIsing = (Q: number[][]): PauliTerm[] => {
  const n = Q.length;
  const terms: PauliTerm[] = [];
  
  let constantOffset = 0;
  const h = new Array(n).fill(0);
  const J = Array.from({ length: n }, () => new Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const q_ij = Q[i][j];
      if (q_ij === 0) continue;
      
      // x_i x_j = 1/4 (1 - Z_i - Z_j + Z_i Z_j)
      if (i === j) {
        // Linear term x_i = 1/2 (1 - Z_i)
        constantOffset += 0.5 * q_ij;
        h[i] -= 0.5 * q_ij;
      } else {
        // Quadratic term
        constantOffset += 0.25 * q_ij;
        h[i] -= 0.25 * q_ij;
        h[j] -= 0.25 * q_ij;
        // J is symmetric, so we just add to J[min][max]
        const iMin = Math.min(i, j);
        const iMax = Math.max(i, j);
        J[iMin][iMax] += 0.25 * q_ij;
      }
    }
  }
  
  // Convert h and J to PauliTerms
  for (let i = 0; i < n; i++) {
    if (Math.abs(h[i]) > 1e-10) {
      let pauli = Array(n).fill('I');
      pauli[i] = 'Z';
      terms.push({ pauliString: pauli.join(''), coefficient: h[i] });
    }
    
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(J[i][j]) > 1e-10) {
        let pauli = Array(n).fill('I');
        pauli[i] = 'Z';
        pauli[j] = 'Z';
        terms.push({ pauliString: pauli.join(''), coefficient: J[i][j] });
      }
    }
  }
  
  // The constant offset is not represented as a Pauli operator that acts on the state,
  // but it's important for final cost evaluation. We can represent it as all 'I's.
  if (Math.abs(constantOffset) > 1e-10) {
    terms.push({ pauliString: 'I'.repeat(n), coefficient: constantOffset });
  }
  
  return terms;
};
