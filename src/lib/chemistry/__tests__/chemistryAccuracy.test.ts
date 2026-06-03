/**
 * Chemistry Accuracy Validation Tests
 * 
 * Validates that predefined molecules produce correct energy classifications
 * and that heuristic fallback is properly flagged.
 */
import { describe, it, expect } from 'vitest';
import { calculateEnergy, generateParameterizedAnsatz, initializeParameters, getParameterCount } from '../vqeOptimizer';
import { getMoleculeById, MOLECULES } from '../moleculeData';
import { getHamiltonian } from '../pauliHamiltonian';

describe('Chemistry Accuracy Validation', () => {

  // ── Hamiltonian Registry Validation ──────────────────────────────────────

  it('H₂ has a registered Hamiltonian with correct metadata', () => {
    const h = getHamiltonian('h2');
    expect(h).toBeDefined();
    expect(h!.numQubits).toBe(4);
    expect(h!.mapping).toBe('jordan_wigner');
    expect(h!.basis).toBe('STO-3G');
    expect(h!.nuclearRepulsion).toBeCloseTo(0.7151, 3);
    expect(h!.fciEnergy).toBeCloseTo(-1.1373, 3);
    expect(h!.terms.length).toBeGreaterThan(5);
  });

  it('LiH has a registered Hamiltonian', () => {
    const h = getHamiltonian('lih');
    expect(h).toBeDefined();
    expect(h!.numQubits).toBe(6);
    expect(h!.fciEnergy).toBeCloseTo(-7.9792, 3);
  });

  it('HeH⁺ has a registered Hamiltonian', () => {
    const h = getHamiltonian('heh_plus');
    expect(h).toBeDefined();
    expect(h!.numQubits).toBe(4);
    expect(h!.fciEnergy).toBeCloseTo(-2.8627, 3);
  });

  it('H₂Bk does NOT have a registered Hamiltonian', () => {
    const h = getHamiltonian('h2bk');
    expect(h).toBeUndefined();
  });

  // ── Energy Source Classification ─────────────────────────────────────────

  it('H₂ VQE uses precomputed-hamiltonian source', () => {
    const molecule = getMoleculeById('h2')!;
    const params = initializeParameters(getParameterCount(molecule));
    const gates = generateParameterizedAnsatz(molecule, params);
    const result = calculateEnergy(gates, molecule.qubitsRequired, molecule);
    
    expect(result.source).toBe('precomputed-hamiltonian');
    // Energy should be a real number in a plausible range
    expect(result.energy).toBeLessThan(0);
    expect(result.energy).toBeGreaterThan(-5);
  });

  it('Custom/unknown molecule uses heuristic-fallback source', () => {
    // Create a fake molecule with no registered Hamiltonian
    const fakeMolecule = {
      ...getMoleculeById('h2')!,
      id: 'fake-molecule-xyz',
      qubitsRequired: 4,
      electrons: 2,
      expectedGroundStateEnergy: -1.0,
    };
    const params = initializeParameters(getParameterCount(fakeMolecule));
    const gates = generateParameterizedAnsatz(fakeMolecule, params);
    const result = calculateEnergy(gates, fakeMolecule.qubitsRequired, fakeMolecule);
    
    expect(result.source).toBe('heuristic-fallback');
  });

  // ── Active Space & Metadata ──────────────────────────────────────────────

  it('All predefined molecules have charge and multiplicity', () => {
    for (const mol of MOLECULES) {
      expect(mol.charge).toBeDefined();
      expect(mol.multiplicity).toBeDefined();
    }
  });

  it('All predefined molecules have active space info', () => {
    for (const mol of MOLECULES) {
      expect(mol.activeSpace).toBeDefined();
      expect(mol.activeSpace!.activeElectrons).toBeGreaterThan(0);
      expect(mol.activeSpace!.activeOrbitals).toBeGreaterThan(0);
    }
  });

  it('H₂Bk is marked as estimated energy', () => {
    const mol = getMoleculeById('h2bk')!;
    expect(mol.isEnergyEstimated).toBe(true);
  });

  it('H₂ is NOT marked as estimated energy', () => {
    const mol = getMoleculeById('h2')!;
    expect(mol.isEnergyEstimated).toBeFalsy();
  });

  // ── Nuclear Repulsion Sanity Check ───────────────────────────────────────

  it('H₂ identity term includes nuclear repulsion contribution', () => {
    const h = getHamiltonian('h2')!;
    const identityTerm = h.terms.find(t => t.pauliString.replace(/I/g, '').length === 0);
    expect(identityTerm).toBeDefined();
    // The identity coefficient should be negative and include nuclear repulsion
    // For H₂: nuclear_repulsion = 0.7151, identity coefficient = -0.8105
    // Total electronic identity offset ≈ -0.8105, which bakes in nuclear repulsion
    expect(identityTerm!.coefficient).toBeLessThan(0);
  });
});
