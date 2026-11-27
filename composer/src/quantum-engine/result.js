/**
 * Unified result format for all backends.
 */

export class SimulationResult {
  constructor({
    counts = {},
    statevector = null,
    probabilities = null,
    unitary = null,
    densityMatrix = null,
    blochCoordinates = null,
    metadata = {}
  } = {}) {
    this.counts = counts;
    this.statevector = statevector;
    this.probabilities = probabilities;
    this.unitary = unitary;
    this.densityMatrix = densityMatrix;
    this.blochCoordinates = blochCoordinates;
    this.metadata = {
      backend: 'unknown',
      shots: 0,
      executionTime: 0,
      numQubits: 0,
      noiseModel: null,
      timestamp: Date.now(),
      ...metadata
    };
  }

  /**
   * Get total shot count from counts dict
   */
  get totalShots() {
    return Object.values(this.counts).reduce((a, b) => a + b, 0);
  }

  /**
   * Get probabilities from counts
   */
  getProbabilitiesFromCounts() {
    const total = this.totalShots;
    if (total === 0) return {};
    const probs = {};
    for (const [key, value] of Object.entries(this.counts)) {
      probs[key] = value / total;
    }
    return probs;
  }

  /**
   * Compute fidelity relative to another result (ideal)
   * F(p,q) = (Σ √(pᵢ·qᵢ))²
   */
  fidelityWith(idealResult) {
    const p = this.getProbabilitiesFromCounts();
    const q = idealResult.getProbabilitiesFromCounts();
    const allKeys = new Set([...Object.keys(p), ...Object.keys(q)]);
    let sum = 0;
    for (const key of allKeys) {
      sum += Math.sqrt((p[key] || 0) * (q[key] || 0));
    }
    return sum * sum;
  }

  /**
   * Total Variation Distance from another result
   * TVD = ½ Σ |pᵢ - qᵢ|
   */
  tvdWith(otherResult) {
    const p = this.getProbabilitiesFromCounts();
    const q = otherResult.getProbabilitiesFromCounts();
    const allKeys = new Set([...Object.keys(p), ...Object.keys(q)]);
    let sum = 0;
    for (const key of allKeys) {
      sum += Math.abs((p[key] || 0) - (q[key] || 0));
    }
    return sum / 2;
  }

  /**
   * Serialize for storage/transmission
   */
  toJSON() {
    return {
      counts: this.counts,
      probabilities: this.probabilities,
      metadata: this.metadata
    };
  }
}
