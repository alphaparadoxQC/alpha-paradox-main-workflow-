import React, { useState } from 'react';
import { COMPONENT_DEFINITIONS, useEdaStore } from '../../stores/edaStore';
import NewComponentModal from './NewComponentModal';

export default function ComponentLibrary() {
  const addComponent = useEdaStore(state => state.addComponent);
  const variables = useEdaStore(state => state.variables);
  const chips = useEdaStore(state => state.chips);
  const components = useEdaStore(state => state.components) || [];
  const selectedComponentId = useEdaStore(state => state.selectedComponentId);
  const selectComponent = useEdaStore(state => state.selectComponent);
  const updateVariable = useEdaStore(state => state.updateVariable);
  const updateChip = useEdaStore(state => state.updateChip);
  const getQGeometry = useEdaStore(state => state.getQGeometry);
  const serverQg = useEdaStore(state => state.server_qgeometry);
  const [expanded, setExpanded] = useState({ qubits: true, routing: true, couplers: true, resonators: true, passives: true, io: true, terminations: true });
  const [activeTab, setActiveTab] = useState('Design');
  const [modalComponent, setModalComponent] = useState(null);
  
  const localQg = getQGeometry ? getQGeometry() : { path: [], poly: [], junction: [] };
  const hasServerGeom = serverQg && ((serverQg.poly && serverQg.poly.length > 0) || (serverQg.path && serverQg.path.length > 0) || (serverQg.junction && serverQg.junction.length > 0));
  const qgeometry = hasServerGeom ? serverQg : localQg;

  const libraryItems = [
    { type: 'circle_caterpillar', name: 'Circle Caterpillar', category: 'passives', svg: <svg viewBox="0 0 32 32"><circle cx="8" cy="16" r="3" fill="#b5cea8" /><circle cx="16" cy="16" r="3" fill="#b5cea8" /><circle cx="24" cy="16" r="3" fill="#b5cea8" /><line x1="8" y1="16" x2="24" y2="16" stroke="#b5cea8" strokeWidth="1" /></svg> },
    { type: 'circle_raster', name: 'Circle Raster', category: 'passives', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="#dcdcaa" /></svg> },
    { 
      type: 'transmon_cross', 
      name: 'Transmon Cross', 
      category: 'qubits', 
      iconImg: '/components/TransmonCross.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="13" y="4" width="6" height="24" fill="#007acc" rx="1"/>
          <rect x="4" y="13" width="24" height="6" fill="#007acc" rx="1"/>
          <line x1="16" y1="28" x2="16" y2="31" stroke="#e74c3c" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      type: 'transmon_cross_fl', 
      name: 'Transmon Cross FL', 
      category: 'qubits', 
      iconImg: '/components/TransmonCrossFL.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="13" y="4" width="6" height="20" fill="#007acc" rx="1"/>
          <rect x="4" y="11" width="24" height="6" fill="#007acc" rx="1"/>
          <line x1="16" y1="24" x2="16" y2="26" stroke="#e74c3c" strokeWidth="1.5"/>
          <line x1="10" y1="28" x2="22" y2="28" stroke="#4ec9b0" strokeWidth="2"/>
          <line x1="16" y1="28" x2="16" y2="31" stroke="#4ec9b0" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      type: 'transmon_pocket', 
      name: 'Transmon Pocket', 
      category: 'qubits', 
      iconImg: '/components/TransmonPocket.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="3" y="3" width="26" height="26" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeDasharray="2,2"/>
          <rect x="7" y="6" width="18" height="7" fill="#007acc" rx="0.5"/>
          <rect x="7" y="19" width="18" height="7" fill="#007acc" rx="0.5"/>
          <line x1="16" y1="13" x2="16" y2="19" stroke="#e74c3c" strokeWidth="2"/>
          <rect x="6" y="7" width="3" height="4" fill="#dcdcaa"/>
        </svg>
      )
    },
    { 
      type: 'transmon_pocket_cl', 
      name: 'Transmon Pocket CL', 
      category: 'qubits', 
      iconImg: '/components/TransmonPocketCL.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="5" y="3" width="24" height="26" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeDasharray="2,2"/>
          <rect x="9" y="6" width="16" height="7" fill="#007acc" rx="0.5"/>
          <rect x="9" y="19" width="16" height="7" fill="#007acc" rx="0.5"/>
          <line x1="17" y1="13" x2="17" y2="19" stroke="#e74c3c" strokeWidth="2"/>
          <path d="M 2 16 H 6 V 11" fill="none" stroke="#4ec9b0" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      type: 'transmon_interdigitated', 
      name: 'Transmon Interdigitated', 
      category: 'qubits', 
      iconImg: '/components/TransmonInterdigitated.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="4" y="4" width="24" height="5" fill="#ce9178" rx="0.5"/>
          <rect x="4" y="23" width="24" height="5" fill="#ce9178" rx="0.5"/>
          <line x1="8" y1="9" x2="8" y2="17" stroke="#ce9178" strokeWidth="1.5"/>
          <line x1="12" y1="15" x2="12" y2="23" stroke="#ce9178" strokeWidth="1.5"/>
          <line x1="16" y1="9" x2="16" y2="14" stroke="#ce9178" strokeWidth="1.5"/>
          <line x1="16" y1="18" x2="16" y2="23" stroke="#ce9178" strokeWidth="1.5"/>
          <line x1="16" y1="14" x2="16" y2="18" stroke="#e74c3c" strokeWidth="1.5"/>
          <line x1="20" y1="9" x2="20" y2="17" stroke="#ce9178" strokeWidth="1.5"/>
          <line x1="24" y1="15" x2="24" y2="23" stroke="#ce9178" strokeWidth="1.5"/>
        </svg>
      )
    },
    { 
      type: 'transmon_pocket_6', 
      name: 'Transmon Pocket 6', 
      category: 'qubits', 
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="3" y="3" width="26" height="26" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeDasharray="2,2"/>
          <rect x="7" y="6" width="18" height="7" fill="#007acc" rx="0.5"/>
          <rect x="7" y="19" width="18" height="7" fill="#007acc" rx="0.5"/>
          <line x1="16" y1="13" x2="16" y2="19" stroke="#e74c3c" strokeWidth="2"/>
          <rect x="5" y="7" width="2.5" height="3" fill="#dcdcaa"/>
          <rect x="14.5" y="4" width="3" height="2.5" fill="#dcdcaa"/>
          <rect x="24.5" y="7" width="2.5" height="3" fill="#dcdcaa"/>
          <rect x="5" y="22" width="2.5" height="3" fill="#dcdcaa"/>
          <rect x="24.5" y="22" width="2.5" height="3" fill="#dcdcaa"/>
        </svg>
      )
    },
    { 
      type: 'transmon_pocket_teeth', 
      name: 'Transmon Pocket Teeth', 
      category: 'qubits', 
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="3" y="3" width="26" height="26" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeDasharray="2,2"/>
          <rect x="6" y="9" width="20" height="6" fill="#007acc" rx="3"/>
          <rect x="6" y="18" width="20" height="6" fill="#007acc" rx="3"/>
          <rect x="11" y="5" width="2" height="5" fill="#007acc" rx="1"/>
          <rect x="19" y="5" width="2" height="5" fill="#007acc" rx="1"/>
          <line x1="16" y1="15" x2="16" y2="18" stroke="#e74c3c" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      type: 'two_pad_transmon', 
      name: 'Two-Pad Transmon', 
      category: 'qubits', 
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="4" y="6" width="9" height="20" fill="#4ec9b0" rx="1"/>
          <rect x="19" y="6" width="9" height="20" fill="#4ec9b0" rx="1"/>
          <line x1="13" y1="16" x2="19" y2="16" stroke="#e74c3c" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      type: 'star_qubit', 
      name: 'Star Qubit', 
      category: 'qubits', 
      iconImg: '/components/StarQubit.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#7f8c8d" strokeWidth="1" strokeDasharray="2,2"/>
          <circle cx="16" cy="16" r="8" fill="#007acc"/>
          <circle cx="16" cy="16" r="4" fill="#1e1e1e"/>
          <rect x="25" y="14" width="5" height="4" fill="#4fa4dd" rx="0.5"/>
          <rect x="18" y="24" width="4" height="5" fill="#4fa4dd" rx="0.5"/>
          <rect x="5" y="21" width="5" height="4" fill="#4fa4dd" rx="0.5"/>
          <rect x="3" y="11" width="5" height="4" fill="#4fa4dd" rx="0.5"/>
          <rect x="14" y="2" width="4" height="6" fill="#e74c3c" rx="0.5"/>
        </svg>
      )
    },
    { 
      type: 'squid_loop', 
      name: 'SQUID Loop', 
      category: 'qubits', 
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="4" y="6" width="4" height="20" fill="#9cdcfe"/>
          <rect x="24" y="8" width="4" height="16" fill="#9cdcfe"/>
          <line x1="8" y1="10" x2="13" y2="10" stroke="#9cdcfe" strokeWidth="2"/>
          <line x1="13" y1="10" x2="15" y2="10" stroke="#e74c3c" strokeWidth="2"/>
          <line x1="15" y1="10" x2="20" y2="10" stroke="#9cdcfe" strokeWidth="2"/>
          <line x1="8" y1="22" x2="13" y2="22" stroke="#9cdcfe" strokeWidth="2"/>
          <line x1="13" y1="22" x2="15" y2="22" stroke="#e74c3c" strokeWidth="2"/>
          <line x1="15" y1="22" x2="20" y2="22" stroke="#9cdcfe" strokeWidth="2"/>
          <line x1="20" y1="10" x2="20" y2="22" stroke="#9cdcfe" strokeWidth="2"/>
          <line x1="20" y1="16" x2="24" y2="16" stroke="#9cdcfe" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      type: 'snail', 
      name: 'SNAIL', 
      category: 'qubits', 
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="4" y="6" width="3.5" height="20" fill="#c586c0"/>
          <rect x="24.5" y="8" width="3.5" height="16" fill="#c586c0"/>
          <line x1="7.5" y1="10" x2="11" y2="10" stroke="#c586c0" strokeWidth="1.5"/>
          <line x1="11" y1="10" x2="12" y2="10" stroke="#e74c3c" strokeWidth="1.5"/>
          <line x1="12" y1="10" x2="15" y2="10" stroke="#c586c0" strokeWidth="1.5"/>
          <line x1="15" y1="10" x2="16" y2="10" stroke="#e74c3c" strokeWidth="1.5"/>
          <line x1="16" y1="10" x2="19" y2="10" stroke="#c586c0" strokeWidth="1.5"/>
          <line x1="19" y1="10" x2="20" y2="10" stroke="#e74c3c" strokeWidth="1.5"/>
          <line x1="20" y1="10" x2="22" y2="10" stroke="#c586c0" strokeWidth="1.5"/>
          <line x1="7.5" y1="22" x2="14" y2="22" stroke="#c586c0" strokeWidth="1.2"/>
          <line x1="14" y1="22" x2="15.5" y2="22" stroke="#e74c3c" strokeWidth="1.2"/>
          <line x1="15.5" y1="22" x2="22" y2="22" stroke="#c586c0" strokeWidth="1.2"/>
          <line x1="22" y1="10" x2="22" y2="22" stroke="#c586c0" strokeWidth="1.5"/>
          <line x1="22" y1="16" x2="24.5" y2="16" stroke="#c586c0" strokeWidth="1.5"/>
        </svg>
      )
    },
    { type: 'fluxonium', name: 'Fluxonium', category: 'qubits', svg: <svg viewBox="0 0 32 32"><path d="M8 12h16v8H8z" fill="none" stroke="#007acc" strokeWidth="2"/><path d="M12 12v-4M20 12v-4" stroke="#007acc" strokeWidth="2"/></svg> },
    { type: 'rectangle', name: 'Rectangle', category: 'passives', svg: <svg viewBox="0 0 32 32"><rect x="6" y="10" width="20" height="12" fill="none" stroke="#ce9178" strokeWidth="2" /></svg> },
    { type: 'circle', name: 'Circle', category: 'passives', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="#ce9178" strokeWidth="2" /></svg> },
    { type: 'ellipse', name: 'Ellipse', category: 'passives', svg: <svg viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="12" ry="7" fill="none" stroke="#ce9178" strokeWidth="2" /></svg> },
    { type: 'rectangle_hollow', name: 'Rectangle Hollow', category: 'passives', svg: <svg viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" fill="none" stroke="#ce9178" strokeWidth="3" /><rect x="9" y="12" width="14" height="8" fill="none" stroke="#ce9178" strokeWidth="1" /></svg> },
    { type: 'circle_hollow', name: 'Circle Hollow (Ring)', category: 'passives', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#ce9178" strokeWidth="3" /><circle cx="16" cy="16" r="6" fill="none" stroke="#ce9178" strokeWidth="1" /></svg> },
    { type: 'cap_3_interdigital', name: 'Cap3Interdigital', category: 'passives', svg: <svg viewBox="0 0 32 32"><path d="M4 10h12v4H4M4 18h12v4H4M28 14H16v4h12" fill="#ce9178" /><path d="M6 10v12M26 14v4" stroke="#ce9178" strokeWidth="4" /></svg> },
    { type: 'cap_n_interdigital', name: 'CapNInterdigital', category: 'passives', svg: <svg viewBox="0 0 32 32"><path d="M4 6h12v4H4M4 14h12v4H4M4 22h12v4H4M28 10H16v4h12M28 18H16v4h12" fill="#ce9178" /><path d="M6 6v20M26 10v12" stroke="#ce9178" strokeWidth="4" /></svg> },
    { type: 'n_gon', name: 'N-Gon (Regular)', category: 'passives', svg: <svg viewBox="0 0 32 32"><polygon points="16,4 27,12 23,26 9,26 5,12" fill="none" stroke="#ce9178" strokeWidth="2" /></svg> },
    { type: 'interdigitated_cap', name: 'Interdigitated Cap', category: 'passives', svg: <svg viewBox="0 0 32 32"><path d="M8 8v16M14 12v12M20 8v16M26 12v12M8 8h12M14 24h12" fill="none" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'cap_finger_in_frame', name: 'Cap Finger In Frame', category: 'passives', svg: <svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="none" stroke="#ce9178" strokeWidth="2" /><path d="M8 8v16M14 12v12M20 8v16M26 12v12M8 8h12M14 24h12" fill="none" stroke="#ce9178" strokeWidth="1" /></svg> },
    { type: 'purcell_filter', name: 'Purcell Filter', category: 'passives', svg: <svg viewBox="0 0 32 32"><path d="M6 16h20M12 10v12M20 10v12" fill="none" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'n_square_spiral', name: 'Square Spiral', category: 'resonators', svg: <svg viewBox="0 0 32 32"><path d="M12 16h8v-8h-12v12h16v-16h-20v20h24" fill="none" stroke="#dcdcaa" strokeWidth="2" /></svg> },
    { type: 'cpw_meander', name: 'CPW Meander', category: 'resonators', svg: <svg viewBox="0 0 32 32"><path d="M4 16h4v-6h4v12h4v-12h4v12h4v-6h4" fill="none" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'cpw_straight', name: 'CPW Straight', category: 'resonators', svg: <svg viewBox="0 0 32 32"><line x1="4" y1="16" x2="28" y2="16" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'bond_pad', name: 'Bond Pad', category: 'io', svg: <svg viewBox="0 0 32 32"><rect x="10" y="10" width="12" height="12" fill="#d4d4d4"/></svg> },
    { type: 'microwave_port', name: 'Microwave Port', category: 'io', svg: <svg viewBox="0 0 32 32"><polygon points="6,12 18,16 6,20" fill="none" stroke="#d4d4d4" strokeWidth="2"/><line x1="18" y1="16" x2="26" y2="16" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'launchpad_wirebond', name: 'Launchpad Wirebond', category: 'io', svg: <svg viewBox="0 0 32 32"><rect x="8" y="4" width="16" height="12" fill="#c586c0" /><polygon points="12,16 20,16 18,24 14,24" fill="#c586c0" /></svg> },
    { type: 'airbridge', name: 'Airbridge', category: 'routing', svg: <svg viewBox="0 0 32 32"><path d="M6 20q10-16 20 0" fill="none" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'tsv', name: 'TSV (Coaxial)', category: 'routing', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="none" stroke="#38bdf8" strokeWidth="1.5"/><circle cx="16" cy="16" r="4" fill="#38bdf8"/></svg> },
    { type: 'micro_bump', name: 'Micro-Bump (Indium)', category: 'routing', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="7" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2"/><circle cx="16" cy="16" r="3" fill="#38bdf8"/></svg> },
    { type: 'hybrid_bond', name: 'Hybrid Bond Pad', category: 'routing', svg: <svg viewBox="0 0 32 32"><rect x="10" y="10" width="12" height="12" rx="2" fill="#ec4899" stroke="#be185d" strokeWidth="1.5"/><circle cx="16" cy="16" r="3" fill="#ffffff"/></svg> },
    { type: 'rdl_trace', name: 'RDL Route (Multi-tier)', category: 'routing', svg: <svg viewBox="0 0 32 32"><path d="M4 22L12 10H20L28 22" fill="none" stroke="#06b6d4" strokeWidth="2.5"/><circle cx="12" cy="10" r="2.5" fill="#38bdf8"/><circle cx="20" cy="10" r="2.5" fill="#38bdf8"/></svg> },
    { type: 'die_interconnect', name: 'Die Interconnect', category: 'routing', svg: <svg viewBox="0 0 32 32"><rect x="4" y="11" width="24" height="10" rx="2" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5"/><line x1="16" y1="8" x2="16" y2="24" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2,2"/></svg> },
    { type: 'resonator_coil_rect', name: 'Resonator Coil Rect', category: 'resonators', svg: <svg viewBox="0 0 32 32"><path d="M10 10h12v12h-8v-8h4v4" fill="none" stroke="#dcdcaa" strokeWidth="2"/></svg> },
    { type: 'line_tee', name: 'Line Tee', category: 'couplers', svg: <svg viewBox="0 0 32 32"><path d="M4 16h24M16 16v12" fill="none" stroke="#4ec9b0" strokeWidth="2"/></svg> },
    { type: 'coupled_line_tee', name: 'Coupled Line Tee', category: 'couplers', svg: <svg viewBox="0 0 32 32"><path d="M4 14h24M4 18h24M16 18v10" fill="none" stroke="#4ec9b0" strokeWidth="2"/></svg> },
    { type: 'cap_n_interdigital_tee', name: 'CapN Interdigital Tee', category: 'couplers', svg: <svg viewBox="0 0 32 32"><path d="M4 16h8v4M28 16h-8v4" fill="none" stroke="#4ec9b0" strokeWidth="2"/><rect x="12" y="12" width="8" height="8" fill="#4ec9b0"/></svg> },
    { type: 'resonator_lumped', name: 'Resonator Lumped', category: 'resonators', svg: <svg viewBox="0 0 32 32"><path d="M6 16h4M22 16h4" fill="none" stroke="#dcdcaa" strokeWidth="2"/><rect x="10" y="10" width="12" height="12" fill="none" stroke="#dcdcaa" strokeWidth="2"/></svg> },
    { type: 'readoutres_fc', name: 'Readout Res FC', category: 'resonators', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="none" stroke="#dcdcaa" strokeWidth="2"/><path d="M16 8v16" stroke="#dcdcaa" strokeWidth="2"/></svg> },
    { type: 'tunable_coupler_01', name: 'Tunable Coupler 01', category: 'couplers', svg: <svg viewBox="0 0 32 32"><rect x="8" y="12" width="16" height="8" fill="none" stroke="#4ec9b0" strokeWidth="2"/><circle cx="16" cy="16" r="2" fill="#4ec9b0"/></svg> },
    { type: 'tunable_coupler_02', name: 'Tunable Coupler 02', category: 'couplers', svg: <svg viewBox="0 0 32 32"><path d="M6 16h20M10 10v12M22 10v12" fill="none" stroke="#4ec9b0" strokeWidth="2"/></svg> },
    { type: 'launchpad_wb_coupled', name: 'Launchpad WB Coupled', category: 'io', svg: <svg viewBox="0 0 32 32"><rect x="8" y="4" width="16" height="12" fill="#c586c0" /><path d="M12 16h8v8h-8z" fill="#c586c0" /><line x1="8" y1="28" x2="24" y2="28" stroke="#c586c0" strokeWidth="2"/></svg> },
    { type: 'launchpad_wb_driven', name: 'Launchpad WB Driven', category: 'io', svg: <svg viewBox="0 0 32 32"><rect x="6" y="4" width="20" height="14" fill="#c586c0" /><polygon points="10,18 22,18 18,26 14,26" fill="#c586c0" /></svg> },
    { type: 'open_to_ground', name: 'Open to Ground', category: 'terminations', svg: <svg viewBox="0 0 32 32"><line x1="16" y1="28" x2="16" y2="12" stroke="#d4d4d4" strokeWidth="4"/><line x1="8" y1="8" x2="24" y2="8" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'short_to_ground', name: 'Short to Ground', category: 'terminations', svg: <svg viewBox="0 0 32 32"><line x1="16" y1="28" x2="16" y2="8" stroke="#d4d4d4" strokeWidth="4"/><rect x="4" y="4" width="24" height="4" fill="#d4d4d4"/></svg> },
    { 
      type: 'route_anchors', 
      name: 'RouteAnchors', 
      category: 'tlines', 
      iconImg: '/components/RouteAnchors.png',
      svg: (
        <svg viewBox="0 0 64 20" width="64" height="20" style={{ background: '#ffffff', border: '1px solid #777777', borderRadius: '1px', display: 'block' }}>
          <rect x="4" y="8" width="4" height="4" fill="#4fa4dd" />
          <rect x="56" y="8" width="4" height="4" fill="#4fa4dd" />
          <path d="M 8 10 H 26 V 4 H 46 V 10 H 56" fill="none" stroke="#7f8c8d" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      type: 'route_framed', 
      name: 'RouteFramed', 
      category: 'tlines', 
      iconImg: '/components/RouteFramed.png',
      svg: (
        <svg viewBox="0 0 64 20" width="64" height="20" style={{ background: '#ffffff', border: '1px solid #777777', borderRadius: '1px', display: 'block' }}>
          <rect x="4" y="4" width="4" height="4" fill="#4fa4dd" />
          <rect x="56" y="12" width="4" height="4" fill="#4fa4dd" />
          <path d="M 8 6 H 32 V 14 H 56" fill="none" stroke="#7f8c8d" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      type: 'route_meander', 
      name: 'RouteMeander', 
      category: 'tlines', 
      iconImg: '/components/RouteMeander.png',
      svg: (
        <svg viewBox="0 0 64 20" width="64" height="20" style={{ background: '#ffffff', border: '1px solid #777777', borderRadius: '1px', display: 'block' }}>
          <rect x="4" y="8" width="4" height="4" fill="#4fa4dd" />
          <rect x="56" y="8" width="4" height="4" fill="#4fa4dd" />
          <path d="M 8 10 H 14 V 4 H 18 V 16 H 22 V 4 H 26 V 16 H 30 V 4 H 34 V 16 H 38 V 4 H 42 V 16 H 46 V 4 H 50 V 10 H 56" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )
    },
    { 
      type: 'route_mixed', 
      name: 'RouteMixed', 
      category: 'tlines', 
      iconImg: '/components/RouteMixed.png',
      svg: (
        <svg viewBox="0 0 64 20" width="64" height="20" style={{ background: '#ffffff', border: '1px solid #777777', borderRadius: '1px', display: 'block' }}>
          <rect x="4" y="8" width="4" height="4" fill="#4fa4dd" />
          <rect x="56" y="8" width="4" height="4" fill="#4fa4dd" />
          <path d="M 8 10 H 26 V 4 H 46 V 10 H 56" fill="none" stroke="#7f8c8d" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      type: 'route_pathfinder', 
      name: 'RoutePathfinder', 
      category: 'tlines', 
      iconImg: '/components/RoutePathfinder.png',
      svg: (
        <svg viewBox="0 0 64 20" width="64" height="20" style={{ background: '#ffffff', border: '1px solid #777777', borderRadius: '1px', display: 'block' }}>
          <rect x="4" y="7" width="4" height="4" fill="#4fa4dd" />
          <rect x="56" y="7" width="4" height="4" fill="#4fa4dd" />
          <rect x="28" y="5" width="8" height="6" fill="#e74c3c" opacity="0.6" />
          <path d="M 8 9 H 22 V 16 H 42 V 9 H 56" fill="none" stroke="#7f8c8d" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      type: 'route_straight', 
      name: 'RouteStraight', 
      category: 'tlines', 
      iconImg: '/components/RouteStraight.png',
      svg: (
        <svg viewBox="0 0 64 20" width="64" height="20" style={{ background: '#ffffff', border: '1px solid #777777', borderRadius: '1px', display: 'block' }}>
          <rect x="4" y="8" width="4" height="4" fill="#4fa4dd" />
          <rect x="56" y="8" width="4" height="4" fill="#4fa4dd" />
          <line x1="8" y1="10" x2="56" y2="10" stroke="#7f8c8d" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      type: 'polyline_cpw', 
      name: 'PolylineCPW', 
      category: 'tlines', 
      iconImg: '/components/PolylineCPW.png',
      svg: (
        <svg viewBox="0 0 64 20" width="64" height="20" style={{ background: '#ffffff', border: '1px solid #777777', borderRadius: '1px', display: 'block' }}>
          <circle cx="8" cy="14" r="2.5" fill="#4fa4dd" />
          <circle cx="56" cy="6" r="2.5" fill="#4fa4dd" />
          <polyline points="8,14 26,14 38,6 56,6" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )
    },
    { 
      type: 'jj_dolan', 
      name: 'JJ Dolan', 
      category: 'qubits', 
      iconImg: '/components/jj_dolan.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="5" y="20" width="11" height="5" fill="#007acc" />
          <rect x="9" y="13" width="3" height="7" fill="#007acc" />
          <rect x="17" y="6" width="11" height="5" fill="#007acc" />
          <rect x="17" y="11" width="3" height="7" fill="#007acc" />
          <rect x="11" y="10" width="4" height="6" fill="#4ec9b0" opacity="0.85" />
        </svg>
      )
    },
    { 
      type: 'jj_manhattan', 
      name: 'JJ Manhattan', 
      category: 'qubits', 
      iconImg: '/components/jj_manhattan.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <rect x="5" y="22" width="11" height="5" fill="#007acc" />
          <rect x="9" y="7" width="3" height="15" fill="#007acc" />
          <rect x="22" y="5" width="5" height="11" fill="#007acc" />
          <rect x="7" y="9" width="15" height="3" fill="#007acc" />
        </svg>
      )
    },
    { 
      type: 'transmon_concentric', 
      name: 'Transmon Concentric', 
      category: 'qubits', 
      iconImg: '/components/TransmonConcentric.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="11" fill="none" stroke="#007acc" strokeWidth="2" />
          <circle cx="16" cy="16" r="5" fill="#007acc" />
          <line x1="16" y1="5" x2="16" y2="11" stroke="#4ec9b0" strokeWidth="1.5" />
          <line x1="16" y1="21" x2="16" y2="27" stroke="#4ec9b0" strokeWidth="1.5" />
          <line x1="4" y1="2" x2="22" y2="2" stroke="#dcdcaa" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      type: 'transmon_concentric_type_2', 
      name: 'Transmon Concentric Type 2', 
      category: 'qubits', 
      iconImg: '/components/TransmonConcentricType2.png',
      svg: (
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="10" fill="none" stroke="#007acc" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" fill="#007acc" />
          <line x1="22" y1="10" x2="27" y2="5" stroke="#4ec9b0" strokeWidth="1.5" />
          <rect x="25" y="3" width="4" height="4" fill="#4ec9b0" />
          <line x1="10" y1="10" x2="5" y2="5" stroke="#4ec9b0" strokeWidth="1.5" />
          <rect x="3" y="3" width="4" height="4" fill="#4ec9b0" />
        </svg>
      )
    }
  ];

  const groupedCategories = {
    core: libraryItems.filter(i => i.category === 'core'),
    couplers: libraryItems.filter(i => i.category === 'couplers'),
    lumped: libraryItems.filter(i => i.category === 'lumped'),
    qubits: libraryItems.filter(i => i.category === 'qubits'),
    passives: libraryItems.filter(i => i.category === 'passives'),
    resonators: libraryItems.filter(i => i.category === 'resonators'),
    tlines: libraryItems.filter(i => i.category === 'tlines'),
    terminations: libraryItems.filter(i => i.category === 'terminations'),
    io: libraryItems.filter(i => i.category === 'io')
  };

  const toggle = (cat) => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#252526', color: '#cccccc', fontSize: '13px' }}>
      {/* Header Tabs */}
      <div style={{ display: 'flex', background: '#333333', borderBottom: '1px solid #252526', cursor: 'pointer', fontSize: '11px' }}>
        <div onClick={() => setActiveTab('Design')} style={tabStyle(activeTab === 'Design')}>Design</div>
        <div onClick={() => setActiveTab('Elements')} style={tabStyle(activeTab === 'Elements')}>Elements</div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', fontSize: '12px' }}>
        {activeTab === 'Design' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TreeFolder name="Chips" expanded={true} />
              <button 
                onClick={() => useEdaStore.getState().add_chip_info()}
                style={{ background: 'transparent', border: 'none', color: '#007acc', cursor: 'pointer', paddingRight: '8px' }}
                title="Add Chip"
              >
                +
              </button>
            </div>
            <div style={{ paddingLeft: '24px' }}>
              {Object.entries(chips).map(([chipName, chipData]) => (
                <div key={chipName} style={{ padding: '3px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#9cdcfe', fontWeight: 600 }}>{chipName}</span>
                  <select
                    value={chipData.material || 'silicon'}
                    onChange={(e) => updateChip(chipName, 'material', e.target.value)}
                    style={{
                      background: '#1e1e1e',
                      color: '#38bdf8',
                      border: '1px solid #3f3f46',
                      borderRadius: '3px',
                      fontSize: '10px',
                      padding: '1px 4px',
                      cursor: 'pointer'
                    }}
                    title="Change substrate dielectric material"
                  >
                    <option value="silicon">Silicon (Si, &epsilon;r=11.45)</option>
                    <option value="sapphire">Sapphire (Al2O3, &epsilon;r=10.0)</option>
                    <option value="gaas">GaAs (&epsilon;r=12.9)</option>
                    <option value="quartz">Quartz (SiO2, &epsilon;r=3.8)</option>
                    <option value="diamond">Diamond (&epsilon;r=5.7)</option>
                  </select>
                  <span style={{ color: '#6b7280', fontSize: '10px' }}>{chipData.size_z}</span>
                </div>
              ))}
            </div>
            
            {/* QComponents Library Tree */}
            <div style={{ marginTop: '0px' }}>
              <div style={{ padding: '4px 8px', fontWeight: 'bold', background: '#333333', borderBottom: '1px solid #252526' }}>Name</div>
              <div style={{ padding: '8px 0' }}>
                {Object.entries(groupedCategories).map(([cat, items]) => (
                  <div key={cat}>
                    <div 
                      onClick={() => toggle(cat)} 
                      style={{ padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ width: '16px', display: 'inline-block', fontSize: '10px', color: '#888' }}>
                        {expanded[cat] ? '▼' : '▶'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#d4d4d4' }}>{cat}</span>
                    </div>
                    {expanded[cat] && items.length > 0 && (
                      <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {/* Vertical tree trunk line */}
                        <div style={{ position: 'absolute', left: '22px', top: 0, bottom: '24px', width: '1px', background: '#555' }} />
                        {items.map((item, idx) => {
                          return (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                              {/* Horizontal branch line */}
                              <div style={{ position: 'absolute', left: '6px', top: '50%', width: '12px', height: '1px', background: '#555' }} />
                              
                              <div 
                                onClick={() => setModalComponent(item.type)}
                                style={{
                                  display: 'flex', alignItems: 'center', padding: '8px 8px 8px 24px', cursor: 'pointer', flex: 1
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#37373d'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ minWidth: item.category === 'tlines' ? '68px' : '36px', height: '24px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {item.iconImg ? (
                                    <div style={{ width: '64px', height: '18px', background: '#ffffff', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 2px', border: '1px solid #777' }}>
                                      <img src={item.iconImg} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                                    </div>
                                  ) : item.category === 'tlines' ? (
                                    item.svg
                                  ) : (
                                    React.cloneElement(item.svg, { width: '28', height: '28' })
                                  )}
                                </div>
                                <div style={{ fontSize: '13px', color: '#d4d4d4' }}>{item.name}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instantiated components (alpha_metal.designs.Components equivalent) */}
            <div style={{ marginTop: '16px' }}>
              <TreeFolder name="Instantiated Components" expanded={true} />
              {components.length === 0 && (
                <div style={{ padding: '8px 24px', color: '#666', fontStyle: 'italic' }}>No components instantiated yet.</div>
              )}
              <div style={{ paddingLeft: '24px' }}>
                {components.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => selectComponent(c.id)}
                    style={{ 
                      padding: '4px 8px', cursor: 'pointer', color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: '8px',
                      background: selectedComponentId === c.id ? '#37373d' : 'transparent',
                      borderLeft: selectedComponentId === c.id ? '2px solid #007acc' : '2px solid transparent'
                    }}
                  >
                    <span style={{ color: '#007acc' }}>•</span> {c.name}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : activeTab === 'Elements' ? (
          <div style={{ padding: '8px', fontSize: '11px', overflowY: 'auto' }}>
            {/* POLYGONS */}
            <div style={{ color: '#10b981', marginBottom: '4px' }}>► poly ({qgeometry.poly.length})</div>
            {qgeometry.poly.map((p, i) => (
              <div key={i} style={{ marginBottom: '4px', padding: '2px', background: '#252526', border: '1px solid #333' }}>
                <span style={{ color: '#9cdcfe' }}>{p.component}</span>.<span style={{ color: '#ce9178' }}>{p.name}</span>
              </div>
            ))}
            
            {/* PATHS */}
            <div style={{ color: '#3b82f6', marginBottom: '4px', marginTop: '12px' }}>► path ({qgeometry.path.length})</div>
            {qgeometry.path.map((p, i) => (
              <div key={i} style={{ marginBottom: '4px', padding: '2px', background: '#252526', border: '1px solid #333' }}>
                <span style={{ color: '#9cdcfe' }}>{p.component}</span>.<span style={{ color: '#ce9178' }}>{p.name}</span>
              </div>
            ))}

            {/* JUNCTIONS */}
            <div style={{ color: '#f59e0b', marginBottom: '4px', marginTop: '12px' }}>► junction ({qgeometry.junction.length})</div>
            {qgeometry.junction.map((p, i) => (
              <div key={i} style={{ marginBottom: '4px', padding: '2px', background: '#252526', border: '1px solid #333' }}>
                <span style={{ color: '#9cdcfe' }}>{p.component}</span>.<span style={{ color: '#ce9178' }}>{p.name}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {modalComponent && (
        <NewComponentModal 
          componentType={modalComponent}
          onClose={() => setModalComponent(null)}
          onCreate={async (params, customName) => {
            addComponent(modalComponent, 0, 0, params, customName);
            setModalComponent(null);
            
            // Auto-rebuild to show geometries immediately
            try {
              const res = await fetch('http://localhost:8000/api/eda/rebuild', {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                  components: useEdaStore.getState().components, 
                  chips: useEdaStore.getState().chips 
                })
              });
              const data = await res.json();
              if (data.qgeometry) {
                const hasGeom = (data.qgeometry.poly?.length > 0 || data.qgeometry.path?.length > 0 || data.qgeometry.junction?.length > 0);
                useEdaStore.setState({ server_qgeometry: hasGeom ? data.qgeometry : null });
              }
            } catch(e) {
              console.error("Auto-rebuild failed:", e);
            }
          }}
        />
      )}
    </div>
  );
}

function tabStyle(active) {
  return {
    padding: '4px 12px',
    color: active ? '#ffffff' : '#9ca3af',
    background: active ? '#1e1e1e' : '#2d2d30',
    borderRight: '1px solid #1e1e1e'
  };
}

function TreeFolder({ name, expanded }) {
  return (
    <div style={{ cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
      <span style={{ width: '16px', display: 'inline-block' }}>{expanded ? '▾' : '▸'}</span>
      <span style={{ fontWeight: 'bold' }}>{name}</span>
    </div>
  );
}

function TreeItem({ name, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
      onMouseOver={e => e.currentTarget.style.background = '#37373d'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ width: '16px', display: 'inline-block' }}></span>
      <span style={{ color: '#d4d4d4' }}>{name}</span>
    </div>
  );
}

// ComponentCard is no longer needed
