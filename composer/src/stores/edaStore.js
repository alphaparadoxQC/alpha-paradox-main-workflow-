import { create } from 'zustand';
import { ParsedDynamicAttributes } from '../utils/parsedDynamicAttributes.js';

// Generate unique IDs
let idCounter = 0;

export const COMPONENT_DEFINITIONS = {
  circle_caterpillar: {
    type: 'circle_caterpillar',
    label: 'CircleCaterpillar',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', segments: '5', distance: '1.2', radius: '300um', resolution: '16', cap_style: 'round', subtract: 'False', helper: 'False', orientation: '0', chip: 'main', layer: '1' }
  },
  circle_raster: {
    type: 'circle_raster',
    label: 'CircleRaster',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', orientation: '0', radius: '300um', resolution: '16', cap_style: 'round', subtract: 'False', helper: 'False', chip: 'main', layer: '1' }
  },
  n_gon: {
    type: 'n_gon',
    label: 'NGon',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', n: '3', radius: '30um', subtract: 'False', helper: 'False', orientation: '0', chip: 'main', layer: '1' }
  },
  star_polygon: {
    type: 'star_polygon',
    label: 'StarPolygon',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', n_points: '5', outer_radius: '60um', inner_radius: '25um', orientation: '0', chip: 'main', layer: '1' }
  },
  n_square_spiral: {
    type: 'n_square_spiral',
    label: 'NSquareSpiral',
    category: 'resonators',
    defaultParams: { pos_x: '0um', pos_y: '0um', n: '3', width: '1um', radius: '40um', gap: '4um', subtract: 'False', helper: 'False', orientation: '0', chip: 'main', layer: '1' }
  },
  rectangle: {
    type: 'rectangle',
    label: 'Rectangle',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', width: '500um', height: '300um', subtract: 'False', helper: 'False', orientation: '0', chip: 'main', layer: '1' }
  },
  circle: {
    type: 'circle',
    label: 'Circle',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', radius: '300um', resolution: '16', cap_style: 'round', subtract: 'False', helper: 'False', orientation: '0', chip: 'main', layer: '1' }
  },
  ellipse: {
    type: 'ellipse',
    label: 'Ellipse',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', radius_x: '150um', radius_y: '80um', resolution: '16', subtract: 'False', helper: 'False', orientation: '0', chip: 'main', layer: '1' }
  },
  rectangle_hollow: {
    type: 'rectangle_hollow',
    label: 'Rectangle Hollow',
    category: 'passives',
    defaultParams: { 
      pos_x: '0um', pos_y: '0um', width: '500um', height: '300um', 
      inner: { width: '250um', height: '100um', offset_x: '40um', offset_y: '-20um', orientation: '15' },
      orientation: '0', subtract: 'False', helper: 'False', color: '#ce9178' 
    }
  },
  circle_hollow: {
    type: 'circle_hollow',
    label: 'Circle Hollow (Ring)',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', outer_radius: '100um', inner_radius: '60um', orientation: '0', subtract: 'False', color: '#ce9178' }
  },
  cap_3_interdigital: {
    type: 'cap_3_interdigital',
    label: 'Cap3Interdigital',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', trace_width: '10um', finger_length: '65um', pocket_buffer_width_x: '10um', pocket_buffer_width_y: '30um', orientation: '0', color: '#ce9178' }
  },
  cap_n_interdigital: {
    type: 'cap_n_interdigital',
    label: 'CapNInterdigital',
    category: 'passives',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      north_width: '10um',
      north_gap: '6um',
      south_width: '10um',
      south_gap: '6um',
      cap_width: '10um',
      cap_gap: '6um',
      cap_gap_ground: '6um',
      finger_length: '20um',
      finger_count: '5',
      cap_distance: '50um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#ce9178'
    }
  },
  transmon_cross: {
    type: 'transmon_cross',
    label: 'TransmonCross',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      cross_width: '20um',
      cross_length: '200um',
      cross_gap: '20um',
      connection_pads: {
        readout: {
          connector_location: '0',
          connector_type: '0',
          claw_length: '30um',
          ground_spacing: '5um',
          ground_spacing_back: null,
          claw_width: '10um',
          claw_width_back: null,
          claw_gap: '6um',
          claw_cpw_length: '40um',
          claw_cpw_width: '10um'
        }
      },
      _default_connection_pads: {
        connector_type: '0',
        claw_length: '30um',
        ground_spacing: '5um',
        ground_spacing_back: null,
        claw_width: '10um',
        claw_width_back: null,
        claw_gap: '6um',
        claw_cpw_length: '40um',
        claw_cpw_width: '10um',
        connector_location: '0'
      },
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#b5cea8'
    }
  },
  transmon_cross_fl: {
    type: 'transmon_cross_fl',
    label: 'TransmonCrossFL',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      cross_width: '20um',
      cross_length: '200um',
      cross_gap: '20um',
      make_fl: true,
      fl_options: {
        t_top: '15um',
        t_offset: '0um',
        t_inductive_gap: '3um',
        t_width: '5um',
        t_gap: '3um'
      },
      connection_pads: {
        readout: {
          connector_location: '0',
          connector_type: '0',
          claw_length: '30um',
          ground_spacing: '5um',
          ground_spacing_back: null,
          claw_width: '10um',
          claw_width_back: null,
          claw_gap: '6um',
          claw_cpw_length: '40um',
          claw_cpw_width: '10um'
        }
      },
      _default_connection_pads: {
        connector_type: '0',
        claw_length: '30um',
        ground_spacing: '5um',
        ground_spacing_back: null,
        claw_width: '10um',
        claw_width_back: null,
        claw_gap: '6um',
        claw_cpw_length: '40um',
        claw_cpw_width: '10um',
        connector_location: '0'
      },
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#4ec9b0'
    }
  },
  transmon_pocket: {
    type: 'transmon_pocket',
    label: 'TransmonPocket',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      pad_gap: '30um',
      inductor_width: '20um',
      pad_width: '455um',
      pad_height: '90um',
      pocket_width: '650um',
      pocket_height: '650um',
      connection_pads: {
        readout: {
          pad_gap: '15um',
          pad_width: '125um',
          pad_height: '30um',
          pad_cpw_shift: '5um',
          pad_cpw_extent: '25um',
          cpw_width: '10um',
          cpw_gap: '6um',
          cpw_extend: '100um',
          pocket_extent: '5um',
          pocket_rise: '65um',
          loc_W: '+1',
          loc_H: '+1'
        }
      },
      _default_connection_pads: {
        pad_gap: '15um',
        pad_width: '125um',
        pad_height: '30um',
        pad_cpw_shift: '5um',
        pad_cpw_extent: '25um',
        cpw_width: '10um',
        cpw_gap: '6um',
        cpw_extend: '100um',
        pocket_extent: '5um',
        pocket_rise: '65um',
        loc_W: '+1',
        loc_H: '+1'
      },
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#9cdcfe'
    }
  },
  transmon_pocket_cl: {
    type: 'transmon_pocket_cl',
    label: 'TransmonPocketCL',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      pad_gap: '30um',
      inductor_width: '20um',
      pad_width: '455um',
      pad_height: '90um',
      pocket_width: '650um',
      pocket_height: '650um',
      make_CL: true,
      cl_gap: '6um',
      cl_width: '10um',
      cl_length: '20um',
      cl_ground_gap: '6um',
      cl_pocket_edge: '0',
      cl_off_center: '50um',
      connection_pads: {
        readout: {
          pad_gap: '15um',
          pad_width: '125um',
          pad_height: '30um',
          pad_cpw_shift: '5um',
          pad_cpw_extent: '25um',
          cpw_width: '10um',
          cpw_gap: '6um',
          cpw_extend: '100um',
          pocket_extent: '5um',
          pocket_rise: '65um',
          loc_W: '+1',
          loc_H: '+1'
        }
      },
      _default_connection_pads: {
        pad_gap: '15um',
        pad_width: '125um',
        pad_height: '30um',
        pad_cpw_shift: '5um',
        pad_cpw_extent: '25um',
        cpw_width: '10um',
        cpw_gap: '6um',
        cpw_extend: '100um',
        pocket_extent: '5um',
        pocket_rise: '65um',
        loc_W: '+1',
        loc_H: '+1'
      },
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#dcdcaa'
    }
  },
  transmon_interdigitated: {
    type: 'transmon_interdigitated',
    label: 'TransmonInterdigitated',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      pad_width: '1000um',
      pad_height: '300um',
      finger_width: '50um',
      finger_height: '100um',
      finger_space: '50um',
      pad_pos_x: '0um',
      pad_pos_y: '0um',
      comb_width: '50um',
      comb_space_vert: '50um',
      comb_space_hor: '50um',
      jj_width: '20um',
      cc_space: '50um',
      cc_width: '100um',
      cc_height: '100um',
      cc_topleft_space: '50um',
      cc_topleft_width: '100um',
      cc_topleft_height: '100um',
      cc_topright_space: '50um',
      cc_topright_width: '100um',
      cc_topright_height: '100um',
      rotation_top_pad: '180',
      inductor_width: '20um',
      color: '#ce9178'
    }
  },
  transmon_pocket_6: {
    type: 'transmon_pocket_6',
    label: 'TransmonPocket6',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      pad_gap: '30um',
      inductor_width: '20um',
      pad_width: '455um',
      pad_height: '90um',
      pocket_width: '650um',
      pocket_height: '650um',
      connection_pads: {
        readout: { loc_W: '+1', loc_H: '+1', pad_gap: '15um', pad_width: '125um', pad_height: '30um', pad_cpw_shift: '0um', pad_cpw_extent: '25um', cpw_width: '10um', cpw_gap: '6um', cpw_extend: '100um', pocket_extent: '5um', pocket_rise: '0um' }
      },
      _default_connection_pads: {
        pad_gap: '15um',
        pad_width: '125um',
        pad_height: '30um',
        pad_cpw_shift: '0um',
        pad_cpw_extent: '25um',
        cpw_width: '10um',
        cpw_gap: '6um',
        cpw_extend: '100um',
        pocket_extent: '5um',
        pocket_rise: '0um',
        loc_W: '+1',
        loc_H: '+1'
      },
      color: '#5b9bd5'
    }
  },
  transmon_pocket_teeth: {
    type: 'transmon_pocket_teeth',
    label: 'TransmonPocketTeeth',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      pad_gap: '30um',
      inductor_width: '20um',
      pad_width: '400um',
      pad_height: '90um',
      pocket_width: '650um',
      pocket_height: '650um',
      coupled_pad_height: '150um',
      coupled_pad_width: '20um',
      coupled_pad_gap: '50um',
      connection_pads: {
        teeth_pad: { loc_W: '0', loc_H: '+1', pad_gap: '15um', pad_width: '20um', pad_height: '150um', pad_cpw_shift: '0um', pad_cpw_extent: '25um', cpw_width: '10um', cpw_gap: '6um', cpw_extend: '100um', pocket_extent: '5um', pocket_rise: '0um' }
      },
      _default_connection_pads: {
        pad_gap: '15um',
        pad_width: '20um',
        pad_height: '150um',
        pad_cpw_shift: '0um',
        pad_cpw_extent: '25um',
        cpw_width: '10um',
        cpw_gap: '6um',
        cpw_extend: '100um',
        pocket_extent: '5um',
        pocket_rise: '0um',
        loc_W: '+1',
        loc_H: '+1'
      },
      color: '#5b9bd5'
    }
  },
  star_qubit: {
    type: 'star_qubit',
    label: 'StarQubit',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      radius: '300um',
      center_radius: '100um',
      gap_couplers: '25um',
      gap_readout: '10um',
      connector_length: '75um',
      trap_offset: '20um',
      junc_h: '30um',
      cpw_width: '10um',
      rotation_cpl1: '0.0',
      rotation_cpl2: '72.0',
      rotation_rdout: '144.0',
      rotation_cpl3: '216.0',
      rotation_cpl4: '288.0',
      rotation_jj: 'auto',
      number_of_connectors: '4',
      resolution: '16',
      cap_style: 'round',
      subtract: 'False',
      helper: 'False',
      color: '#007acc'
    }
  },
  squid_loop: {
    type: 'squid_loop',
    label: 'SQUID_LOOP',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      plate1_width: '5.5um',
      plate1_height: '40um',
      squid_gap: '10um',
      segment_a_length: '10um',
      segment_a_width: '1um',
      JJ_gap: '0.5um',
      segment_b_length: '5um',
      segment_b_width: '1um',
      segment_c_width: '1um',
      segment_d_length: '10um',
      segment_d_width: '2um',
      plate2_width: '6um',
      plate2_height: '30um',
      color: '#9cdcfe'
    }
  },
  snail: {
    type: 'snail',
    label: 'SNAIL',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      plate1_width: '5.5um',
      plate1_height: '40um',
      squid_gap: '10um',
      segment_a_length: '10um',
      segment_a_width: '1um',
      JJ_gap: '0.5um',
      segment_ab_length: '5um',
      segment_b_length: '5um',
      segment_b_width: '1um',
      JJ_gap_small: '0.3um',
      segment_lower_width: '0.6um',
      segment_c_width: '1um',
      segment_d_length: '10um',
      segment_d_width: '2um',
      plate2_width: '6um',
      plate2_height: '30um',
      Lj: '0.046nH',
      Lj_small: '0.165nH',
      inductor_width: '1um',
      pin_width: '5um',
      color: '#c586c0'
    }
  },
  fluxonium: {
    type: 'fluxonium',
    label: 'Fluxonium',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      cross_width: '20um',
      cross_length: '200um',
      cross_gap: '20um',
      connection_pads: {},
      _default_connection_pads: {},
      color: '#ce9178'
    }
  },
  two_pad_transmon: {
    type: 'two_pad_transmon',
    label: 'TwoPadTransmon',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      pad_width: '500um',
      pad_height: '1000um',
      pad_gap: '200um',
      jj_width: '20um',
      color: '#4ec9b0'
    }
  },
  cpw_straight: {
    type: 'cpw_straight',
    label: 'CPW Straight',
    category: 'resonators',
    defaultParams: {
      start_x: '0um',
      start_y: '0um',
      end_x: '1000um',
      end_y: '0um',
      trace_width: 'cpw_width',
      gap_width: 'cpw_gap',
      color: '#dcdcaa',
      pin_inputs: { start_pin: { component: '', pin: '' }, end_pin: { component: '', pin: '' } },
      lead: { start_straight: '0um', end_straight: '0um', start_jogged_extension: '', end_jogged_extension: '' },
      fillet: '0',
      total_length: '7mm'
    }
  },
  cpw_meander: {
    type: 'cpw_meander',
    label: 'CPW Meander',
    category: 'resonators',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      total_length: '5000um',
      trace_width: 'cpw_width',
      gap_width: 'cpw_gap',
      meander_spacing: '50um',
      orientation: '0',
      color: '#dcdcaa',
      pin_inputs: { start_pin: { component: '', pin: '' }, end_pin: { component: '', pin: '' } },
      lead: { start_straight: '0um', end_straight: '0um', start_jogged_extension: '', end_jogged_extension: '' },
      fillet: '0'
    }
  },
  bond_pad: {
    type: 'bond_pad',
    label: 'Bond Pad',
    category: 'io',
    defaultParams: { pos_x: '0um', pos_y: '0um', width: '250um', height: '250um', gap: '50um', orientation: '0', color: '#c586c0' }
  },
  microwave_port: {
    type: 'microwave_port',
    label: 'Microwave Port',
    category: 'io',
    defaultParams: { pos_x: '0um', pos_y: '0um', trace_width: 'cpw_width', gap_width: 'cpw_gap', launch_taper: '200um', orientation: '0' }
  },
  interdigitated_cap: {
    type: 'interdigitated_cap',
    label: 'CapNInterdigital',
    category: 'passives',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      north_width: '10um',
      north_gap: '6um',
      south_width: '10um',
      south_gap: '6um',
      cap_width: '10um',
      cap_gap: '6um',
      cap_gap_ground: '6um',
      finger_length: '20um',
      finger_count: '5',
      cap_distance: '50um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#ce9178'
    }
  },
  purcell_filter: {
    type: 'purcell_filter',
    label: 'Purcell Filter',
    category: 'passives',
    defaultParams: { pos_x: '0um', pos_y: '0um', length: '1500um', trace_width: 'cpw_width', gap_width: 'cpw_gap', orientation: '0' }
  },
  airbridge: {
    type: 'airbridge',
    label: 'Airbridge',
    category: 'routing',
    defaultParams: { pos_x: '0um', pos_y: '0um', span: '30um', width: '10um', orientation: '0' }
  },
  tsv: {
    type: 'tsv',
    label: 'TSV (Through Silicon Via)',
    category: 'routing',
    defaultParams: { pos_x: '0um', pos_y: '0um', radius: '20um', coaxial_gap: '15um', ground_ring: '10um', chip: 'main' }
  },
  micro_bump: {
    type: 'micro_bump',
    label: 'Indium Micro-Bump',
    category: 'routing',
    defaultParams: { pos_x: '0um', pos_y: '0um', radius: '15um', height: '10um', standoff: '10um', chip: 'main' }
  },
  die_interconnect: {
    type: 'die_interconnect',
    label: 'Die-to-Die Interconnect',
    category: 'routing',
    defaultParams: { pos_x: '0um', pos_y: '0um', length: '400um', width: '25um', orientation: '0', chip: 'main' }
  },
  hybrid_bond: {
    type: 'hybrid_bond',
    label: 'Hybrid Bonding Pad (Direct Cu/Al)',
    category: 'routing',
    defaultParams: { pos_x: '0um', pos_y: '0um', radius: '6um', pitch: '10um', dielectric: 'SiO2', chip: 'main' }
  },
  rdl_trace: {
    type: 'rdl_trace',
    label: 'Redistribution Layer (RDL)',
    category: 'routing',
    defaultParams: { pos_x: '0um', pos_y: '0um', length: '600um', width: '12um', tier: 'RDL-1', chip: 'main' }
  },
  cap_finger_in_frame: {
    type: 'cap_finger_in_frame',
    label: 'CapFingerInFrame',
    category: 'passives',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      frame_length: '245um',
      frame_width: '72um',
      frame_trace: '16um',
      cap_gap: '10um',
      ground_gap: '10um',
      frame_cpw_width: 'cpw_width',
      finger_cpw_width: 'cpw_width',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#ce9178'
    }
  },
  launchpad_wirebond: {
    type: 'launchpad_wirebond',
    label: 'LaunchpadWirebond',
    category: 'io',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      trace_width: 'cpw_width',
      trace_gap: 'cpw_gap',
      lead_length: '25um',
      pad_width: '80um',
      pad_height: '80um',
      pad_gap: '58um',
      taper_height: '122um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#c586c0'
    }
  },
  resonator_coil_rect: {
    type: 'resonator_coil_rect',
    label: 'ResonatorCoilRect',
    category: 'resonators',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      n: '3',
      length: '2000um',
      line_width: '1um',
      height: '40um',
      gap: '4um',
      coupler_distance: '10um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  line_tee: {
    type: 'line_tee',
    label: 'LineTee',
    category: 'couplers',
    defaultParams: { 
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      prime_width: '10um',
      prime_gap: '6um',
      second_width: '10um',
      second_gap: '6um',
      t_length: '50um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  coupled_line_tee: {
    type: 'coupled_line_tee',
    label: 'CoupledLineTee',
    category: 'couplers',
    defaultParams: { 
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      prime_width: '10um',
      prime_gap: '6um',
      second_width: '10um',
      second_gap: '6um',
      coupling_space: '3um',
      coupling_length: '100um',
      down_length: '100um',
      fillet: '25um',
      mirror: false,
      open_termination: true,
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  cap_n_interdigital_tee: {
    type: 'cap_n_interdigital_tee',
    label: 'CapNInterdigitalTee',
    category: 'couplers',
    defaultParams: { 
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      prime_width: '10um',
      prime_gap: '6um',
      second_width: '10um',
      second_gap: '6um',
      cap_gap: '6um',
      cap_width: '10um',
      finger_length: '20um',
      finger_count: '5',
      cap_distance: '50um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  resonator_lumped: {
    type: 'resonator_lumped',
    label: 'ResonatorLumped',
    category: 'resonators',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      box_width: '5mm',
      box_height: '5mm',
      perimeter_thickness: '0.01mm',
      res_width: '0.01mm',
      initial: '0.1mm',
      n_turns: '14',
      turn_radius: '0.1mm',
      inner_space: '0.19mm',
      outer_space: '0.1mm',
      final: '2.5mm',
      break_width: '0.2mm',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  readoutres_fc: {
    type: 'readoutres_fc',
    label: 'ReadoutResFC',
    category: 'resonators',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      readout_radius: '50um',
      readout_cpw_width: '5um',
      readout_cpw_gap: '5um',
      readout_cpw_turnradius: '50um',
      readout_l1: '400um',
      readout_l2: '400um',
      readout_l3: '400um',
      readout_l4: '250um',
      readout_l5: '400um',
      arc_step: '1um',
      layer_subtract: '2',
      subtract: true,
      _default_connection_pads: {},
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  tunable_coupler_01: {
    type: 'tunable_coupler_01',
    label: 'TunableCoupler01',
    category: 'couplers',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      c_width: '400um',
      l_width: '20um',
      l_gap: '10um',
      a_height: '60um',
      cp_height: '15um',
      cp_arm_length: '30um',
      cp_arm_width: '6um',
      cp_gap: '6um',
      cp_gspace: '3um',
      fl_width: '5um',
      fl_gap: '3um',
      fl_length: '10um',
      fl_ground: '2um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  tunable_coupler_02: {
    type: 'tunable_coupler_02',
    label: 'TunableCoupler02',
    category: 'couplers',
    defaultParams: {
      pos_x: '0mm',
      pos_y: '0mm',
      orientation: '0',
      chip: 'main',
      layer: '1',
      pocket_width: '3mm',
      pocket_height: '2mm',
      pad_radius: '0.3mm',
      bus_width: '0.1mm',
      bus_inner_length: '0.5mm',
      bus_outer_length: '0.5mm',
      bus_JJ_height: '0.5mm',
      JJ_width: '0.1mm',
      JJ_length: '0.4mm',
      fbl_width: '0.1mm',
      fbl_length: '0.5mm',
      fbl_offset: '0.1mm',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  launchpad_wb_coupled: {
    type: 'launchpad_wb_coupled',
    label: 'LaunchpadWirebondCoupled',
    category: 'io',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      trace_width: 'cpw_width',
      trace_gap: 'cpw_gap',
      coupler_length: '62.5um',
      lead_length: '25um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#c586c0'
    }
  },
  launchpad_wb_driven: {
    type: 'launchpad_wb_driven',
    label: 'LaunchpadWirebondDriven',
    category: 'io',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      trace_width: 'cpw_width',
      trace_gap: 'cpw_gap',
      lead_length: '25um',
      pad_width: '80um',
      pad_height: '80um',
      pad_gap: '58um',
      taper_height: '122um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      color: '#c586c0'
    }
  },
  open_to_ground: {
    type: 'open_to_ground',
    label: 'OpenToGround',
    category: 'terminations',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      width: '10um',
      gap: '6um',
      termination_gap: '6um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  short_to_ground: {
    type: 'short_to_ground',
    label: 'ShortToGround',
    category: 'terminations',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      width: '10um',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  route_straight: {
    type: 'route_straight',
    label: 'RouteStraight',
    category: 'tlines',
    defaultParams: { 
      chip: 'main',
      layer: '1',
      pin_inputs: {
        start_pin: { component: '', pin: '' },
        end_pin: { component: '', pin: '' }
      },
      fillet: '0',
      lead: {
        start_straight: '0mm',
        end_straight: '0mm',
        start_jogged_extension: '',
        end_jogged_extension: ''
      },
      total_length: '7mm',
      trace_width: 'cpw_width',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  route_framed: {
    type: 'route_framed',
    label: 'RouteFramed',
    category: 'tlines',
    defaultParams: {
      chip: 'main',
      layer: '1',
      pin_inputs: {
        start_pin: { component: '', pin: '' },
        end_pin: { component: '', pin: '' }
      },
      fillet: '0',
      lead: {
        start_straight: '0mm',
        end_straight: '0mm',
        start_jogged_extension: '',
        end_jogged_extension: ''
      },
      total_length: '7mm',
      trace_width: 'cpw_width',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  route_meander: {
    type: 'route_meander',
    label: 'RouteMeander',
    category: 'tlines',
    defaultParams: {
      chip: 'main',
      layer: '1',
      pin_inputs: {
        start_pin: { component: '', pin: '' },
        end_pin: { component: '', pin: '' }
      },
      fillet: '0',
      lead: {
        start_straight: '0mm',
        end_straight: '0mm',
        start_jogged_extension: '',
        end_jogged_extension: ''
      },
      total_length: '7mm',
      trace_width: 'cpw_width',
      meander: {
        spacing: '200um',
        asymmetry: '0um'
      },
      snap: 'true',
      prevent_short_edges: 'true',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  route_anchors: {
    type: 'route_anchors',
    label: 'RouteAnchors',
    category: 'tlines',
    defaultParams: {
      chip: 'main',
      layer: '1',
      pin_inputs: {
        start_pin: { component: '', pin: '' },
        end_pin: { component: '', pin: '' }
      },
      fillet: '0',
      lead: {
        start_straight: '0mm',
        end_straight: '0mm',
        start_jogged_extension: '',
        end_jogged_extension: ''
      },
      total_length: '7mm',
      trace_width: 'cpw_width',
      anchors: {},
      advanced: {
        avoid_collision: 'false'
      },
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  route_pathfinder: {
    type: 'route_pathfinder',
    label: 'RoutePathfinder',
    category: 'tlines',
    defaultParams: {
      chip: 'main',
      layer: '1',
      pin_inputs: {
        start_pin: { component: '', pin: '' },
        end_pin: { component: '', pin: '' }
      },
      fillet: '0',
      lead: {
        start_straight: '0mm',
        end_straight: '0mm',
        start_jogged_extension: '',
        end_jogged_extension: ''
      },
      total_length: '7mm',
      trace_width: 'cpw_width',
      step_size: '0.25mm',
      anchors: {},
      advanced: {
        avoid_collision: 'true'
      },
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false
    }
  },
  route_mixed: {
    type: 'route_mixed',
    label: 'RouteMixed',
    category: 'tlines',
    defaultParams: {
      chip: 'main',
      layer: '1',
      pin_inputs: {
        start_pin: { component: '', pin: '' },
        end_pin: { component: '', pin: '' }
      },
      fillet: '0',
      lead: {
        start_straight: '0mm',
        end_straight: '0mm',
        start_jogged_extension: '',
        end_jogged_extension: ''
      },
      total_length: '7mm',
      trace_width: 'cpw_width',
      anchors: {},
      between_anchors: {},
      step_size: '0.25mm',
      hfss_wire_bonds: false,
      q3d_wire_bonds: false,
      aedt_q3d_wire_bonds: false,
      aedt_hfss_wire_bonds: false,
      meander: {
        spacing: '200um',
        asymmetry: '0um'
      },
      snap: 'true',
      prevent_short_edges: 'true',
      advanced: {
        avoid_collision: 'true'
      }
    }
  },
  polyline_cpw: {
    type: 'polyline_cpw',
    label: 'PolylineCPW',
    category: 'tlines',
    defaultParams: {
      points: '[[0, 0], [1.0, 0], [1.0, 1.0]]',
      trace_width: '10um',
      trace_gap: '6um',
      fillet: '0um',
      min_segment: '0um',
      taps: {},
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1'
    }
  },
  jj_dolan: {
    type: 'jj_dolan',
    label: 'JJ Dolan',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      JJ_pad_lower_width: '25um',
      JJ_pad_lower_height: '10um',
      JJ_pad_lower_pos_x: '0um',
      JJ_pad_lower_pos_y: '0um',
      finger_lower_width: '1um',
      finger_lower_height: '20um',
      extension: '1um',
      offset: '2um',
      second_metal_length: '5um',
      second_metal_width: '1um'
    }
  },
  jj_manhattan: {
    type: 'jj_manhattan',
    label: 'JJ Manhattan',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      JJ_pad_lower_width: '25um',
      JJ_pad_lower_height: '10um',
      JJ_pad_lower_pos_x: '0um',
      JJ_pad_lower_pos_y: '0um',
      finger_lower_width: '1um',
      finger_lower_height: '20um',
      extension: '1um'
    }
  },
  transmon_concentric: {
    type: 'transmon_concentric',
    label: 'Transmon Concentric',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      width: '1000um',
      height: '1000um',
      rad_o: '170um',
      rad_i: '115um',
      gap: '35um',
      jj_w: '10um',
      res_s: '100um',
      res_ext: '100um',
      fbl_rad: '100um',
      fbl_sp: '100um',
      fbl_gap: '80um',
      fbl_ext: '300um',
      pocket_w: '1500um',
      pocket_h: '1000um',
      cpw_width: '10um',
      inductor_width: '5um'
    }
  },
  transmon_concentric_type_2: {
    type: 'transmon_concentric_type_2',
    label: 'Transmon Concentric Type 2',
    category: 'qubits',
    defaultParams: {
      pos_x: '0um',
      pos_y: '0um',
      orientation: '0',
      chip: 'main',
      layer: '1',
      rad_outer: '2mm',
      rad_inner: '1mm',
      gap: '0.5mm',
      jj_w: '0.2mm',
      finger_NE_width: '0.1mm',
      finger_NE_length: '0.5mm',
      coupler_NE_width: '0.1mm',
      coupler_NE_gap: '0.1mm',
      finger_NW_width: '0.1mm',
      finger_NW_length: '0.5mm',
      coupler_NW_width: '0.1mm',
      coupler_NW_gap: '0.1mm',
      finger_SW_width: '0.1mm',
      finger_SW_length: '0.5mm',
      coupler_SW_width: '0.1mm',
      coupler_SW_gap: '0.1mm',
      finger_E_width: '0.1mm',
      finger_E_length: '0.5mm',
      box_E_width: '0.7mm',
      box_E_length: '0.7mm',
      finger_N_width: '0.1mm',
      finger_N_length: '2mm',
      triangle_base: '2mm',
      triangle_height: '1mm',
      pocket_w: '10mm',
      pocket_h: '10mm'
    }
  }
};

// Inject MultiPlanar support properties (chip, layer) to all component definitions
Object.values(COMPONENT_DEFINITIONS).forEach(def => {
  def.defaultParams.chip = 'main';
  def.defaultParams.layer = '1';
});

export const useEdaStore = create((set, get) => ({
  components: [],
  selectedComponentId: null,
  activeCanvasTab: 'Main View', // 'Main View' | '3D View' | 'QGeometry' | 'Net List'
  viewer3DEmMode: 0, // 0: PBR, 1: Electric Energy (u_E), 2: Magnetic Energy (u_H), 3: EPR Loss
  canvasTransform: { x: 0, y: 0, scale: 1 },
  variables: {
    cpw_width: '10um',
    cpw_gap: '6um'
  },
  chips: {
    main: {
      material: 'silicon',
      size_x: '9mm',
      size_y: '6mm',
      size_z: '-500um',
      layer_stack: 1 // Carrier Interposer
    },
    Q_chip: {
      material: 'sapphire',
      size_x: '7.8mm',
      size_y: '5.2mm',
      size_z: '300um',
      layer_stack: 2 // Flipped Qubit Die
    }
  },
  netlist: [], // Tracks pin connections
  dependencies: {}, // Tracks component dependencies
  
  setActiveCanvasTab: (tab) => set({ activeCanvasTab: tab }),
  setViewer3DEmMode: (mode) => set({ viewer3DEmMode: mode }),

  updateVariable: (key, value) => set(state => ({
    variables: { ...state.variables, [key]: value }
  })),

  updateChip: (chipName, key, value) => set(state => ({
    chips: { 
      ...state.chips, 
      [chipName]: { ...state.chips[chipName], [key]: value } 
    }
  })),

  // --- Alpha Paradox DesignPlanar API Mapping ---
  add_chip_info: () => set(state => {
    const numChips = Object.keys(state.chips).length;
    const newChipId = `chip_${numChips}`;
    return { 
      chips: { 
        ...state.chips, 
        [newChipId]: { 
          material: 'silicon', 
          size_x: '9mm', 
          size_y: '6mm', 
          size_z: '-500um',
          layer_stack: numChips + 1 // MultiPlanar layer stack assignment
        } 
      } 
    };
  }),

  // --- Alpha Paradox DesignFlipChip API Mapping ---
  create_flipchip_design: () => set(state => ({
    chips: {
      Q_chip: {
        material: 'silicon',
        size_x: '9mm',
        size_y: '6mm',
        size_z: '-500um',
        layer_stack: 1
      },
      C_chip: {
        material: 'silicon',
        size_x: '9mm',
        size_y: '6mm',
        size_z: '50um', // Flipped chip offset
        layer_stack: 2
      }
    },
    components: [],
    netlist: [],
    dependencies: {}
  })),

  add_dependency: (parent, child) => set(state => {
    const deps = { ...state.dependencies };
    if (!deps[parent]) deps[parent] = [];
    if (!deps[parent].includes(child)) deps[parent].push(child);
    return { dependencies: deps };
  }),
  
  // --- Alpha Paradox QNet API Mapping ---
  // Connect two pins and assign a unique net_id
  connect_pins: (comp1Id, pin1Name, comp2Id, pin2Name) => set(state => {
    const net_id = state.netlist.length > 0 ? Math.max(...state.netlist.map(n => n.net_id)) + 1 : 1;
    return {
      netlist: [...state.netlist, 
        { net_id, comp: comp1Id, pin: pin1Name },
        { net_id, comp: comp2Id, pin: pin2Name }
      ]
    };
  }),

  // Return the QNet net_info DataFrame equivalent
  get_net_info: () => {
    return get().netlist.map(net => {
      const comp = get().components.find(c => c.id === net.comp);
      return {
        net_id: net.net_id,
        component_name: comp ? comp.name : 'Unknown',
        pin_name: net.pin
      };
    });
  },

  all_component_names_id: () => {
    return get().components.map(c => ({ id: c.id, name: c.name }));
  },
  connect_pins: (comp1Id, pin1Name, comp2Id, pin2Name) => set(state => ({
    netlist: [...state.netlist, { comp1: comp1Id, pin1: pin1Name, comp2: comp2Id, pin2: pin2Name }]
  })),
  copy_multiple_qcomponents: (ids) => {
    ids.forEach(id => get().copy_qcomponent(id));
  },
  copy_qcomponent: (id) => set(state => {
    const compToCopy = state.components.find(c => c.id === id);
    if (!compToCopy) return state;
    idCounter++;
    const newComp = {
      ...compToCopy,
      id: `${compToCopy.type}_${idCounter}`,
      name: `${compToCopy.name}_copy`,
      params: { ...compToCopy.params, pos_x: `${parseFloat(compToCopy.params.pos_x || 0) + 100}um` }
    };
    return { components: [...state.components, newComp] };
  }),
  delete_all_components: () => set({ components: [], netlist: [], dependencies: {} }),
  delete_all_pins: () => set({ netlist: [] }),
  get_chip_layer: (chipName = 'main') => get().chips[chipName]?.layer || 1,
  get_chip_size: (chipName = 'main') => {
    const chip = get().chips[chipName];
    return { x: chip?.size_x, y: chip?.size_y };
  },
  get_chip_z: (chipName = 'main') => get().chips[chipName]?.size_z || '0um',
  get_design_name: () => 'QuantumDesign',
  get_units: () => 'um',
  get_x_y_for_chip: (chipName = 'main') => {
    const chip = get().chips[chipName];
    return [get().parseValue(chip?.size_x), get().parseValue(chip?.size_y)];
  },
  load_design: (data) => set({ ...data }),
  parse_options: (options) => {
    const parse = (obj) => {
      let result = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'object' && v !== null) result[k] = parse(v);
        else result[k] = get().parseValue(v);
      }
      return result;
    };
    return parse(options);
  },
  rebuild: () => {
    // Math recompilation triggers inside UI
    console.log('DesignPlanar API rebuild() called.');
  },
  remove_dependency: (parent, child) => set(state => {
    if (!state.dependencies || !state.dependencies[parent]) return state;
    return { dependencies: { ...state.dependencies, [parent]: state.dependencies[parent].filter(c => c !== child) } };
  }),
  rename_component: (id, newName) => set(state => ({
    components: state.components.map(c => c.id === id ? { ...c, name: newName } : c)
  })),
  rename_variable: (oldName, newName) => set(state => {
    const newVars = { ...state.variables };
    newVars[newName] = newVars[oldName];
    delete newVars[oldName];
    return { variables: newVars };
  }),
  save_design: () => {
    console.log("Saving DesignPlanar...", get());
  },
  // ----------------------------------------------

  // Parse a string value into numeric micrometers with math support
  parseValue: (val) => {
    const parser = new ParsedDynamicAttributes({}, get().variables);
    return parser.parseValue(val);
  },

  // Calculate mathematical QGeometry tables (path, poly, junction)
  // Physics: All geometry in micrometers. Polygons are WKT-like coordinate rings.
  // Transmon: H = 4Ec(n - ng)^2 - Ej*cos(phi). Geometry defines the capacitive pads
  //           that set Ec = e^2/(2C_total), and the junction that sets Ej.
  // CPW:     Z0 = (1/(2pi)) * sqrt(L/C) * arccosh(b/a), where a=trace_width, b=a+2*gap.
  //           Effective permittivity eps_eff = (eps_r + 1)/2 for coplanar geometry on substrate.
  getQGeometry: () => {
    const { components, parseValue, chips } = get();
    let qgeometry = { path: [], poly: [], junction: [], pins: {} };
    
    // Helper: add a pin with normal/tangent vector
    // Matches Alpha Paradox add_pin(name, points, width, input_as_norm, chip, gap)
    const addPin = (compName, pinName, p1, p2, width, chip, input_as_norm = false, gap = null) => {
      let mid, normal, tangent;
      
      // Validate input_as_norm usage as requested by user
      const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      if (!input_as_norm) {
        if (Math.abs(dist - width) > 0.05 * width + 0.001) {
          console.warn(`[QGeometry] add_pin('${compName}', '${pinName}') Warning: input_as_norm=False but distance between points (${dist.toFixed(2)}) != width (${width.toFixed(2)}). You may have mixed up the input_as_norm forms!`);
        }
      }

      if (!input_as_norm) {
        // input_as_norm=False: points is line ACROSS conductor
        // middle = midpoint, normal = perpendicular to line
        mid = [(p1[0] + p2[0])/2, (p1[1] + p2[1])/2];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy) || 1;
        normal = [dy/len, -dx/len]; 
        tangent = [dx/len, dy/len];
      } else {
        // input_as_norm=True: points is line ALONG intended connection
        // middle = points[1], normal runs from points[0] toward points[1]
        mid = [...p2];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy) || 1;
        normal = [dx/len, dy/len];
        tangent = [-dy/len, dx/len];
      }
      if (!qgeometry.pins[compName]) qgeometry.pins[compName] = {};
      qgeometry.pins[compName][pinName] = {
        points: [p1, p2],
        middle: mid,
        normal: normal,
        tangent: tangent,
        width: width,
        chip: chip || 'main',
        gap: gap !== null ? gap : 0.6 * width,
        parent_name: compName,
        net_id: 0
      };
    };
    

    // Helper: rotate point (px,py) around origin by angle (radians)
    const rot = (px, py, angle) => {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [px * c - py * s, px * s + py * c];
    };
    
    // Helper: make a polygon string from points array [[x,y], ...]
    const polyStr = (pts) => `POLYGON((${pts.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(', ')}))`;
    const lineStr = (pts) => `LINESTRING(${pts.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(', ')})`;
    
    // Helper: create a rectangle centered at (cx,cy) with half-widths hw,hh then rotate and translate
    const makeRect = (cx, cy, hw, hh, angle, tx, ty) => {
      const corners = [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh],[-hw,-hh]];
      return corners.map(([px,py]) => {
        const [rx, ry] = rot(px + cx, py + cy, angle);
        return [rx + tx, ry + ty];
      });
    };

    components.forEach(comp => {
      const p = comp.params;
      const x = parseValue(p.pos_x || '0');
      const y = parseValue(p.pos_y || '0');
      const theta = (parseValue(p.orientation || '0')) * Math.PI / 180;

      if (comp.type === 'circle_caterpillar') {
        // Physics/Geometry: A caterpillar is a sequence of circles spaced by 'distance'.
        const segs = parseInt(parseValue(p.segments || '5'));
        const rad = parseValue(p.radius || '300');
        const resolution = parseInt(parseValue(p.resolution || '16'));
        const dist = parseValue(p.distance || '1.2');

        // Draw multiple overlapping circles to mimic shapely union
        for (let i = 0; i < segs; i++) {
          const cx = -rad * i * dist;
          const pts = [];
          for (let j = 0; j <= resolution; j++) {
            const a = (j / resolution) * Math.PI * 2;
            const [rx, ry] = rot(cx + rad * Math.cos(a), rad * Math.sin(a), theta);
            pts.push([rx + x, ry + y]);
          }
          qgeometry.poly.push({ 
            component: comp.name, 
            name: `circle_${i}`, 
            layer: p.layer || 1, 
            subtract: p.subtract === 'True', 
            chip: p.chip || 'main', 
            helper: p.helper === 'True', 
            geometry: polyStr(pts) 
          });
        }
        
        // The tiny polygon cutout (0,0), (0.5,0), (0.25,0.5) scaled/rotated by 65deg 
        // We will approximate this cutout by adding it as a subtract polygon over the main one
        const cutoutPts = [[0,0], [0.5,0], [0.25,0.5]];
        const absCutout = cutoutPts.map(([px, py]) => {
           const [rx, ry] = rot(px, py, 65 * Math.PI / 180);
           const [rrx, rry] = rot(rx, ry, theta);
           return [rrx + x, rry + y];
        });
        qgeometry.poly.push({
           component: comp.name,
           name: 'cutout',
           layer: p.layer || 1,
           subtract: true, // Always subtract this from the caterpillar
           chip: p.chip || 'main',
           helper: p.helper === 'True',
           geometry: polyStr(absCutout)
        });
      } else if (comp.type === 'circle_raster') {
        const rad = parseValue(p.radius || '300');
        const resolution = parseInt(parseValue(p.resolution || '16'));

        const circlePts = [];
        for (let j = 0; j <= resolution; j++) {
          const a = (j / resolution) * Math.PI * 2;
          circlePts.push([x + rad * Math.cos(a), y + rad * Math.sin(a)]);
        }

        qgeometry.poly.push({
          component: comp.name, name: `circle`, layer: p.layer || 1, subtract: p.subtract === 'True', chip: p.chip || 'main', helper: p.helper === 'True',
          geometry: polyStr(circlePts)
        });
      } else if (comp.type === 'n_gon') {
        const n = Math.max(3, parseInt(parseValue(p.n || '3')));
        const rad = parseValue(p.radius || '30');

        const pts = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const [rx, ry] = rot(rad * Math.cos(a), rad * Math.sin(a), theta);
          pts.push([rx + x, ry + y]);
        }
        pts.push([...pts[0]]); // Close polygon

        qgeometry.poly.push({
          component: comp.name, name: 'ngon_body', layer: p.layer || 1, subtract: p.subtract === 'True', chip: p.chip || 'main',
          geometry: polyStr(pts)
        });
      } else if (comp.type === 'star_polygon') {
        const nPts = Math.max(3, parseInt(parseValue(p.n_points || '5')));
        const outRad = parseValue(p.outer_radius || '60');
        const inRad = parseValue(p.inner_radius || '25');

        const pts = [];
        for (let i = 0; i < nPts * 2; i++) {
          const r = i % 2 === 0 ? outRad : inRad;
          const a = (i / (nPts * 2)) * Math.PI * 2;
          const [rx, ry] = rot(r * Math.cos(a), r * Math.sin(a), theta);
          pts.push([rx + x, ry + y]);
        }
        pts.push([...pts[0]]); // Close polygon

        qgeometry.poly.push({
          component: comp.name, name: 'star_body', layer: p.layer || 1, subtract: p.subtract === 'True', chip: p.chip || 'main',
          geometry: polyStr(pts)
        });
      } else if (comp.type === 'n_square_spiral') {
        const nTurns = parseInt(parseValue(p.n || '3'));
        const w = parseValue(p.width || '1um');
        const gap = parseValue(p.gap || '4um');
        const inRad = parseValue(p.radius || '40um');

        let pts = [];
        const pitch = w + gap;
        
        for (let i = 0; i < nTurns; i++) {
           const pv = inRad / 2 + i * pitch;
           pts.push([-pv, -pv]);
           pts.push([pv, -pv]);
           pts.push([pv, pv]);
           pts.push([-pv - pitch, pv]);
        }
        
        const final_pv = inRad / 2 + nTurns * pitch;
        pts.push([-final_pv, -final_pv]);

        const absPts = pts.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });

        qgeometry.path.push({
          component: comp.name, name: 'spiral', layer: p.layer || 1, subtract: p.subtract === 'True', chip: p.chip || 'main', helper: p.helper === 'True',
          width: w, geometry: lineStr(absPts)
        });

        // Add the pin at the outer end of the spiral trace
        if (absPts.length >= 2) {
          const p1 = absPts[absPts.length - 2];
          const p2 = absPts[absPts.length - 1];
          addPin(comp.name, 'spiralPin', p1, p2, w, p.chip || 'main', true);
        }
      } else if (comp.type === 'rectangle') {
        const w = parseValue(p.width || '300');
        const h = parseValue(p.height || '150');
        const isSubtract = String(p.subtract).toLowerCase() === 'true';

        const rect = makeRect(0, 0, w/2, h/2, theta, x, y);
        qgeometry.poly.push({
          component: comp.name, name: 'rect_body', layer: p.layer || 1, subtract: isSubtract, chip: p.chip || 'main',
          geometry: polyStr(rect)
        });
      } else if (comp.type === 'circle') {
        const rad = parseValue(p.radius || '100');
        const isSubtract = String(p.subtract).toLowerCase() === 'true';

        const circlePts = [];
        for (let j = 0; j < 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          circlePts.push([x + rad * Math.cos(a), y + rad * Math.sin(a)]); // no rot needed for circle
        }
        circlePts.push([x + rad, y]);

        qgeometry.poly.push({
          component: comp.name, name: 'circle_body', layer: p.layer || 1, subtract: isSubtract, chip: p.chip || 'main',
          geometry: polyStr(circlePts)
        });
      } else if (comp.type === 'ellipse') {
        const rx = parseValue(p.radius_x || '150');
        const ry = parseValue(p.radius_y || '80');
        const isSubtract = String(p.subtract).toLowerCase() === 'true';

        const pts = [];
        for (let j = 0; j < 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          const [rotX, rotY] = rot(rx * Math.cos(a), ry * Math.sin(a), theta);
          pts.push([rotX + x, rotY + y]);
        }
        pts.push([...pts[0]]);

        qgeometry.poly.push({
          component: comp.name, name: 'ellipse_body', layer: p.layer || 1, subtract: isSubtract, chip: p.chip || 'main',
          geometry: polyStr(pts)
        });
      } else if (comp.type === 'rectangle_hollow') {
        const w = parseValue(p.width || '500');
        const h = parseValue(p.height || '300');
        const isSub = String(p.subtract).toLowerCase() === 'true';

        // Read from inner dictionary
        const inner = p.inner || {};
        const iw = parseValue(inner.width || '250');
        const ih = parseValue(inner.height || '100');
        const iox = parseValue(inner.offset_x || '40');
        const ioy = parseValue(inner.offset_y || '-20');
        const innerTheta = parseFloat(inner.orientation || '15') * (Math.PI / 180);

        const tr_o = rot(w/2, h/2, theta);
        const tl_o = rot(-w/2, h/2, theta);
        const bl_o = rot(-w/2, -h/2, theta);
        const br_o = rot(w/2, -h/2, theta);
        
        // Inner vertices calculation (includes local offset/rotation, then global rotation)
        const getInnerPt = (ix, iy) => {
          const [rix, riy] = rot(ix, iy, innerTheta);
          const tx = rix + iox;
          const ty = riy + ioy;
          const [gx, gy] = rot(tx, ty, theta);
          return [gx + x, gy + y];
        };

        const tr_i = getInnerPt(iw/2, ih/2);
        const tl_i = getInnerPt(-iw/2, ih/2);
        const bl_i = getInnerPt(-iw/2, -ih/2);
        const br_i = getInnerPt(iw/2, -ih/2);

        const pts = [
          [tr_o[0]+x, tr_o[1]+y], [tl_o[0]+x, tl_o[1]+y],
          [bl_o[0]+x, bl_o[1]+y], [br_o[0]+x, br_o[1]+y],
          [tr_o[0]+x, tr_o[1]+y], // Close outer
          tr_i, // Slit inwards
          br_i, bl_i,
          tl_i, tr_i  // Close inner
        ];

        qgeometry.poly.push({
          component: comp.name, name: 'rect_hollow', layer: 1, subtract: isSub, chip: 'main', geometry: polyStr(pts)
        });
      } else if (comp.type === 'circle_hollow') {
        const outR = parseValue(p.outer_radius || '100');
        const inR = parseValue(p.inner_radius || '60');
        const isSub = String(p.subtract).toLowerCase() === 'true';

        const pts = [];
        for (let j = 0; j <= 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          pts.push([x + outR * Math.cos(a), y + outR * Math.sin(a)]);
        }
        for (let j = 32; j >= 0; j--) {
          const a = (j / 32) * Math.PI * 2;
          pts.push([x + inR * Math.cos(a), y + inR * Math.sin(a)]);
        }

        qgeometry.poly.push({
          component: comp.name, name: 'circle_hollow', layer: 1, subtract: isSub, chip: 'main', geometry: polyStr(pts)
        });
      } else if (comp.type === 'cap_3_interdigital') {
        const nFingers = 3;
        const tw = parseValue(p.trace_width || '10');
        const fl = parseValue(p.finger_length || '65');
        const pbx = parseValue(p.pocket_buffer_width_x || '10');
        const pby = parseValue(p.pocket_buffer_width_y || '30');

        const totalW = (2 * nFingers - 1) * tw;
        const capH = fl + 3 * tw; // Distance between anchors is fl + tw (so gap is tw)
        
        // Pad 1 (Top) - fingers pointing down
        const p1Pts = [];
        p1Pts.push([-tw/2, capH/2 + pby]); // Top trace left
        p1Pts.push([-tw/2, capH/2]);       // Anchor top left
        p1Pts.push([-totalW/2, capH/2]);   // Anchor left end
        p1Pts.push([-totalW/2, capH/2 - tw]); // Anchor bottom left
        
        for (let i = 0; i < nFingers; i++) {
          if (i % 2 === 0) { // Top pad owns even fingers
            const fxCenter = -totalW/2 + tw/2 + i * 2 * tw;
            p1Pts.push([fxCenter - tw/2, capH/2 - tw]);
            p1Pts.push([fxCenter - tw/2, capH/2 - tw - fl]);
            p1Pts.push([fxCenter + tw/2, capH/2 - tw - fl]);
            p1Pts.push([fxCenter + tw/2, capH/2 - tw]);
          }
        }
        
        p1Pts.push([totalW/2, capH/2 - tw]);
        p1Pts.push([totalW/2, capH/2]);
        p1Pts.push([tw/2, capH/2]);
        p1Pts.push([tw/2, capH/2 + pby]);
        
        const p1Poly = p1Pts.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({
          component: comp.name, name: 'pad_top', layer: 1, subtract: false, chip: 'main', geometry: polyStr(p1Poly)
        });

        // Pad 2 (Bottom) - fingers pointing up
        const p2Pts = [];
        p2Pts.push([tw/2, -capH/2 - pby]); 
        p2Pts.push([tw/2, -capH/2]);
        p2Pts.push([totalW/2, -capH/2]);
        p2Pts.push([totalW/2, -capH/2 + tw]);
        
        // Build bottom fingers right to left
        for (let i = nFingers - 1; i >= 0; i--) {
          if (i % 2 !== 0) { // Bottom pad owns odd fingers
            const fxCenter = -totalW/2 + tw/2 + i * 2 * tw;
            p2Pts.push([fxCenter + tw/2, -capH/2 + tw]);
            p2Pts.push([fxCenter + tw/2, -capH/2 + tw + fl]);
            p2Pts.push([fxCenter - tw/2, -capH/2 + tw + fl]);
            p2Pts.push([fxCenter - tw/2, -capH/2 + tw]);
          }
        }
        
        p2Pts.push([-totalW/2, -capH/2 + tw]);
        p2Pts.push([-totalW/2, -capH/2]);
        p2Pts.push([-tw/2, -capH/2]);
        p2Pts.push([-tw/2, -capH/2 - pby]);

        const p2Poly = p2Pts.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({
          component: comp.name, name: 'pad_bot', layer: 1, subtract: false, chip: 'main', geometry: polyStr(p2Poly)
        });

        // Ground Pocket Cutout
        const gw = totalW + 2 * pbx;
        const gh = capH + 2 * pby;
        const pocketPts = [
          [-gw/2, gh/2], [gw/2, gh/2],
          [gw/2, -gh/2], [-gw/2, -gh/2]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({
          component: comp.name, name: 'pocket', layer: 1, subtract: true, chip: 'main', geometry: polyStr(pocketPts)
        });

        const [ptTop1, ptTop2] = [[-tw/2, capH/2 + pby], [tw/2, capH/2 + pby]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'a', ptTop1, ptTop2, tw, 'main');

        const [ptBot1, ptBot2] = [[tw/2, -capH/2 - pby], [-tw/2, -capH/2 - pby]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'b', ptBot1, ptBot2, tw, 'main');

      } else if (comp.type === 'cap_n_interdigital' || comp.type === 'CapNInterdigital') {
        // Exact mathematical port of Qiskit Metal CapNInterdigital
        const N = parseInt(parseValue(p.finger_count || p.n_fingers || '5'));
        const cw = parseValue(p.cap_width || '10');
        const cg = parseValue(p.cap_gap || '6');
        const cgg = parseValue(p.cap_gap_ground || '6');
        const fl = parseValue(p.finger_length || '20');
        const cd = parseValue(p.cap_distance || '50');
        const nw = parseValue(p.north_width || '10');
        const ng = parseValue(p.north_gap || '6');
        const sw = parseValue(p.south_width || '10');
        const sg = parseValue(p.south_gap || '6');

        const totalW = N * cw + (N - 1) * cg;
        const boxH = cg + 2 * cw + fl;
        const cy = -cd - boxH / 2;

        // North CPW
        const nPts = [[0, 0], [0, -cd]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.path.push({ component: comp.name, name: 'north_cpw', layer: 1, chip: 'main', width: nw, geometry: lineStr(nPts) });
        qgeometry.path.push({ component: comp.name, name: 'north_cpw_sub', layer: 1, chip: 'main', width: nw + 2 * ng, subtract: true, geometry: lineStr(nPts) });

        // South CPW
        const sPts = [[0, -cd - boxH], [0, -2 * cd - boxH]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.path.push({ component: comp.name, name: 'south_cpw', layer: 1, chip: 'main', width: sw, geometry: lineStr(sPts) });
        qgeometry.path.push({ component: comp.name, name: 'south_cpw_sub', layer: 1, chip: 'main', width: sw + 2 * sg, subtract: true, geometry: lineStr(sPts) });

        // Interlocking Fingers Pad 1 (North/Top)
        const p1Pts = [];
        p1Pts.push([-totalW / 2, cy + boxH / 2]);
        p1Pts.push([totalW / 2, cy + boxH / 2]);
        p1Pts.push([totalW / 2, cy + boxH / 2 - cw]);
        for (let i = N - 1; i >= 0; i--) {
          if (i % 2 === 0) {
            const fxCenter = -totalW / 2 + cw / 2 + i * (cw + cg);
            p1Pts.push([fxCenter + cw / 2, cy + boxH / 2 - cw]);
            p1Pts.push([fxCenter + cw / 2, cy + boxH / 2 - cw - fl]);
            p1Pts.push([fxCenter - cw / 2, cy + boxH / 2 - cw - fl]);
            p1Pts.push([fxCenter - cw / 2, cy + boxH / 2 - cw]);
          }
        }
        p1Pts.push([-totalW / 2, cy + boxH / 2 - cw]);
        const p1Poly = p1Pts.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({ component: comp.name, name: 'cap_body_north', layer: 1, subtract: false, chip: 'main', geometry: polyStr(p1Poly) });

        // Interlocking Fingers Pad 2 (South/Bottom)
        const p2Pts = [];
        p2Pts.push([-totalW / 2, cy - boxH / 2]);
        p2Pts.push([-totalW / 2, cy - boxH / 2 + cw]);
        for (let i = 0; i < N; i++) {
          if (i % 2 !== 0) {
            const fxCenter = -totalW / 2 + cw / 2 + i * (cw + cg);
            p2Pts.push([fxCenter - cw / 2, cy - boxH / 2 + cw]);
            p2Pts.push([fxCenter - cw / 2, cy - boxH / 2 + cw + fl]);
            p2Pts.push([fxCenter + cw / 2, cy - boxH / 2 + cw + fl]);
            p2Pts.push([fxCenter + cw / 2, cy - boxH / 2 + cw]);
          }
        }
        p2Pts.push([totalW / 2, cy - boxH / 2 + cw]);
        p2Pts.push([totalW / 2, cy - boxH / 2]);
        const p2Poly = p2Pts.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({ component: comp.name, name: 'cap_body_south', layer: 1, subtract: false, chip: 'main', geometry: polyStr(p2Poly) });

        // Etch ground pocket
        const etchPts = [
          [-totalW / 2 - cgg, cy + boxH / 2 + cgg],
          [totalW / 2 + cgg, cy + boxH / 2 + cgg],
          [totalW / 2 + cgg, cy - boxH / 2 - cgg],
          [-totalW / 2 - cgg, cy - boxH / 2 - cgg]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({ component: comp.name, name: 'cap_etch', layer: 1, subtract: true, chip: 'main', geometry: polyStr(etchPts) });

        // Pins: north_end at (0, 0) pointing UP, south_end at (0, -2*cd - boxH) pointing DOWN
        const [nP1, nP2] = [[0, -cd], [0, 0]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'north_end', nP1, nP2, nw, 'main', true);

        const [sP1, sP2] = [[0, -cd - boxH], [0, -2 * cd - boxH]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'south_end', sP1, sP2, sw, 'main', true);

      } else if (comp.type === 'cap_n_interdigital_tee' || comp.type === 'CapNInterdigitalTee') {
        // Exact mathematical port of Qiskit Metal CapNInterdigitalTee
        const N = parseInt(parseValue(p.finger_count || '5'));
        const cw = parseValue(p.cap_width || '10');
        const cg = parseValue(p.cap_gap || '6');
        const pw = parseValue(p.prime_width || '10');
        const pg = parseValue(p.prime_gap || '6');
        const sw = parseValue(p.second_width || '10');
        const sg = parseValue(p.second_gap || '6');
        const fl = parseValue(p.finger_length || '20');
        const cd = parseValue(p.cap_distance || '50');

        const primeLen = cw * 2 * N;
        const totalW = N * cw + (N - 1) * cg;
        const boxH = cg + 2 * cw + fl;
        const cy = -cd - boxH / 2;

        // Prime CPW (bus along X)
        const primePts = [[-primeLen / 2, 0], [primeLen / 2, 0]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.path.push({ component: comp.name, name: 'prime_cpw', layer: 1, chip: 'main', width: pw, geometry: lineStr(primePts) });
        qgeometry.path.push({ component: comp.name, name: 'prime_cpw_sub', layer: 1, chip: 'main', width: pw + 2 * pg, subtract: true, geometry: lineStr(primePts) });

        // Second CPW top
        const secTopPts = [[0, -pw / 2], [0, -cd]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.path.push({ component: comp.name, name: 'second_cpw_top', layer: 1, chip: 'main', width: sw, geometry: lineStr(secTopPts) });
        qgeometry.path.push({ component: comp.name, name: 'second_cpw_top_sub', layer: 1, chip: 'main', width: sw + 2 * sg, subtract: true, geometry: lineStr(secTopPts) });

        // Interlocking Fingers Pad 1 (Top)
        const p1Pts = [];
        p1Pts.push([-totalW / 2, cy + boxH / 2]);
        p1Pts.push([totalW / 2, cy + boxH / 2]);
        p1Pts.push([totalW / 2, cy + boxH / 2 - cw]);
        for (let i = N - 1; i >= 0; i--) {
          if (i % 2 === 0) {
            const fxCenter = -totalW / 2 + cw / 2 + i * (cw + cg);
            p1Pts.push([fxCenter + cw / 2, cy + boxH / 2 - cw]);
            p1Pts.push([fxCenter + cw / 2, cy + boxH / 2 - cw - fl]);
            p1Pts.push([fxCenter - cw / 2, cy + boxH / 2 - cw - fl]);
            p1Pts.push([fxCenter - cw / 2, cy + boxH / 2 - cw]);
          }
        }
        p1Pts.push([-totalW / 2, cy + boxH / 2 - cw]);
        const p1Poly = p1Pts.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({ component: comp.name, name: 'cap_body_top', layer: 1, subtract: false, chip: 'main', geometry: polyStr(p1Poly) });

        // Interlocking Fingers Pad 2 (Bottom)
        const p2Pts = [];
        p2Pts.push([-totalW / 2, cy - boxH / 2]);
        p2Pts.push([-totalW / 2, cy - boxH / 2 + cw]);
        for (let i = 0; i < N; i++) {
          if (i % 2 !== 0) {
            const fxCenter = -totalW / 2 + cw / 2 + i * (cw + cg);
            p2Pts.push([fxCenter - cw / 2, cy - boxH / 2 + cw]);
            p2Pts.push([fxCenter - cw / 2, cy - boxH / 2 + cw + fl]);
            p2Pts.push([fxCenter + cw / 2, cy - boxH / 2 + cw + fl]);
            p2Pts.push([fxCenter + cw / 2, cy - boxH / 2 + cw]);
          }
        }
        p2Pts.push([totalW / 2, cy - boxH / 2 + cw]);
        p2Pts.push([totalW / 2, cy - boxH / 2]);
        const p2Poly = p2Pts.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({ component: comp.name, name: 'cap_body_bottom', layer: 1, subtract: false, chip: 'main', geometry: polyStr(p2Poly) });

        // Etch ground pocket
        const etchPts = [
          [-totalW / 2 - sg, cy + boxH / 2 + sg],
          [totalW / 2 + sg, cy + boxH / 2 + sg],
          [totalW / 2 + sg, cy - boxH / 2 - sg],
          [-totalW / 2 - sg, cy - boxH / 2 - sg]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.poly.push({ component: comp.name, name: 'cap_etch', layer: 1, subtract: true, chip: 'main', geometry: polyStr(etchPts) });

        // Second CPW bottom
        const secBotPts = [[0, -cd - boxH], [0, -2 * cd - boxH]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.path.push({ component: comp.name, name: 'second_cpw_bottom', layer: 1, chip: 'main', width: sw, geometry: lineStr(secBotPts) });
        qgeometry.path.push({ component: comp.name, name: 'second_cpw_bottom_sub', layer: 1, chip: 'main', width: sw + 2 * sg, subtract: true, geometry: lineStr(secBotPts) });

        // Pins: prime_start at (-primeLen/2, 0) pointing LEFT, prime_end at (+primeLen/2, 0) pointing RIGHT, second_end at (0, -2*cd - boxH) pointing DOWN
        const [psP1, psP2] = [[primeLen / 2, 0], [-primeLen / 2, 0]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'prime_start', psP1, psP2, pw, 'main', true);

        const [peP1, peP2] = [[-primeLen / 2, 0], [primeLen / 2, 0]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'prime_end', peP1, peP2, pw, 'main', true);

        const [s2P1, s2P2] = [[0, -cd - boxH], [0, -2 * cd - boxH]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'second_end', s2P1, s2P2, sw, 'main', true);
      } else if (comp.type === 'transmon_cross' || comp.type === 'TransmonCross' || comp.type === 'transmon_cross_fl' || comp.type === 'TransmonCrossFL') {
        // Physics: Cross-shaped capacitor pads define C_shunt which sets Ec
        // Ec = e^2 / (2 * C_total), where C_total ≈ C_shunt + C_jj
        const cw = parseValue(p.cross_width || '20um');    // arm width
        const cl = parseValue(p.cross_length || '200um');  // arm length
        const gap = parseValue(p.cross_gap || '20um');     // gap around cross (ground plane cutout)
        const jjw = parseValue(p.jj_width || p.inductor_width || '20um');

        // Vertical arm of cross
        qgeometry.poly.push({
          component: comp.name, name: 'cross_vert', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, cw / 2, cl, theta, x, y))
        });
        // Horizontal arm of cross
        qgeometry.poly.push({
          component: comp.name, name: 'cross_horiz', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, cl, cw / 2, theta, x, y))
        });
        // Ground plane pocket cutout
        qgeometry.poly.push({
          component: comp.name, name: 'pocket_vert', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(makeRect(0, 0, cw / 2 + gap, cl + gap, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'pocket_horiz', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(makeRect(0, 0, cl + gap, cw / 2 + gap, theta, x, y))
        });
        // Josephson junction at south arm
        const [jjBot, jjTop] = [[0, -cl], [0, -cl - gap]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'rect_jj', layer: 1, chip: 'main', width: cw,
          geometry: lineStr([jjBot, jjTop])
        });

        // Connector pads (claw/gap)
        const connPads = (p.connection_pads && Object.keys(p.connection_pads).length > 0)
          ? p.connection_pads
          : { readout: { connector_location: '0', connector_type: '0', claw_length: '30um', ground_spacing: '5um', claw_width: '10um', claw_gap: '6um', claw_cpw_length: '40um', claw_cpw_width: '10um' } };

        Object.keys(connPads).forEach((padName) => {
          const pc = connPads[padName] || {};
          const locAngle = parseFloat(pc.connector_location !== undefined ? pc.connector_location : '0');
          const clawL = parseValue(pc.claw_length || '30um');
          const clawW = parseValue(pc.claw_width || '10um');
          const clawG = parseValue(pc.claw_gap || '6um');
          const clawCpwW = parseValue(pc.claw_cpw_width || '10um');
          const clawCpwL = parseValue(pc.claw_cpw_length || '40um');
          const gs = parseValue(pc.ground_spacing || '5um');

          // Arm rotation angle: 0 => west (0 deg), 90 => north (-90 deg), 180 => east (180 deg), 270 => south (90 deg)
          let armRotDeg = 0;
          const normAngle = ((locAngle % 360) + 360) % 360;
          if (normAngle > 315 || normAngle <= 45) armRotDeg = 0;        // west
          else if (normAngle > 45 && normAngle <= 135) armRotDeg = -90; // north
          else if (normAngle > 135 && normAngle <= 225) armRotDeg = 180; // east
          else armRotDeg = 90;                                          // south

          const armRad = (armRotDeg * Math.PI) / 180;
          const totalDist = cl + gap + gs + clawG;
          const tClawHeight = 2 * clawG + 2 * clawW + 2 * gs + 2 * gap + cw;

          if (String(pc.connector_type) === '1') {
            // Gap-type connector (straight rectangular CPW stub)
            const gapPts = makeRect(-totalDist - clawCpwL / 2, 0, clawCpwL / 2, clawW / 2, theta + armRad, x, y);
            qgeometry.poly.push({ component: comp.name, name: `${padName}_connector_arm`, layer: 1, subtract: false, chip: 'main', geometry: polyStr(gapPts) });
            const gapEtchPts = makeRect(-totalDist - clawCpwL / 2, 0, clawCpwL / 2 + clawG, clawW / 2 + clawG, theta + armRad, x, y);
            qgeometry.poly.push({ component: comp.name, name: `${padName}_connector_etcher`, layer: 1, subtract: true, chip: 'main', geometry: polyStr(gapEtchPts) });
          } else {
            // Claw-type connector (exact 12-point U/C-shaped claw matching Qiskit Metal Screenshot 1)
            const claw12Pts = [
              [-totalDist - clawW - clawCpwL, -clawCpwW / 2],
              [-totalDist - clawW, -clawCpwW / 2],
              [-totalDist - clawW, -tClawHeight / 2],
              [-totalDist + clawL, -tClawHeight / 2],
              [-totalDist + clawL, -tClawHeight / 2 + clawW],
              [-totalDist, -tClawHeight / 2 + clawW],
              [-totalDist, tClawHeight / 2 - clawW],
              [-totalDist + clawL, tClawHeight / 2 - clawW],
              [-totalDist + clawL, tClawHeight / 2],
              [-totalDist - clawW, tClawHeight / 2],
              [-totalDist - clawW, clawCpwW / 2],
              [-totalDist - clawW - clawCpwL, clawCpwW / 2]
            ].map(([px, py]) => {
              const [rx1, ry1] = rot(px, py, armRad);
              const [rx2, ry2] = rot(rx1, ry1, theta);
              return [rx2 + x, ry2 + y];
            });
            qgeometry.poly.push({ component: comp.name, name: `${padName}_connector_arm`, layer: 1, subtract: false, chip: 'main', geometry: polyStr(claw12Pts) });

            // Claw etch border (buffered by clawG)
            const clawEtch12Pts = [
              [-totalDist - clawW - clawCpwL, -clawCpwW / 2 - clawG],
              [-totalDist - clawW - clawG, -clawCpwW / 2 - clawG],
              [-totalDist - clawW - clawG, -tClawHeight / 2 - clawG],
              [-totalDist + clawL + clawG, -tClawHeight / 2 - clawG],
              [-totalDist + clawL + clawG, -tClawHeight / 2 + clawW + clawG],
              [-totalDist + clawG, -tClawHeight / 2 + clawW + clawG],
              [-totalDist + clawG, tClawHeight / 2 - clawW - clawG],
              [-totalDist + clawL + clawG, tClawHeight / 2 - clawW - clawG],
              [-totalDist + clawL + clawG, tClawHeight / 2 + clawG],
              [-totalDist - clawW - clawG, tClawHeight / 2 + clawG],
              [-totalDist - clawW - clawG, clawCpwW / 2 + clawG],
              [-totalDist - clawW - clawCpwL, clawCpwW / 2 + clawG]
            ].map(([px, py]) => {
              const [rx1, ry1] = rot(px, py, armRad);
              const [rx2, ry2] = rot(rx1, ry1, theta);
              return [rx2 + x, ry2 + y];
            });
            qgeometry.poly.push({ component: comp.name, name: `${padName}_connector_etcher`, layer: 1, subtract: true, chip: 'main', geometry: polyStr(clawEtch12Pts) });
          }

          // CPW lead & pin
          const feedEndDist = totalDist + clawW + clawCpwL;
          const [pPin1, pPin2] = [
            [-feedEndDist, -clawCpwW / 2],
            [-feedEndDist, clawCpwW / 2]
          ].map(([px, py]) => {
            const [rx1, ry1] = rot(px, py, armRad);
            const [rx2, ry2] = rot(rx1, ry1, theta);
            return [rx2 + x, ry2 + y];
          });
          addPin(comp.name, padName, pPin1, pPin2, clawCpwW, 'main', false);
        });

        // Flux line for TransmonCrossFL
        if ((comp.type === 'transmon_cross_fl' || comp.type === 'TransmonCrossFL') && p.make_fl !== false) {
          const pf = p.fl_options || {};
          const tTop = parseValue(pf.t_top || '15um');
          const tOff = parseValue(pf.t_offset || '0um');
          const tIndGap = parseValue(pf.t_inductive_gap || '3um');
          const tW = parseValue(pf.t_width || '5um');
          const tGap = parseValue(pf.t_gap || '3um');

          const flY = -(cl + gap + tIndGap + tW / 2 + tGap);
          const flLeadLen = 0.03; // 30um lead length

          const [h1, h2] = [[-tTop / 2, flY], [tTop / 2, flY]].map(([px, py]) => {
            const [rx, ry] = rot(px, py, theta);
            return [rx + x, ry + y];
          });
          const [v1, v2] = [[tOff, flY], [tOff, flY - flLeadLen]].map(([px, py]) => {
            const [rx, ry] = rot(px, py, theta);
            return [rx + x, ry + y];
          });

          qgeometry.path.push({
            component: comp.name, name: 'h_line', layer: 1, chip: 'main', width: tW,
            geometry: lineStr([h1, h2])
          });
          qgeometry.path.push({
            component: comp.name, name: 'v_line', layer: 1, chip: 'main', width: tW,
            geometry: lineStr([v1, v2])
          });
          qgeometry.path.push({
            component: comp.name, name: 'h_line_sub', layer: 1, chip: 'main', width: tW + 2 * tGap, subtract: true,
            geometry: lineStr([h1, h2])
          });
          qgeometry.path.push({
            component: comp.name, name: 'v_line_sub', layer: 1, chip: 'main', width: tW + 2 * tGap, subtract: true,
            geometry: lineStr([v1, v2])
          });

          addPin(comp.name, 'flux_line', v1, v2, tW, 'main', true);
        }

      } else if (comp.type === 'transmon_pocket' || comp.type === 'TransmonPocket' || comp.type === 'transmon_pocket_cl' || comp.type === 'TransmonPocketCL' || comp.type === 'transmon_pocket_6' || comp.type === 'TransmonPocket6' || comp.type === 'transmon_pocket_teeth' || comp.type === 'TransmonPocketTeeth') {
        // Physics: Two rectangular capacitor pads separated by a gap
        const pw = parseValue(p.pad_width || '455um');
        const ph = parseValue(p.pad_height || '90um');
        const pg = parseValue(p.pad_gap || '30um');
        const pocketW = parseValue(p.pocket_width || '650um');
        const pocketH = parseValue(p.pocket_height || '650um');
        const indW = parseValue(p.inductor_width || '20um');

        const isTeeth = comp.type === 'transmon_pocket_teeth' || comp.type === 'TransmonPocketTeeth';

        // Top pad
        qgeometry.poly.push({
          component: comp.name, name: 'pad_top', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, (ph + pg) / 2, pw / 2, ph / 2, theta, x, y))
        });
        // Bottom pad
        qgeometry.poly.push({
          component: comp.name, name: 'pad_bot', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, -(ph + pg) / 2, pw / 2, ph / 2, theta, x, y))
        });

        if (isTeeth) {
          // Rounded caps on left and right sides of top & bottom pads
          [-pw / 2, pw / 2].forEach((cx, idx) => {
            qgeometry.poly.push({
              component: comp.name, name: `cap_top_${idx}`, layer: 1, subtract: false, chip: 'main',
              geometry: polyStr(makeRect(cx, (ph + pg) / 2, ph / 4, ph / 2, theta, x, y))
            });
            qgeometry.poly.push({
              component: comp.name, name: `cap_bot_${idx}`, layer: 1, subtract: false, chip: 'main',
              geometry: polyStr(makeRect(cx, -(ph + pg) / 2, ph / 4, ph / 2, theta, x, y))
            });
          });

          // Teeth extending upwards from top pad
          const cpH = parseValue(p.coupled_pad_height || '150um');
          const cpW = parseValue(p.coupled_pad_width || '20um');
          const cpG = parseValue(p.coupled_pad_gap || '50um');

          const toothLeftX = -(cpW / 2 + cpG / 2);
          const toothRightX = (cpW / 2 + cpG / 2);
          const toothY = (ph + pg) / 2 + ph / 2 + cpH / 2;

          qgeometry.poly.push({
            component: comp.name, name: 'tooth_top_left', layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(makeRect(toothLeftX, toothY, cpW / 2, cpH / 2, theta, x, y))
          });
          qgeometry.poly.push({
            component: comp.name, name: 'tooth_top_right', layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(makeRect(toothRightX, toothY, cpW / 2, cpH / 2, theta, x, y))
          });
        }

        // Pocket cutout from ground plane
        qgeometry.poly.push({
          component: comp.name, name: 'pocket', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(makeRect(0, 0, pocketW / 2, pocketH / 2, theta, x, y))
        });
        // Junction connecting the two pads (center inductive bridge)
        const [jjTop, jjBot] = [[0, pg / 2], [0, -pg / 2]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'rect_jj', layer: 1, chip: 'main', width: indW,
          geometry: lineStr([jjTop, jjBot])
        });
        qgeometry.poly.push({
          component: comp.name, name: 'jj_bridge', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, indW / 2, pg / 2, theta, x, y))
        });

        // Connection pads (coupler pads inside pocket with rising jog or vertical CPW feed lines)
        const connPads = (p.connection_pads && Object.keys(p.connection_pads).length > 0)
          ? p.connection_pads
          : { readout: { loc_W: '+1', loc_H: '+1', pad_gap: '15um', pad_width: '125um', pad_height: '30um', pad_cpw_shift: '5um', pad_cpw_extent: '25um', cpw_width: '10um', cpw_gap: '6um', cpw_extend: '100um', pocket_extent: '5um', pocket_rise: '65um' } };

        Object.keys(connPads).forEach((padName) => {
          const pc = connPads[padName] || {};
          const locW = parseFloat(pc.loc_W !== undefined ? pc.loc_W : '+1');
          const locH = parseFloat(pc.loc_H !== undefined ? pc.loc_H : '+1');
          const cPadW = parseValue(pc.pad_width || '125um');
          const cPadH = parseValue(pc.pad_height || '30um');
          const cPadGap = parseValue(pc.pad_gap || '15um');
          const cpwW = parseValue(pc.cpw_width || '10um');
          const cpwG = parseValue(pc.cpw_gap || '6um');
          const cpwExtend = parseValue(pc.cpw_extend || '100um');
          const pocketExtent = parseValue(pc.pocket_extent || '5um');
          const pocketRise = parseValue(pc.pocket_rise !== undefined ? pc.pocket_rise : '65um');
          const padCpwShift = parseValue(pc.pad_cpw_shift || '5um');
          const padCpwExtent = parseValue(pc.pad_cpw_extent || '25um');

          if (locW !== 0) {
            // Connector pad rectangle near outer corner of island
            const padCenterX = locW * (pw / 2 - cPadW / 2);
            const padCenterY = locH * (ph + pg / 2 + cPadGap + cPadH / 2);

            qgeometry.poly.push({
              component: comp.name, name: `${padName}_connector_pad`, layer: 1, subtract: false, chip: 'main',
              geometry: polyStr(makeRect(padCenterX, padCenterY, cPadW / 2, cPadH / 2, theta, x, y))
            });

            // Wire path: 4-point rising jog matching Qiskit Metal connector_wire_path
            const yBase = locH * (ph + pg / 2 + cPadGap + padCpwShift + cpwW / 2);
            const yRisen = locH * (ph + pg / 2 + cPadGap + padCpwShift + cpwW / 2 + pocketRise);

            const wirePts = [
              [locW * (pw / 2), yBase],
              [locW * (pw / 2 + padCpwExtent), yBase],
              [locW * (pocketW / 2 - pocketExtent), yRisen],
              [locW * (pocketW / 2 + cpwExtend), yRisen]
            ].map(([px, py]) => {
              const [rx, ry] = rot(px, py, theta);
              return [rx + x, ry + y];
            });

            qgeometry.path.push({
              component: comp.name, name: `${padName}_wire`, layer: 1, chip: 'main', width: cpwW,
              geometry: lineStr(wirePts)
            });
            qgeometry.path.push({
              component: comp.name, name: `${padName}_wire_sub`, layer: 1, chip: 'main', width: cpwW + 2 * cpwG, subtract: true,
              geometry: lineStr(wirePts)
            });

            // Pin at wire termination outside ground pocket
            addPin(comp.name, padName, wirePts[2], wirePts[3], cpwW, 'main', true);
          } else {
            // locW === 0: top or bottom center connector pad and vertical wire (TransmonPocket6 / TransmonPocketTeeth)
            const padCenterY = locH * (ph + pg / 2 + cPadGap + cPadH / 2);
            qgeometry.poly.push({
              component: comp.name, name: `${padName}_connector_pad`, layer: 1, subtract: false, chip: 'main',
              geometry: polyStr(makeRect(0, padCenterY, cPadW / 2, cPadH / 2, theta, x, y))
            });

            const y1 = locH * (ph + pg / 2 + cPadGap + cPadH);
            const y2 = locH * (pocketH / 2 + cpwExtend);
            const vWirePts = [
              [0, y1],
              [0, y2]
            ].map(([px, py]) => {
              const [rx, ry] = rot(px, py, theta);
              return [rx + x, ry + y];
            });

            qgeometry.path.push({
              component: comp.name, name: `${padName}_wire`, layer: 1, chip: 'main', width: cpwW,
              geometry: lineStr(vWirePts)
            });
            qgeometry.path.push({
              component: comp.name, name: `${padName}_wire_sub`, layer: 1, chip: 'main', width: cpwW + 2 * cpwG, subtract: true,
              geometry: lineStr(vWirePts)
            });

            addPin(comp.name, padName, vWirePts[0], vWirePts[1], cpwW, 'main', true);
          }
        });

        // Charge Line for TransmonPocketCL
        if ((comp.type === 'transmon_pocket_cl' || comp.type === 'TransmonPocketCL') && p.make_CL !== false) {
          const clW = parseValue(p.cl_width || '10um');
          const clG = parseValue(p.cl_gap || '6um');
          const clL = parseValue(p.cl_length || '20um');
          const clGroundG = parseValue(p.cl_ground_gap || '6um');
          const clOff = parseValue(p.cl_off_center || '50um');

          // Placed on west edge by default
          const clPosX = -(pocketW / 2 + clGroundG + clG);
          const clPosY = clOff;

          const clArmPoly = makeRect(clPosX - clW / 2, clPosY + clL / 2, clW / 2, clL / 2, theta, x, y);
          const clCpwPoly = makeRect(clPosX - 4 * clW, clPosY + clW / 2, 4 * clW, clW / 2, theta, x, y);

          qgeometry.poly.push({
            component: comp.name, name: 'cl_arm', layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(clArmPoly)
          });
          qgeometry.poly.push({
            component: comp.name, name: 'cl_cpw', layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(clCpwPoly)
          });
          // Etch buffer around charge line
          const clEtchPoly = makeRect(clPosX - 4 * clW, clPosY + clL / 2, 4 * clW + clG, clL / 2 + clG, theta, x, y);
          qgeometry.poly.push({
            component: comp.name, name: 'cl_etcher', layer: 1, subtract: true, chip: 'main',
            geometry: polyStr(clEtchPoly)
          });

          // Pin for Charge_Line
          const [clP1, clP2] = [
            [clPosX - 8 * clW, clPosY],
            [clPosX - 8 * clW, clPosY + clW]
          ].map(([px, py]) => {
            const [rx, ry] = rot(px, py, theta);
            return [rx + x, ry + y];
          });
          addPin(comp.name, 'Charge_Line', clP1, clP2, clW, 'main', false);
        }

      } else if (comp.type === 'transmon_interdigitated' || comp.type === 'TransmonInterdigitated') {
        // Physics: Transmon pocket with large pads and interdigitated capacitive comb fingers
        const pw = parseValue(p.pad_width || '1000um');
        const ph = parseValue(p.pad_height || '300um');
        const fw = parseValue(p.finger_width || '50um');
        const fh = parseValue(p.finger_height || '100um');
        const fs = parseValue(p.finger_space || '50um');
        const cw = parseValue(p.comb_width || '50um');
        const csh = parseValue(p.comb_space_hor || '50um');
        const jjw = parseValue(p.jj_width || '20um');

        // Lower rectangular pad
        const lowerPadY = -0.5 * ph - fh - 0.5 * fs;
        qgeometry.poly.push({
          component: comp.name, name: 'pad_lower', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, lowerPadY, pw / 2, ph / 2, theta, x, y))
        });

        // Lower center finger
        const lowerFingerY = -0.5 * fh - 0.5 * fs;
        qgeometry.poly.push({
          component: comp.name, name: 'finger_lower', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, lowerFingerY, fw / 2, fh / 2, theta, x, y))
        });

        // Upper rectangular pad
        const upperPadY = 0.5 * ph + fh + 0.5 * fs;
        qgeometry.poly.push({
          component: comp.name, name: 'pad_upper', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, upperPadY, pw / 2, ph / 2, theta, x, y))
        });

        // Upper center finger
        const upperFingerY = 0.5 * fh + 0.5 * fs;
        qgeometry.poly.push({
          component: comp.name, name: 'finger_upper', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, upperFingerY, fw / 2, fh / 2, theta, x, y))
        });

        // Interdigitated combs: 4 lower fingers, 4 upper fingers
        const combOffsets = [
          0.5 * fw + csh + 0.5 * cw,
          0.5 * fw + csh + 0.5 * cw + 2 * (csh + cw),
          -0.5 * fw - 2 * csh - 1.5 * cw,
          -0.5 * fw - 2 * csh - 1.5 * cw - 2 * (csh + cw)
        ];

        combOffsets.forEach((cx, idx) => {
          // Lower comb extending upward
          qgeometry.poly.push({
            component: comp.name, name: `comb_lower_${idx}`, layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(makeRect(cx, lowerPadY + ph / 2 + fh, cw / 2, fh, theta, x, y))
          });
          // Upper comb extending downward (interdigitated shifted)
          const cxUpper = cx + (csh + cw);
          qgeometry.poly.push({
            component: comp.name, name: `comb_upper_${idx}`, layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(makeRect(cxUpper, upperPadY - ph / 2 - fh, cw / 2, fh, theta, x, y))
          });
        });

        // Ground pocket etching around whole interdigitated structure
        const pocketTotalW = pw + 2 * parseValue(p.comb_space_vert || '50um') + 200;
        const pocketTotalH = 2 * ph + 2 * fh + fs + 300;
        qgeometry.poly.push({
          component: comp.name, name: 'pocket_interdig', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(makeRect(0, 0, pocketTotalW / 2, pocketTotalH / 2, theta, x, y))
        });

        // Josephson Junction between center fingers
        const [jjP1, jjP2] = [[0, -0.5 * fs], [0, 0.5 * fs]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'rect_jj', layer: 1, chip: 'main', width: jjw,
          geometry: lineStr([jjP1, jjP2])
        });

        // 3 Coupling capacitors and Pins:
        // 1. Readout capacitor below lower pad
        const ccW = parseValue(p.cc_width || '100um');
        const ccH = parseValue(p.cc_height || '100um');
        const ccS = parseValue(p.cc_space || '50um');
        const ccY = lowerPadY - ph / 2 - ccS - ccH / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'cc_readout', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, ccY, ccW / 2, ccH / 2, theta, x, y))
        });
        const [rPin1, rPin2] = [[0, ccY - ccH / 2], [0, ccY - ccH / 2 - 30]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'readout', rPin1, rPin2, 10, 'main', true);

        // 2. Top-left capacitor (bus1)
        const cctlW = parseValue(p.cc_topleft_width || '100um');
        const cctlH = parseValue(p.cc_topleft_height || '100um');
        const cctlS = parseValue(p.cc_topleft_space || '50um');
        const cctlX = -pw / 2 + cctlW / 2;
        const cctlY = upperPadY + ph / 2 + cctlS + cctlH / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'cc_bus1', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(cctlX, cctlY, cctlW / 2, cctlH / 2, theta, x, y))
        });
        const [b1Pin1, b1Pin2] = [[cctlX, cctlY], [cctlX - cctlW / 2, cctlY]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'bus1', b1Pin1, b1Pin2, 10, 'main', true);

        // 3. Top-right capacitor (bus2)
        const cctrW = parseValue(p.cc_topright_width || '100um');
        const cctrH = parseValue(p.cc_topright_height || '100um');
        const cctrS = parseValue(p.cc_topright_space || '50um');
        const cctrX = pw / 2 - cctrW / 2;
        const cctrY = upperPadY + ph / 2 + cctrS + cctrH / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'cc_bus2', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(cctrX, cctrY, cctrW / 2, cctrH / 2, theta, x, y))
        });
        const [b2Pin1, b2Pin2] = [[cctrX, cctrY], [cctrX + cctrW / 2, cctrY]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'bus2', b2Pin1, b2Pin2, 10, 'main', true);

      } else if (comp.type === 'star_qubit' || comp.type === 'StarQubit') {
        const rad = parseValue(p.radius || '300um');
        const cRad = parseValue(p.center_radius || '100um');
        const gapCpl = parseValue(p.gap_couplers || '25um');
        const gapRd = parseValue(p.gap_readout || '10um');
        const connL = parseValue(p.connector_length || '75um');
        const jw = parseValue(p.cpw_width || '10um');
        const jh = parseValue(p.junc_h || '30um');
        const nConnectors = parseInt(p.number_of_connectors !== undefined ? p.number_of_connectors : 4, 10);

        // Ground pocket around star (outer circle)
        const pocketRad = rad * 1.35;
        const outerCirclePts = [];
        for (let i = 0; i <= 32; i++) {
          const ang = (i / 32) * 2 * Math.PI;
          const [rx, ry] = rot(pocketRad * Math.cos(ang), pocketRad * Math.sin(ang), theta);
          outerCirclePts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'circle_outer', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(outerCirclePts)
        });

        // Center star circular island
        const innerStarPts = [];
        for (let i = 0; i <= 32; i++) {
          const ang = (i / 32) * 2 * Math.PI;
          const r = (i % 2 === 0) ? rad * 0.95 : cRad * 1.15;
          const [rx, ry] = rot(r * Math.cos(ang), r * Math.sin(ang), theta);
          innerStarPts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'circle_inner', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(innerStarPts)
        });

        // Coupler pads and pins
        const cplAngles = [
          parseFloat(p.rotation_cpl1 || '0.0'),
          parseFloat(p.rotation_cpl2 || '72.0'),
          parseFloat(p.rotation_cpl3 || '216.0'),
          parseFloat(p.rotation_cpl4 || '288.0')
        ];
        for (let i = 0; i < Math.min(nConnectors, 4); i++) {
          const deg = cplAngles[i];
          const radAng = (deg * Math.PI) / 180;
          const padDist = rad + gapCpl + connL / 2;
          const px = padDist * Math.cos(radAng);
          const py = padDist * Math.sin(radAng);
          qgeometry.poly.push({
            component: comp.name, name: `contact_cpl${i + 1}`, layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(makeRect(px, py, connL / 2, jw * 1.5, theta, x, y))
          });

          // Pin at edge of coupler pad
          const pinDist = rad + gapCpl + connL;
          const [pinP1, pinP2] = [
            [pinDist * Math.cos(radAng), pinDist * Math.sin(radAng)],
            [(pinDist + 40) * Math.cos(radAng), (pinDist + 40) * Math.sin(radAng)]
          ].map(([ptx, pty]) => {
            const [rx, ry] = rot(ptx, pty, theta);
            return [rx + x, ry + y];
          });
          addPin(comp.name, `pin_cpl${i + 1}`, pinP1, pinP2, jw, 'main', true);
        }

        // Readout pad and pin
        const rdDeg = parseFloat(p.rotation_rdout || '144.0');
        const rdRadAng = (rdDeg * Math.PI) / 180;
        const rdDist = rad + gapRd + connL / 2;
        const rdx = rdDist * Math.cos(rdRadAng);
        const rdy = rdDist * Math.sin(rdRadAng);
        qgeometry.poly.push({
          component: comp.name, name: 'contact_rdout', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(rdx, rdy, connL / 2, jw * 1.5, theta, x, y))
        });
        const pinRdDist = rad + gapRd + connL;
        const [rdPin1, rdPin2] = [
          [pinRdDist * Math.cos(rdRadAng), pinRdDist * Math.sin(rdRadAng)],
          [(pinRdDist + 40) * Math.cos(rdRadAng), (pinRdDist + 40) * Math.sin(rdRadAng)]
        ].map(([ptx, pty]) => {
          const [rx, ry] = rot(ptx, pty, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'pin_rdout', rdPin1, rdPin2, jw, 'main', true);

        // Junction
        const [jjP1, jjP2] = [[0, -jh / 2], [0, jh / 2]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'rect_jj', layer: 1, chip: 'main', width: jw,
          geometry: lineStr([jjP1, jjP2])
        });

      } else if (comp.type === 'two_pad_transmon' || comp.type === 'TwoPadTransmon') {
        const pw = parseValue(p.pad_width || '500um');
        const ph = parseValue(p.pad_height || '1000um');
        const pgap = parseValue(p.pad_gap || '200um');
        const jw = parseValue(p.jj_width || '20um');
        const shift = (pgap + pw) / 2;

        qgeometry.poly.push({
          component: comp.name, name: 'pad_left', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(-shift, 0, pw / 2, ph / 2, theta, x, y))
        });

        qgeometry.poly.push({
          component: comp.name, name: 'pad_right', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(shift, 0, pw / 2, ph / 2, theta, x, y))
        });

        const [jjP1, jjP2] = [[-pgap / 2, 0], [pgap / 2, 0]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'jj', layer: 1, chip: 'main', width: jw,
          geometry: lineStr([jjP1, jjP2])
        });

        const [pL1, pL2] = [[-shift - pw / 2 + 1, 0], [-shift - pw / 2, 0]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'left', pL1, pL2, ph, 'main', true);

        const [pR1, pR2] = [[shift + pw / 2 - 1, 0], [shift + pw / 2, 0]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'right', pR1, pR2, ph, 'main', true);

      } else if (comp.type === 'tunable_coupler_01' || comp.type === 'TunableCoupler01') {
        const cW = parseValue(p.c_width || '400um');
        const lW = parseValue(p.l_width || '20um');
        const lGap = parseValue(p.l_gap || '10um');
        const aH = parseValue(p.a_height || '60um');
        const cpH = parseValue(p.cp_height || '15um');
        const cpArmL = parseValue(p.cp_arm_length || '30um');
        const cpArmW = parseValue(p.cp_arm_width || '6um');
        const cpGap = parseValue(p.cp_gap || '6um');
        const cpGspace = parseValue(p.cp_gspace || '3um');
        const flW = parseValue(p.fl_width || '5um');
        const flGap = parseValue(p.fl_gap || '3um');
        const flL = parseValue(p.fl_length || '10um');
        const flGround = parseValue(p.fl_ground || '2um');

        const xSpot = cW / 2 - lW / 2;

        // Bottom horizontal bar
        qgeometry.poly.push({
          component: comp.name, name: 'island_btm', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, cW / 2, lW / 2, theta, x, y))
        });

        // 6 vertical arms of the charge island
        const armXOffsets = [
          -xSpot,
          -(xSpot * 3 / 5),
          -(xSpot * 1 / 5),
          (xSpot * 1 / 5),
          (xSpot * 3 / 5),
          xSpot
        ];
        armXOffsets.forEach((ax, idx) => {
          const armPoly = makeRect(ax, (lW / 2 + aH) / 2, lW / 2, (aH - lW / 2) / 2, theta, x, y);
          qgeometry.poly.push({
            component: comp.name, name: `island_arm_${idx}`, layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(armPoly)
          });
        });

        // Ground plane subtractive pocket around charge island
        const islandCutout = makeRect(0, aH / 2, cW / 2 + lGap, aH / 2 + lGap, theta, x, y);
        qgeometry.poly.push({
          component: comp.name, name: 'island_pocket', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(islandCutout)
        });

        // Reference coordinates for coupler claw and flux line
        const cplX = (1 / 5) * xSpot;
        const cplY = aH + lGap + cpGap + cpGspace;
        const flY = aH + lGap + flGround + flGap + flW / 2;

        // SQUID Josephson Junction
        const [jjBot, jjTop] = [
          [-cplX * 3, aH],
          [-cplX * 3, aH + lGap]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'rect_jj', layer: 1, chip: 'main', width: lW,
          geometry: lineStr([jjBot, jjTop])
        });

        // Flux line path
        const flLead = 30; // 30um
        const fluxPts = [
          [-cplX * 3 - flL, flY],
          [-cplX * 3, flY],
          [-cplX * 3, flY + flLead]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.path.push({
          component: comp.name, name: 'flux_line', layer: 1, chip: 'main', width: flW,
          geometry: lineStr(fluxPts)
        });
        qgeometry.path.push({
          component: comp.name, name: 'flux_line_sub', layer: 1, chip: 'main', width: flW + 2 * flGap, subtract: true,
          geometry: lineStr(fluxPts)
        });
        addPin(comp.name, 'Flux', fluxPts[1], fluxPts[2], flW, 'main', true);

        // Connection claw (Control port)
        const conPadPoly = makeRect(cplX, cplY + cpH / 2, (1 / 5) * xSpot + cpArmW / 2, cpH / 2, theta, x, y);
        const conArmLPoly = makeRect(cplX - (1 / 5) * xSpot, cplY - cpArmL / 2, cpArmW / 2, cpArmL / 2, theta, x, y);
        const conArmRPoly = makeRect(cplX + (1 / 5) * xSpot, cplY - cpArmL / 2, cpArmW / 2, cpArmL / 2, theta, x, y);

        qgeometry.poly.push({ component: comp.name, name: 'con_pad', layer: 1, subtract: false, chip: 'main', geometry: polyStr(conPadPoly) });
        qgeometry.poly.push({ component: comp.name, name: 'con_arm_l', layer: 1, subtract: false, chip: 'main', geometry: polyStr(conArmLPoly) });
        qgeometry.poly.push({ component: comp.name, name: 'con_arm_r', layer: 1, subtract: false, chip: 'main', geometry: polyStr(conArmRPoly) });

        // Connector etcher cutout
        const conCutoutPoly = makeRect(cplX, cplY + cpH / 2 - cpArmL / 2, (1 / 5) * xSpot + cpArmW / 2 + cpGap, (cpH + cpArmL) / 2 + cpGap, theta, x, y);
        qgeometry.poly.push({ component: comp.name, name: 'con_pocket', layer: 1, subtract: true, chip: 'main', geometry: polyStr(conCutoutPoly) });

        // Control Pin
        const [ctrlP1, ctrlP2] = [
          [cplX, cplY],
          [cplX, cplY + cpH]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'Control', ctrlP1, ctrlP2, lW, 'main', true);

      } else if (comp.type === 'squid_loop' || comp.type === 'SQUID_LOOP') {
        const p1W = parseValue(p.plate1_width || '5.5um');
        const p1H = parseValue(p.plate1_height || '40um');
        const sGap = parseValue(p.squid_gap || '10um');
        const segAL = parseValue(p.segment_a_length || '10um');
        const segAW = parseValue(p.segment_a_width || '1um');
        const jjGap = parseValue(p.JJ_gap || '0.5um');
        const segBL = parseValue(p.segment_b_length || '5um');
        const segBW = parseValue(p.segment_b_width || '1um');
        const segCW = parseValue(p.segment_c_width || '1um');
        const segDL = parseValue(p.segment_d_length || '10um');
        const segDW = parseValue(p.segment_d_width || '2um');
        const p2W = parseValue(p.plate2_width || '6um');
        const p2H = parseValue(p.plate2_height || '30um');

        const upperY = 0.5 * (sGap + segAW);
        const lowerY = -0.5 * (sGap + segAW);
        const halfP1 = p1W / 2;

        // Plate 1 (left)
        qgeometry.poly.push({
          component: comp.name, name: 'plate1', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, halfP1, p1H / 2, theta, x, y))
        });

        // Upper arm: seg_a and seg_b
        const segAX = halfP1 + segAL / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'seg_a', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(segAX, upperY, segAL / 2, segAW / 2, theta, x, y))
        });
        const segBX = halfP1 + segAL + jjGap + segBL / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'seg_b', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(segBX, upperY, segBL / 2, segBW / 2, theta, x, y))
        });

        // Lower arm: seg_a_lower and seg_b_lower
        qgeometry.poly.push({
          component: comp.name, name: 'seg_a_lower', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(segAX, lowerY, segAL / 2, segAW / 2, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'seg_b_lower', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(segBX, lowerY, segBL / 2, segBW / 2, theta, x, y))
        });

        // Josephson Junctions across JJ_gap
        const [jjUpperP1, jjUpperP2] = [
          [halfP1 + segAL, upperY],
          [halfP1 + segAL + jjGap, upperY]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'rect_jj_upper', layer: 1, chip: 'main', width: segAW,
          geometry: lineStr([jjUpperP1, jjUpperP2])
        });

        const [jjLowerP1, jjLowerP2] = [
          [halfP1 + segAL, lowerY],
          [halfP1 + segAL + jjGap, lowerY]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'rect_jj_lower', layer: 1, chip: 'main', width: segAW,
          geometry: lineStr([jjLowerP1, jjLowerP2])
        });

        // Vertical connector seg_c
        const armSpanX = halfP1 + segAL + jjGap + segBL;
        const segCX = armSpanX + segCW / 2;
        const segCH = sGap + segAW + segBW;
        qgeometry.poly.push({
          component: comp.name, name: 'seg_c', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(segCX, 0, segCW / 2, segCH / 2, theta, x, y))
        });

        // Horizontal lead seg_d
        const segDX = armSpanX + segCW + segDL / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'seg_d', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(segDX, 0, segDL / 2, segDW / 2, theta, x, y))
        });

        // Plate 2 (right)
        const plate2X = armSpanX + segCW + segDL + p2W / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'plate2', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(plate2X, 0, p2W / 2, p2H / 2, theta, x, y))
        });

        // Pins: pin_a on plate1 (west) and pin_b on plate2 (east)
        const [pin1P1, pin1P2] = [[-halfP1, -p1H / 4], [-halfP1, p1H / 4]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'a', pin1P1, pin1P2, p1H / 2, 'main', false);

        const totalRight = armSpanX + segCW + segDL + p2W;
        const [pin2P1, pin2P2] = [[totalRight, -p2H / 4], [totalRight, p2H / 4]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'b', pin2P1, pin2P2, p2H / 2, 'main', false);

      } else if (comp.type === 'snail' || comp.type === 'SNAIL') {
        const p1W = parseValue(p.plate1_width || '5.5um');
        const p1H = parseValue(p.plate1_height || '40um');
        const sGap = parseValue(p.squid_gap || '10um');
        const segAL = parseValue(p.segment_a_length || '10um');
        const segAW = parseValue(p.segment_a_width || '1um');
        const jjGap = parseValue(p.JJ_gap || '0.5um');
        const segAbL = parseValue(p.segment_ab_length || '5um');
        const segBL = parseValue(p.segment_b_length || '5um');
        const segBW = parseValue(p.segment_b_width || '1um');
        const jjGapSmall = parseValue(p.JJ_gap_small || '0.3um');
        const segLowerW = parseValue(p.segment_lower_width || '0.6um');
        const segCW = parseValue(p.segment_c_width || '1um');
        const segDL = parseValue(p.segment_d_length || '10um');
        const segDW = parseValue(p.segment_d_width || '2um');
        const p2W = parseValue(p.plate2_width || '6um');
        const p2H = parseValue(p.plate2_height || '30um');
        const pinW = parseValue(p.pin_width || '5um');

        const upperY = 0.5 * (sGap + segAW);
        const lowerY = -0.5 * (sGap + segLowerW);
        const halfP1 = p1W / 2;
        const upperArmL = segAL + 2 * segAbL + segBL + 3 * jjGap;

        // Plate 1
        qgeometry.poly.push({
          component: comp.name, name: 'plate1', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, halfP1, p1H / 2, theta, x, y))
        });

        // Upper arm: seg_a, seg_ab1, seg_ab2, seg_b
        const ab1Start = halfP1 + segAL + jjGap;
        const ab2Start = ab1Start + segAbL + jjGap;
        const bStart = ab2Start + segAbL + jjGap;

        qgeometry.poly.push({
          component: comp.name, name: 'seg_a', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(halfP1 + segAL / 2, upperY, segAL / 2, segAW / 2, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'seg_ab1', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(ab1Start + segAbL / 2, upperY, segAbL / 2, segAW / 2, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'seg_ab2', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(ab2Start + segAbL / 2, upperY, segAbL / 2, segAW / 2, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'seg_b', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(bStart + segBL / 2, upperY, segBL / 2, segBW / 2, theta, x, y))
        });

        // 3 Large JJs on upper arm
        [
          [halfP1 + segAL, ab1Start],
          [ab1Start + segAbL, ab2Start],
          [ab2Start + segAbL, bStart]
        ].forEach(([x1, x2], idx) => {
          const [jjP1, jjP2] = [[x1, upperY], [x2, upperY]].map(([px, py]) => {
            const [rx, ry] = rot(px, py, theta);
            return [rx + x, ry + y];
          });
          qgeometry.junction.push({
            component: comp.name, name: `jj_large_${idx + 1}`, layer: 1, chip: 'main', width: segAW,
            geometry: lineStr([jjP1, jjP2])
          });
        });

        // Lower arm: single small JJ
        const lowerSegL = Math.max(0.0, 0.5 * (upperArmL - jjGapSmall));
        qgeometry.poly.push({
          component: comp.name, name: 'seg_a_lower', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(halfP1 + lowerSegL / 2, lowerY, lowerSegL / 2, segLowerW / 2, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'seg_b_lower', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(halfP1 + upperArmL - lowerSegL / 2, lowerY, lowerSegL / 2, segLowerW / 2, theta, x, y))
        });

        const [smallJjP1, smallJjP2] = [
          [halfP1 + lowerSegL, lowerY],
          [halfP1 + upperArmL - lowerSegL, lowerY]
        ].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.junction.push({
          component: comp.name, name: 'jj_small', layer: 1, chip: 'main', width: segLowerW,
          geometry: lineStr([smallJjP1, smallJjP2])
        });

        // Vertical connector seg_c
        const segCX = halfP1 + upperArmL + segCW / 2;
        const segCH = sGap + segAW + segBW;
        qgeometry.poly.push({
          component: comp.name, name: 'seg_c', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(segCX, 0, segCW / 2, segCH / 2, theta, x, y))
        });

        // Horizontal lead seg_d
        const segDX = halfP1 + upperArmL + segCW + segDL / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'seg_d', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(segDX, 0, segDL / 2, segDW / 2, theta, x, y))
        });

        // Plate 2
        const p2X = halfP1 + upperArmL + segCW + segDL + p2W / 2;
        qgeometry.poly.push({
          component: comp.name, name: 'plate2', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(p2X, 0, p2W / 2, p2H / 2, theta, x, y))
        });

        // Pins a and b
        const [pinAP1, pinAP2] = [[-halfP1, -pinW / 2], [-halfP1, pinW / 2]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'a', pinAP1, pinAP2, pinW, 'main', false);

        const totalRight = halfP1 + upperArmL + segCW + segDL + p2W;
        const [pinBP1, pinBP2] = [[totalRight, pinW / 2], [totalRight, -pinW / 2]].map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        addPin(comp.name, 'b', pinBP1, pinBP2, pinW, 'main', false);


      } else if (comp.type === 'fluxonium') {
        // Physics: Fluxonium = JJ shunted by superinductance (array of JJs or geometric inductor)
        // H = 4Ec*n^2 + (1/2)*El*phi^2 - Ej*cos(phi - 2π*Φext/Φ0)
        // El = (Φ0/(2π))^2 / L_inductor
        const lw = parseValue(p.loop_width || '100');
        const lh = parseValue(p.loop_height || '50');
        const nMeanders = parseInt(p.inductor_meanders || '5');

        // Inductor loop outline
        qgeometry.poly.push({
          component: comp.name, name: 'inductor_loop', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, lw/2, lh/2, theta, x, y))
        });
        // Inductor meander path inside loop
        const meandPts = [];
        const mStep = lw / (nMeanders + 1);
        for (let i = 0; i <= nMeanders; i++) {
          const mx = -lw/2 + mStep * i;
          const my1 = i % 2 === 0 ? -lh/3 : lh/3;
          const my2 = i % 2 === 0 ? lh/3 : -lh/3;
          const [r1x, r1y] = rot(mx, my1, theta);
          const [r2x, r2y] = rot(mx, my2, theta);
          meandPts.push([r1x + x, r1y + y]);
          meandPts.push([r2x + x, r2y + y]);
        }
        qgeometry.path.push({
          component: comp.name, name: 'inductor_meander', layer: 1, chip: 'main',
          width: 2, geometry: lineStr(meandPts)
        });
        // Junction at bottom
        const [fjbx, fjby] = rot(0, -lh/2, theta);
        const [fjtx, fjty] = rot(0, -lh/2 - (8 * 1e-3), theta);
        qgeometry.junction.push({
          component: comp.name, name: 'jj', layer: 1, chip: 'main', width: 1,
          geometry: lineStr([[fjbx+x, fjby+y], [fjtx+x, fjty+y]])
        });

      } else if (comp.type === 'cpw_straight') {
        // Physics: CPW characteristic impedance Z0 for w=trace, s=gap on substrate εr:
        // Z0 = 30π / (sqrt(εeff)) * K(k')/K(k), k = w/(w+2s), εeff = (εr+1)/2
        // K = complete elliptic integral of the first kind
        const sx = parseValue(p.start_x || '0');
        const sy = parseValue(p.start_y || '0');
        const ex = parseValue(p.end_x || '1000');
        const ey = parseValue(p.end_y || '0');
        const tw = parseValue(p.trace_width || '10');
        const gw = parseValue(p.gap_width || '6');

        const ss = parseValue((p.lead && p.lead.start_straight) || '0');
        const es = parseValue((p.lead && p.lead.end_straight) || '0');

        const dx = ex - sx;
        const dy = ey - sy;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx/len, ny = dy/len;
        
        const pts = [];
        if (ss > 0) pts.push([sx - nx*ss, sy - ny*ss]);
        pts.push([sx, sy]);
        pts.push([ex, ey]);
        if (es > 0) pts.push([ex + nx*es, ey + ny*es]);

        // Center trace path
        qgeometry.path.push({
          component: comp.name, name: 'trace', layer: 1, chip: 'main',
          width: tw, geometry: lineStr(pts)
        });
        // Gap cutout path (trace + 2*gap width, subtract from ground)
        qgeometry.path.push({
          component: comp.name, name: 'cut', layer: 1, chip: 'main',
          width: tw + 2 * gw, subtract: true, geometry: lineStr(pts)
        });
        
        const angle = Math.atan2(dy, dx);
        const firstPt = pts[0];
        const lastPt = pts[pts.length - 1];
        
        const sTop = [firstPt[0] - tw/2*Math.sin(angle), firstPt[1] + tw/2*Math.cos(angle)];
        const sBot = [firstPt[0] + tw/2*Math.sin(angle), firstPt[1] - tw/2*Math.cos(angle)];
        addPin(comp.name, 'start', sTop, sBot, tw, 'main');
        
        const eBot = [lastPt[0] + tw/2*Math.sin(angle), lastPt[1] - tw/2*Math.cos(angle)];
        const eTop = [lastPt[0] - tw/2*Math.sin(angle), lastPt[1] + tw/2*Math.cos(angle)];
        addPin(comp.name, 'end', eBot, eTop, tw, 'main');

      } else if (comp.type === 'cpw_meander') {
        // Physics: Meander resonator. Total electrical length L sets resonance:
        // f_res = c / (4 * L * sqrt(εeff)) for λ/4 resonator
        // c = 3e8 m/s, εeff ≈ (εr_silicon + 1)/2 ≈ 6.45 for silicon
        const totalLen = parseValue(p.total_length || '5000');
        const tw = parseValue(p.trace_width || '10');
        const gw = parseValue(p.gap_width || '6');
        const spacing = parseValue(p.meander_spacing || '50');

        // Generate meander points
        const pts = [];
        let curX = 0, curY = 0, dir = 1;
        let remainLen = totalLen;
        const segLen = spacing * 3; // Each horizontal segment
        pts.push([curX, curY]);
        
        while (remainLen > 0) {
          // Horizontal segment
          const hLen = Math.min(segLen, remainLen);
          curX += hLen * dir;
          pts.push([curX, curY]);
          remainLen -= hLen;
          if (remainLen <= 0) break;
          
          // Vertical connector
          const vLen = Math.min(spacing, remainLen);
          curY += vLen;
          pts.push([curX, curY]);
          remainLen -= vLen;
          dir *= -1;
        }

        // Transform all points
        const transformed = pts.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });

        const ss = parseValue((p.lead && p.lead.start_straight) || '0');
        const es = parseValue((p.lead && p.lead.end_straight) || '0');
        
        if (ss > 0 && transformed.length >= 2) {
          const pt0 = transformed[0], pt1 = transformed[1];
          const len0 = Math.hypot(pt1[0]-pt0[0], pt1[1]-pt0[1]) || 1;
          const nx0 = (pt1[0]-pt0[0])/len0, ny0 = (pt1[1]-pt0[1])/len0;
          transformed.unshift([pt0[0] - nx0*ss, pt0[1] - ny0*ss]);
        }
        if (es > 0 && transformed.length >= 2) {
          const ptN1 = transformed[transformed.length-2], ptN = transformed[transformed.length-1];
          const lenN = Math.hypot(ptN[0]-ptN1[0], ptN[1]-ptN1[1]) || 1;
          const nxN = (ptN[0]-ptN1[0])/lenN, nyN = (ptN[1]-ptN1[1])/lenN;
          transformed.push([ptN[0] + nxN*es, ptN[1] + nyN*es]);
        }

        qgeometry.path.push({
          component: comp.name, name: 'trace', layer: 1, chip: 'main',
          width: tw, geometry: lineStr(transformed)
        });
        qgeometry.path.push({
          component: comp.name, name: 'cut', layer: 1, chip: 'main',
          width: tw + 2 * gw, subtract: true, geometry: lineStr(transformed)
        });
        
        if (transformed.length >= 2) {
          const pt0 = transformed[0], pt1 = transformed[1];
          const ang0 = Math.atan2(pt1[1]-pt0[1], pt1[0]-pt0[0]);
          const sTop = [pt0[0] - tw/2*Math.sin(ang0), pt0[1] + tw/2*Math.cos(ang0)];
          const sBot = [pt0[0] + tw/2*Math.sin(ang0), pt0[1] - tw/2*Math.cos(ang0)];
          addPin(comp.name, 'start', sTop, sBot, tw, 'main');
          
          const ptN1 = transformed[transformed.length-2], ptN = transformed[transformed.length-1];
          const angN = Math.atan2(ptN[1]-ptN1[1], ptN[0]-ptN1[0]);
          const eBot = [ptN[0] + tw/2*Math.sin(angN), ptN[1] - tw/2*Math.cos(angN)];
          const eTop = [ptN[0] - tw/2*Math.sin(angN), ptN[1] + tw/2*Math.cos(angN)];
          addPin(comp.name, 'end', eBot, eTop, tw, 'main');
        }

      } else if (comp.type.startsWith('route_') || comp.type.startsWith('Route')) {
        // Physics & Vector Routing: QRoute implementation for CPW lines.
        // Handles RouteStraight, RouteFramed, RouteMeander, RouteAnchors, RoutePathfinder, RouteMixed.
        const tw = parseValue(p.trace_width || '10');
        const gw = parseValue(p.trace_gap || p.gap_width || '6');
        const fillet = parseValue(p.fillet !== undefined && p.fillet !== '' ? p.fillet : '90um') || 90;
        const ss = parseValue((p.lead && p.lead.start_straight) || '200um') || 200;
        const es = parseValue((p.lead && p.lead.end_straight) || '200um') || 200;

        // Resolve connected pins if specified
        let pStart = null, dirStart = [1, 0];
        let pEnd = null, dirEnd = [-1, 0];

        const startComp = p.pin_inputs?.start_pin?.component;
        const startPinName = p.pin_inputs?.start_pin?.pin;
        if (startComp && startPinName && qgeometry.pins[startComp]?.[startPinName]) {
          const pinObj = qgeometry.pins[startComp][startPinName];
          pStart = [...pinObj.middle];
          dirStart = [...pinObj.normal];
        }

        const endComp = p.pin_inputs?.end_pin?.component;
        const endPinName = p.pin_inputs?.end_pin?.pin;
        if (endComp && endPinName && qgeometry.pins[endComp]?.[endPinName]) {
          const pinObj = qgeometry.pins[endComp][endPinName];
          pEnd = [...pinObj.middle];
          dirEnd = [...pinObj.normal];
        }

        const isConnected = !!(startComp && startPinName && qgeometry.pins[startComp]?.[startPinName]) &&
                            !!(endComp && endPinName && qgeometry.pins[endComp]?.[endPinName]);

        const totalLen = parseValue(p.total_length || '8mm') || 8000;

        // If not connected to pins yet, center the route elegantly around (x, y)
        if (!pStart && !pEnd) {
          const cos = Math.cos(theta);
          const sin = Math.sin(theta);
          const spanLen = 3500;
          const halfSpan = spanLen / 2;
          const nx = -sin;
          const ny = cos;

          if (comp.type === 'route_framed' || comp.type === 'RouteFramed') {
            // RouteFramed signature: orthogonal Z-step connecting an upper bus level to an offset lower bus level
            const frameOffset = 600;
            pStart = [x - halfSpan * cos + nx * frameOffset, y - halfSpan * sin + ny * frameOffset];
            pEnd = [x + halfSpan * cos - nx * frameOffset, y + halfSpan * sin - ny * frameOffset];
          } else {
            pStart = [x - halfSpan * cos, y - halfSpan * sin];
            pEnd = [x + halfSpan * cos, y + halfSpan * sin];
          }
          dirStart = [cos, sin];
          dirEnd = [-cos, -sin];
        } else {
          if (!pStart) {
            pStart = [x, y];
            dirStart = [Math.cos(theta), Math.sin(theta)];
          }
          if (!pEnd) {
            pEnd = [pStart[0] + 3500 * Math.cos(theta), pStart[1] + 3500 * Math.sin(theta)];
            dirEnd = [-Math.cos(theta), -Math.sin(theta)];
          }
        }

        let pts = [];
        const ptLeadIn = [pStart[0] + dirStart[0] * ss, pStart[1] + dirStart[1] * ss];
        const ptLeadOut = [pEnd[0] + dirEnd[0] * es, pEnd[1] + dirEnd[1] * es];

        if (comp.type === 'route_straight' || comp.type === 'RouteStraight') {
          // 1. RouteStraight: Direct point-to-point connection
          pts = isConnected ? [pStart, ptLeadIn, ptLeadOut, pEnd] : [pStart, pEnd];

        } else if (comp.type === 'route_framed' || comp.type === 'RouteFramed') {
          // 2. RouteFramed: Stepped orthogonal frame connecting to an offset pin (Z/L frame)
          // Canonical Qiskit Metal geometry:
          // Q1 [pin] ────────────────────┐
          //                              │
          //                              └──────────────────── [pin] Q2 (Offset)
          // Strictly a 2-corner Z-step transition between offset heights. Never a U-trough detour!
          if (!isConnected) {
            // Standalone unattached view: clean orthogonal Z-step between offset pins
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            const nx = -sin;
            const ny = cos;
            const frameOffset = 600;
            const midCorner1 = [x + nx * frameOffset, y + ny * frameOffset];
            const midCorner2 = [x - nx * frameOffset, y - ny * frameOffset];
            pts = [
              pStart,
              ptLeadIn,
              midCorner1,
              midCorner2,
              ptLeadOut,
              pEnd
            ];
          } else {
            // Connected between two specific pins:
            const dx = ptLeadOut[0] - ptLeadIn[0];
            const dy = ptLeadOut[1] - ptLeadIn[1];
            const isHorizontalLeads = Math.abs(dirStart[0]) >= Math.abs(dirStart[1]);

            if (isHorizontalLeads) {
              if (Math.abs(dy) > 10) {
                // Stepped Z-frame: horizontal lead-in to midX, vertical step between heights, horizontal lead-out
                const midX = (ptLeadIn[0] + ptLeadOut[0]) / 2;
                pts = [
                  pStart,
                  ptLeadIn,
                  [midX, ptLeadIn[1]],
                  [midX, ptLeadOut[1]],
                  ptLeadOut,
                  pEnd
                ];
              } else {
                // Collinear horizontal connection (Qiskit Metal connect_frame(1))
                pts = [pStart, ptLeadIn, ptLeadOut, pEnd];
              }
            } else {
              if (Math.abs(dx) > 10) {
                // Stepped Z-frame with vertical leads: vertical to midY, horizontal step, vertical to lead-out
                const midY = (ptLeadIn[1] + ptLeadOut[1]) / 2;
                pts = [
                  pStart,
                  ptLeadIn,
                  [ptLeadIn[0], midY],
                  [ptLeadOut[0], midY],
                  ptLeadOut,
                  pEnd
                ];
              } else {
                // Collinear vertical connection
                pts = [pStart, ptLeadIn, ptLeadOut, pEnd];
              }
            }
          }

        } else if (comp.type === 'route_meander' || comp.type === 'RouteMeander') {
          // Meander path: true square-wave orthogonal serpentine with rounded fillets
          const spacing = parseValue((p.meander && p.meander.spacing) || '200um') || 200;
          const dx = ptLeadOut[0] - ptLeadIn[0];
          const dy = ptLeadOut[1] - ptLeadIn[1];
          const spanDist = Math.hypot(dx, dy) || 1;
          const ux = dx / spanDist;
          const uy = dy / spanDist;
          const px_vec = -uy;
          const py_vec = ux;

          const pitch = spacing * 2;
          const margin = 300;
          const availSpan = Math.max(pitch, spanDist - 2 * margin);
          const nCycles = Math.max(2, Math.floor(availSpan / pitch));
          const actualSpan = nCycles * pitch;
          const offsetStart = (spanDist - actualSpan) / 2;

          const neededExtra = Math.max(0, totalLen - spanDist);
          const amp = Math.max(300, Math.min(850, neededExtra / (4 * nCycles)));

          pts = [pStart, ptLeadIn];
          const mStart = [ptLeadIn[0] + ux * offsetStart, ptLeadIn[1] + uy * offsetStart];
          pts.push(mStart);

          for (let k = 0; k < nCycles; k++) {
            const baseProgress = k * pitch;
            // Point 1: Step out along +perp to +amp
            const p1 = [
              mStart[0] + ux * baseProgress + px_vec * amp,
              mStart[1] + uy * baseProgress + py_vec * amp
            ];
            // Point 2: Step forward along +unit by spacing
            const p2 = [
              mStart[0] + ux * (baseProgress + spacing) + px_vec * amp,
              mStart[1] + uy * (baseProgress + spacing) + py_vec * amp
            ];
            // Point 3: Step down through centerline along -perp to -amp
            const p3 = [
              mStart[0] + ux * (baseProgress + spacing) - px_vec * amp,
              mStart[1] + uy * (baseProgress + spacing) - py_vec * amp
            ];
            // Point 4: Step forward along +unit by spacing
            const p4 = [
              mStart[0] + ux * (baseProgress + 2 * spacing) - px_vec * amp,
              mStart[1] + uy * (baseProgress + 2 * spacing) - py_vec * amp
            ];
            // Point 5: Return to centerline
            const p5 = [
              mStart[0] + ux * (baseProgress + 2 * spacing),
              mStart[1] + uy * (baseProgress + 2 * spacing)
            ];
            pts.push(p1, p2, p3, p4, p5);
          }

          pts.push(ptLeadOut);
          pts.push(pEnd);

        } else if (comp.type === 'route_anchors' || comp.type === 'RouteAnchors') {
          // Anchors path: pass cleanly through user anchors or orthogonal bridge
          pts = [pStart, ptLeadIn];
          let hasCustomAnchors = false;
          if (p.anchors && typeof p.anchors === 'object' && Object.keys(p.anchors).length > 0) {
            Object.values(p.anchors).forEach(anc => {
              if (Array.isArray(anc) && anc.length >= 2) {
                let ax = Number(parseValue(anc[0]));
                let ay = Number(parseValue(anc[1]));
                if (Math.abs(ax) < 30 && Math.abs(ay) < 30) {
                  ax *= 1000;
                  ay *= 1000;
                }
                pts.push([ax, ay]);
                hasCustomAnchors = true;
              }
            });
          }
          if (!hasCustomAnchors) {
            const midX = (ptLeadIn[0] + ptLeadOut[0]) / 2;
            const detourY = Math.max(ptLeadIn[1], ptLeadOut[1]) + 800;
            pts.push([ptLeadIn[0] + 400, ptLeadIn[1]]);
            pts.push([ptLeadIn[0] + 400, detourY]);
            pts.push([ptLeadOut[0] - 400, detourY]);
            pts.push([ptLeadOut[0] - 400, ptLeadOut[1]]);
          }
          pts.push(ptLeadOut);
          pts.push(pEnd);

        } else if (comp.type === 'route_pathfinder' || comp.type === 'RoutePathfinder') {
          // 3. RoutePathfinder: Smart A* obstacle-avoidance detour
          // Automatically creates a Manhattan bay routing around center obstacle
          const dx = ptLeadOut[0] - ptLeadIn[0];
          const midX1 = ptLeadIn[0] + dx * 0.25;
          const midX2 = ptLeadIn[0] + dx * 0.75;
          const detourY = Math.min(ptLeadIn[1], ptLeadOut[1]) - 900;
          pts = [
            pStart,
            ptLeadIn,
            [midX1, ptLeadIn[1]],
            [midX1, detourY],
            [midX2, detourY],
            [midX2, ptLeadOut[1]],
            ptLeadOut,
            pEnd
          ];

        } else if (comp.type === 'route_mixed' || comp.type === 'RouteMixed') {
          // Mixed path: hybrid straight leads + orthogonal meander section
          const dx = ptLeadOut[0] - ptLeadIn[0];
          const midX1 = ptLeadIn[0] + dx * 0.35;
          const midX2 = ptLeadIn[0] + dx * 0.65;
          const detourY = ptLeadIn[1] + 700;
          pts = [
            pStart,
            ptLeadIn,
            [midX1, ptLeadIn[1]],
            [midX1, detourY],
            [midX2, detourY],
            [midX2, ptLeadOut[1]],
            ptLeadOut,
            pEnd
          ];

        } else {
          pts = [pStart, ptLeadIn, ptLeadOut, pEnd];
        }

        // Filter out duplicate consecutive points
        const cleanPts = [];
        pts.forEach((pt, idx) => {
          if (idx === 0 || Math.hypot(pt[0] - cleanPts[cleanPts.length-1][0], pt[1] - cleanPts[cleanPts.length-1][1]) > 0.01) {
            cleanPts.push(pt);
          }
        });

        // Add trace to path table
        qgeometry.path.push({
          component: comp.name,
          name: 'trace',
          layer: 1,
          chip: 'main',
          width: tw,
          fillet: fillet > 0 ? fillet : 0,
          subtract: false,
          geometry: lineStr(cleanPts)
        });

        // Add ground cutout to path table
        qgeometry.path.push({
          component: comp.name,
          name: 'cut',
          layer: 1,
          chip: 'main',
          width: tw + 2 * gw,
          fillet: fillet > 0 ? fillet : 0,
          subtract: true,
          geometry: lineStr(cleanPts)
        });

        // Register pins for start and end
        if (cleanPts.length >= 2) {
          const pt0 = cleanPts[0], pt1 = cleanPts[1];
          const ang0 = Math.atan2(pt1[1]-pt0[1], pt1[0]-pt0[0]);
          const sTop = [pt0[0] - tw/2*Math.sin(ang0), pt0[1] + tw/2*Math.cos(ang0)];
          const sBot = [pt0[0] + tw/2*Math.sin(ang0), pt0[1] - tw/2*Math.cos(ang0)];
          addPin(comp.name, 'start', sTop, sBot, tw, 'main');

          const ptN1 = cleanPts[cleanPts.length-2], ptN = cleanPts[cleanPts.length-1];
          const angN = Math.atan2(ptN[1]-ptN1[1], ptN[0]-ptN1[0]);
          const eBot = [ptN[0] + tw/2*Math.sin(angN), ptN[1] - tw/2*Math.cos(angN)];
          const eTop = [ptN[0] - tw/2*Math.sin(angN), ptN[1] + tw/2*Math.cos(angN)];
          addPin(comp.name, 'end', eBot, eTop, tw, 'main');
        }

      } else if (comp.type === 'bond_pad') {
        // Physics: Bond pad provides galvanic contact. Geometry is a simple rectangle
        // with a gap etched around it in the ground plane.
        const bw = parseValue(p.width || '250');
        const bh = parseValue(p.height || '250');
        const bg = parseValue(p.gap || '50');

        qgeometry.poly.push({
          component: comp.name, name: 'pad', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, bw/2, bh/2, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'pad_gap', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(makeRect(0, 0, bw/2+bg, bh/2+bg, theta, x, y))
        });

      } else if (comp.type === 'microwave_port') {
        // Physics: Tapered CPW launch transitions impedance from PCB (~50Ω) to on-chip CPW.
        // The taper adiabatically matches Z by linearly varying trace width.
        const tw = parseValue(p.trace_width || '10');
        const gw = parseValue(p.gap_width || '6');
        const taper = parseValue(p.launch_taper || '200');

        // Taper polygon (trapezoid from wide launch to narrow CPW)
        const wideW = tw * 5;
        const narrowW = tw;
        const pts = [
          [-wideW/2, 0], [wideW/2, 0],
          [narrowW/2, taper], [-narrowW/2, taper],
          [-wideW/2, 0]
        ].map(([px,py]) => {
          const [rx,ry] = rot(px,py,theta);
          return [rx+x, ry+y];
        });
        qgeometry.poly.push({
          component: comp.name, name: 'taper', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(pts)
        });
        // Gap cutout
        const gapPts = [
          [-(wideW/2+gw), -gw], [wideW/2+gw, -gw],
          [narrowW/2+gw, taper+gw], [-(narrowW/2+gw), taper+gw],
          [-(wideW/2+gw), -gw]
        ].map(([px,py]) => {
          const [rx,ry] = rot(px,py,theta);
          return [rx+x, ry+y];
        });
        qgeometry.poly.push({
          component: comp.name, name: 'taper_gap', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(gapPts)
        });
        
        const tieTop = rot(narrowW/2, taper, theta);
        const tieBot = rot(-narrowW/2, taper, theta);
        addPin(comp.name, 'tie', [tieTop[0]+x, tieTop[1]+y], [tieBot[0]+x, tieBot[1]+y], tw, 'main');

      } else if (comp.type === 'interdigitated_cap') {
        // Physics: C = ε0 * εr * (N-1) * L * t / d  (interdigitated capacitor)
        // N=num_fingers, L=finger_length, t=alpha thickness, d=finger_gap
        const fl = parseValue(p.finger_length || '100');
        const fw = parseValue(p.finger_width || '5');
        const fg = parseValue(p.finger_gap || '5');
        const nf = parseInt(p.num_fingers || '8');

        const totalW = nf * fw + (nf - 1) * fg;
        for (let i = 0; i < nf; i++) {
          const fx = -totalW/2 + i * (fw + fg) + fw/2;
          const fy = (i % 2 === 0) ? -fl/2 + fl/4 : -fl/2;
          const fh = (i % 2 === 0) ? fl * 3/4 : fl * 3/4;
          qgeometry.poly.push({
            component: comp.name, name: `finger_${i}`, layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(makeRect(fx, fy + fh/2, fw/2, fh/2, theta, x, y))
          });
        }

      } else if (comp.type === 'purcell_filter') {
        // Physics: Purcell filter is a bandpass/bandstop filter protecting qubit from
        // Purcell decay via readout resonator. Typically a λ/4 or λ/2 CPW stub.
        // κ_purcell ∝ (g/Δ)^2 * κ_readout. Filter suppresses κ at qubit frequency.
        const len = parseValue(p.length || '1500');
        const tw = parseValue(p.trace_width || '10');
        const gw = parseValue(p.gap_width || '6');

        const [ex, ey] = rot(len, 0, theta);
        qgeometry.path.push({
          component: comp.name, name: 'trace', layer: 1, chip: 'main',
          width: tw, geometry: lineStr([[x, y], [ex+x, ey+y]])
        });
        qgeometry.path.push({
          component: comp.name, name: 'cut', layer: 1, chip: 'main',
          width: tw + 2*gw, subtract: true, geometry: lineStr([[x, y], [ex+x, ey+y]])
        });

      } else if (comp.type === 'airbridge') {
        // Physics: Airbridge equalizes ground plane potential across CPW to suppress
        // slotline modes. It's a alpha bridge arching over the CPW center conductor.
        const span = parseValue(p.span || '30');
        const bw = parseValue(p.width || '10');

        // Bridge deck polygon
        qgeometry.poly.push({
          component: comp.name, name: 'bridge_deck', layer: 2, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, span/2, bw/2, theta, x, y))
        });
        // Two anchor pads
        qgeometry.poly.push({
          component: comp.name, name: 'anchor_left', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(-span/2, 0, bw/2, bw/2, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'anchor_right', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(span/2, 0, bw/2, bw/2, theta, x, y))
        });

      } else if (comp.type === 'tsv') {
        // Physics: Through-Silicon Via connects ground planes or signals across substrate
        // in 3D multi-planar (flip-chip) designs. Modeled as coaxial shielded via.
        const r = parseValue(p.radius || '20');
        const gap = parseValue(p.coaxial_gap || '15');
        const nSides = 16;
        
        // Coaxial ground keepout (subtractive trench)
        if (gap > 0) {
          const outerR = r + gap;
          const outerPts = [];
          for (let i = 0; i <= nSides; i++) {
            const a = (2 * Math.PI * i) / nSides;
            const [rx, ry] = rot(outerR * Math.cos(a), outerR * Math.sin(a), theta);
            outerPts.push([rx + x, ry + y]);
          }
          qgeometry.poly.push({
            component: comp.name, name: 'coaxial_pocket', layer: 1, subtract: true, chip: p.chip || 'main',
            geometry: polyStr(outerPts)
          });
        }

        // Inner conducting via core
        const pts = [];
        for (let i = 0; i <= nSides; i++) {
          const a = (2 * Math.PI * i) / nSides;
          const [rx, ry] = rot(r * Math.cos(a), r * Math.sin(a), theta);
          pts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'via_core', layer: 1, subtract: false, chip: p.chip || 'main',
          geometry: polyStr(pts)
        });

      } else if (comp.type === 'micro_bump') {
        // Physics: Superconducting Indium micro-bump for flip-chip 3D interconnect
        const r = parseValue(p.radius || '15');
        const nSides = 16;
        const pts = [];
        for (let i = 0; i <= nSides; i++) {
          const a = (2 * Math.PI * i) / nSides;
          const [rx, ry] = rot(r * Math.cos(a), r * Math.sin(a), theta);
          pts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'indium_pad', layer: 1, subtract: false, chip: p.chip || 'main',
          geometry: polyStr(pts)
        });

      } else if (comp.type === 'die_interconnect') {
        // Physics: Die-to-Die microwave bridge interconnect bridging chiplets
        const len = parseValue(p.length || '400');
        const w = parseValue(p.width || '25');
        qgeometry.poly.push({
          component: comp.name, name: 'bridge_trace', layer: 1, subtract: false, chip: p.chip || 'main',
          geometry: polyStr(makeRect(0, 0, len/2, w/2, theta, x, y))
        });

      } else if (comp.type === 'hybrid_bond') {
        // Physics: Direct planar dielectric & metal fusion bonding pad
        const r = parseValue(p.radius || '6');
        const nSides = 16;
        const pts = [];
        for (let i = 0; i <= nSides; i++) {
          const a = (2 * Math.PI * i) / nSides;
          const [rx, ry] = rot(r * Math.cos(a), r * Math.sin(a), theta);
          pts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'hybrid_contact', layer: 2, subtract: false, chip: p.chip || 'main',
          geometry: polyStr(pts)
        });

      } else if (comp.type === 'rdl_trace') {
        // Physics: Redistribution Layer (RDL) multi-metal fanout trace
        const len = parseValue(p.length || '600');
        const w = parseValue(p.width || '12');
        qgeometry.poly.push({
          component: comp.name, name: 'rdl_metal', layer: 2, subtract: false, chip: p.chip || 'main',
          geometry: polyStr(makeRect(0, 0, len/2, w/2, theta, x, y))
        });
      } else if (comp.type === 'cap_finger_in_frame') {
        const outerW = parseValue(p.frame_width || '72');
        const outerH = parseValue(p.frame_length || '245');
        const trace = parseValue(p.frame_trace || '16');
        const gap = parseValue(p.cap_gap || '10');
        const stubW = parseValue(p.finger_cpw_width || '10');
        const groundGap = parseValue(p.ground_gap || '10');

        // Physics/Geometry: CapFingerInFrame is a full ring frame with a slot on +x.
        // The finger is a large derived rectangle inside the frame, with a stub exiting the slot.
        
        // Frame: Top and Bottom bars (full width)
        qgeometry.poly.push({
          component: comp.name, name: 'frame_top', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, outerH/2 - trace/2, outerW/2, trace/2, theta, x, y))
        });
        qgeometry.poly.push({
          component: comp.name, name: 'frame_bottom', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, -outerH/2 + trace/2, outerW/2, trace/2, theta, x, y))
        });

        // Frame: Left bar (inner height)
        const innerH = outerH - 2 * trace;
        qgeometry.poly.push({
          component: comp.name, name: 'frame_left', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(-outerW/2 + trace/2, 0, trace/2, innerH/2, theta, x, y))
        });

        // Frame: Right bars (top-right and bottom-right lips forming the slot)
        const slotSize = stubW + 2 * gap;
        const rightLipH = (innerH - slotSize) / 2;
        if (rightLipH > 0) {
          const topLipY = slotSize/2 + rightLipH/2;
          qgeometry.poly.push({
            component: comp.name, name: 'frame_right_top', layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(makeRect(outerW/2 - trace/2, topLipY, trace/2, rightLipH/2, theta, x, y))
          });
          const botLipY = -slotSize/2 - rightLipH/2;
          qgeometry.poly.push({
            component: comp.name, name: 'frame_right_bot', layer: 1, subtract: false, chip: 'main',
            geometry: polyStr(makeRect(outerW/2 - trace/2, botLipY, trace/2, rightLipH/2, theta, x, y))
          });
        }

        // Finger: Main Body (derived)
        const bodyW = (outerW - 2 * trace) - 2 * gap;
        const bodyH = innerH - 2 * gap;
        qgeometry.poly.push({
          component: comp.name, name: 'finger_body', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(0, 0, bodyW/2, bodyH/2, theta, x, y))
        });

        // Finger: Stub (connects main body through the slot)
        const stubLen = trace + gap;
        const stubX = bodyW/2 + stubLen/2;
        qgeometry.poly.push({
          component: comp.name, name: 'finger_stub', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(makeRect(stubX, 0, stubLen/2, stubW/2, theta, x, y))
        });

        // Pocket (ground plane cutout)
        qgeometry.poly.push({
          component: comp.name, name: 'pocket', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(makeRect(0, 0, (outerW)/2 + groundGap, (outerH)/2 + groundGap, theta, x, y))
        });
        
        const aTop = rot(stubX + stubLen/2, stubW/2, theta);
        const aBot = rot(stubX + stubLen/2, -stubW/2, theta);
        addPin(comp.name, 'a', [aTop[0]+x, aTop[1]+y], [aBot[0]+x, aBot[1]+y], stubW, 'main');
      } else if (comp.type === 'launchpad_wirebond' || comp.type === 'LaunchpadWirebond' || comp.type === 'launchpad_wb_driven' || comp.type === 'LaunchpadWirebondDriven') {
        const tw = parseValue(p.trace_width || '10');
        const tg = parseValue(p.trace_gap || '6');
        const leadLen = parseValue(p.lead_length || '25');
        const pw = parseValue(p.pad_width || '80');
        const ph = parseValue(p.pad_height || '80');
        const pg = parseValue(p.pad_gap || '58');
        const th = parseValue(p.taper_height || '122');
        const twHalf = tw / 2.0;
        const pwHalf = pw / 2.0;

        // Exact Qiskit Metal launch_pad polygon:
        const padRawPts = [
          [0, twHalf],
          [-th, pwHalf],
          [-(ph + th), pwHalf],
          [-(ph + th), -pwHalf],
          [-th, -pwHalf],
          [0, -twHalf],
          [leadLen, -twHalf],
          [leadLen, twHalf]
        ];
        const padPts = padRawPts.map(([px, py]) => {
          const r = rot(px, py, theta);
          return [r[0] + x, r[1] + y];
        });
        qgeometry.poly.push({
          component: comp.name, name: 'launch_pad', layer: 1, subtract: false, chip: 'main',
          geometry: polyStr(padPts)
        });

        // Exact Qiskit Metal pocket polygon:
        const pocketRawPts = [
          [0, twHalf + tg],
          [-th, pwHalf + pg],
          [-(ph + th + pg), pwHalf + pg],
          [-(ph + th + pg), -(pwHalf + pg)],
          [-th, -(pwHalf + pg)],
          [0, -(twHalf + tg)],
          [leadLen, -(twHalf + tg)],
          [leadLen, twHalf + tg]
        ];
        const pocketPts = pocketRawPts.map(([px, py]) => {
          const r = rot(px, py, theta);
          return [r[0] + x, r[1] + y];
        });
        qgeometry.poly.push({
          component: comp.name, name: 'pocket', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(pocketPts)
        });

        // Pin 'tie' is at (leadLen, 0) pointing outwards (+X, along orientation theta)
        const tieTop = rot(leadLen, twHalf, theta);
        const tieBot = rot(leadLen, -twHalf, theta);
        addPin(comp.name, 'tie', [tieTop[0] + x, tieTop[1] + y], [tieBot[0] + x, tieBot[1] + y], tw, 'main', true);
      } else if (comp.type === 'open_to_ground' || comp.type === 'OpenToGround') {
        const w = parseValue(p.width || '10');
        const gap = parseValue(p.gap || '6');
        const tGap = parseValue(p.termination_gap || '6');
        const halfH = w / 2 + gap;
        const boxPts = [
          [0, -halfH],
          [tGap, -halfH],
          [tGap, halfH],
          [0, halfH]
        ].map(([px, py]) => {
          const r = rot(px, py, theta);
          return [r[0] + x, r[1] + y];
        });
        qgeometry.poly.push({
          component: comp.name, name: 'open_sub', layer: 1, subtract: true, chip: 'main',
          geometry: polyStr(boxPts)
        });
        const p1 = rot(0, -w / 2, theta);
        const p2 = rot(0, w / 2, theta);
        addPin(comp.name, 'open', [p1[0] + x, p1[1] + y], [p2[0] + x, p2[1] + y], w, 'main', true);
      } else if (comp.type === 'short_to_ground' || comp.type === 'ShortToGround') {
        const w = parseValue(p.width || '10');
        const p1 = rot(0, -w / 2, theta);
        const p2 = rot(0, w / 2, theta);
        addPin(comp.name, 'short', [p1[0] + x, p1[1] + y], [p2[0] + x, p2[1] + y], w, 'main', true);
      } else if (comp.type === 'polyline_cpw' || comp.type === 'PolylineCPW') {
        let rawPts = p.points || [[0, 0], [1000, 0], [1000, 1000]];
        if (typeof rawPts === 'string') {
          try {
            rawPts = JSON.parse(rawPts);
          } catch (e) {
            rawPts = [[0, 0], [1000, 0]];
          }
        }
        const tw = parseValue(p.trace_width || '10um');
        const tg = parseValue(p.trace_gap || '6um');
        const chip = p.chip || 'main';
        const layer = p.layer || 1;

        const pts = rawPts.map(([px, py]) => {
          const vx = typeof px === 'string' ? parseValue(px) : px;
          const vy = typeof py === 'string' ? parseValue(py) : py;
          const [rx, ry] = rot(vx, vy, theta);
          return [rx + x, ry + y];
        });

        if (pts.length >= 2) {
          // Central conductor trace
          qgeometry.path.push({
            component: comp.name,
            name: 'trace',
            layer: layer,
            subtract: false,
            chip: chip,
            width: tw,
            geometry: lineStr(pts)
          });
          // Ground cut gap
          qgeometry.path.push({
            component: comp.name,
            name: 'cut',
            layer: layer,
            subtract: true,
            chip: chip,
            width: tw + 2 * tg,
            geometry: lineStr(pts)
          });

          // Pin: start
          const dStart = [pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]];
          const lenStart = Math.hypot(dStart[0], dStart[1]) || 1;
          const nStart = [dStart[0] / lenStart, dStart[1] / lenStart];
          const tStart = [-nStart[1], nStart[0]];
          const startP1 = [pts[0][0] + tStart[0] * tw / 2, pts[0][1] + tStart[1] * tw / 2];
          const startP2 = [pts[0][0] - tStart[0] * tw / 2, pts[0][1] - tStart[1] * tw / 2];
          addPin(comp.name, 'start', startP1, startP2, tw, chip, false);

          // Pin: end
          const dEnd = [pts[pts.length - 1][0] - pts[pts.length - 2][0], pts[pts.length - 1][1] - pts[pts.length - 2][1]];
          const lenEnd = Math.hypot(dEnd[0], dEnd[1]) || 1;
          const nEnd = [dEnd[0] / lenEnd, dEnd[1] / lenEnd];
          const tEnd = [-nEnd[1], nEnd[0]];
          const endP1 = [pts[pts.length - 1][0] + tEnd[0] * tw / 2, pts[pts.length - 1][1] + tEnd[1] * tw / 2];
          const endP2 = [pts[pts.length - 1][0] - tEnd[0] * tw / 2, pts[pts.length - 1][1] - tEnd[1] * tw / 2];
          addPin(comp.name, 'end', endP1, endP2, tw, chip, false);

          // Taps
          if (p.taps && typeof p.taps === 'object') {
            Object.entries(p.taps).forEach(([tapName, tapCoord]) => {
              if (Array.isArray(tapCoord) && tapCoord.length >= 2) {
                const tx = typeof tapCoord[0] === 'string' ? parseValue(tapCoord[0]) : tapCoord[0];
                const ty = typeof tapCoord[1] === 'string' ? parseValue(tapCoord[1]) : tapCoord[1];
                const [rtx, rty] = rot(tx, ty, theta);
                const tapX = rtx + x;
                const tapY = rty + y;
                const tapP1 = [tapX - tw / 2, tapY];
                const tapP2 = [tapX + tw / 2, tapY];
                addPin(comp.name, tapName, tapP1, tapP2, tw, chip, false);
              }
            });
          }
        }
      } else if (comp.type === 'jj_dolan' || comp.type === 'JJDolan') {
        const padW = parseValue(p.JJ_pad_lower_width || '25um');
        const padH = parseValue(p.JJ_pad_lower_height || '10um');
        const fingerW = parseValue(p.finger_lower_width || '1um');
        const fingerH = parseValue(p.finger_lower_height || '20um');
        const ext = parseValue(p.extension || '1um');
        const offset = parseValue(p.offset || '2um');
        const secL = parseValue(p.second_metal_length || '5um');
        const secW = parseValue(p.second_metal_width || '1um');
        const chip = p.chip || 'main';
        const layer = p.layer || 1;

        // Lower pad centered at (0, 0), finger extends along +Y from pad
        const lowerPadCorners = makeRect(0, 0, padW / 2, padH / 2, theta, x, y);
        const fingerCenterY = 0.5 * (padH + fingerH);
        const fingerCorners = makeRect(0, fingerCenterY, fingerW / 2, fingerH / 2, theta, x, y);

        // Second pad/finger is rotated by 90 degrees and translated
        const shiftX = 0.5 * (padH + fingerH) - 0.5 * fingerW - ext + ext + fingerW + offset;
        const shiftY = 0.5 * (padH + fingerH) - 0.5 * fingerW - ext;
        const upperPadCorners = makeRect(shiftX + fingerCenterY, shiftY, padH / 2, padW / 2, theta, x, y);
        const upperFingerCorners = makeRect(shiftX, shiftY, fingerH / 2, fingerW / 2, theta, x, y);

        // Second metal layer on layer 2
        const secX = offset + 0.5 * fingerW;
        const secY = 0.5 * padH + fingerH - 0.5 * secL;
        const secondMetalCorners = makeRect(secX, secY, secW / 2, secL / 2, theta, x, y);

        qgeometry.poly.push({
          component: comp.name, name: 'jj_pad_lower', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(lowerPadCorners)
        });
        qgeometry.poly.push({
          component: comp.name, name: 'jj_finger_lower', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(fingerCorners)
        });
        qgeometry.poly.push({
          component: comp.name, name: 'jj_pad_upper', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(upperPadCorners)
        });
        qgeometry.poly.push({
          component: comp.name, name: 'jj_finger_upper', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(upperFingerCorners)
        });
        qgeometry.poly.push({
          component: comp.name, name: 'second_metal', layer: 2, subtract: false, chip: chip,
          geometry: polyStr(secondMetalCorners)
        });

        // Add pins at connection pads
        const [p1x, p1y] = rot(0, -padH / 2, theta);
        const [p2x, p2y] = rot(shiftX + fingerCenterY + padH / 2, shiftY, theta);
        addPin(comp.name, 'pad1', [p1x + x - padW / 4, p1y + y], [p1x + x + padW / 4, p1y + y], padW / 2, chip, false);
        addPin(comp.name, 'pad2', [p2x + x, p2y + y - padW / 4], [p2x + x, p2y + y + padW / 4], padW / 2, chip, false);
      } else if (comp.type === 'jj_manhattan' || comp.type === 'JJManhattan') {
        const padW = parseValue(p.JJ_pad_lower_width || '25um');
        const padH = parseValue(p.JJ_pad_lower_height || '10um');
        const fingerW = parseValue(p.finger_lower_width || '1um');
        const fingerH = parseValue(p.finger_lower_height || '20um');
        const ext = parseValue(p.extension || '1um');
        const chip = p.chip || 'main';
        const layer = p.layer || 1;

        // Lower pad + vertical finger
        const lowerPadCorners = makeRect(0, 0, padW / 2, padH / 2, theta, x, y);
        const fingerCenterY = 0.5 * (padH + fingerH);
        const fingerCorners = makeRect(0, fingerCenterY, fingerW / 2, fingerH / 2, theta, x, y);

        // Rotated upper pad + horizontal finger crossing at extension
        const shiftX = 0.5 * (padH + fingerH) - 0.5 * fingerW - ext;
        const shiftY = 0.5 * (padH + fingerH) - 0.5 * fingerW - ext;
        const upperPadCorners = makeRect(shiftX + fingerCenterY, shiftY, padH / 2, padW / 2, theta, x, y);
        const upperFingerCorners = makeRect(shiftX, shiftY, fingerH / 2, fingerW / 2, theta, x, y);

        qgeometry.poly.push({
          component: comp.name, name: 'pad_lower', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(lowerPadCorners)
        });
        qgeometry.poly.push({
          component: comp.name, name: 'finger_lower', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(fingerCorners)
        });
        qgeometry.poly.push({
          component: comp.name, name: 'pad_upper', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(upperPadCorners)
        });
        qgeometry.poly.push({
          component: comp.name, name: 'finger_upper', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(upperFingerCorners)
        });

        // Add pins at pads
        const [p1x, p1y] = rot(0, -padH / 2, theta);
        const [p2x, p2y] = rot(shiftX + fingerCenterY + padH / 2, shiftY, theta);
        addPin(comp.name, 'pad1', [p1x + x - padW / 4, p1y + y], [p1x + x + padW / 4, p1y + y], padW / 2, chip, false);
        addPin(comp.name, 'pad2', [p2x + x, p2y + y - padW / 4], [p2x + x, p2y + y + padW / 4], padW / 2, chip, false);
      } else if (comp.type === 'transmon_concentric' || comp.type === 'TransmonConcentric') {
        const radO = parseValue(p.rad_o || '170um');
        const radI = parseValue(p.rad_i || '115um');
        const gap = parseValue(p.gap || '35um');
        const pocketW = parseValue(p.pocket_w || '1500um');
        const pocketH = parseValue(p.pocket_h || '1000um');
        const resS = parseValue(p.res_s || '100um');
        const resExt = parseValue(p.res_ext || '100um');
        const fblRad = parseValue(p.fbl_rad || '100um');
        const fblSp = parseValue(p.fbl_sp || '100um');
        const fblGap = parseValue(p.fbl_gap || '80um');
        const fblExt = parseValue(p.fbl_ext || '300um');
        const cpwW = parseValue(p.cpw_width || '10um');
        const jjW = parseValue(p.inductor_width || '5um');
        const chip = p.chip || 'main';
        const layer = p.layer || 1;

        // 1. Transmon ground cut pocket
        const pocketRect = makeRect(0, 0, pocketW / 2, pocketH / 2, theta, x, y);
        qgeometry.poly.push({
          component: comp.name, name: 'pocket', layer: 1, subtract: true, chip: chip,
          geometry: polyStr(pocketRect)
        });

        // 2. Inner circular pad
        const innerPts = [];
        for (let j = 0; j <= 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          const [rx, ry] = rot(radI * Math.cos(a), radI * Math.sin(a), theta);
          innerPts.push([rx + x, ry + y]);
        }

        // 3. Outer concentric ring
        const outerPts = [];
        for (let j = 0; j <= 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          const [rx, ry] = rot(radO * Math.cos(a), radO * Math.sin(a), theta);
          outerPts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'outer_pad', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(outerPts)
        });

        // Gap cut between pads
        const gapCutPts = [];
        for (let j = 0; j <= 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          const [rx, ry] = rot((radI + gap) * Math.cos(a), (radI + gap) * Math.sin(a), theta);
          gapCutPts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'gap_cut', layer: layer, subtract: true, chip: chip,
          geometry: polyStr(gapCutPts)
        });

        // Inner pad island
        qgeometry.poly.push({
          component: comp.name, name: 'inner_island', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(innerPts)
        });

        // 4. North and South Josephson Junctions
        const jjTop = [
          rot(0, radI, theta),
          rot(0, radI + gap, theta)
        ].map(([rx, ry]) => [rx + x, ry + y]);
        const jjBot = [
          rot(0, -radI, theta),
          rot(0, -radI - gap, theta)
        ].map(([rx, ry]) => [rx + x, ry + y]);
        qgeometry.junction.push({
          component: comp.name, name: 'jj_top', layer: layer, width: jjW, chip: chip,
          geometry: lineStr(jjTop)
        });
        qgeometry.junction.push({
          component: comp.name, name: 'jj_bottom', layer: layer, width: jjW, chip: chip,
          geometry: lineStr(jjBot)
        });

        // 5. Readout resonator
        const rrStart = rot(-0.5 * pocketW, radO + resS, theta);
        const rrEnd = rot(resExt, radO + resS, theta);
        const rrPts = [[rrStart[0] + x, rrStart[1] + y], [rrEnd[0] + x, rrEnd[1] + y]];
        qgeometry.path.push({
          component: comp.name, name: 'readout_resonator', layer: layer, width: cpwW, chip: chip, subtract: false,
          geometry: lineStr(rrPts)
        });

        // 6. Flux bias line
        const fblCoords = [
          [0.5 * pocketW, -0.5 * fblGap],
          [0.5 * pocketW - fblExt, -0.5 * fblGap],
          [radO + fblSp + fblRad, -1.0 * fblRad],
          [radO + fblSp + 0.2929 * fblRad, -0.7071 * fblRad],
          [radO + fblSp, 0.0],
          [radO + fblSp + 0.2929 * fblRad, 0.7071 * fblRad],
          [radO + fblSp + fblRad, fblRad],
          [0.5 * pocketW - fblExt, 0.5 * fblGap],
          [0.5 * pocketW, 0.5 * fblGap]
        ];
        const fblPts = fblCoords.map(([px, py]) => {
          const [rx, ry] = rot(px, py, theta);
          return [rx + x, ry + y];
        });
        qgeometry.path.push({
          component: comp.name, name: 'flux_bias_line', layer: layer, width: cpwW, chip: chip, subtract: false,
          geometry: lineStr(fblPts)
        });

        // Pins
        addPin(comp.name, 'pin1', rrPts[1], rrPts[0], cpwW, chip, true);
        addPin(comp.name, 'pin2', fblPts[1], fblPts[0], cpwW, chip, true);
        addPin(comp.name, 'pin3', fblPts[7], fblPts[8], cpwW, chip, true);
      } else if (comp.type === 'transmon_concentric_type_2' || comp.type === 'TransmonConcentricType2') {
        const radO = parseValue(p.rad_outer || '2mm');
        const radI = parseValue(p.rad_inner || '1mm');
        const gap = parseValue(p.gap || '0.5mm');
        const jjW = parseValue(p.jj_w || '0.2mm');
        const fNELen = parseValue(p.finger_NE_length || '0.5mm');
        const fNEW = parseValue(p.finger_NE_width || '0.1mm');
        const cNEW = parseValue(p.coupler_NE_width || '0.1mm');
        const cNEGap = parseValue(p.coupler_NE_gap || '0.1mm');
        const fNWLen = parseValue(p.finger_NW_length || '0.5mm');
        const fSWLen = parseValue(p.finger_SW_length || '0.5mm');
        const pocketW = parseValue(p.pocket_w || '10mm');
        const pocketH = parseValue(p.pocket_h || '10mm');
        const chip = p.chip || 'main';
        const layer = p.layer || 1;

        // Ground pocket cut
        const pocketRect = makeRect(0, 0, pocketW / 2, pocketH / 2, theta, x, y);
        qgeometry.poly.push({
          component: comp.name, name: 'pocket', layer: 1, subtract: true, chip: chip,
          geometry: polyStr(pocketRect)
        });

        // Inner circular pad
        const innerPts = [];
        for (let j = 0; j <= 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          const [rx, ry] = rot(radI * Math.cos(a), radI * Math.sin(a), theta);
          innerPts.push([rx + x, ry + y]);
        }

        // Outer concentric ring
        const outerPts = [];
        for (let j = 0; j <= 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          const [rx, ry] = rot(radO * Math.cos(a), radO * Math.sin(a), theta);
          outerPts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'outer_pad', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(outerPts)
        });

        // Gap cut
        const gapPts = [];
        for (let j = 0; j <= 32; j++) {
          const a = (j / 32) * Math.PI * 2;
          const [rx, ry] = rot((radI + gap) * Math.cos(a), (radI + gap) * Math.sin(a), theta);
          gapPts.push([rx + x, ry + y]);
        }
        qgeometry.poly.push({
          component: comp.name, name: 'gap_cut', layer: layer, subtract: true, chip: chip,
          geometry: polyStr(gapPts)
        });
        qgeometry.poly.push({
          component: comp.name, name: 'inner_island', layer: layer, subtract: false, chip: chip,
          geometry: polyStr(innerPts)
        });

        // 45 degree Josephson Junction
        const cos45 = Math.cos(Math.PI / 4);
        const sin45 = Math.sin(Math.PI / 4);
        const jjPt1 = rot(radI * cos45, -radI * sin45, theta);
        const jjPt2 = rot((radI + gap) * cos45, -(radI + gap) * sin45, theta);
        qgeometry.junction.push({
          component: comp.name, name: 'jj', layer: layer, width: jjW, chip: chip,
          geometry: lineStr([[jjPt1[0] + x, jjPt1[1] + y], [jjPt2[0] + x, jjPt2[1] + y]])
        });

        // Coupler fingers (NE, NW, SW)
        const makeCoupler = (angleDeg, fLen, cW, cGap, pinName) => {
          const ang = angleDeg * Math.PI / 180;
          const ca = Math.cos(ang), sa = Math.sin(ang);
          const fStart = rot(radO * ca, radO * sa, theta);
          const fEnd = rot((radO + fLen) * ca, (radO + fLen) * sa, theta);
          qgeometry.path.push({
            component: comp.name, name: `finger_${pinName}`, layer: layer, width: fNEW, chip: chip, subtract: false,
            geometry: lineStr([[fStart[0] + x, fStart[1] + y], [fEnd[0] + x, fEnd[1] + y]])
          });
          const cBoxR = radO + fLen + cGap + cW / 2;
          const cBoxCorners = makeRect(cBoxR * ca, cBoxR * sa, cW, cW, theta + ang, x, y);
          qgeometry.poly.push({
            component: comp.name, name: `coupler_${pinName}`, layer: layer, subtract: false, chip: chip,
            geometry: polyStr(cBoxCorners)
          });

          // Pin at coupler tip
          const pOuterR = radO + fLen + cGap + cW;
          const pInnerR = radO + fLen + cGap;
          const pA = rot(pInnerR * ca, pInnerR * sa, theta);
          const pB = rot(pOuterR * ca, pOuterR * sa, theta);
          addPin(comp.name, pinName, [pA[0] + x, pA[1] + y], [pB[0] + x, pB[1] + y], cW, chip, true);
        };

        makeCoupler(45, fNELen, cNEW, cNEGap, 'pin1');
        makeCoupler(135, fNWLen, cNEW, cNEGap, 'pin2');
        makeCoupler(225, fSWLen, cNEW, cNEGap, 'pin3');
      }
    });
    
    return qgeometry;
  },

  // Add a new component to the design
  addComponent: (type, initialX = 0, initialY = 0, customParams = null, customName = null) => {
    const def = COMPONENT_DEFINITIONS[type];
    if (!def) return;
    
    const baseParams = customParams ? customParams : def.defaultParams;
    const clonedParams = JSON.parse(JSON.stringify(baseParams));
    
    // Ensure connection_pads is seeded if empty or missing and default has it
    if (!clonedParams.connection_pads || Object.keys(clonedParams.connection_pads).length === 0) {
      if (def.defaultParams?.connection_pads && Object.keys(def.defaultParams.connection_pads).length > 0) {
        clonedParams.connection_pads = JSON.parse(JSON.stringify(def.defaultParams.connection_pads));
      }
    }

    const newComponent = {
      id: `${type}_${++idCounter}`,
      type,
      name: customName || `${def.label} ${idCounter}`,
      params: { 
        ...clonedParams,
        pos_x: clonedParams.pos_x || `${initialX}um`,
        pos_y: clonedParams.pos_y || `${initialY}um`
      }
    };

    set((state) => ({
      server_qgeometry: null,
      components: [...state.components, newComponent],
      selectedComponentId: newComponent.id
    }));
  },

  updateComponentParams: (id, newParams) => {
    set((state) => ({
      server_qgeometry: null,
      components: state.components.map(comp => 
        comp.id === id ? { ...comp, params: { ...comp.params, ...newParams } } : comp
      )
    }));
  },
  
  // Select a component
  selectComponent: (id) => {
    set({ selectedComponentId: id });
  },

  // MetalGUI parity: Nudge component in 2D space
  nudgeComponent: (id, dx = 0, dy = 0) => {
    set((state) => ({
      server_qgeometry: null,
      components: state.components.map(comp => {
        if (comp.id !== id) return comp;
        const parseUnitVal = (strVal, delta) => {
          if (typeof strVal === 'number') return `${strVal + delta}`;
          const match = String(strVal || '0um').trim().match(/^([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s*([a-zA-Z]*)$/);
          if (!match) return `${delta}um`;
          const num = parseFloat(match[1]) || 0;
          const unit = match[2] || 'um';
          return `${num + delta}${unit}`;
        };
        return {
          ...comp,
          params: {
            ...comp.params,
            pos_x: parseUnitVal(comp.params.pos_x, dx),
            pos_y: parseUnitVal(comp.params.pos_y, dy)
          }
        };
      })
    }));
  },

  // MetalGUI parity: Rotate component in place
  rotateComponent: (id, deltaDeg = 90) => {
    set((state) => ({
      server_qgeometry: null,
      components: state.components.map(comp => {
        if (comp.id !== id) return comp;
        const currentRot = parseFloat(comp.params.orientation || '0') || 0;
        const newRot = (currentRot + deltaDeg) % 360;
        return {
          ...comp,
          params: {
            ...comp.params,
            orientation: `${newRot}`
          }
        };
      })
    }));
  },

  // MetalGUI parity: Highlight components
  highlightedComponentIds: [],
  highlightAllComponents: () => {
    set((state) => ({
      highlightedComponentIds: state.components.map(c => c.id)
    }));
  },
  clearHighlight: () => {
    set({ highlightedComponentIds: [] });
  },

  // Delete a component
  deleteComponent: (id) => {
    set((state) => ({
      components: state.components.filter(c => c.id !== id),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId
    }));
  },

  // Update canvas transform
  setCanvasTransform: (transform) => {
    set({ canvasTransform: transform });
  },

  // Clear all
  clearDesign: () => {
    set({ components: [], selectedComponentId: null });
    idCounter = 0;
  },

  // Serialization: to_script equivalent
  generateMetalScript: () => {
    const { components } = get();
    let script = `import alpha_metal as alpha\n`;
    script += `from alpha_metal import designs, draw\n`;
    script += `from alpha_metal import MetalGUI, Dict\n\n`;
    script += `design = designs.DesignPlanar()\n`;
    script += `gui = MetalGUI(design)\n\n`;

    components.forEach(comp => {
      const typeParts = comp.type.split('_');
      const className = typeParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
      
      script += `# Identity and Lifecycle: ${comp.name}\n`;
      script += `try:\n    from alpha_metal.qlibrary import ${className}\nexcept ImportError:\n    pass\n`;
      script += `options_${comp.name.replace(/[^a-zA-Z0-9_]/g, '_')} = Dict(\n`;
      Object.entries(comp.params).forEach(([k, v]) => {
        script += `    ${k}='${v}',\n`;
      });
      script += `)\n`;
      script += `${comp.name.replace(/[^a-zA-Z0-9_]/g, '_')} = ${className}(design, '${comp.name}', options=options_${comp.name.replace(/[^a-zA-Z0-9_]/g, '_')})\n\n`;
    });
    
    script += `gui.rebuild()\n`;
    script += `gui.autoscale()\n`;
    return script;
  },

  // Serialization: to_html equivalent
  generateHTML: () => {
    const { components } = get();
    let html = `<div class="alpha-alpha-html-summary">\n`;
    components.forEach(comp => {
      html += `  <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">\n`;
      html += `    <h3>${comp.name} (Type: ${comp.type})</h3>\n`;
      html += `    <table border="1" style="border-collapse: collapse;">\n`;
      html += `      <tr><th>Option</th><th>Value</th></tr>\n`;
      Object.entries(comp.params).forEach(([k, v]) => {
        html += `      <tr><td>${k}</td><td>${v}</td></tr>\n`;
      });
      html += `    </table>\n`;
      html += `  </div>\n`;
    });
    html += `</div>`;
    return html;
  }
}));
