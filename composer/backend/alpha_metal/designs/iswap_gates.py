"""
Physical Design Builders for Three iSWAP Gate Architectures.

Based on Qiskit Metal tutorial 'Full Physical Design of Three iSWAP Gates':
- Example 1: One fixed-frequency and one flux-tunable concentric transmon with lumped resonator couplers.
- Example 2: Two fixed-frequency pocket transmons and a flux-tunable coupler (TunableCoupler02).
- Example 3: Two fixed-frequency Xmon transmons and a tunable coupler (TunableCoupler01) with Purcell meanders.
"""

from collections import OrderedDict
from typing import Optional, Dict as TypingDict, Any

from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.designs.design_planar import DesignPlanar
from alpha_metal.qlibrary.qubits.transmon_concentric_type_2 import TransmonConcentricType2
from alpha_metal.qlibrary.resonators.resonator_lumped import ResonatorLumped
from alpha_metal.qlibrary.qubits.transmon_pocket_6 import TransmonPocket6
from alpha_metal.qlibrary.couplers.tunable_coupler_02 import TunableCoupler02
from alpha_metal.qlibrary.couplers.tunable_coupler_01 import TunableCoupler01
from alpha_metal.qlibrary.qubits.transmon_cross_fl import TransmonCrossFL
from alpha_metal.qlibrary.terminations.launchpad_wb import LaunchpadWirebond
from alpha_metal.qlibrary.terminations.open_to_ground import OpenToGround
from alpha_metal.qlibrary.tlines.straight_path import RouteStraight
from alpha_metal.qlibrary.tlines.meandered import RouteMeander


def build_iswap_concentric(design: Optional[DesignPlanar] = None) -> DesignPlanar:
    """
    Example 1: One fixed-frequency transmon and one flux-tunable concentric transmon.
    Coupled via lumped-element LC resonators and wirebond launchpads.
    """
    if design is None:
        design = DesignPlanar()
    design.overwrite_enabled = True

    # Chip sizing (32mm x 20mm)
    design.chips.main.size.update(
        size_x="32mm", size_y="20mm", center_x="1mm", center_y="3mm"
    )

    # 1. Concentric transmons
    q1 = TransmonConcentricType2(
        design, "qubit1", options=dict(pos_x="0.0mm", orientation="-45")
    )
    q2 = TransmonConcentricType2(
        design, "qubit2", options=dict(pos_y="10.0mm", orientation="135")
    )

    # 2. Lumped resonators
    res1 = ResonatorLumped(
        design,
        "resonator1",
        options=dict(pos_x="10.0mm", pos_y="10.0mm", orientation="-45"),
    )
    res2 = ResonatorLumped(
        design,
        "resonator2",
        options=dict(pos_x="-10.0mm", pos_y="0.0mm", orientation="45"),
    )

    # 3. Wirebond launchpads
    pad1 = LaunchpadWirebond(
        design,
        "P1_C",
        options=dict(
            pos_x="0mm",
            pos_y="-5mm",
            orientation="90",
            pad_width="0.5mm",
            pad_height="1mm",
            lead_length="0um",
        ),
    )
    pad2 = LaunchpadWirebond(
        design,
        "P2_C",
        options=dict(
            pos_x="-13mm",
            pos_y="-5mm",
            orientation="90",
            pad_width="0.5mm",
            pad_height="1mm",
            lead_length="0um",
        ),
    )
    pad3 = LaunchpadWirebond(
        design,
        "P3_C",
        options=dict(
            pos_x="15mm",
            pos_y="7mm",
            orientation="180",
            pad_width="0.5mm",
            pad_height="1mm",
            lead_length="0um",
        ),
    )

    # Open termination for drive line
    otg11 = OpenToGround(
        design, "open1i", options=dict(pos_x="0mm", pos_y="-2.5mm", orientation="90")
    )

    # 4. CPW Routes
    design.variables["cpw_width"] = "0.1mm"

    # Direct inter-qubit coupling line
    RouteStraight(
        design,
        "route1",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="qubit1", pin="pin2"),
                end_pin=Dict(component="qubit2", pin="pin2"),
            ),
            lead=Dict(start_straight="0.0mm", end_straight="0.0mm"),
        ),
    )

    # Resonator 1 to Qubit 2
    RouteStraight(
        design,
        "route2",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="resonator1", pin="pin_sw"),
                end_pin=Dict(component="qubit2", pin="pin3"),
            ),
            lead=Dict(start_straight="0.0mm", end_straight="0.0mm"),
        ),
    )

    # Resonator 2 to Qubit 1
    RouteStraight(
        design,
        "route3",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="resonator2", pin="pin_se"),
                end_pin=Dict(component="qubit1", pin="pin3"),
            ),
            lead=Dict(start_straight="0.0mm", end_straight="0.0mm"),
        ),
    )

    # Resonator 1 to Launchpad P3_C
    RouteStraight(
        design,
        "route4",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="resonator1", pin="pin_east"),
                end_pin=Dict(component="P3_C", pin="tie"),
            ),
            lead=Dict(start_straight="1mm", end_straight="0.0mm"),
        ),
    )

    # Resonator 2 to Launchpad P2_C
    RouteStraight(
        design,
        "route5",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="resonator2", pin="pin_west"),
                end_pin=Dict(component="P2_C", pin="tie"),
            ),
            lead=Dict(start_straight="1mm", end_straight="0.0mm"),
        ),
    )

    # Drive open termination to Launchpad P1_C
    RouteStraight(
        design,
        "route6",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="open1i", pin="open"),
                end_pin=Dict(component="P1_C", pin="tie"),
            ),
            lead=Dict(start_straight="0mm", end_straight="0.0mm"),
        ),
    )

    return design


def build_iswap_pocket(design: Optional[DesignPlanar] = None) -> DesignPlanar:
    """
    Example 2: Two fixed-frequency transmons and a flux-tunable coupler (TunableCoupler02).
    Includes meandered readout feedlines and wirebond pads.
    """
    if design is None:
        design = DesignPlanar()
    design.overwrite_enabled = True

    # Chip sizing (16mm x 6mm)
    design.chips.main.size.update(
        size_x="16mm", size_y="6mm", center_x="0mm", center_y="1mm"
    )

    # 1. Pocket transmons with connection pads
    Q1 = TransmonPocket6(
        design,
        "Q1",
        options=dict(
            pos_x="-4mm",
            pos_y="0.0mm",
            orientation="90",
            pad_width="1mm",
            pad_height="0.4mm",
            pocket_width="1.5mm",
            pocket_height="1.2mm",
            pad_gap="0.05mm",
            connection_pads=dict(
                bus_03=dict(loc_W=0, loc_H=-1, pad_width="100um", pad_gap="50um"),
                readout=dict(loc_W=0, loc_H=1, pad_width="100um", pad_gap="50um"),
            ),
        ),
    )

    Q2 = TransmonPocket6(
        design,
        "Q2",
        options=dict(
            pos_x="4mm",
            pos_y="0.0mm",
            orientation="90",
            pad_width="1mm",
            pad_height="0.4mm",
            pocket_width="1.5mm",
            pocket_height="1.2mm",
            pad_gap="0.05mm",
            connection_pads=dict(
                bus_03=dict(loc_W=0, loc_H=-1, pad_width="100um", pad_gap="50um"),
                readout=dict(loc_W=0, loc_H=1, pad_width="100um", pad_gap="50um"),
            ),
        ),
    )

    # 2. Tunable coupler
    TC = TunableCoupler02(design, "TC")

    # 3. Perimeter launch pads
    pad1 = LaunchpadWirebond(
        design,
        "P1_C",
        options=dict(
            pos_x="-7mm",
            pos_y="0.5mm",
            orientation="90",
            pad_width="0.5mm",
            pad_height="1mm",
            lead_length="0um",
        ),
    )
    pad2 = LaunchpadWirebond(
        design,
        "P2_C",
        options=dict(
            pos_x="7mm",
            pos_y="0.5mm",
            orientation="90",
            pad_width="0.5mm",
            pad_height="1mm",
            lead_length="0um",
        ),
    )
    pad3 = LaunchpadWirebond(
        design,
        "P3_C",
        options=dict(
            pos_x="3mm",
            pos_y="3mm",
            orientation="-180",
            pad_width="0.5mm",
            pad_height="1mm",
            lead_length="0um",
        ),
    )

    # 4. Routing
    design.variables["cpw_width"] = "0.01mm"

    # Q1 to Coupler
    RouteStraight(
        design,
        "route1",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="Q1", pin="bus_03"),
                end_pin=Dict(component="TC", pin="pin2"),
            ),
            lead=Dict(start_straight="0.0mm", end_straight="0.0mm"),
        ),
    )

    # Q2 to Coupler
    RouteStraight(
        design,
        "route2",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="Q2", pin="readout"),
                end_pin=Dict(component="TC", pin="pin1"),
            ),
            lead=Dict(start_straight="0.0mm", end_straight="0.0mm"),
        ),
    )

    # Coupler flux bias line to Launchpad P3_C
    RouteStraight(
        design,
        "route3",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="P3_C", pin="tie"),
                end_pin=Dict(component="TC", pin="fbl"),
            ),
            lead=Dict(start_straight="3.4mm", end_straight="0.2mm"),
            fillet="90um",
        ),
    )

    # Readout meander Q1 -> P1_C
    RouteMeander(
        design,
        "route4",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="Q1", pin="readout"),
                end_pin=Dict(component="P1_C", pin="tie"),
            ),
            lead=Dict(start_straight="0.2mm", end_straight="0.5mm"),
            meander=Dict(asymmetry="0mm"),
            total_length="10mm",
            fillet="90um",
        ),
    )

    # Readout meander Q2 -> P2_C
    RouteMeander(
        design,
        "route5",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="Q2", pin="bus_03"),
                end_pin=Dict(component="P2_C", pin="tie"),
            ),
            lead=Dict(start_straight="0.2mm", end_straight="0.5mm"),
            meander=Dict(asymmetry="0mm"),
            total_length="10mm",
            fillet="90um",
        ),
    )

    return design


def build_iswap_xmon(design: Optional[DesignPlanar] = None) -> DesignPlanar:
    """
    Example 3: Two fixed-frequency Xmon transmons and a tunable coupler (TunableCoupler01).
    Features flux control lines, CPW through line, and capacitive Purcell filters.
    """
    if design is None:
        design = DesignPlanar()
    design.overwrite_enabled = True

    # Chip sizing (4mm x 3mm)
    design.chips.main.size.update(
        size_x="4mm", size_y="3mm", center_x="0mm", center_y="0mm"
    )

    # 1. TransmonCrossFL Qubits
    xmon_options1 = dict(
        connection_pads=dict(
            b=dict(connector_location="90", connector_type="1"),
            c=dict(connector_location="180", connector_type="0"),
        ),
        pos_x="0.3mm",
    )
    xmon_options2 = dict(
        connection_pads=dict(
            b=dict(connector_location="90", connector_type="1"),
            c=dict(connector_location="180", connector_type="0"),
        ),
        pos_x="-0.3mm",
        orientation="180",
    )

    TransmonCrossFL(design, "Q1", options=xmon_options1)
    TransmonCrossFL(design, "Q2", options=xmon_options2)

    # 2. Tunable Coupler
    TunableCoupler01(design, "TC", options=dict(pos_y="0.15mm", a_height="100um"))

    # 3. Perimeter Wirebond Launchpads
    LaunchpadWirebond(design, "T_west", options=dict(pos_x="-1.5mm", pos_y="0.0mm"))
    LaunchpadWirebond(
        design, "T_east", options=dict(pos_x="1.5mm", pos_y="0.0mm", orientation="180")
    )
    LaunchpadWirebond(
        design, "T_NE", options=dict(pos_x="0.5mm", pos_y="1mm", orientation="-90")
    )
    LaunchpadWirebond(
        design, "T_NW", options=dict(pos_x="-0.5mm", pos_y="1mm", orientation="-90")
    )
    LaunchpadWirebond(
        design, "T_SW", options=dict(pos_x="-0.5mm", pos_y="-1mm", orientation="90")
    )
    LaunchpadWirebond(
        design, "T_SE", options=dict(pos_x="0.5mm", pos_y="-1mm", orientation="90")
    )

    # 4. Straight Control and Flux Lines
    RouteStraight(
        design,
        "cpw_1",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="Q1", pin="flux_line"),
                end_pin=Dict(component="T_SE", pin="tie"),
            ),
            lead=Dict(start_straight="0.25mm", end_straight="0.25mm"),
        ),
    )
    RouteStraight(
        design,
        "cpw_2",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="Q2", pin="b"),
                end_pin=Dict(component="T_SW", pin="tie"),
            ),
            lead=Dict(start_straight="0.25mm", end_straight="0.25mm"),
        ),
    )
    RouteStraight(
        design,
        "cpw_3",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="Q1", pin="b"),
                end_pin=Dict(component="T_NE", pin="tie"),
            ),
            lead=Dict(start_straight="0.25mm", end_straight="0.25mm"),
        ),
    )
    RouteStraight(
        design,
        "cpw_4",
        options=Dict(
            pin_inputs=Dict(
                start_pin=Dict(component="TC", pin="Flux"),
                end_pin=Dict(component="T_NW", pin="tie"),
            ),
            lead=Dict(start_straight="0.25mm", end_straight="0.25mm"),
        ),
    )

    # 5. Through Meander Bus Line
    jogs = OrderedDict()
    jogs[0] = ["R", "0.5mm"]
    jogs[1] = [45, "0.5mm"]
    jogs[2] = [45, "1.75mm"]
    jogs[3] = [45, "0.5mm"]
    jogs[4] = [45, "0.5mm"]
    jogs[5] = ["R", "0.5mm"]

    options_tline = Dict(
        total_length="4.75mm",
        pin_inputs=Dict(
            start_pin=Dict(component="T_east", pin="tie"),
            end_pin=Dict(component="T_west", pin="tie"),
        ),
        lead=Dict(
            start_straight="0.25mm", end_straight="0.1mm", start_jogged_extension=jogs
        ),
        meander=Dict(asymmetry="0.0mm"),
    )
    RouteMeander(design, "tline", options=options_tline)

    # 6. Open capacitive terminations
    OpenToGround(
        design, "open1", options=dict(pos_x="0.25mm", pos_y="0.8mm", orientation="0")
    )
    OpenToGround(
        design, "open2", options=dict(pos_x="1.1mm", pos_y="0.0mm", orientation="-90")
    )
    OpenToGround(
        design, "open3", options=dict(pos_x="-1.1mm", pos_y="0.0mm", orientation="90")
    )

    # 7. Meander Couplers
    options_mid = Dict(
        fillet="40um",
        total_length="1.5mm",
        pin_inputs=Dict(
            start_pin=Dict(component="TC", pin="Control"),
            end_pin=Dict(component="open1", pin="open"),
        ),
        lead=Dict(start_straight="0.1mm", end_straight="0.1mm"),
        meander=Dict(spacing="90um", asymmetry="0mm"),
    )
    RouteMeander(design, "coupler_mid", options=options_mid)

    options_right = Dict(
        fillet="40um",
        total_length="2mm",
        pin_inputs=Dict(
            start_pin=Dict(component="Q1", pin="c"),
            end_pin=Dict(component="open2", pin="open"),
        ),
        lead=Dict(start_straight="0.1mm", end_straight="0.1mm"),
        meander=Dict(spacing="90um", asymmetry="0mm"),
    )
    RouteMeander(design, "coupler_right", options=options_right)

    options_left = Dict(
        fillet="40um",
        total_length="2mm",
        pin_inputs=Dict(
            start_pin=Dict(component="Q2", pin="c"),
            end_pin=Dict(component="open3", pin="open"),
        ),
        lead=Dict(start_straight="0.1mm", end_straight="0.1mm"),
        meander=Dict(spacing="90um", asymmetry="0mm"),
    )
    RouteMeander(design, "coupler_left", options=options_left)

    return design

