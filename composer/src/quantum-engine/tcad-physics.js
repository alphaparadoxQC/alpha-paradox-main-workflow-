/**
 * Silicon TCAD & Quantum Electrodynamics (cQED) Physics Engine
 * =============================================================
 * Provides rigorous, first-principles electrostatics and transmon
 * Hamiltonian derivations for superconducting quantum circuits:
 *
 * 1. Conformal Mapping Electrostatics (Maxwell partial capacitance matrix)
 * 2. Charging Energy: Ec = e² / (2·C_Σ)
 * 3. Josephson Electrodynamics: Ej = Φ₀² / (4π²·L_J) = Ic·Φ₀ / 2π
 * 4. Transmon Spectrum (Koch et al. 2007 perturbation theory):
 *      ℏω₀₁ = √(8·Ec·Ej) - Ec - Ec² / (4·√(8·Ec·Ej))
 *      α = ω₁₂ - ω₀₁ ≈ -Ec·(1 + (3/8)·√(2·Ec/Ej))
 * 5. Zero-Point Fluctuations (ZPF):
 *      φ_zpf = (2·Ec / Ej)^(1/4)
 *      n_zpf = (Ej / 32·Ec)^(1/4)
 *      Z_char = √(L_J / C_Σ)
 * 6. Charge-Noise Dispersion & Dephasing Immunity:
 *      ε₀₁ ≈ 32·Ec·√(2/π)·(Ej / 2Ec)^(5/4)·exp(-√(8·Ej/Ec))
 * 7. Dispersive Cavity Coupling & Readout Shift:
 *      g = (ω_r / 2) · (Cc / √(C_Σ·Cr))
 *      χ = g²·α / (Δ·(Δ + α))
 */

// ─── Physical Constants (CODATA 2018 SI values) ──────────────────────────────
export const ELECTRON_CHARGE = 1.602176634e-19;       // C
export const PLANCK_CONSTANT = 6.62607015e-34;        // J·s
export const PLANCK_REDUCED = 1.054571817e-34;        // J·s
export const FLUX_QUANTUM = 2.067833848e-15;          // Wb (h / 2e)
export const VACUUM_PERMITTIVITY = 8.854187817e-12;   // F/m (ε₀)
export const SILICON_EPS_R = 11.7;                    // High-resistivity Float-Zone Silicon
export const SAPPHIRE_EPS_R = 10.0;                   // C-plane Sapphire (Al2O3)

// ─── Special Mathematical Functions ──────────────────────────────────────────

/**
 * Complete Elliptic Integral of the First Kind K(k)
 * Evaluated via the Arithmetic-Geometric Mean (AGM) algorithm.
 */
export function ellipticK(k) {
  if (k <= 0) return Math.PI / 2;
  if (k >= 1) return 20; // Bound near asymptote k -> 1
  let a = 1.0;
  let b = Math.sqrt(Math.max(1e-15, 1.0 - k * k));
  let c = k;
  let iter = 0;
  while (c > 1e-15 && iter++ < 25) {
    const aNext = 0.5 * (a + b);
    const bNext = Math.sqrt(a * b);
    c = 0.5 * (a - b);
    a = aNext;
    b = bNext;
  }
  return (0.5 * Math.PI) / a;
}

// ─── Core Transmon TCAD Physics Solver ────────────────────────────────────────

/**
 * Compute the full physical TCAD parameters for a planar transmon from its
 * lithography layout geometry, substrate dielectric, and Josephson junction.
 *
 * @param {Object} params
 * @param {number} [params.padWidth_um=440] - Transmon capacitor pad width (µm)
 * @param {number} [params.padHeight_um=290] - Transmon capacitor pad height (µm)
 * @param {number} [params.padGap_um=28] - Trench gap to surrounding coplanar ground plane (µm)
 * @param {number} [params.inductance_nH=11.5] - Josephson junction inductance L_J (nH)
 * @param {number} [params.epsR=11.7] - Substrate relative permittivity (11.7 Si, 10.0 Sapphire)
 * @param {number} [params.resonator_freq_GHz=6.5] - Coupled readout resonator frequency (GHz)
 * @param {number} [params.coupling_cap_fF=4.5] - Qubit-to-resonator coupling capacitance (fF)
 * @returns {Object} Comprehensive physical and Hamiltonian parameters
 */
export function calculateTransmonTCAD({
  padWidth_um = 440,
  padHeight_um = 290,
  padGap_um = 28,
  inductance_nH = 11.5,
  epsR = 11.7,
  resonator_freq_GHz = 6.5,
  coupling_cap_fF = 4.5
} = {}) {
  const e = ELECTRON_CHARGE;
  const h = PLANCK_CONSTANT;
  const phi0 = FLUX_QUANTUM;
  const eps0 = VACUUM_PERMITTIVITY;
  const epsEff = (epsR + 1) / 2; // Effective half-space dielectric constant

  const w = Math.max(50, padWidth_um) * 1e-6;
  const h_pad = Math.max(50, padHeight_um) * 1e-6;
  const g = Math.max(4, padGap_um) * 1e-6;
  const L_J = Math.max(0.5, inductance_nH) * 1e-9;

  // 1. Conformal Mapping Electrostatics
  // Coplanar pad-to-pad coupling (internal capacitance between the two transmon pads)
  const k1 = g / (g + 2 * w);
  const k1_prime = Math.sqrt(Math.max(1e-12, 1 - k1 * k1));
  const K1 = ellipticK(k1);
  const K1p = ellipticK(k1_prime);
  const C_pad_pad = eps0 * epsEff * (K1 / K1p) * h_pad;

  // Pad to ground pocket coplanar boundary
  const k2 = w / (w + 2 * g);
  const k2_prime = Math.sqrt(Math.max(1e-12, 1 - k2 * k2));
  const K2 = ellipticK(k2);
  const K2p = ellipticK(k2_prime);
  const C_pad_gnd = 2 * eps0 * epsEff * (K2 / K2p) * (w + h_pad);

  // Intrinsic Al/AlOx/Al Josephson junction self-capacitance (~1.8 - 2.2 fF for 100nm x 100nm)
  const C_J = 2.0e-15;

  // Total island capacitance: C_Σ = C_pad_pad + 0.5 · C_pad_gnd + C_J
  const C_sigma = C_pad_pad + 0.5 * C_pad_gnd + C_J;

  // 2. Charging Energy: Ec = e² / (2 · C_Σ)
  const Ec_J = Math.pow(e, 2) / (2 * C_sigma);
  const Ec_MHz = (Ec_J / h) / 1e6;

  // 3. Josephson Coupling Energy: Ej = Φ₀² / (4π² · L_J)
  const Ej_J = Math.pow(phi0, 2) / (4 * Math.pow(Math.PI, 2) * L_J);
  const Ej_MHz = (Ej_J / h) / 1e6;
  const Ej_GHz = Ej_MHz / 1000;

  // Junction critical current: Ic = Φ₀ / (2π · L_J)
  const Ic_A = phi0 / (2 * Math.PI * L_J);
  const Ic_nA = Ic_A * 1e9;

  // Dimensionless transmon parameter ratio
  const ej_ec_ratio = Ej_MHz / Ec_MHz;

  // 4. Koch et al. Transmon Transition Frequency
  // ℏω₀₁ = √(8·Ec·Ej) - Ec - Ec² / (4·√(8·Ec·Ej))
  const sqrt8EcEj = Math.sqrt(8 * Ec_MHz * Ej_MHz);
  const secondOrderCorr = Math.pow(Ec_MHz, 2) / (4 * sqrt8EcEj);
  const omega01_MHz = sqrt8EcEj - Ec_MHz - secondOrderCorr;
  const omega01_GHz = omega01_MHz / 1000;

  // 5. Anharmonicity: α = ω₁₂ - ω₀₁ ≈ -Ec · (1 + (3/8)·√(2/(Ej/Ec)))
  const alphaCorr = 1 + (3 / 8) * Math.sqrt(2 / ej_ec_ratio);
  const alpha_MHz = -Ec_MHz * alphaCorr;

  // 6. Quantum Zero-Point Fluctuations (Ground State Wavepacket Width)
  const phi_zpf = Math.pow(2 / ej_ec_ratio, 0.25); // phase spread in radians
  const n_zpf = Math.pow(ej_ec_ratio / 32, 0.25);   // Cooper-pair number spread
  const Z_char = Math.sqrt(L_J / C_sigma);          // Transmon characteristic impedance in Ohms

  // 7. Charge-Noise Dispersion of 01 transition (Koch et al. Eq 2.15)
  // ε₀₁ ≈ 32 · Ec · √(2/π) · (Ej / 2Ec)^(5/4) · exp(-√(8·Ej/Ec))
  const eps01_kHz = (Ec_MHz * 1e3) * 32 * Math.sqrt(2 / Math.PI) *
    Math.pow(ej_ec_ratio / 2, 1.25) * Math.exp(-Math.sqrt(8 * ej_ec_ratio));

  // 8. Dispersive Resonator Coupling & Shift
  const omega_r_GHz = resonator_freq_GHz;
  const Cr_fF = 350; // Readout CPW resonator lumped capacitance
  const Cc_F = coupling_cap_fF * 1e-15;
  const g_MHz = (omega_r_GHz * 1000 / 2) * (Cc_F / Math.sqrt(C_sigma * (Cr_fF * 1e-15)));
  const delta_GHz = omega01_GHz - omega_r_GHz;
  const delta_MHz = delta_GHz * 1000;
  const chi_MHz = (Math.pow(g_MHz, 2) * alpha_MHz) / (delta_MHz * (delta_MHz + alpha_MHz));

  // Step-by-step mathematical derivation breakdown strings
  const derivations = {
    capacitance: {
      formula: 'C_Σ = C_pad + ½·C_gnd + C_J',
      substitution: `(${(C_pad_pad * 1e15).toFixed(2)} fF) + ½·(${(C_pad_gnd * 1e15).toFixed(2)} fF) + ${(C_J * 1e15).toFixed(1)} fF`,
      result: `${(C_sigma * 1e15).toFixed(2)} fF`,
      physics: 'Conformal mapping of coplanar thin-film aluminum on dielectric substrate'
    },
    chargingEnergy: {
      formula: 'E_C = e² / (2 · C_Σ · h)',
      substitution: `(1.602×10⁻¹⁹ C)² / (2 · ${(C_sigma * 1e15).toFixed(2)} fF · 6.626×10⁻³⁴ J·s)`,
      result: `${Ec_MHz.toFixed(2)} MHz`,
      physics: 'Coulomb electrostatic energy to transfer a single electron across junction'
    },
    josephsonEnergy: {
      formula: 'E_J = Φ₀² / (4π² · L_J · h) = I_c · Φ₀ / (2π · h)',
      substitution: `(2.068×10⁻¹⁵ Wb)² / (4π² · ${inductance_nH.toFixed(2)} nH · h)`,
      result: `${Ej_GHz.toFixed(2)} GHz (${Ej_MHz.toFixed(1)} MHz)`,
      physics: `Cooper-pair Josephson tunneling energy (Critical current I_c = ${Ic_nA.toFixed(2)} nA)`
    },
    qubitFrequency: {
      formula: 'ℏω₀₁ = √(8·E_C·E_J) - E_C - E_C² / (4·√(8·E_C·E_J))',
      substitution: `√(8 · ${Ec_MHz.toFixed(1)}M · ${(Ej_MHz).toFixed(0)}M) - ${Ec_MHz.toFixed(1)}M - ${secondOrderCorr.toFixed(1)}M`,
      result: `${omega01_GHz.toFixed(3)} GHz (${omega01_MHz.toFixed(1)} MHz)`,
      physics: 'Fundamental transmon ground-to-excited splitting in weakly anharmonic well'
    },
    anharmonicity: {
      formula: 'α = ω₁₂ - ω₀₁ ≈ -E_C · [1 + ⅜·√(2·E_C/E_J)]',
      substitution: `-${Ec_MHz.toFixed(2)} MHz · [1 + ⅜·√(2 / ${ej_ec_ratio.toFixed(1)})]`,
      result: `${alpha_MHz.toFixed(2)} MHz`,
      physics: 'Negative anharmonicity isolating |0⟩ ↔ |1⟩ computational subspace from |2⟩'
    },
    quantumFluctuations: {
      formula: 'φ_zpf = (2·E_C/E_J)¹/⁴,  n_zpf = (E_J/32·E_C)¹/⁴',
      substitution: `(2 / ${ej_ec_ratio.toFixed(1)})¹/⁴ = ${phi_zpf.toFixed(3)} rad,  (${ej_ec_ratio.toFixed(1)} / 32)¹/⁴ = ${n_zpf.toFixed(3)}`,
      result: `Δφ = ${phi_zpf.toFixed(3)} rad, Δn = ${n_zpf.toFixed(3)} (Δφ·Δn = 0.500)`,
      physics: `Minimum-uncertainty quantum ground-state phase & Cooper-pair charge fluctuations (Z_char = ${Z_char.toFixed(1)} Ω)`
    },
    chargeDispersion: {
      formula: 'ε₀₁ ≈ 32·E_C·√(2/π)·(E_J/2E_C)⁵/⁴·exp(-√(8·E_J/E_C))',
      substitution: `32 · ${Ec_MHz.toFixed(1)}M · 0.798 · (${(ej_ec_ratio / 2).toFixed(1)})⁵/⁴ · exp(-√${(8 * ej_ec_ratio).toFixed(1)})`,
      result: `${eps01_kHz < 0.001 ? '< 0.001' : eps01_kHz.toFixed(3)} kHz`,
      physics: `E_J/E_C = ${ej_ec_ratio.toFixed(1)} > 50 exponentially suppresses charge-parity dephasing Γ_φ^(1/f)`
    },
    dispersiveReadout: {
      formula: 'g = (ω_r/2)·(C_c / √(C_Σ·C_r)),  χ = g²·α / (Δ·(Δ + α))',
      substitution: `g = ${g_MHz.toFixed(1)} MHz, Δ = ${(delta_GHz * 1000).toFixed(0)} MHz (ω_r = ${omega_r_GHz.toFixed(2)} GHz)`,
      result: `χ = ${chi_MHz.toFixed(2)} MHz`,
      physics: 'Dispersive state-dependent cavity pull enabling quantum non-demolition (QND) readout'
    }
  };

  return {
    padWidth_um,
    padHeight_um,
    padGap_um,
    inductance_nH,
    epsR,
    C_sigma_fF: Number((C_sigma * 1e15).toFixed(2)),
    C_pad_pad_fF: Number((C_pad_pad * 1e15).toFixed(2)),
    C_pad_gnd_fF: Number((C_pad_gnd * 1e15).toFixed(2)),
    C_J_fF: Number((C_J * 1e15).toFixed(2)),
    Ec_MHz: Number(Ec_MHz.toFixed(2)),
    Ej_GHz: Number(Ej_GHz.toFixed(2)),
    Ej_MHz: Number(Ej_MHz.toFixed(1)),
    Ic_nA: Number(Ic_nA.toFixed(2)),
    ej_ec_ratio: Number(ej_ec_ratio.toFixed(1)),
    omega01_GHz: Number(omega01_GHz.toFixed(3)),
    omega01_MHz: Number(omega01_MHz.toFixed(1)),
    alpha_MHz: Number(alpha_MHz.toFixed(2)),
    phi_zpf: Number(phi_zpf.toFixed(3)),
    n_zpf: Number(n_zpf.toFixed(3)),
    Z_char: Number(Z_char.toFixed(1)),
    eps01_kHz: Number(eps01_kHz.toFixed(4)),
    omega_r_GHz: Number(omega_r_GHz.toFixed(3)),
    g_MHz: Number(g_MHz.toFixed(1)),
    delta_GHz: Number(delta_GHz.toFixed(3)),
    chi_MHz: Number(chi_MHz.toFixed(2)),
    derivations
  };
}

/**
 * Extract or generate realistic physical TCAD parameters for every qubit
 * in the active quantum circuit, respecting Silicon EDA layouts if present.
 *
 * @param {Object} circuit - Active QuantumCircuit instance
 * @param {Object} [edaState] - Zustand edaStore state
 * @returns {Array<Object>} Per-qubit TCAD profiles
 */
export function getCircuitTCADProfiles(circuit, edaState = null) {
  const numQ = Math.max(1, circuit?.numQubits || 1);
  const edaComponents = edaState?.components || [];

  // Filter actual qubit components on the physical chip
  const chipQubits = edaComponents.filter(c => {
    const t = (c.type || '').toLowerCase();
    const n = (c.name || '').toLowerCase();
    return (t.includes('transmon') || t.includes('star') || t.includes('qubit') || /^(q\d+|[dzx]\d+)$/i.test(n)) &&
           !t.includes('route') && !t.includes('launchpad') && !n.startsWith('cpl');
  });

  // Staggered realistic parameters for multi-qubit frequency division multiplexing
  // (Prevents frequency collisions on coupled superconducting chips)
  const staggeredGeometries = [
    { padWidth_um: 440, padHeight_um: 290, padGap_um: 28, inductance_nH: 11.5, epsR: 11.7 }, // Q0 ~5.63 GHz
    { padWidth_um: 430, padHeight_um: 280, padGap_um: 30, inductance_nH: 12.2, epsR: 11.7 }, // Q1 ~5.57 GHz
    { padWidth_um: 450, padHeight_um: 295, padGap_um: 26, inductance_nH: 10.9, epsR: 11.7 }, // Q2 ~5.82 GHz
    { padWidth_um: 435, padHeight_um: 285, padGap_um: 29, inductance_nH: 11.8, epsR: 11.7 }, // Q3 ~5.68 GHz
    { padWidth_um: 445, padHeight_um: 290, padGap_um: 27, inductance_nH: 11.3, epsR: 11.7 }, // Q4 ~5.75 GHz
    { padWidth_um: 425, padHeight_um: 275, padGap_um: 32, inductance_nH: 12.6, epsR: 11.7 }, // Q5 ~5.51 GHz
  ];

  const profiles = [];

  for (let q = 0; q < numQ; q++) {
    // Check if matching component exists in Silicon EDA
    const edaComp = chipQubits[q];
    let geom = null;

    if (edaComp && edaComp.params) {
      const p = edaComp.params;
      const parseDim = (val, defaultVal) => {
        if (!val) return defaultVal;
        const str = String(val).toLowerCase();
        if (str.endsWith('um')) return parseFloat(str);
        if (str.endsWith('mm')) return parseFloat(str) * 1000;
        return parseFloat(str) || defaultVal;
      };
      const parseInd = (val, defaultVal) => {
        if (!val) return defaultVal;
        const str = String(val).toLowerCase();
        if (str.endsWith('nh')) return parseFloat(str);
        return parseFloat(str) || defaultVal;
      };

      geom = {
        padWidth_um: parseDim(p.pad_width || p.cross_width, 440),
        padHeight_um: parseDim(p.pad_height || p.cross_length, 290),
        padGap_um: parseDim(p.pad_gap || p.cross_gap, 28),
        inductance_nH: parseInd(p.induction || p.inductance, 11.5),
        epsR: 11.7
      };
    } else {
      geom = staggeredGeometries[q % staggeredGeometries.length];
    }

    const tcad = calculateTransmonTCAD({
      ...geom,
      resonator_freq_GHz: Number((6.5 + q * 0.08).toFixed(3)),
      coupling_cap_fF: 4.5
    });

    profiles.push({
      qubitIndex: q,
      qubitName: edaComp?.name || `Q${q}`,
      edaComponentId: edaComp?.id || null,
      source: edaComp ? 'Silicon EDA Layout' : 'Physical Transmon Lithography',
      ...tcad
    });
  }

  return profiles;
}

