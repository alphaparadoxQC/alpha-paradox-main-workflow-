import uuid
from typing import Dict, Any, List, Optional
import numpy as np

class Pin:
    """
    Defines a docking point on a component for routing transmission lines.
    """
    def __init__(self, name: str, x: float, y: float, orientation: float, width: float = 10.0):
        self.name = name
        self.x = x
        self.y = y
        self.orientation = orientation  # Angle in degrees (0 points East)
        self.width = width
        self.connected_to: Optional['Pin'] = None

    def serialize(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "x": self.x,
            "y": self.y,
            "orientation": self.orientation,
            "width": self.width,
            "connected_to": f"{self.connected_to.component.name}:{self.connected_to.name}" if self.connected_to else None
        }


class BaseQComponent:
    """
    The core parametric component class, inspired by Alpha Paradox's QComponent.
    Every visual node in the React UI should map to an instance of a subclass of this.
    """
    # Default options that subclasses can override
    default_options = {
        "pos_x": "0.0mm",
        "pos_y": "0.0mm",
        "orientation": "0.0"
    }

    def __init__(self, design: 'QDesign', name: str, options: Dict[str, Any] = None):
        self.id = str(uuid.uuid4())
        self.design = design
        self.name = name
        
        # Merge default options with user provided options
        self.options = self.default_options.copy()
        if options:
            self.options.update(options)
            
        self.pins: Dict[str, Pin] = {}
        self.geometry = {}  # Store generated polygons/paths here
        
        # Automatically register with the design netlist manager
        self.design.add_component(self)
        
        # Call the subclass implementation to generate shapes and pins
        self.make()

    def make(self):
        """
        Subclasses must implement this. 
        It parses self.options and populates self.geometry and self.pins.
        """
        raise NotImplementedError("Subclasses must implement the make() method.")

    def add_pin(self, name: str, x: float, y: float, orientation: float, width: float = 10.0):
        """Helper to add a pin during make()"""
        pin = Pin(name, x, y, orientation, width)
        pin.component = self
        self.pins[name] = pin

    def parse_value(self, val_str: str) -> float:
        """
        Utility to convert parametric strings (like '10um' or '2.5mm') into internal floats (e.g., standardizing to mm).
        Also resolves variables from design.variables.
        """
        if isinstance(val_str, (int, float)):
            return float(val_str)
        val_str = str(val_str).lower().strip()
        
        # Check if it's a variable
        if val_str in self.design.variables:
            val_str = self.design.variables[val_str]
            
        if val_str.endswith('um'):
            return float(val_str.replace('um', '')) / 1000.0
        if val_str.endswith('mm'):
            return float(val_str.replace('mm', ''))
        if val_str.endswith('nm'):
            return float(val_str.replace('nm', '')) / 1e6
        
        try:
            return float(val_str)
        except ValueError:
            return 0.0

    def serialize(self) -> Dict[str, Any]:
        """Serialize for sending back to the React UI or saving the netlist."""
        return {
            "id": self.id,
            "name": self.name,
            "class_name": self.__class__.__name__,
            "options": self.options,
            "pins": {name: pin.serialize() for name, pin in self.pins.items()}
        }


class QDesign:
    """
    The central Netlist and Geometry manager.
    Maintains the state of all components and how they are routed together.
    """
    def __init__(self, metadata: Dict[str, Any] = None):
        self.components: Dict[str, BaseQComponent] = {}
        self.variables: Dict[str, str] = {}
        self.chips: Dict[str, Any] = {}
        self.qgeometry = {
            "path": [],
            "poly": [],
            "junction": []
        }
        self.metadata = metadata or {}
        
    def add_component(self, component: BaseQComponent):
        if component.name in self.components:
            raise ValueError(f"Component with name '{component.name}' already exists.")
        self.components[component.name] = component

    def delete_component(self, component_name: str):
        if component_name in self.components:
            del self.components[component_name]

    def rename_component(self, old_name: str, new_name: str):
        if old_name in self.components:
            comp = self.components.pop(old_name)
            comp.name = new_name
            self.components[new_name] = comp

    def rebuild(self):
        """Rebuilds all components in the design."""
        self.qgeometry = {"path": [], "poly": [], "junction": []}
        for comp in self.components.values():
            comp.geometry = {}
            comp.pins = {}
            comp.make()

    def connect_pins(self, comp1_name: str, pin1_name: str, comp2_name: str, pin2_name: str):
        """Logically connect two pins."""
        pin1 = self.components[comp1_name].pins[pin1_name]
        pin2 = self.components[comp2_name].pins[pin2_name]
        
        pin1.connected_to = pin2
        pin2.connected_to = pin1

    def serialize(self) -> Dict[str, Any]:
        """Export the full chip design state."""
        return {
            "variables": self.variables,
            "chips": self.chips,
            "components": {name: comp.serialize() for name, comp in self.components.items()}
        }

class DesignPlanar(QDesign):
    """
    A planar (2D) quantum design. Initializes with a default 'main' chip.
    """
    def __init__(self, metadata: Dict[str, Any] = None, overwrite: bool = False):
        super().__init__(metadata=metadata)
        self.chips["main"] = {
            "material": "silicon",
            "layer_stack": "1",
            "size": {"size_x": "9mm", "size_y": "6mm", "size_z": "-500um"}
        }


class MultiPlanar(QDesign):
    """
    A multi-planar quantum design (e.g. 3D stackups, flip-chip).
    Supports multiple chips with configurable layers and thicknesses.
    """
    def __init__(self, metadata: Dict[str, Any] = None, overwrite: bool = False):
        super().__init__(metadata=metadata)
        # Initializes with two chips as an example of a multi-planar default
        self.chips["main"] = {
            "material": "silicon",
            "layer_stack": "1",
            "size": {"size_x": "9mm", "size_y": "6mm", "size_z": "-500um"}
        }
        self.chips["interposer"] = {
            "material": "silicon",
            "layer_stack": "2",
            "size": {"size_x": "9mm", "size_y": "6mm", "size_z": "-200um"}
        }


# Example Implementation of a Parametric Qubit
class TransmonPocket(BaseQComponent):
    """A standard Transmon Pocket Qubit."""
    default_options = {
        "pos_x": "0.0mm",
        "pos_y": "0.0mm",
        "pad_width": "400um",
        "pad_gap": "30um",
        "orientation": "0"
    }

    def make(self):
        # 1. Parse parametric options
        x = self.parse_value(self.options["pos_x"])
        y = self.parse_value(self.options["pos_y"])
        pad_width = self.parse_value(self.options["pad_width"])
        
        # 2. Generate Geometry (simplified)
        self.geometry["island"] = {"type": "rect", "x": x, "y": y, "width": pad_width, "height": pad_width/2}
        
        # 3. Add Pins for routing readout or control lines
        self.add_pin("readout", x, y + pad_width/4, orientation=90.0)
        self.add_pin("control", x, y - pad_width/4, orientation=270.0)

class Launchpad(BaseQComponent):
    """A wirebond launchpad for IO connections."""
    default_options = {
        "pos_x": "0.0mm",
        "pos_y": "0.0mm",
        "trace_width": "10um",
        "pad_width": "200um",
        "orientation": "0"
    }
    
    def make(self):
        x = self.parse_value(self.options["pos_x"])
        y = self.parse_value(self.options["pos_y"])
        self.add_pin("out", x, y, orientation=float(self.options["orientation"]))

class RouteMeander(BaseQComponent):
    """A Coplanar Waveguide (CPW) meander line."""
    default_options = {
        "start_pin": "",
        "end_pin": "",
        "trace_width": "10um",
        "gap": "6um",
        "meander_length": "1.5mm"
    }
    
    def make(self):
        # Logic to extract the exact coordinates of start_pin and end_pin from the design netlist
        pass

