// Semantic Material & Component Color Engine for Quantum EDA & HFSS 3D Simulation
// Adheres to IEEE / SEMI / Qiskit Metal / Cadence Virtuoso layout conventions

export const MATERIAL_VISUALS = {
  silicon: {
    name: 'Silicon (HR-Si)',
    formula: 'Si',
    eps_r: 11.45,
    loss_tangent: '1.0e-6',
    bg2D: '#141a23',
    border2D: '#475569',
    text2D: '#94a3b8',
    rgba3DTop: [0.11, 0.14, 0.19, 1.0],      // Deep obsidian slate
    rgba3DSide: [0.06, 0.08, 0.11, 1.0],
    rgba3DBot: [0.03, 0.04, 0.06, 1.0],
    gndColor: [0.22, 0.28, 0.38, 1.0]
  },
  sapphire: {
    name: 'Sapphire (Al2O3)',
    formula: 'Al2O3',
    eps_r: 10.0,
    loss_tangent: '2.0e-7',
    bg2D: 'rgba(14, 116, 144, 0.18)',
    border2D: '#06b6d4',
    text2D: '#38bdf8',
    rgba3DTop: [0.18, 0.44, 0.62, 0.82],     // Crystalline azure ice
    rgba3DSide: [0.12, 0.30, 0.45, 0.90],
    rgba3DBot: [0.08, 0.20, 0.35, 0.85],
    gndColor: [0.25, 0.55, 0.70, 0.90]
  },
  gaas: {
    name: 'Gallium Arsenide (GaAs)',
    formula: 'GaAs',
    eps_r: 12.9,
    loss_tangent: '8.0e-6',
    bg2D: 'rgba(120, 53, 15, 0.22)',
    border2D: '#b45309',
    text2D: '#f59e0b',
    rgba3DTop: [0.22, 0.16, 0.12, 1.0],      // Warm bronze graphite
    rgba3DSide: [0.14, 0.10, 0.07, 1.0],
    rgba3DBot: [0.07, 0.05, 0.03, 1.0],
    gndColor: [0.35, 0.26, 0.20, 1.0]
  },
  quartz: {
    name: 'Fused Silica (SiO2)',
    formula: 'SiO2',
    eps_r: 3.8,
    loss_tangent: '1.5e-7',
    bg2D: 'rgba(56, 189, 248, 0.14)',
    border2D: '#38bdf8',
    text2D: '#7dd3fc',
    rgba3DTop: [0.30, 0.52, 0.60, 0.70],     // Clear vitreous glass
    rgba3DSide: [0.20, 0.38, 0.45, 0.80],
    rgba3DBot: [0.14, 0.26, 0.32, 0.75],
    gndColor: [0.38, 0.60, 0.68, 0.80]
  },
  diamond: {
    name: 'CVD Diamond (C)',
    formula: 'C',
    eps_r: 5.7,
    loss_tangent: '1.0e-7',
    bg2D: 'rgba(165, 243, 252, 0.18)',
    border2D: '#67e8f9',
    text2D: '#a5f3fc',
    rgba3DTop: [0.42, 0.64, 0.75, 0.85],     // High-refractive crystal
    rgba3DSide: [0.28, 0.48, 0.58, 0.90],
    rgba3DBot: [0.18, 0.34, 0.42, 0.85],
    gndColor: [0.50, 0.72, 0.82, 0.85]
  }
};

export function getMaterialVisuals(materialName) {
  const key = (materialName || 'silicon').toLowerCase().trim();
  if (key.includes('sapphire') || key.includes('al2o3')) return MATERIAL_VISUALS.sapphire;
  if (key.includes('gaas') || key.includes('gallium') || key.includes('inp')) return MATERIAL_VISUALS.gaas;
  if (key.includes('quartz') || key.includes('sio2') || key.includes('silica')) return MATERIAL_VISUALS.quartz;
  if (key.includes('diamond')) return MATERIAL_VISUALS.diamond;
  return MATERIAL_VISUALS.silicon;
}

export const COMPONENT_ROLE_PALETTE = {
  qubit: {
    role: 'Qubit (Computational Core)',
    label: 'Qubit',
    hex: '#f43f5e',                         // Quantum Rose / Coral
    strokeHex: '#be123c',
    rgba3D: [0.957, 0.247, 0.369, 1.0],
    topDieRgba3D: [0.988, 0.443, 0.522, 1.0],
    glowHex: 'rgba(244, 63, 94, 0.45)'
  },
  coupler: {
    role: 'Coupler (Entangling Bus)',
    label: 'Coupler',
    hex: '#a855f7',                         // Electric Violet / Purple
    strokeHex: '#7e22ce',
    rgba3D: [0.659, 0.333, 0.969, 1.0],
    topDieRgba3D: [0.753, 0.518, 0.988, 1.0],
    glowHex: 'rgba(168, 85, 247, 0.45)'
  },
  resonator: {
    role: 'Readout Resonator / Purcell Filter',
    label: 'Resonator',
    hex: '#06b6d4',                         // Dispersive Cyan / Azure
    strokeHex: '#0e7490',
    rgba3D: [0.024, 0.714, 0.831, 1.0],
    topDieRgba3D: [0.133, 0.824, 0.925, 1.0],
    glowHex: 'rgba(6, 182, 212, 0.45)'
  },
  tline: {
    role: 'CPW Feedline / Routing',
    label: 'CPW Line',
    hex: '#0ea5e9',                         // Microwave Sky Blue
    strokeHex: '#0369a1',
    rgba3D: [0.055, 0.647, 0.914, 1.0],
    topDieRgba3D: [0.220, 0.741, 0.973, 1.0],
    glowHex: 'rgba(14, 165, 233, 0.40)'
  },
  io: {
    role: 'I/O Launchpad / RF Wirebond',
    label: 'Launchpad',
    hex: '#eab308',                         // Warm Amber / Gold
    strokeHex: '#a16207',
    rgba3D: [0.918, 0.702, 0.031, 1.0],
    topDieRgba3D: [0.980, 0.800, 0.082, 1.0],
    glowHex: 'rgba(234, 179, 8, 0.45)'
  },
  interconnect: {
    role: '3D TSV / Micro-Bump / Bridge',
    label: '3D Via/Bump',
    hex: '#f97316',                         // Copper / Indium Orange
    strokeHex: '#c2410c',
    rgba3D: [0.976, 0.451, 0.090, 1.0],
    topDieRgba3D: [0.984, 0.573, 0.235, 1.0],
    glowHex: 'rgba(249, 115, 22, 0.45)'
  },
  passive: {
    role: 'Passive / Termination / Lumped',
    label: 'Passive',
    hex: '#10b981',                         // Emerald Mint
    strokeHex: '#047857',
    rgba3D: [0.063, 0.725, 0.506, 1.0],
    topDieRgba3D: [0.204, 0.827, 0.612, 1.0],
    glowHex: 'rgba(16, 185, 129, 0.45)'
  },
  selected: {
    role: 'Selected Component',
    label: 'Selected',
    hex: '#facc15',                         // High-Contrast Selection Gold
    strokeHex: '#ca8a04',
    rgba3D: [0.98, 0.75, 0.14, 1.0],
    topDieRgba3D: [1.0, 0.85, 0.22, 1.0],
    glowHex: 'rgba(250, 204, 21, 0.60)'
  },
  subtract: {
    role: 'Etched Ground Pocket / Dielectric Gap',
    label: 'Etched Pocket',
    hex: 'rgba(215, 215, 215, 0.65)',
    strokeHex: '#64748b',
    rgba3D: [0.05, 0.07, 0.11, 0.95],
    topDieRgba3D: [0.06, 0.08, 0.12, 0.95],
    glowHex: 'rgba(100, 116, 139, 0.20)'
  }
};

export function hexToRgbNormalized(hex) {
  if (!hex || typeof hex !== 'string') return [0.22, 0.68, 0.96, 1.0];
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    const g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    const b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
    return [r, g, b, 1.0];
  }
  if (cleaned.length >= 6) {
    const r = parseInt(cleaned.substring(0, 2), 16) / 255;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255;
    return [r, g, b, 1.0];
  }
  return [0.22, 0.68, 0.96, 1.0];
}

const SYNTAX_THEME_COLORS = new Set([
  '#ce9178', '#b5cea8', '#4ec9b0', '#9cdcfe', '#dcdcaa', '#5b9bd5', '#007acc', '#c586c0'
]);

export function detectComponentRole(comp) {
  if (!comp) return 'tline';
  const type = (comp.type || '').toLowerCase();
  const name = (comp.name || '').toLowerCase();
  const cat = (comp.category || '').toLowerCase();

  // 1. Couplers
  if (
    cat === 'couplers' ||
    name.startsWith('cpl') ||
    name.startsWith('clt') ||
    name.includes('coupler') ||
    type.includes('coupler') ||
    type.includes('capn') ||
    type.includes('coupled_line')
  ) {
    return 'coupler';
  }

  // 2. Qubits
  if (
    cat === 'qubits' ||
    name.startsWith('q') ||
    name.includes('qubit') ||
    type.includes('transmon') ||
    type.includes('cross') ||
    type.includes('pocket') ||
    type.includes('star') ||
    type.includes('xmon') ||
    type.includes('fluxonium')
  ) {
    return 'qubit';
  }

  // 3. I/O Launchpads
  if (
    cat === 'io' ||
    name.startsWith('lp') ||
    name.includes('launch') ||
    name.includes('pad') ||
    type.includes('launchpad') ||
    type.includes('pad')
  ) {
    return 'io';
  }

  // 4. Interconnects (3D TSVs, Micro-bumps, Indium balls, Airbridges)
  if (
    cat === 'interconnects' ||
    name.includes('tsv') ||
    name.includes('bump') ||
    name.includes('indium') ||
    name.includes('airbridge') ||
    name.includes('rdl') ||
    type.includes('tsv') ||
    type.includes('bump') ||
    type.includes('airbridge') ||
    type.includes('interconnect')
  ) {
    return 'interconnect';
  }

  // 5. Resonators & Purcell filters
  if (
    cat === 'resonators' ||
    name.startsWith('r') ||
    name.startsWith('ro_') ||
    name.includes('resonator') ||
    name.includes('purcell') ||
    type.includes('resonator') ||
    type.includes('meander') ||
    type.includes('purcell')
  ) {
    return 'resonator';
  }

  // 6. Passives & Terminations
  if (
    cat === 'passives' ||
    cat === 'terminations' ||
    name.startsWith('cap_') ||
    name.startsWith('res_') ||
    name.startsWith('term_') ||
    type.includes('termination') ||
    type.includes('raster') ||
    type.includes('caterpillar')
  ) {
    return 'passive';
  }

  // 7. Routing / CPW Transmission lines
  return 'tline';
}

export function getComponentVisuals(comp, isSelected = false, isSubtract = false, chipName = 'main') {
  if (isSubtract) {
    return {
      role: 'subtract',
      hex: COMPONENT_ROLE_PALETTE.subtract.hex,
      strokeHex: COMPONENT_ROLE_PALETTE.subtract.strokeHex,
      rgba3D: COMPONENT_ROLE_PALETTE.subtract.rgba3D,
      isTopDie: false
    };
  }

  if (isSelected) {
    return {
      role: 'selected',
      hex: COMPONENT_ROLE_PALETTE.selected.hex,
      strokeHex: COMPONENT_ROLE_PALETTE.selected.strokeHex,
      rgba3D: COMPONENT_ROLE_PALETTE.selected.rgba3D,
      isTopDie: false
    };
  }

  const role = detectComponentRole(comp);
  const palette = COMPONENT_ROLE_PALETTE[role] || COMPONENT_ROLE_PALETTE.tline;

  // Determine if component is on a secondary / top flipped die (e.g. Q_chip)
  const compChip = comp?.params?.chip || chipName || 'main';
  const isTopDie = compChip === 'Q_chip' || compChip === 'top' || compChip === 'chip_1';

  // Check if user set an explicit custom color override in Property Editor
  const customColor = comp?.params?.color;
  if (customColor && !SYNTAX_THEME_COLORS.has(customColor.toLowerCase())) {
    const customRgba = hexToRgbNormalized(customColor);
    return {
      role,
      hex: customColor,
      strokeHex: customColor,
      rgba3D: customRgba,
      isTopDie
    };
  }

  return {
    role,
    hex: palette.hex,
    strokeHex: palette.strokeHex,
    rgba3D: isTopDie ? palette.topDieRgba3D : palette.rgba3D,
    isTopDie
  };
}

