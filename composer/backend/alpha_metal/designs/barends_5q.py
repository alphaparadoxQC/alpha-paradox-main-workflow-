"""5-Qubit Xmon Processor (Barends et al., Nature 508, 500, 2014).

Physical physical layout generator in Quantum Metal / Alpha Metal.
"""

from __future__ import annotations

from alpha_metal import designs, Dict
from alpha_metal.qlibrary.qubits.transmon_cross_fl import TransmonCrossFL
from alpha_metal.qlibrary.couplers.coupled_line_tee import CoupledLineTee
from alpha_metal.qlibrary.tlines.meandered import RouteMeander
from alpha_metal.qlibrary.terminations.launchpad_wb import LaunchpadWirebond
from alpha_metal.qlibrary.terminations.open_to_ground import OpenToGround
from alpha_metal.qlibrary.tlines.straight_path import RouteStraight
from alpha_metal.qlibrary.tlines.framed_path import RouteFramed
from alpha_metal.qlibrary.tlines.anchored_path import RouteAnchors
from alpha_metal.qlibrary.lumped.cap_n_interdigital import CapNInterdigital


def build_barends_5q(design=None, qubit_pitch_mm=0.45):
    """Build the complete 5-qubit Xmon quantum processor.

    Args:
        design (DesignPlanar, optional): Parent design. If None, creates a 6x6 mm Planar design.
        qubit_pitch_mm (float): Distance between adjacent Xmon qubits in mm (default 0.45).

    Returns:
        DesignPlanar: The constructed quantum processor design.
    """
    if design is None:
        design = designs.DesignPlanar({}, overwrite_enabled=True)
        design.chips.main.size.size_x = "6.0mm"
        design.chips.main.size.size_y = "6.0mm"

    # 1. Place the 5 Xmon Qubits (Q0-Q4) and XY capacitive drive pads
    for i in range(5):
        x_pos = (i - 2) * qubit_pitch_mm
        TransmonCrossFL(
            design,
            f"Q{i}",
            options=dict(
                pos_x=f"{x_pos}mm",
                pos_y="0.0mm",
                orientation="0",
                cross_width="30um",
                cross_length="190um",
                cross_gap="50um",
                make_fl=True,
                fl_options=dict(
                    t_gap="3um",
                    t_inductive_gap="3um",
                    t_offset="0um",
                    t_top="15um",
                    t_width="5um",
                ),
                connection_pads=dict(
                    readout=dict(
                        connector_type="0",
                        claw_length="40um",
                        ground_spacing="5um",
                        claw_width="10um",
                        claw_gap="6um",
                        connector_location="90",
                    )
                ),
            ),
        )
        OpenToGround(
            design,
            f"XY_pad_{i}",
            options=dict(
                pos_x=f"{x_pos - 0.1}mm",
                pos_y="-0.18mm",
                orientation="90",
                width="10um",
                gap="6um",
                termination_gap="6um",
            ),
        )

    # 2. Coupled Line Tees (Feedline Couplers)
    for i in range(5):
        x_pos = (i - 2) * qubit_pitch_mm
        CoupledLineTee(
            design,
            f"CLT{i}",
            options=dict(
                pos_x=f"{x_pos}mm",
                pos_y="1.5mm",
                orientation="0",
                coupling_length="200um",
                coupling_space="4um",
            ),
        )

    # 3. Wirebond Launchpads along perimeter
    lps = [
        ("LP_W1", "-2.8mm", "-1.5mm", "0"),
        ("LP_W2", "-2.8mm", "0.0mm", "0"),
        ("LP_W3", "-2.8mm", "1.5mm", "0"),
        ("LP_E1", "2.8mm", "-1.5mm", "180"),
        ("LP_E2", "2.8mm", "0.0mm", "180"),
        ("LP_E3", "2.8mm", "1.5mm", "180"),
        ("LP_S1", "-1.5mm", "-2.8mm", "90"),
        ("LP_S2", "0.0mm", "-2.8mm", "90"),
        ("LP_S3", "1.5mm", "-2.8mm", "90"),
        ("LP_N1", "-1.5mm", "2.8mm", "270"),
        ("LP_N2", "0.0mm", "2.8mm", "270"),
        ("LP_N3", "1.5mm", "2.8mm", "270"),
    ]
    for name, px, py, orient in lps:
        LaunchpadWirebond(design, name, options=dict(pos_x=px, pos_y=py, orientation=orient))

    # 4. Interdigital input/output Purcell filter capacitors
    CapNInterdigital(design, "Cap_input", options=dict(pos_x="-2.4mm", pos_y="1.5mm", orientation="270"))
    CapNInterdigital(design, "Cap_output", options=dict(pos_x="-1mm", pos_y="2.1mm", orientation="90"))

    # 5. Purcell feedline interconnects
    RouteStraight(
        design,
        "Feed_in_lp",
        options=dict(
            pin_inputs=dict(
                start_pin=dict(component="LP_W3", pin="tie"),
                end_pin=dict(component="Cap_input", pin="south_end"),
            )
        ),
    )
    RouteStraight(
        design,
        "Feed_in_clt",
        options=dict(
            pin_inputs=dict(
                start_pin=dict(component="Cap_input", pin="north_end"),
                end_pin=dict(component="CLT0", pin="prime_start"),
            )
        ),
    )
    for i in range(4):
        RouteStraight(
            design,
            f"Feed_mid_{i}",
            options=dict(
                pin_inputs=dict(
                    start_pin=dict(component=f"CLT{i}", pin="prime_end"),
                    end_pin=dict(component=f"CLT{i + 1}", pin="prime_start"),
                )
            ),
        )

    RouteAnchors(
        design,
        "Feed_out_clt",
        options=dict(
            pin_inputs=dict(
                start_pin=dict(component="CLT4", pin="prime_end"),
                end_pin=dict(component="Cap_output", pin="north_end"),
            ),
            anchors=Dict({0: (1.7, 1.5), 1: (1.7, 1.8), 2: (-2.4, 1.8)}),
            fillet="100um",
            advanced=Dict(avoid_collision=False),
        ),
    )
    RouteAnchors(
        design,
        "Feed_out_lp",
        options=dict(
            pin_inputs=dict(
                start_pin=dict(component="Cap_output", pin="south_end"),
                end_pin=dict(component="LP_N1", pin="tie"),
            ),
            lead=Dict(start_straight="200um", end_straight="100um"),
            fillet="20um",
            advanced=Dict(avoid_collision=False),
        ),
    )

    # 6. Readout resonators (staggered lengths)
    resonator_lengths = ["4.41mm", "4.45mm", "4.49mm", "4.53mm", "4.57mm"]
    for i in range(5):
        RouteMeander(
            design,
            f"ReadoutRes{i}",
            options=dict(
                pin_inputs=dict(
                    start_pin=dict(component=f"Q{i}", pin="readout"),
                    end_pin=dict(component=f"CLT{i}", pin="second_end"),
                ),
                total_length=resonator_lengths[i],
                fillet="20um",
                lead=dict(start_straight="150um", end_straight="150um"),
                meander=dict(spacing="50um", asymmetry="0um"),
            ),
        )

    # 7. XY and Z (flux) control lines
    control_routes = [
        ("XY_pad_0", "open", "LP_W2", "tie", "XY_Line_0", Dict({})),
        ("Q0", "flux_line", "LP_W1", "tie", "Z_Line_0", Dict({})),
        ("XY_pad_1", "open", "LP_S1", "tie", "XY_Line_1", Dict({0: ["R", "50um"], 1: ["L", "2000um"], 2: ["R", "200um"]})),
        ("Q1", "flux_line", "LP_S2", "tie", "Z_Line_1", Dict({0: ["L", "100um"], 1: ["R", "2000um"], 2: ["L", "200um"]})),
        ("XY_pad_2", "open", "LP_S3", "tie", "XY_Line_2", Dict({0: ["R", "50um"], 1: ["L", "1800um"], 2: ["L", "500um"]})),
        ("Q2", "flux_line", "LP_E1", "tie", "Z_Line_2", Dict({0: ["L", "100um"], 1: ["R", "1600um"], 2: ["L", "2500um"], 3: ["L", "100um"]})),
        ("XY_pad_3", "open", "LP_E2", "tie", "XY_Line_3", Dict({0: ["R", "50um"], 1: ["L", "1400um"], 2: ["L", "2100um"], 3: ["L", "1200um"]})),
        ("Q3", "flux_line", "LP_E3", "tie", "Z_Line_3", Dict({0: ["L", "100um"], 1: ["R", "1200um"], 2: ["L", "1700um"], 3: ["L", "800um"]})),
        ("XY_pad_4", "open", "LP_N3", "tie", "XY_Line_4", Dict({0: ["R", "50um"], 1: ["L", "1000um"], 2: ["L", "1350um"], 3: ["L", "3700um"], 4: ["L", "400um"]})),
        ("Q4", "flux_line", "LP_N2", "tie", "Z_Line_4", Dict({0: ["L", "100um"], 1: ["R", "800um"], 2: ["L", "950um"], 3: ["L", "3300um"], 4: ["L", "400um"]})),
    ]

    for start_comp, start_pin, end_comp, end_pin, route_name, jogs in control_routes:
        route_options = dict(
            pin_inputs=dict(
                start_pin=dict(component=start_comp, pin=start_pin),
                end_pin=dict(component=end_comp, pin=end_pin),
            ),
            lead=dict(start_straight="100um", end_straight="50um", start_jogged_extension=jogs),
            fillet="20um",
            step_size="0.05mm",
        )
        if "XY" in route_name:
            route_options["lead"]["start_straight"] = "200um"
        RouteFramed(design, route_name, options=route_options)

    return design
