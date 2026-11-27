/**
 * Pulse Synthesis Engine
 * ======================
 * Compiles a logical quantum circuit into physical microwave pulse schedules.
 * Maps abstract gates (X, H, CX) to continuous I/Q voltage envelopes.
 */

export class PulseEngine {
  constructor(config = {}) {
    this.dt = config.dt || 1.0; // Time resolution (ns per sample)
    this.anharmonicity = config.anharmonicity || -0.33e9; // Transmon anharmonicity (Hz)
    
    // Default gate durations in ns
    this.gateTimes = {
      singleQubit: 35,
      twoQubit: 300,
      readout: 1000,
      virtualZ: 0
    };
  }

  /**
   * Compile a QuantumCircuit into a hardware pulse schedule.
   * @param {QuantumCircuit} circuit 
   * @returns {Object} Pulse schedule dictionary mapping channels to pulse events
   */
  compile(circuit) {
    const schedule = {
      channels: {}, // e.g. 'd0': [], 'd1': [], 'u0': [], 'm0': []
      totalDuration: 0
    };

    // Initialize drive (d) and measurement (m) channels for each qubit
    for (let i = 0; i < circuit.numQubits; i++) {
      schedule.channels[`d${i}`] = []; 
      schedule.channels[`m${i}`] = [];
    }

    // Keep track of the current physical time (in ns) for each qubit
    const qubitTimes = new Array(circuit.numQubits).fill(0);

    for (const op of circuit.operations) {
      if (op.gate === 'BARRIER') {
        // Synchronize all qubits involved in the barrier to the max time
        const maxTime = Math.max(...op.qubits.map(q => qubitTimes[q]));
        for (const q of op.qubits) qubitTimes[q] = maxTime;
        continue;
      }

      this._mapGateToPulses(op, schedule, qubitTimes);
    }

    schedule.totalDuration = Math.max(...qubitTimes);
    return schedule;
  }

  _mapGateToPulses(op, schedule, qubitTimes) {
    const q0 = op.qubits[0];
    const startTime = qubitTimes[q0];

    switch (op.gate) {
      // ── Single Qubit DRAG Pulses ──
      case 'X':
        this._addDragPulse(schedule, `d${q0}`, startTime, this.gateTimes.singleQubit, 1.0, op.gate);
        qubitTimes[q0] += this.gateTimes.singleQubit;
        break;
      case 'Y':
        this._addDragPulse(schedule, `d${q0}`, startTime, this.gateTimes.singleQubit, 1.0, op.gate, Math.PI / 2);
        qubitTimes[q0] += this.gateTimes.singleQubit;
        break;
      case 'H':
        // H = Z(pi/2) X(pi/2) Z(pi/2) effectively, but we'll approximate with a DRAG pulse
        this._addDragPulse(schedule, `d${q0}`, startTime, this.gateTimes.singleQubit, 0.5, op.gate);
        qubitTimes[q0] += this.gateTimes.singleQubit;
        break;
      case 'SX':
        this._addDragPulse(schedule, `d${q0}`, startTime, this.gateTimes.singleQubit, 0.5, op.gate);
        qubitTimes[q0] += this.gateTimes.singleQubit;
        break;
      case 'RX':
        const rxAmp = (op.params?.theta || Math.PI) / Math.PI;
        this._addDragPulse(schedule, `d${q0}`, startTime, this.gateTimes.singleQubit, rxAmp, op.gate);
        qubitTimes[q0] += this.gateTimes.singleQubit;
        break;
      case 'RY':
        const ryAmp = (op.params?.theta || Math.PI) / Math.PI;
        this._addDragPulse(schedule, `d${q0}`, startTime, this.gateTimes.singleQubit, ryAmp, op.gate, Math.PI / 2);
        qubitTimes[q0] += this.gateTimes.singleQubit;
        break;

      // ── Virtual-Z (Zero Duration Frame Changes) ──
      case 'Z':
        this._addFrameChange(schedule, `d${q0}`, startTime, Math.PI, op.gate);
        break;
      case 'S':
      case 'SDG':
        this._addFrameChange(schedule, `d${q0}`, startTime, op.gate === 'S' ? Math.PI/2 : -Math.PI/2, op.gate);
        break;
      case 'T':
      case 'TDG':
        this._addFrameChange(schedule, `d${q0}`, startTime, op.gate === 'T' ? Math.PI/4 : -Math.PI/4, op.gate);
        break;
      case 'RZ':
      case 'P':
        this._addFrameChange(schedule, `d${q0}`, startTime, op.params?.theta || op.params?.lambda || Math.PI, op.gate);
        break;

      // ── Two-Qubit Cross-Resonance ──
      case 'CX':
      case 'CZ':
      case 'CY': {
        const q1 = op.qubits[1];
        // Both qubits must wait for the other
        const syncTime = Math.max(qubitTimes[q0], qubitTimes[q1]);
        
        // Initialize cross-resonance (u) channel if it doesn't exist
        const uChannel = `u${q0}_${q1}`;
        if (!schedule.channels[uChannel]) schedule.channels[uChannel] = [];

        this._addFlatTopPulse(schedule, uChannel, syncTime, this.gateTimes.twoQubit, 0.8, op.gate);
        
        // Add cancellation pulses on drive channels
        this._addDragPulse(schedule, `d${q0}`, syncTime, this.gateTimes.singleQubit, 0.2, 'Cancel');
        this._addDragPulse(schedule, `d${q1}`, syncTime, this.gateTimes.singleQubit, 0.2, 'Cancel');

        qubitTimes[q0] = syncTime + this.gateTimes.twoQubit;
        qubitTimes[q1] = syncTime + this.gateTimes.twoQubit;
        break;
      }

      // ── Readout ──
      case 'MEASURE':
        this._addSquarePulse(schedule, `m${q0}`, startTime, this.gateTimes.readout, 1.0, op.gate);
        qubitTimes[q0] += this.gateTimes.readout;
        break;

      // ── Fallback ──
      default:
        // For unsupported/multi-qubit gates, just advance time
        const maxT = Math.max(...op.qubits.map(q => qubitTimes[q]));
        for (const q of op.qubits) {
          qubitTimes[q] = maxT + this.gateTimes.singleQubit;
        }
        break;
    }
  }

  /**
   * Generates a Derivative Removal by Adiabatic Gate (DRAG) pulse envelope.
   */
  _addDragPulse(schedule, channel, startTime, duration, amplitude, label, phaseOffset = 0) {
    const nSamples = Math.ceil(duration / this.dt);
    const tMid = duration / 2;
    const sigma = duration / 4; // Standard deviation

    const I = new Float32Array(nSamples);
    const Q = new Float32Array(nSamples);

    for (let i = 0; i < nSamples; i++) {
      const t = i * this.dt;
      // Gaussian envelope
      const g = amplitude * Math.exp(-Math.pow(t - tMid, 2) / (2 * Math.pow(sigma, 2)));
      // Derivative of Gaussian
      const dg = g * (-(t - tMid) / Math.pow(sigma, 2));
      
      // DRAG correction applied to Quadrature component
      const rawI = g;
      const rawQ = -dg / this.anharmonicity;

      // Apply phase offset (e.g., for Y gates where phase is pi/2)
      if (phaseOffset !== 0) {
        const cosP = Math.cos(phaseOffset);
        const sinP = Math.sin(phaseOffset);
        I[i] = rawI * cosP - rawQ * sinP;
        Q[i] = rawI * sinP + rawQ * cosP;
      } else {
        I[i] = rawI;
        Q[i] = rawQ;
      }
    }

    schedule.channels[channel].push({
      type: 'drag',
      startTime,
      duration,
      I: Array.from(I),
      Q: Array.from(Q),
      label
    });
  }

  /**
   * Adds a virtual-Z frame change (instantaneous phase shift in software).
   */
  _addFrameChange(schedule, channel, startTime, phase, label) {
    schedule.channels[channel].push({
      type: 'frameChange',
      startTime,
      duration: 0,
      phase,
      label
    });
  }

  /**
   * Flat-top Gaussian pulse (often used for cross-resonance).
   */
  _addFlatTopPulse(schedule, channel, startTime, duration, amplitude, label) {
    const nSamples = Math.ceil(duration / this.dt);
    const I = new Float32Array(nSamples);
    const Q = new Float32Array(nSamples);
    
    const rampTime = 20; // ns
    const sigma = rampTime / 3;

    for (let i = 0; i < nSamples; i++) {
      const t = i * this.dt;
      let g = amplitude;
      
      if (t < rampTime) {
        g = amplitude * Math.exp(-Math.pow(t - rampTime, 2) / (2 * Math.pow(sigma, 2)));
      } else if (t > duration - rampTime) {
        g = amplitude * Math.exp(-Math.pow(t - (duration - rampTime), 2) / (2 * Math.pow(sigma, 2)));
      }
      
      I[i] = g;
      Q[i] = 0;
    }

    schedule.channels[channel].push({
      type: 'flatTop',
      startTime,
      duration,
      I: Array.from(I),
      Q: Array.from(Q),
      label
    });
  }

  /**
   * Simple square pulse (used for measurement resonators).
   */
  _addSquarePulse(schedule, channel, startTime, duration, amplitude, label) {
    const nSamples = Math.ceil(duration / this.dt);
    const I = new Array(nSamples).fill(amplitude);
    const Q = new Array(nSamples).fill(0);

    schedule.channels[channel].push({
      type: 'square',
      startTime,
      duration,
      I,
      Q,
      label
    });
  }
}

export const pulseEngine = new PulseEngine();
