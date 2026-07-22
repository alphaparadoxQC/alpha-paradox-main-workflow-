import { describe, it, expect } from 'vitest';
import { 
  AddComponentCommand, 
  ConnectPinsCommand, 
  DeleteComponentCommand, 
  RotateComponentCommand, 
  UpdatePropertyCommand,
  SchematicState 
} from '../commands';
import { validateCircuit } from '../validation';
import { parseNaturalLanguageRoute } from '../nlp';

describe('Electronics Command Pattern & State Mutators', () => {
  it('should successfully add components to state', () => {
    let state: SchematicState = { components: [], connections: [] };

    const cmd1 = new AddComponentCommand('MCU1', 'arduino_uno', 10, 20);
    state = cmd1.execute(state);

    expect(state.components).toHaveLength(1);
    expect(state.components[0]).toEqual({
      id: 'MCU1',
      type: 'arduino_uno',
      x: 10,
      y: 20,
      rotation: 0,
      properties: {},
    });

    // Test undoing AddComponent
    state = cmd1.undo(state);
    expect(state.components).toHaveLength(0);
  });

  it('should support connection wiring and deletion', () => {
    let state: SchematicState = {
      components: [
        { id: 'MCU1', type: 'arduino_uno', x: 0, y: 0, rotation: 0, properties: {} },
        { id: 'LED1', type: 'led', x: 100, y: 100, rotation: 0, properties: {} },
      ],
      connections: [],
    };

    const connectCmd = new ConnectPinsCommand('wire-1', 'MCU1', 'D13', 'LED1', 'anode');
    state = connectCmd.execute(state);

    expect(state.connections).toHaveLength(1);
    expect(state.connections[0]).toEqual({
      id: 'wire-1',
      fromComponentId: 'MCU1',
      fromPin: 'D13',
      toComponentId: 'LED1',
      toPin: 'anode',
    });

    // Test undoing connection
    state = connectCmd.undo(state);
    expect(state.connections).toHaveLength(0);
  });

  it('should cascadingly delete connections when a component is deleted', () => {
    let state: SchematicState = {
      components: [
        { id: 'MCU1', type: 'arduino_uno', x: 0, y: 0, rotation: 0, properties: {} },
        { id: 'LED1', type: 'led', x: 100, y: 100, rotation: 0, properties: {} },
      ],
      connections: [
        { id: 'wire-1', fromComponentId: 'MCU1', fromPin: 'D13', toComponentId: 'LED1', toPin: 'anode' }
      ],
    };

    const deleteCmd = new DeleteComponentCommand('LED1');
    state = deleteCmd.execute(state);

    expect(state.components).toHaveLength(1);
    expect(state.components[0].id).toBe('MCU1');
    expect(state.connections).toHaveLength(0); // Wire deleted automatically

    // Test undo delete
    state = deleteCmd.undo(state);
    expect(state.components).toHaveLength(2);
    expect(state.connections).toHaveLength(1); // Wire restored
  });
});

describe('Electrical Schematic Validation Rules', () => {
  it('should detect short circuits', () => {
    const components = [
      { id: 'MCU1', type: 'arduino_uno', x: 0, y: 0, rotation: 0, properties: {} },
    ];
    // Connect 5V directly to GND
    const connections = [
      { id: 'wire-1', fromComponentId: 'MCU1', fromPin: '5V', toComponentId: 'MCU1', toPin: 'GND_1' },
    ];

    const warnings = validateCircuit(components, connections);
    const shortCircuitWarning = warnings.find(w => w.type === 'short_circuit');
    expect(shortCircuitWarning).toBeDefined();
    expect(shortCircuitWarning?.severity).toBe('error');
  });

  it('should flag LED burnout warnings', () => {
    const components = [
      { id: 'MCU1', type: 'arduino_uno', x: 0, y: 0, rotation: 0, properties: {} },
      { id: 'LED1', type: 'led', x: 100, y: 100, rotation: 0, properties: {} },
    ];
    // LED positive is wired to 5V power directly, cathode to GND. No resistor.
    const connections = [
      { id: 'wire-1', fromComponentId: 'MCU1', fromPin: '5V', toComponentId: 'LED1', toPin: 'anode' },
      { id: 'wire-2', fromComponentId: 'LED1', fromPin: 'cathode', toComponentId: 'MCU1', toPin: 'GND_1' },
    ];

    const warnings = validateCircuit(components, connections);
    expect(warnings.some(w => w.type === 'led_burnout')).toBe(true);
  });
});

describe('AI NLP Prompts Parsing and Compilation', () => {
  it('should parse simple clear requests', () => {
    const res = parseNaturalLanguageRoute('clear circuit');
    expect(res.status).toBe('success');
    expect(res.commands[0].action).toBe('CLEAR_ALL');
  });

  it('should compile full adders', () => {
    const res = parseNaturalLanguageRoute('Build a full adder');
    expect(res.status).toBe('success');
    expect(res.commands.filter(c => c.action === 'ADD_COMPONENT')).toHaveLength(5); // 2 XOR, 2 AND, 1 OR
  });

  it('should request clarification if resistor requirement is ambiguous', () => {
    const res = parseNaturalLanguageRoute('Connect an Arduino Uno to an LED');
    expect(res.status).toBe('clarification_needed');
    expect(res.questions).toHaveLength(2); // Ask for resistor and pin
  });
});
