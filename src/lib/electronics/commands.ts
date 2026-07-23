export interface CircuitComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  properties: Record<string, any>;
}

export interface CircuitConnection {
  id: string;
  fromComponentId: string;
  fromPin: string;
  toComponentId: string;
  toPin: string;
}

export interface SchematicState {
  components: CircuitComponent[];
  connections: CircuitConnection[];
}

export interface Command {
  id: string;
  name: string;
  execute(state: SchematicState): SchematicState;
  undo(state: SchematicState): SchematicState;
}

// 1. ADD COMPONENT
export class AddComponentCommand implements Command {
  id: string;
  name = 'Add Component';

  constructor(
    public componentId: string,
    public componentType: string,
    public x: number,
    public y: number,
    public properties: Record<string, any> = {}
  ) {
    this.id = `add-${componentId}-${Date.now()}`;
  }

  execute(state: SchematicState): SchematicState {
    const exists = state.components.some(c => c.id === this.componentId);
    if (exists) return state;

    return {
      ...state,
      components: [
        ...state.components,
        {
          id: this.componentId,
          type: this.componentType,
          x: this.x,
          y: this.y,
          rotation: 0,
          properties: { ...this.properties },
        },
      ],
    };
  }

  undo(state: SchematicState): SchematicState {
    return {
      ...state,
      components: state.components.filter(c => c.id !== this.componentId),
    };
  }
}

// 2. CONNECT PINS
export class ConnectPinsCommand implements Command {
  id: string;
  name = 'Connect Pins';

  constructor(
    public connectionId: string,
    public fromComponentId: string,
    public fromPin: string,
    public toComponentId: string,
    public toPin: string
  ) {
    this.id = `connect-${connectionId}-${Date.now()}`;
  }

  execute(state: SchematicState): SchematicState {
    const exists = state.connections.some(c => c.id === this.connectionId);
    if (exists) return state;

    // Avoid duplicate connections between same pins
    const duplicate = state.connections.some(
      c =>
        (c.fromComponentId === this.fromComponentId &&
          c.fromPin === this.fromPin &&
          c.toComponentId === this.toComponentId &&
          c.toPin === this.toPin) ||
        (c.fromComponentId === this.toComponentId &&
          c.fromPin === this.toPin &&
          c.toComponentId === this.fromComponentId &&
          c.toPin === this.fromPin)
    );
    if (duplicate) return state;

    return {
      ...state,
      connections: [
        ...state.connections,
        {
          id: this.connectionId,
          fromComponentId: this.fromComponentId,
          fromPin: this.fromPin,
          toComponentId: this.toComponentId,
          toPin: this.toPin,
        },
      ],
    };
  }

  undo(state: SchematicState): SchematicState {
    return {
      ...state,
      connections: state.connections.filter(c => c.id !== this.connectionId),
    };
  }
}

// 3. MOVE COMPONENT
export class MoveComponentCommand implements Command {
  id: string;
  name = 'Move Component';
  private prevX = 0;
  private prevY = 0;

  constructor(
    public componentId: string,
    public nextX: number,
    public nextY: number
  ) {
    this.id = `move-${componentId}-${Date.now()}`;
  }

  execute(state: SchematicState): SchematicState {
    return {
      ...state,
      components: state.components.map(c => {
        if (c.id === this.componentId) {
          this.prevX = c.x;
          this.prevY = c.y;
          return { ...c, x: this.nextX, y: this.nextY };
        }
        return c;
      }),
    };
  }

  undo(state: SchematicState): SchematicState {
    return {
      ...state,
      components: state.components.map(c => {
        if (c.id === this.componentId) {
          return { ...c, x: this.prevX, y: this.prevY };
        }
        return c;
      }),
    };
  }
}

// 4. ROTATE COMPONENT
export class RotateComponentCommand implements Command {
  id: string;
  name = 'Rotate Component';
  private prevRotation = 0;

  constructor(
    public componentId: string,
    public rotationAngleDelta: number = 90 // Default is rotate clock-wise by 90 degrees
  ) {
    this.id = `rotate-${componentId}-${Date.now()}`;
  }

  execute(state: SchematicState): SchematicState {
    return {
      ...state,
      components: state.components.map(c => {
        if (c.id === this.componentId) {
          this.prevRotation = c.rotation;
          const newRotation = (c.rotation + this.rotationAngleDelta) % 360;
          return { ...c, rotation: newRotation };
        }
        return c;
      }),
    };
  }

  undo(state: SchematicState): SchematicState {
    return {
      ...state,
      components: state.components.map(c => {
        if (c.id === this.componentId) {
          return { ...c, rotation: this.prevRotation };
        }
        return c;
      }),
    };
  }
}

// 5. UPDATE PROPERTY
export class UpdatePropertyCommand implements Command {
  id: string;
  name = 'Update Property';
  private prevValue: any;

  constructor(
    public componentId: string,
    public propertyName: string,
    public value: any
  ) {
    this.id = `prop-${componentId}-${propertyName}-${Date.now()}`;
  }

  execute(state: SchematicState): SchematicState {
    return {
      ...state,
      components: state.components.map(c => {
        if (c.id === this.componentId) {
          this.prevValue = c.properties[this.propertyName];
          return {
            ...c,
            properties: {
              ...c.properties,
              [this.propertyName]: this.value,
            },
          };
        }
        return c;
      }),
    };
  }

  undo(state: SchematicState): SchematicState {
    return {
      ...state,
      components: state.components.map(c => {
        if (c.id === this.componentId) {
          return {
            ...c,
            properties: {
              ...c.properties,
              [this.propertyName]: this.prevValue,
            },
          };
        }
        return c;
      }),
    };
  }
}

// 6. DELETE COMPONENT
export class DeleteComponentCommand implements Command {
  id: string;
  name = 'Delete Component';
  private deletedComponent: CircuitComponent | null = null;
  private deletedConnections: CircuitConnection[] = [];

  constructor(public componentId: string) {
    this.id = `delete-${componentId}-${Date.now()}`;
  }

  execute(state: SchematicState): SchematicState {
    const component = state.components.find(c => c.id === this.componentId);
    if (!component) return state;

    this.deletedComponent = component;
    this.deletedConnections = state.connections.filter(
      c => c.fromComponentId === this.componentId || c.toComponentId === this.componentId
    );

    return {
      components: state.components.filter(c => c.id !== this.componentId),
      connections: state.connections.filter(
        c => c.fromComponentId !== this.componentId && c.toComponentId !== this.componentId
      ),
    };
  }

  undo(state: SchematicState): SchematicState {
    if (!this.deletedComponent) return state;

    return {
      components: [...state.components, this.deletedComponent],
      connections: [...state.connections, ...this.deletedConnections],
    };
  }
}
