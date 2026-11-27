"""
Interactive Demonstration script for Qiskit Metal Transmission Lines (tlines).
Launches the full Qiskit Metal Qt GUI with all 6 transmission line routing types.

Usage:
    conda run -n qmetal python demo_all_tlines_qiskit_metal.py
"""

import sys
import numpy as np
import qiskit_metal as metal
from qiskit_metal import designs
from qiskit_metal.qlibrary.qubits.transmon_pocket import TransmonPocket
from qiskit_metal.qlibrary.tlines.straight_path import RouteStraight
from qiskit_metal.qlibrary.tlines.framed_path import RouteFramed
from qiskit_metal.qlibrary.tlines.meandered import RouteMeander
from qiskit_metal.qlibrary.tlines.anchored_path import RouteAnchors
from qiskit_metal.qlibrary.tlines.pathfinder import RoutePathfinder
from qiskit_metal.qlibrary.tlines.mixed_path import RouteMixed

def main():
    print("=" * 65)
    print("  Qiskit Metal: Launching GUI with All 6 Transmission Lines")
    print("=" * 65)

    # 1. Initialize Planar Design & GUI
    design = designs.DesignPlanar()
    design.chips['main']['size']['size_x'] = '14mm'
    design.chips['main']['size']['size_y'] = '16mm'
    
    gui = metal.MetalGUI(design)

    print("\n[+] Creating components and routes:")

    # 1. RouteStraight
    print("  1/6 Building RouteStraight...")
    TransmonPocket(design, "Q_str_1", options=dict(pos_x="-2.5mm", pos_y="4.5mm", connection_pads=dict(pin=dict(loc_W=+1, loc_H=+1))))
    TransmonPocket(design, "Q_str_2", options=dict(pos_x="+2.5mm", pos_y="4.5mm", connection_pads=dict(pin=dict(loc_W=-1, loc_H=+1))))
    RouteStraight(design, "RouteStraight", options=dict(
        pin_inputs=dict(start_pin=dict(component="Q_str_1", pin="pin"), end_pin=dict(component="Q_str_2", pin="pin")),
        fillet="90um"
    ))

    # 2. RouteFramed
    print("  2/6 Building RouteFramed (stepped orthogonal)...")
    TransmonPocket(design, "Q_frm_1", options=dict(pos_x="-2.5mm", pos_y="3.0mm", connection_pads=dict(pin=dict(loc_W=+1, loc_H=+1))))
    TransmonPocket(design, "Q_frm_2", options=dict(pos_x="+2.5mm", pos_y="2.0mm", connection_pads=dict(pin=dict(loc_W=-1, loc_H=-1))))
    RouteFramed(design, "RouteFramed", options=dict(
        pin_inputs=dict(start_pin=dict(component="Q_frm_1", pin="pin"), end_pin=dict(component="Q_frm_2", pin="pin")),
        fillet="90um"
    ))

    # 3. RouteMeander
    print("  3/6 Building RouteMeander (serpentine length-matched)...")
    TransmonPocket(design, "Q_mnd_1", options=dict(pos_x="-2.5mm", pos_y="0.6mm", connection_pads=dict(pin=dict(loc_W=+1, loc_H=+1))))
    TransmonPocket(design, "Q_mnd_2", options=dict(pos_x="+2.5mm", pos_y="0.6mm", connection_pads=dict(pin=dict(loc_W=-1, loc_H=+1))))
    RouteMeander(design, "RouteMeander", options=dict(
        pin_inputs=dict(start_pin=dict(component="Q_mnd_1", pin="pin"), end_pin=dict(component="Q_mnd_2", pin="pin")),
        total_length="8.5mm",
        fillet="90um",
        meander=dict(spacing="200um", asymmetry="0um")
    ))

    # 4. RouteAnchors
    print("  4/6 Building RouteAnchors (custom waypoint routing)...")
    TransmonPocket(design, "Q_anc_1", options=dict(pos_x="-2.5mm", pos_y="-1.3mm", connection_pads=dict(pin=dict(loc_W=+1, loc_H=+1))))
    TransmonPocket(design, "Q_anc_2", options=dict(pos_x="+2.5mm", pos_y="-1.3mm", connection_pads=dict(pin=dict(loc_W=-1, loc_H=+1))))
    RouteAnchors(design, "RouteAnchors", options=dict(
        pin_inputs=dict(start_pin=dict(component="Q_anc_1", pin="pin"), end_pin=dict(component="Q_anc_2", pin="pin")),
        fillet="90um",
        anchors={
            1: np.array([-0.8, -0.7]),
            2: np.array([0.8, -0.7])
        }
    ))

    # 5. RoutePathfinder
    print("  5/6 Building RoutePathfinder (obstacle-avoiding A*)...")
    TransmonPocket(design, "Q_ptf_1", options=dict(pos_x="-2.5mm", pos_y="-2.5mm", connection_pads=dict(pin=dict(loc_W=+1, loc_H=+1))))
    TransmonPocket(design, "Q_ptf_2", options=dict(pos_x="+2.5mm", pos_y="-3.5mm", connection_pads=dict(pin=dict(loc_W=-1, loc_H=-1))))
    RoutePathfinder(design, "RoutePathfinder", options=dict(
        pin_inputs=dict(start_pin=dict(component="Q_ptf_1", pin="pin"), end_pin=dict(component="Q_ptf_2", pin="pin")),
        fillet="90um"
    ))

    # 6. RouteMixed
    print("  6/6 Building RouteMixed (hybrid segments)...")
    TransmonPocket(design, "Q_mxd_1", options=dict(pos_x="-2.5mm", pos_y="-5.0mm", connection_pads=dict(pin=dict(loc_W=+1, loc_H=+1))))
    TransmonPocket(design, "Q_mxd_2", options=dict(pos_x="+2.5mm", pos_y="-5.0mm", connection_pads=dict(pin=dict(loc_W=-1, loc_H=+1))))
    RouteMixed(design, "RouteMixed", options=dict(
        pin_inputs=dict(start_pin=dict(component="Q_mxd_1", pin="pin"), end_pin=dict(component="Q_mxd_2", pin="pin")),
        total_length="8.5mm",
        fillet="90um",
        anchors={
            0: np.array([-0.8, -4.4]),
            1: np.array([0.8, -4.4])
        },
        between_anchors={
            0: "S",
            1: "PF",
            2: "S"
        }
    ))

    # Rebuild layout and autoscale camera view
    gui.rebuild()
    gui.autoscale()

    print("\n" + "=" * 65)
    print("✓ All 6 Transmission Lines built successfully!")
    print("Qiskit Metal GUI window is now open. Inspect geometry, edit parameters, or zoom into any route.")
    print("=" * 65)

    # Start Qt Event Loop
    gui.qApp.exec_()

if __name__ == "__main__":
    main()
