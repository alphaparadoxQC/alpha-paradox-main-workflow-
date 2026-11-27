from alpha_metal import draw
from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.qlibrary.core.base import QComponent
import numpy as np

class CoupledLineTee(QComponent):
    """Coupled Line Tee component for Alpha Metal."""

    component_metadata = Dict(short_name="cpw", _qgeometry_table_path="True")

    default_options = Dict(
        prime_width="10um",
        prime_gap="6um",
        second_width="10um",
        second_gap="6um",
        coupling_space="3um",
        coupling_length="100um",
        down_length="100um",
        fillet="25um",
        mirror=False,
        open_termination=True,
    )

    TOOLTIP = """CoupledLineTee"""

    def make(self):
        p = self.p

        prime_cpw_length = p.coupling_length * 2
        second_flip = 1
        if p.mirror:
            second_flip = -1

        prime_cpw = draw.LineString(
            [[-prime_cpw_length / 2, 0], [prime_cpw_length / 2, 0]]
        )

        second_down_length = p.down_length
        second_y = (
            -p.prime_width / 2
            - p.prime_gap
            - p.coupling_space
            - p.second_gap
            - p.second_width / 2
        )
        second_cpw = draw.LineString(
            [
                [second_flip * (-p.coupling_length / 2), second_y],
                [second_flip * (p.coupling_length / 2), second_y],
                [second_flip * (p.coupling_length / 2), second_y - second_down_length],
            ]
        )

        second_termination = 0
        if p.open_termination:
            second_termination = p.second_gap

        second_cpw_etch = draw.LineString(
            [
                [second_flip * (-p.coupling_length / 2 - second_termination), second_y],
                [second_flip * (p.coupling_length / 2), second_y],
                [second_flip * (p.coupling_length / 2), second_y - second_down_length],
            ]
        )

        c_items = [prime_cpw, second_cpw, second_cpw_etch]
        c_items = draw.rotate(c_items, p.orientation, origin=(0, 0))
        c_items = draw.translate(c_items, p.pos_x, p.pos_y)
        [prime_cpw, second_cpw, second_cpw_etch] = c_items

        self.add_qgeometry("path", {"prime_cpw": prime_cpw}, width=p.prime_width)
        self.add_qgeometry(
            "path",
            {"prime_cpw_sub": prime_cpw},
            width=p.prime_width + 2 * p.prime_gap,
            subtract=True,
        )
        self.add_qgeometry(
            "path", {"second_cpw": second_cpw}, width=p.second_width, fillet=p.fillet
        )
        self.add_qgeometry(
            "path",
            {"second_cpw_sub": second_cpw_etch},
            width=p.second_width + 2 * p.second_gap,
            subtract=True,
            fillet=p.fillet,
        )

        prime_pin_list = prime_cpw.coords
        second_pin_list = second_cpw.coords

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

        pts_second = np.array(second_pin_list[1:])
        if len(pts_second) >= 2:
            self.add_pin(
                "second_end",
                points=pts_second[:2],
                width=p.second_width,
                input_as_norm=True,
            )
