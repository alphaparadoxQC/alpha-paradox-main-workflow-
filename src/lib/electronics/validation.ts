import { CircuitComponent, CircuitConnection } from './commands';
import { ELECTRONIC_COMPONENTS } from './registry';

export interface ValidationWarning {
  id: string;
  type: 'short_circuit' | 'led_burnout' | 'self_connection' | 'invalid_connection';
  severity: 'warning' | 'error';
  message: string;
  affectedComponents: string[];
  affectedConnections: string[];
}

export function validateCircuit(
  components: CircuitComponent[],
  connections: CircuitConnection[]
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (components.length === 0) return warnings;

  // 1. Check for self-connections
  connections.forEach(conn => {
    if (conn.fromComponentId === conn.toComponentId) {
      warnings.push({
        id: `self-conn-${conn.id}`,
        type: 'self_connection',
        severity: 'warning',
        message: `Pin ${conn.fromPin} is connected to pin ${conn.toPin} on the same component.`,
        affectedComponents: [conn.fromComponentId],
        affectedConnections: [conn.id],
      });
    }
  });

  // Helper: Build electrical nets (connected components of pins)
  // Each pin is represented as "componentId:pinId"
  const parent: Record<string, string> = {};

  function find(pin: string): string {
    if (!parent[pin]) {
      parent[pin] = pin;
    }
    if (parent[pin] === pin) {
      return pin;
    }
    parent[pin] = find(parent[pin]);
    return parent[pin];
  }

  function union(pinA: string, pinB: string) {
    const rootA = find(pinA);
    const rootB = find(pinB);
    if (rootA !== rootB) {
      parent[rootA] = rootB;
    }
  }

  // Initialize all component pins in parent map
  components.forEach(comp => {
    const meta = ELECTRONIC_COMPONENTS[comp.type];
    if (meta) {
      meta.pins.forEach(pin => {
        const pinKey = `${comp.id}:${pin.id}`;
        parent[pinKey] = pinKey;
      });
    }
  });

  // Union connected pins
  connections.forEach(conn => {
    const pinA = `${conn.fromComponentId}:${conn.fromPin}`;
    const pinB = `${conn.toComponentId}:${conn.toPin}`;
    union(pinA, pinB);
  });

  // Group pins by their root net
  const nets: Record<string, string[]> = {};
  Object.keys(parent).forEach(pinKey => {
    const root = find(pinKey);
    if (!nets[root]) {
      nets[root] = [];
    }
    nets[root].push(pinKey);
  });

  // Helper to categorize pins inside nets
  // A net can contain power pins, gnd pins, component inputs/outputs
  const powerPins = new Set(['5V', '3.3V', 'positive', 'VCC']);
  const gndPins = new Set(['GND', 'GND_1', 'GND_2', 'negative']);

  // For each net, check if it contains both Power and GND
  Object.entries(nets).forEach(([netRoot, pins]) => {
    let hasPower = false;
    let hasGnd = false;
    const powerSourceComps: string[] = [];
    const gndSourceComps: string[] = [];

    pins.forEach(pinKey => {
      const [compId, pinId] = pinKey.split(':');
      if (powerPins.has(pinId)) {
        hasPower = true;
        if (!powerSourceComps.includes(compId)) powerSourceComps.push(compId);
      }
      if (gndPins.has(pinId)) {
        hasGnd = true;
        if (!gndSourceComps.includes(compId)) gndSourceComps.push(compId);
      }
    });

    if (hasPower && hasGnd) {
      // Short circuit detected!
      const affectedComps = Array.from(new Set([...powerSourceComps, ...gndSourceComps]));
      // Find connections that are part of this net
      const affectedConns = connections.filter(conn => {
        const pinA = `${conn.fromComponentId}:${conn.fromPin}`;
        return find(pinA) === find(netRoot);
      }).map(c => c.id);

      warnings.push({
        id: `short-circuit-${netRoot}`,
        type: 'short_circuit',
        severity: 'error',
        message: 'Short Circuit Warning: Direct connection between Power and Ground detected in this net!',
        affectedComponents: affectedComps,
        affectedConnections: affectedConns,
      });
    }
  });

  // 2. Check for LED burnout (LED anode directly connected to power, cathode directly connected to GND)
  components.forEach(comp => {
    if (comp.type === 'led') {
      const anodeKey = `${comp.id}:anode`;
      const cathodeKey = `${comp.id}:cathode`;

      const anodeRoot = find(anodeKey);
      const cathodeRoot = find(cathodeKey);

      // Check if anode's net contains a raw power pin
      const anodeNetPins = nets[anodeRoot] || [];
      const cathodeNetPins = nets[cathodeRoot] || [];

      let anodeHasPower = false;
      let cathodeHasGnd = false;
      const powerSources: string[] = [];
      const gndSources: string[] = [];

      anodeNetPins.forEach(p => {
        const [cId, pinId] = p.split(':');
        if (powerPins.has(pinId)) {
          anodeHasPower = true;
          powerSources.push(cId);
        }
      });

      cathodeNetPins.forEach(p => {
        const [cId, pinId] = p.split(':');
        if (gndPins.has(pinId)) {
          cathodeHasGnd = true;
          gndSources.push(cId);
        }
      });

      if (anodeHasPower && cathodeHasGnd) {
        // Find connections involved in the LED paths
        const affectedConns = connections.filter(conn => {
          const pinA = `${conn.fromComponentId}:${conn.fromPin}`;
          const root = find(pinA);
          return root === anodeRoot || root === cathodeRoot;
        }).map(c => c.id);

        warnings.push({
          id: `burnout-${comp.id}`,
          type: 'led_burnout',
          severity: 'warning',
          message: `Burnout Warning: LED "${comp.id}" is connected directly to power without a current-limiting resistor. It will burn out!`,
          affectedComponents: [comp.id, ...powerSources, ...gndSources],
          affectedConnections: affectedConns,
        });
      }
    }
  });

  return warnings;
}
