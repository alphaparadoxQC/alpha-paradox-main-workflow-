export type PinType = 'power_out' | 'power_in' | 'gnd' | 'io' | 'passive';

export interface PinDefinition {
  id: string;      // Pin identifier used for wire connections
  name: string;    // Human-readable display label
  type: PinType;
  x: number;       // Visual percentage from left edge (0 to 100)
  y: number;       // Visual percentage from top edge (0 to 100)
  side: 'left' | 'right' | 'top' | 'bottom';
}

export interface PropertyDefinition {
  name: string;
  type: 'string' | 'number' | 'select';
  options?: string[];
  defaultValue: any;
  label: string;
}

export interface ComponentMetadata {
  type: string;
  name: string;
  category: 'Microcontrollers' | 'Passives' | 'Actuators' | 'Power' | 'Logic';
  description: string;
  pins: PinDefinition[];
  properties: Record<string, PropertyDefinition>;
  width: number;
  height: number;
}

export const ELECTRONIC_COMPONENTS: Record<string, ComponentMetadata> = {
  arduino_uno: {
    type: 'arduino_uno',
    name: 'Arduino Uno R3',
    category: 'Microcontrollers',
    description: 'Atmega328P microcontroller board with digital/analog IO pins.',
    width: 240,
    height: 160,
    pins: [
      // Left side: Power pins
      { id: '5V', name: '5V', type: 'power_out', x: 0, y: 30, side: 'left' },
      { id: '3.3V', name: '3.3V', type: 'power_out', x: 0, y: 50, side: 'left' },
      { id: 'GND_1', name: 'GND', type: 'gnd', x: 0, y: 70, side: 'left' },
      { id: 'GND_2', name: 'GND', type: 'gnd', x: 0, y: 85, side: 'left' },
      // Bottom: Analog pins
      { id: 'A0', name: 'A0', type: 'io', x: 20, y: 100, side: 'bottom' },
      { id: 'A1', name: 'A1', type: 'io', x: 35, y: 100, side: 'bottom' },
      { id: 'A2', name: 'A2', type: 'io', x: 50, y: 100, side: 'bottom' },
      { id: 'A3', name: 'A3', type: 'io', x: 65, y: 100, side: 'bottom' },
      { id: 'A4', name: 'A4', type: 'io', x: 80, y: 100, side: 'bottom' },
      { id: 'A5', name: 'A5', type: 'io', x: 95, y: 100, side: 'bottom' },
      // Right side: Digital pins
      { id: 'D0', name: 'D0 (RX)', type: 'io', x: 100, y: 92, side: 'right' },
      { id: 'D1', name: 'D1 (TX)', type: 'io', x: 100, y: 85, side: 'right' },
      { id: 'D2', name: 'D2', type: 'io', x: 100, y: 78, side: 'right' },
      { id: 'D3', name: 'D3 (~)', type: 'io', x: 100, y: 71, side: 'right' },
      { id: 'D4', name: 'D4', type: 'io', x: 100, y: 64, side: 'right' },
      { id: 'D5', name: 'D5 (~)', type: 'io', x: 100, y: 57, side: 'right' },
      { id: 'D6', name: 'D6 (~)', type: 'io', x: 100, y: 50, side: 'right' },
      { id: 'D7', name: 'D7', type: 'io', x: 100, y: 43, side: 'right' },
      { id: 'D8', name: 'D8', type: 'io', x: 100, y: 36, side: 'right' },
      { id: 'D9', name: 'D9 (~)', type: 'io', x: 100, y: 29, side: 'right' },
      { id: 'D10', name: 'D10 (~)', type: 'io', x: 100, y: 22, side: 'right' },
      { id: 'D11', name: 'D11 (~)', type: 'io', x: 100, y: 15, side: 'right' },
      { id: 'D12', name: 'D12', type: 'io', x: 100, y: 8, side: 'right' },
      { id: 'D13', name: 'D13', type: 'io', x: 100, y: 1, side: 'right' },
    ],
    properties: {
      boardModel: { name: 'boardModel', type: 'string', defaultValue: 'Uno R3', label: 'Board Model' },
    },
  },
  resistor: {
    type: 'resistor',
    name: 'Resistor',
    category: 'Passives',
    description: 'Restricts the flow of electrical current.',
    width: 120,
    height: 60,
    pins: [
      { id: 'p1', name: '1', type: 'passive', x: 0, y: 50, side: 'left' },
      { id: 'p2', name: '2', type: 'passive', x: 100, y: 50, side: 'right' },
    ],
    properties: {
      resistance: { 
        name: 'resistance', 
        type: 'select', 
        options: ['100Ω', '220Ω', '330Ω', '1kΩ', '10kΩ', '100kΩ'], 
        defaultValue: '220Ω', 
        label: 'Resistance' 
      },
    },
  },
  led: {
    type: 'led',
    name: 'LED',
    category: 'Actuators',
    description: 'Light Emitting Diode that glows when forward biased.',
    width: 80,
    height: 80,
    pins: [
      { id: 'anode', name: '+ (Anode)', type: 'passive', x: 25, y: 100, side: 'bottom' },
      { id: 'cathode', name: '- (Cathode)', type: 'passive', x: 75, y: 100, side: 'bottom' },
    ],
    properties: {
      color: { 
        name: 'color', 
        type: 'select', 
        options: ['red', 'green', 'blue', 'yellow', 'white'], 
        defaultValue: 'red', 
        label: 'LED Color' 
      },
    },
  },
  capacitor: {
    type: 'capacitor',
    name: 'Capacitor',
    category: 'Passives',
    description: 'Stores electrical energy in an electric field.',
    width: 80,
    height: 80,
    pins: [
      { id: 'p1', name: '1', type: 'passive', x: 0, y: 50, side: 'left' },
      { id: 'p2', name: '2', type: 'passive', x: 100, y: 50, side: 'right' },
    ],
    properties: {
      capacitance: { 
        name: 'capacitance', 
        type: 'select', 
        options: ['100nF', '1µF', '10µF', '100µF', '470µF'], 
        defaultValue: '10µF', 
        label: 'Capacitance' 
      },
    },
  },
  battery_9v: {
    type: 'battery_9v',
    name: '9V Battery',
    category: 'Power',
    description: 'Direct current 9 Volt power supply source.',
    width: 100,
    height: 140,
    pins: [
      { id: 'positive', name: '+', type: 'power_out', x: 25, y: 0, side: 'top' },
      { id: 'negative', name: '-', type: 'gnd', x: 75, y: 0, side: 'top' },
    ],
    properties: {
      voltage: { name: 'voltage', type: 'number', defaultValue: 9, label: 'Voltage (V)' },
    },
  },
  and_gate: {
    type: 'and_gate',
    name: 'AND Gate (74HC08)',
    category: 'Logic',
    description: 'Quad 2-input AND gate integrated circuit.',
    width: 140,
    height: 100,
    pins: [
      { id: 'A1', name: '1A', type: 'io', x: 0, y: 20, side: 'left' },
      { id: 'B1', name: '1B', type: 'io', x: 0, y: 40, side: 'left' },
      { id: 'Y1', name: '1Y', type: 'io', x: 100, y: 30, side: 'right' },
      { id: 'A2', name: '2A', type: 'io', x: 0, y: 60, side: 'left' },
      { id: 'B2', name: '2B', type: 'io', x: 0, y: 80, side: 'left' },
      { id: 'Y2', name: '2Y', type: 'io', x: 100, y: 70, side: 'right' },
      { id: 'VCC', name: 'VCC', type: 'power_in', x: 50, y: 0, side: 'top' },
      { id: 'GND', name: 'GND', type: 'gnd', x: 50, y: 100, side: 'bottom' },
    ],
    properties: {},
  },
  or_gate: {
    type: 'or_gate',
    name: 'OR Gate (74HC32)',
    category: 'Logic',
    description: 'Quad 2-input OR gate integrated circuit.',
    width: 140,
    height: 100,
    pins: [
      { id: 'A1', name: '1A', type: 'io', x: 0, y: 20, side: 'left' },
      { id: 'B1', name: '1B', type: 'io', x: 0, y: 40, side: 'left' },
      { id: 'Y1', name: '1Y', type: 'io', x: 100, y: 30, side: 'right' },
      { id: 'A2', name: '2A', type: 'io', x: 0, y: 60, side: 'left' },
      { id: 'B2', name: '2B', type: 'io', x: 0, y: 80, side: 'left' },
      { id: 'Y2', name: '2Y', type: 'io', x: 100, y: 70, side: 'right' },
      { id: 'VCC', name: 'VCC', type: 'power_in', x: 50, y: 0, side: 'top' },
      { id: 'GND', name: 'GND', type: 'gnd', x: 50, y: 100, side: 'bottom' },
    ],
    properties: {},
  },
  xor_gate: {
    type: 'xor_gate',
    name: 'XOR Gate (74HC86)',
    category: 'Logic',
    description: 'Quad 2-input XOR gate integrated circuit.',
    width: 140,
    height: 100,
    pins: [
      { id: 'A1', name: '1A', type: 'io', x: 0, y: 20, side: 'left' },
      { id: 'B1', name: '1B', type: 'io', x: 0, y: 40, side: 'left' },
      { id: 'Y1', name: '1Y', type: 'io', x: 100, y: 30, side: 'right' },
      { id: 'A2', name: '2A', type: 'io', x: 0, y: 60, side: 'left' },
      { id: 'B2', name: '2B', type: 'io', x: 0, y: 80, side: 'left' },
      { id: 'Y2', name: '2Y', type: 'io', x: 100, y: 70, side: 'right' },
      { id: 'VCC', name: 'VCC', type: 'power_in', x: 50, y: 0, side: 'top' },
      { id: 'GND', name: 'GND', type: 'gnd', x: 50, y: 100, side: 'bottom' },
    ],
    properties: {},
  },
};
