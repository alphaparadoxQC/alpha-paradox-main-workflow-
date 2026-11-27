from math import sin, cos
import numpy as np
from alpha_metal import draw
from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.qlibrary.core.qubit import BaseQubit


class TunableCoupler02(BaseQubit):
    """TunableCoupler02"""

    default_options = Dict(
        pocket_width="3mm",
        pocket_height="2mm",
        pos_x="0mm",
        pos_y="0mm",
        orientation="0",
        pad_radius="0.3mm",
        bus_width="0.1mm",
        bus_inner_length="0.5mm",
        bus_outer_length="0.5mm",
        bus_JJ_height="0.5mm",
        JJ_width="0.1mm",
        JJ_length="0.4mm",
        fbl_width="0.1mm",
        fbl_length="0.5mm",
        fbl_offset="0.1mm",
        layer="1",
    )

    component_metadata = Dict(
        short_name="Pocket",
        _qgeometry_table_path="True",
        _qgeometry_table_poly="True",
        _qgeometry_table_junction="True",
    )

    TOOLTIP = """One of the tunable couplers"""

    def make(self):
        p = self.p
        JJ = draw.LineString(
            [
                (-0.5 * p.JJ_length, p.bus_JJ_height - 0.5 * p.JJ_width),
                (0.5 * p.JJ_length, p.bus_JJ_height - 0.5 * p.JJ_width),
            ]
        )
        bus_vertical_left = draw.rectangle(
            p.bus_width,
            p.bus_JJ_height,
            -0.5 * p.JJ_length - 0.5 * p.bus_width,
            0.5 * p.bus_JJ_height,
        )
        bus_vertical_right = draw.rectangle(
            p.bus_width,
            p.bus_JJ_height,
            0.5 * p.JJ_length + 0.5 * p.bus_width,
            0.5 * p.bus_JJ_height,
        )
        bus_left = draw.rectangle(
            p.bus_inner_length + p.bus_outer_length + 2.0 * p.pad_radius,
            p.bus_width,
            -0.5 * p.JJ_length
            - p.bus_width
            - 0.5 * (p.bus_inner_length + p.bus_outer_length + 2.0 * p.pad_radius),
            0.5 * p.bus_width,
        )
        bus_right = draw.rectangle(
            p.bus_inner_length + p.bus_outer_length + 2.0 * p.pad_radius,
            p.bus_width,
            0.5 * p.JJ_length
            + p.bus_width
            + 0.5 * (p.bus_inner_length + p.bus_outer_length + 2.0 * p.pad_radius),
            0.5 * p.bus_width,
        )
        left_pad = draw.Point(
            -0.5 * p.JJ_length - p.bus_width - p.bus_inner_length - 0.5 * p.pad_radius,
            0.5 * p.bus_width,
        ).buffer(p.pad_radius)
        right_pad = draw.Point(
            0.5 * p.JJ_length + p.bus_width + p.bus_inner_length + 0.5 * p.pad_radius,
            0.5 * p.bus_width,
        ).buffer(p.pad_radius)
        fbl = draw.rectangle(
            p.fbl_width,
            p.fbl_length,
            -0.5 * p.JJ_length - p.bus_width - p.fbl_offset - 0.5 * p.fbl_width,
            p.bus_JJ_height + 0.5 * p.fbl_length,
        )
        pocket = draw.rectangle(0.0, 0.0, p.pocket_width, p.pocket_height)
        
        objects = [
            JJ,
            bus_vertical_left,
            bus_vertical_right,
            bus_left,
            bus_right,
            left_pad,
            right_pad,
            fbl,
            pocket,
        ]
        objects = draw.rotate(objects, p.orientation, origin=(0, 0))
        objects = draw.translate(objects, xoff=p.pos_x, yoff=p.pos_y)
        [
            JJ,
            bus_vertical_left,
            bus_vertical_right,
            bus_left,
            bus_right,
            left_pad,
            right_pad,
            fbl,
            pocket,
        ] = objects
        
        geom_jj = {"poly1": JJ}
        geom_bus_vertical_left = {"poly2": bus_vertical_left}
        geom_bus_vertical_right = {"poly3": bus_vertical_right}
        geom_bus_left = {"poly4": bus_left}
        geom_bus_right = {"poly5": bus_right}
        geom_left_pad = {"poly6": left_pad}
        geom_right_pad = {"poly7": right_pad}
        geom_fbl = {"poly8": fbl}
        
        self.add_qgeometry(
            "junction", geom_jj, layer=p.layer, subtract=False, width=p.JJ_width
        )
        self.add_qgeometry(
            "poly", geom_bus_vertical_left, layer=p.layer, subtract=False
        )
        self.add_qgeometry(
            "poly", geom_bus_vertical_right, layer=p.layer, subtract=False
        )
        self.add_qgeometry("poly", geom_bus_left, layer=p.layer, subtract=False)
        self.add_qgeometry("poly", geom_bus_right, layer=p.layer, subtract=False)
        self.add_qgeometry("poly", geom_left_pad, layer=p.layer, subtract=False)
        self.add_qgeometry("poly", geom_right_pad, layer=p.layer, subtract=False)
        self.add_qgeometry("poly", geom_fbl, layer=p.layer, subtract=False)

        def qpin_rotate_translate(x):
            y = list(x)
            z = [0.0, 0.0]
            z[0] = y[0] * cos(p.orientation * 3.14159 / 180) - y[1] * sin(
                p.orientation * 3.14159 / 180
            )
            z[1] = y[0] * sin(p.orientation * 3.14159 / 180) + y[1] * cos(
                p.orientation * 3.14159 / 180
            )
            z[0] = z[0] + p.pos_x
            z[1] = z[1] + p.pos_y
            x = (z[0], z[1])
            return x

        qp1b = (
            0.5 * p.JJ_length
            + p.bus_width
            + p.bus_inner_length
            + p.bus_outer_length
            + 2.0 * p.pad_radius,
            0.5 * p.bus_width,
        )
        qp1a = (
            0.5 * p.JJ_length
            + p.bus_width
            + 0.9 * p.bus_inner_length
            + p.bus_outer_length
            + 2.0 * p.pad_radius,
            0.5 * p.bus_width,
        )
        qp1a = qpin_rotate_translate(qp1a)
        qp1b = qpin_rotate_translate(qp1b)
        
        pts1 = np.array([qp1a, qp1b])
        if len(pts1) == 2:
            self.add_pin(
                "pin1", points=pts1, width=0.01, input_as_norm=True
            )

        qp2b = (
            -0.5 * p.JJ_length
            - p.bus_width
            - p.bus_inner_length
            - p.bus_outer_length
            - 2.0 * p.pad_radius,
            0.5 * p.bus_width,
        )
        qp2a = (
            -0.5 * p.JJ_length
            - p.bus_width
            - 0.9 * p.bus_inner_length
            - p.bus_outer_length
            - 2.0 * p.pad_radius,
            0.5 * p.bus_width,
        )
        qp2a = qpin_rotate_translate(qp2a)
        qp2b = qpin_rotate_translate(qp2b)
        
        pts2 = np.array([qp2a, qp2b])
        if len(pts2) == 2:
            self.add_pin(
                "pin2", points=pts2, width=0.01, input_as_norm=True
            )

        qp3b = (
            -0.5 * p.JJ_length - p.bus_width - p.fbl_offset - 0.5 * p.fbl_width,
            p.bus_JJ_height + p.fbl_length,
        )
        qp3a = (
            -0.5 * p.JJ_length - p.bus_width - p.fbl_offset - 0.5 * p.fbl_width,
            p.bus_JJ_height + 0.9 * p.fbl_length,
        )
        qp3a = qpin_rotate_translate(qp3a)
        qp3b = qpin_rotate_translate(qp3b)
        
        pts3 = np.array([qp3a, qp3b])
        if len(pts3) == 2:
            self.add_pin(
                "fbl", points=pts3, width=0.01, input_as_norm=True
            )
