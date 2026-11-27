from alpha_metal import draw
from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.qlibrary.core.base import QComponent

class LaunchpadWirebond(QComponent):
    """LaunchpadWirebond"""

    default_options = Dict(
        trace_width="cpw_width",
        trace_gap="cpw_gap",
        lead_length="25um",
        pad_width="80um",
        pad_height="80um",
        pad_gap="58um",
        taper_height="122um",
        layer="1"
    )
    
    TOOLTIP = """Launch pad to feed/read signals to/from the chip."""

    def make(self):
        p = self.p

        pad_width = p.pad_width
        pad_height = p.pad_height
        pad_gap = p.pad_gap
        trace_width = p.trace_width
        trace_width_half = trace_width / 2.0
        pad_width_half = pad_width / 2.0
        lead_length = p.lead_length
        taper_height = p.taper_height
        trace_gap = p.trace_gap
        pad_gap = p.pad_gap

        launch_pad = draw.Polygon(
            [
                (0, trace_width_half),
                (-taper_height, pad_width_half),
                (-(pad_height + taper_height), pad_width_half),
                (-(pad_height + taper_height), -pad_width_half),
                (-taper_height, -pad_width_half),
                (0, -trace_width_half),
                (lead_length, -trace_width_half),
                (lead_length, trace_width_half),
                (0, trace_width_half),
            ]
        )

        pocket = draw.Polygon(
            [
                (0, trace_width_half + trace_gap),
                (-taper_height, pad_width_half + pad_gap),
                (-(pad_height + taper_height + pad_gap), pad_width_half + pad_gap),
                (-(pad_height + taper_height + pad_gap), -(pad_width_half + pad_gap)),
                (-taper_height, -(pad_width_half + pad_gap)),
                (0, -(trace_width_half + trace_gap)),
                (lead_length, -(trace_width_half + trace_gap)),
                (lead_length, trace_width_half + trace_gap),
                (0, trace_width_half + trace_gap),
            ]
        )

        main_pin_line = draw.LineString(
            [(lead_length, trace_width_half), (lead_length, -trace_width_half)]
        )

        polys1 = [main_pin_line, launch_pad, pocket]
        polys1 = draw.rotate(polys1, p.orientation, origin=(0, 0))
        polys1 = draw.translate(polys1, xoff=p.pos_x, yoff=p.pos_y)
        [main_pin_line, launch_pad, pocket] = polys1

        layer = p.layer
        self.add_qgeometry("poly", dict(launch_pad=launch_pad), layer=layer)
        self.add_qgeometry("poly", dict(pocket=pocket), subtract=True, layer=layer)
        self.add_pin("tie", main_pin_line.coords, trace_width)
