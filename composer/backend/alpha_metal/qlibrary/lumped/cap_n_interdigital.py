from alpha_metal import draw
from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.qlibrary.core.base import QComponent
import numpy as np

class CapNInterdigital(QComponent):
    """Cap N Interdigital component for Alpha Metal."""

    component_metadata = Dict(
        short_name="cpw", _qgeometry_table_poly="True", _qgeometry_table_path="True"
    )

    default_options = Dict(
        north_width="10um",
        north_gap="6um",
        south_width="10um",
        south_gap="6um",
        cap_width="10um",
        cap_gap="6um",
        cap_gap_ground="6um",
        finger_length="20um",
        finger_count="5",
        cap_distance="50um",
        layer="1"
    )

    TOOLTIP = """CapNInterdigital Component"""

    def make(self):
        p = self.p
        N = int(p.finger_count)

        cap_box = draw.rectangle(
            N * p.cap_width + (N - 1) * p.cap_gap,
            p.cap_gap + 2 * p.cap_width + p.finger_length,
            0,
            0,
        )
        make_cut_list = []
        make_cut_list.append([0, (p.finger_length) / 2])
        make_cut_list.append([(p.cap_width) + (p.cap_gap / 2), (p.finger_length) / 2])
        flip = -1

        for i in range(1, N):
            make_cut_list.append(
                [
                    i * (p.cap_width) + (2 * i - 1) * (p.cap_gap / 2),
                    flip * (p.finger_length) / 2,
                ]
            )
            make_cut_list.append(
                [
                    (i + 1) * (p.cap_width) + (2 * i + 1) * (p.cap_gap / 2),
                    flip * (p.finger_length) / 2,
                ]
            )
            flip = flip * -1

        cap_cut = draw.LineString(make_cut_list).buffer(
            p.cap_gap / 2, cap_style=2, join_style=2
        )
        cap_cut = draw.translate(
            cap_cut, -(N * p.cap_width + (N - 1) * p.cap_gap) / 2, 0
        )

        cap_body = draw.subtract(cap_box, cap_cut)
        cap_body = draw.translate(
            cap_body,
            0,
            -p.cap_distance - (p.cap_gap + 2 * p.cap_width + p.finger_length) / 2,
        )

        cap_etch = draw.rectangle(
            N * p.cap_width + (N - 1) * p.cap_gap + 2 * p.cap_gap_ground,
            p.cap_gap + 2 * p.cap_width + p.finger_length + 2 * p.cap_gap_ground,
            0,
            -p.cap_distance - (p.cap_gap + 2 * p.cap_width + p.finger_length) / 2,
        )

        north_cpw = draw.LineString([[0, 0], [0, -p.cap_distance]])
        south_cpw = draw.LineString(
            [
                [0, -p.cap_distance - (p.cap_gap + 2 * p.cap_width + p.finger_length)],
                [
                    0,
                    -2 * p.cap_distance
                    - (p.cap_gap + 2 * p.cap_width + p.finger_length),
                ],
            ]
        )

        c_items = [north_cpw, south_cpw, cap_body, cap_etch]
        c_items = draw.rotate(c_items, p.orientation, origin=(0, 0))
        c_items = draw.translate(c_items, p.pos_x, p.pos_y)
        [north_cpw, south_cpw, cap_body, cap_etch] = c_items

        layer = p.layer
        self.add_qgeometry(
            "path", {"north_cpw": north_cpw}, width=p.north_width, layer=layer
        )
        self.add_qgeometry(
            "path",
            {"north_cpw_sub": north_cpw},
            width=p.north_width + 2 * p.north_gap,
            layer=layer,
            subtract=True,
        )

        self.add_qgeometry(
            "path", {"south_cpw": south_cpw}, width=p.south_width, layer=layer
        )
        self.add_qgeometry(
            "path",
            {"south_cpw_sub": south_cpw},
            width=p.south_width + 2 * p.south_gap,
            layer=layer,
            subtract=True,
        )

        self.add_qgeometry("poly", {"cap_body": cap_body}, layer=layer)
        self.add_qgeometry("poly", {"cap_etch": cap_etch}, layer=layer, subtract=True)

        north_pin_list = north_cpw.coords
        south_pin_list = south_cpw.coords

        pts_north = np.array(north_pin_list[::-1])
        if len(pts_north) == 2:
            self.add_pin(
                "north_end",
                points=pts_north,
                width=p.north_width,
                input_as_norm=True,
            )
        else:
            if hasattr(self, 'logger'):
                self.logger.warning("north_end points invalid length")

        pts_south = np.array(south_pin_list)
        if len(pts_south) == 2:
            self.add_pin(
                "south_end",
                points=pts_south,
                width=p.south_width,
                input_as_norm=True,
            )
        else:
            if hasattr(self, 'logger'):
                self.logger.warning("south_end points invalid length")
