import os
import csv
import qiskit_metal as metal
from qiskit_metal import designs, QComponent
from qiskit_metal.qlibrary.qubits.transmon_pocket import TransmonPocket
from qiskit_metal.qlibrary.tlines.straight_path import RouteStraight
from qiskit_metal.qlibrary.terminations.open_to_ground import OpenToGround
from shapely.geometry import box
from shapely.affinity import rotate

class TestResonator(QComponent):
    """Standalone lambda/2 resonator for measuring substrate dielectric loss."""
    default_options = dict(
        pos_x=0.0, pos_y=0.0, length=2.0, 
        trace_width=0.01, trace_gap=0.006
    )
    def make(self):
        p = self.p
        trace = box(p.pos_x - p.trace_width/2.0, p.pos_y - p.length/2.0, 
                    p.pos_x + p.trace_width/2.0, p.pos_y + p.length/2.0)
        gap = box(p.pos_x - p.trace_width/2.0 - p.trace_gap, p.pos_y - p.length/2.0 - p.trace_gap, 
                  p.pos_x + p.trace_width/2.0 + p.trace_gap, p.pos_y + p.length/2.0 + p.trace_gap)
        self.add_qgeometry('poly', {'trace': trace}, layer=1)
        self.add_qgeometry('poly', {'gap': gap}, layer=1, subtract=True)

class BondPad(QComponent):
    """Square bond pad for wirebonding or bump bonding to external circuitry."""
    default_options = dict(
        pos_x=0.0, pos_y=0.0,
        width=0.1, # 100 um pad
        height=0.1,
        gap=0.05 # 50 um gap to ground
    )
    def make(self):
        p = self.p
        pad = box(p.pos_x - p.width/2.0, p.pos_y - p.height/2.0, 
                  p.pos_x + p.width/2.0, p.pos_y + p.height/2.0)
        gap = box(p.pos_x - p.width/2.0 - p.gap, p.pos_y - p.height/2.0 - p.gap, 
                  p.pos_x + p.width/2.0 + p.gap, p.pos_y + p.height/2.0 + p.gap)
        self.add_qgeometry('poly', {'pad': pad}, layer=1)
        self.add_qgeometry('poly', {'gap': gap}, layer=1, subtract=True)

class AirBridge(QComponent):
    """Custom AirBridge component for ground plane continuity."""
    default_options = dict(
        pos_x=0.0, pos_y=0.0, 
        orientation=0, # 0: bridge is vertical (crosses horiz CPW)
        span=0.03, # 30 um span across CPW
        pad_size=0.015, # 15 um landing pads
        width=0.008 # 8 um wide bridge (DRC margin)
    )
    def make(self):
        p = self.p
        x = p.pos_x
        y = p.pos_y
        span = p.span
        pad = p.pad_size
        w = p.width
        
        bridge = box(x - w/2.0, y - span/2.0, x + w/2.0, y + span/2.0)
        landing1 = box(x - w/2.0, y + span/2.0, x + w/2.0, y + span/2.0 + pad)
        landing2 = box(x - w/2.0, y - span/2.0 - pad, x + w/2.0, y - span/2.0)
        
        bridge = rotate(bridge, p.orientation, origin=(x,y))
        landing1 = rotate(landing1, p.orientation, origin=(x,y))
        landing2 = rotate(landing2, p.orientation, origin=(x,y))
        
        self.add_qgeometry('poly', {'bridge': bridge}, layer=10)
        self.add_qgeometry('poly', {'landing1': landing1, 'landing2': landing2}, layer=11)

class VerticalBus(QComponent):
    """Custom component to draw a vertical CPW bridging horizontal buses without touching qubits."""
    default_options = dict(
        pos_x=0.0, pos_y=0.0, length=0.65, 
        trace_width=0.01, trace_gap=0.006
    )
    def make(self):
        p = self.p
        trace = box(p.pos_x - p.trace_width/2.0, p.pos_y - p.length/2.0, 
                    p.pos_x + p.trace_width/2.0, p.pos_y + p.length/2.0)
        gap_box = box(p.pos_x - p.trace_width/2.0 - p.trace_gap, p.pos_y - p.length/2.0, 
                      p.pos_x + p.trace_width/2.0 + p.trace_gap, p.pos_y + p.length/2.0)
        self.add_qgeometry('poly', {'trace': trace}, layer=1)
        self.add_qgeometry('poly', {'gap': gap_box}, layer=1, subtract=True)

class InterstitialHorizontalBus(QComponent):
    """Draws a horizontal CPW line linking vertical buses without touching qubits."""
    default_options = dict(
        pos_x=0.0, pos_y=0.0, length=0.65, 
        trace_width=0.01, trace_gap=0.006
    )
    def make(self):
        p = self.p
        trace = box(p.pos_x - p.length/2.0, p.pos_y - p.trace_width/2.0, 
                    p.pos_x + p.length/2.0, p.pos_y + p.trace_width/2.0)
        gap_box = box(p.pos_x - p.length/2.0, p.pos_y - p.trace_width/2.0 - p.trace_gap, 
                      p.pos_x + p.length/2.0, p.pos_y + p.trace_width/2.0 + p.trace_gap)
        self.add_qgeometry('poly', {'trace': trace}, layer=1)
        self.add_qgeometry('poly', {'gap': gap_box}, layer=1, subtract=True)

def generate_1100_qubit_array():
    print("Initializing Qiskit Metal Planar Design...")
    design = designs.DesignPlanar()
    
    # Phase 12 & 13: Substrate and Impedance Specification
    design.chips.main.material = ['silicon']
    design.variables['cpw_width'] = '10um'
    design.variables['cpw_gap'] = '6um'

    cols = 44
    rows = 25
    total_qubits = cols * rows
    
    spacing_x = 0.65
    spacing_y = 0.65

    offset_x = (cols - 1) * spacing_x / 2.0
    offset_y = (rows - 1) * spacing_y / 2.0

    print(f"Generating {total_qubits} qubits with dual-lattice interconnects and readout resonators...")

    os.makedirs('exports', exist_ok=True)
    coords_file = 'exports/qubit_coordinates.csv'
    coordinates_data = []

    # 1. Create all Qubits and Readout Resonators
    qubit_index = 1
    for r in range(rows):
        for c in range(cols):
            pos_x = (c * spacing_x) - offset_x
            pos_y = (r * spacing_y) - offset_y
            
            qubit_name = f"Q{qubit_index}"
            
            # Phase 8 & 10: Assign QEC Roles and Factory regions
            is_data = (r + c) % 2 == 0
            role = 'data' if is_data else 'ancilla'
            
            # 5x5 corners are Magic State Factories
            is_factory = (r < 5 and c < 5) or (r < 5 and c >= cols - 5) or (r >= rows - 5 and c < 5) or (r >= rows - 5 and c >= cols - 5)
            if is_factory:
                role = 'factory'
            
            # Left and right for bus, top for readout
            # loc_W and loc_H must be +1 or -1 for TransmonPocket
            options = dict(
                pos_x=f"{pos_x:.4f}mm",
                pos_y=f"{pos_y:.4f}mm",
                connection_pads=dict(
                    left=dict(loc_W=-1, loc_H=0),
                    right=dict(loc_W=1, loc_H=0),
                    top=dict(loc_W=0, loc_H=1),
                    bottom=dict(loc_W=0, loc_H=-1),
                    readout=dict(loc_W=1, loc_H=1)
                )
            )
            TransmonPocket(design, qubit_name, options=options)
            coordinates_data.append([qubit_name, r, c, pos_x, pos_y, role])

            # Attach Readout Resonator (Straight Stub)
            otg_name = f"otg_{qubit_name}"
            # Place the open-to-ground 0.25mm above the qubit, facing down (-90 degrees)
            otg_options = dict(pos_x=f"{pos_x:.4f}mm", pos_y=f"{pos_y + 0.25:.4f}mm", orientation='-90')
            OpenToGround(design, otg_name, options=otg_options)

            readout_route_name = f"readout_{qubit_name}"
            readout_options = dict(
                pin_inputs=dict(
                    start_pin=dict(component=qubit_name, pin='readout'),
                    end_pin=dict(component=otg_name, pin='open')
                )
            )
            RouteStraight(design, readout_route_name, options=readout_options)

            qubit_index += 1

    # 2. Create Horizontal Bus Resonators
    print("Adding primary horizontal bus resonators...")
    for r in range(rows):
        for c in range(cols - 1):
            q1_idx = r * cols + c + 1
            q2_idx = r * cols + c + 2
            
            q1_name = f"Q{q1_idx}"
            q2_name = f"Q{q2_idx}"
            route_name = f"bus_r{r}_c{c}"
            
            options = dict(
                pin_inputs=dict(
                    start_pin=dict(component=q1_name, pin='right'),
                    end_pin=dict(component=q2_name, pin='left')
                )
            )
            RouteStraight(design, route_name, options=options)

    # 2B. Create Vertical Bus Resonators (Direct Qubit-to-Qubit Coupling)
    print("Adding primary vertical bus resonators between rows...")
    for r in range(rows - 1):
        for c in range(cols):
            q_top_idx = r * cols + c + 1
            q_bottom_idx = (r + 1) * cols + c + 1
            
            q_top_name = f"Q{q_top_idx}"
            q_bottom_name = f"Q{q_bottom_idx}"
            route_name = f"vbus_pin_r{r}_c{c}"
            
            options = dict(
                pin_inputs=dict(
                    start_pin=dict(component=q_top_name, pin='top'),
                    end_pin=dict(component=q_bottom_name, pin='bottom')
                )
            )
            RouteStraight(design, route_name, options=options)

    # 3. Create Vertical Bus Interconnects
    print("Adding vertical bus interconnects...")
    for r in range(rows - 1):
        for c in range(cols - 1):
            vbus_name = f"vbus_r{r}_c{c}"
            pos_x = (c + 0.5) * spacing_x - offset_x
            pos_y = (r + 0.5) * spacing_y - offset_y
            
            options = dict(pos_x=pos_x, pos_y=pos_y, length=spacing_y)
            VerticalBus(design, vbus_name, options=options)

    # 4. Create Interstitial Horizontal Interconnects between Vertical Buses
    print("Adding horizontal cross-links between vertical buses...")
    for r in range(rows - 1):
        for c in range(cols - 2):
            h_inter_name = f"hinter_r{r}_c{c}"
            # Centered precisely between two vertical buses
            pos_x = (c + 1.0) * spacing_x - offset_x
            pos_y = (r + 0.5) * spacing_y - offset_y
            
            options = dict(pos_x=pos_x, pos_y=pos_y, length=spacing_x)
            InterstitialHorizontalBus(design, h_inter_name, options=options)

    # 5. Test Structures (Phase 16)
    print("Adding On-Chip Test Structures...")
    TestResonator(design, "test_res_1", options=dict(pos_x=-offset_x - 1.5, pos_y=-offset_y - 1.5))
    TestResonator(design, "test_res_2", options=dict(pos_x=offset_x + 1.5, pos_y=-offset_y - 1.5))

    # 6. Classical Control Interface (Bond Pads at perimeter)
    print("Adding Perimeter Bond Pads for I/O...")
    pad_idx = 0
    # Top edge pads
    for c in range(0, cols, 4): # Every 4th column to save rendering time
        x_pos = (c * spacing_x) - offset_x
        y_pos = (rows * spacing_y) - offset_y + 0.5 # 0.5mm above the array
        BondPad(design, f"pad_top_{pad_idx}", options=dict(pos_x=x_pos, pos_y=y_pos))
        pad_idx += 1

    # 7. Add Air Bridges (Demonstration on Row 0 and 1 to prevent GUI timeout)
    print("Adding Air Bridges for ground plane continuity...")
    ab_idx = 0
    for r in range(min(2, rows)): # Only first 2 rows for performance
        for c in range(cols - 1):
            # Horizontal bus air bridges
            x_pos1 = (c * spacing_x) - offset_x + spacing_x/3.0
            x_pos2 = (c * spacing_x) - offset_x + 2*spacing_x/3.0
            y_pos = (r * spacing_y) - offset_y
            AirBridge(design, f"ab_{ab_idx}", options=dict(pos_x=x_pos1, pos_y=y_pos, orientation=0))
            ab_idx += 1
            AirBridge(design, f"ab_{ab_idx}", options=dict(pos_x=x_pos2, pos_y=y_pos, orientation=0))
            ab_idx += 1

    print("Rebuilding design geometry (this will take a while)...")
    design.rebuild()
    print("Design built successfully!")

    print(f"Exporting coordinates to {coords_file}...")
    with open(coords_file, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Qubit_Label', 'Row', 'Column', 'X_pos_mm', 'Y_pos_mm', 'Role'])
        writer.writerows(coordinates_data)

    # Export GDS file
    gds_file = os.path.join('exports', 'quantum_chip_1100.gds')
    print(f"Exporting GDSII to {gds_file}...")
    try:
        a_gds = design.renderers.gds
        a_gds.options['short_segments_to_not_fillet'] = 'True'
        a_gds.export_to_gds(gds_file)
        print(f"GDS file exported successfully to {gds_file}!")
    except Exception as e:
        print(f"GDS export error: {e}")

    print("Complete!")
    return design

if __name__ == "__main__":
    design = generate_1100_qubit_array()
    
    try:
        os.environ["QT_QPA_PLATFORM_PLUGIN_PATH"] = "/opt/anaconda3/lib/python3.13/site-packages/PySide6/Qt/plugins/platforms"
        gui = metal.MetalGUI(design)
        gui.autoscale()
        from PySide6.QtWidgets import QApplication
        import sys
        if QApplication.instance():
            sys.exit(QApplication.instance().exec())
    except Exception as e:
        print("GUI could not be started:", e)
