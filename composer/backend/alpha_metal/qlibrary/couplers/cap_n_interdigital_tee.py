from alpha_metal import draw
from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.qlibrary.core.base import QComponent
import numpy as np

class CapNInterdigitalTee(QComponent):
    """Cap N Interdigital Tee component for Alpha Metal."""

    component_metadata = Dict(
        short_name="cpw", _qgeometry_table_poly="True", _qgeometry_table_path="True"
    )

    default_options = Dict(
        prime_width="10um",
        prime_gap="6um",
        second_width="10um",
        second_gap="6um",
        cap_gap="6um",
        cap_width="10um",
        finger_length="20um",
        finger_count="5",
        cap_distance="50um",
        layer="1"
    )

    TOOLTIP = """CapNInterdigitalTee"""

    def make(self):
        p = self.p
        N = int(p.finger_count)
        prime_cpw_length = p.cap_width * 2 * N

        prime_cpw = draw.LineString(
            [[-prime_cpw_length / 2, 0], [prime_cpw_length / 2, 0]]
        )

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
            N * p.cap_width + (N - 1) * p.cap_gap + 2 * p.second_gap,
            p.cap_gap + 2 * p.cap_width + p.finger_length + 2 * p.second_gap,
            0,
            -p.cap_distance - (p.cap_gap + 2 * p.cap_width + p.finger_length) / 2,
        )

        second_cpw_top = draw.LineString(
            [[0, -p.prime_width / 2], [0, -p.cap_distance]]
        )

        second_cpw_bottom = draw.LineString(
            [
                [0, -p.cap_distance - (p.cap_gap + 2 * p.cap_width + p.finger_length)],
                [
                    0,
                    -2 * p.cap_distance
                    - (p.cap_gap + 2 * p.cap_width + p.finger_length),
                ],
            ]
        )

        c_items = [prime_cpw, second_cpw_top, second_cpw_bottom, cap_body, cap_etch]
        c_items = draw.rotate(c_items, p.orientation, origin=(0, 0))
        c_items = draw.translate(c_items, p.pos_x, p.pos_y)
        [prime_cpw, second_cpw_top, second_cpw_bottom, cap_body, cap_etch] = c_items

        layer = p.layer
        self.add_qgeometry(
            "path", {"prime_cpw": prime_cpw}, width=p.prime_width, layer=layer
        )
        self.add_qgeometry(
            "path",
            {"prime_cpw_sub": prime_cpw},
            width=p.prime_width + 2 * p.prime_gap,
            subtract=True,
            layer=layer,
        )
        self.add_qgeometry(
            "path",
            {"second_cpw_top": second_cpw_top, "second_cpw_bottom": second_cpw_bottom},
            width=p.second_width,
            layer=layer,
        )
        self.add_qgeometry(
            "path",
            {
                "second_cpw_top_sub": second_cpw_top,
                "second_cpw_bottom_sub": second_cpw_bottom,
            },
            width=p.second_width + 2 * p.second_gap,
            subtract=True,
            layer=layer,
        )

        self.add_qgeometry("poly", {"cap_body": cap_body}, layer=layer)
        self.add_qgeometry("poly", {"cap_etch": cap_etch}, layer=layer, subtract=True)

        prime_pin_list = prime_cpw.coords
        second_pin_list = second_cpw_bottom.coords

        pts_prime_start = np.array(prime_pin_list[::-1])
        if len(pts_prime_start) == 2:
            self.add_pin(
                "prime_start",
                points=pts_prime_start,
                width=p.prime_width,
                input_as_norm=True,
            )

        pts_prime_end = np.array(prime_pin_list)
        if len(pts_prime_end) == 2:
            self.add_pin(
                "prime_end",
                points=pts_prime_end,
                width=p.prime_width,
                input_as_norm=True,
            )

        pts_second = np.array(second_pin_list)
        if len(pts_second) == 2:
            self.add_pin(
                "second_end",
                points=pts_second,
                width=p.second_width,
                input_as_norm=True,
            )
