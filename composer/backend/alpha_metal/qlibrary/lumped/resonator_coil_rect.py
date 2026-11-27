from alpha_metal import draw
from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.qlibrary.core.base import QComponent
import numpy as np

class ResonatorCoilRect(QComponent):
    """Resonator Coil Rect component for Alpha Metal."""

    component_metadata = Dict(short_name="res")

    default_options = Dict(
        n="3",
        length="2000um",
        line_width="1um",
        height="40um",
        gap="4um",
        coupler_distance="10um",
    )

    TOOLTIP = """ResonatorCoilRect"""

    def make(self):
        p = self.p
        n = int(p.n)
        spiral_list = []

        x_n = (p.length / (2 * n)) - (
            p.height + 2 * (p.gap + p.line_width) * (2 * n - 1)
        )

        if x_n <= p.gap + p.line_width:
            if hasattr(self, 'logger'):
                self.logger.warning("Inputted values results in the width of the spiral being too small.")
            return

        for step in range(n):
            x_point = x_n / 2 + step * (p.line_width + p.gap)
            y_point = p.height / 2 + step * (p.line_width + p.gap)
            spiral_list.append((-x_point, -y_point))
            spiral_list.append((x_point, -y_point))
            spiral_list.append((x_point, y_point))
            spiral_list.append((-x_point - (p.line_width + p.gap), y_point))

        x_point = x_n / 2 + (n) * (p.line_width + p.gap)
        y_point = p.height / 2 + (n) * (p.line_width + p.gap) - p.line_width / 2
        spiral_list.append((-x_point, -y_point))
        spiral_list = draw.LineString(spiral_list)

        spiral_etch = draw.shapely.geometry.box(
            -(x_point + p.line_width / 2 + p.gap),
            -y_point,
            x_point - p.line_width / 2,
            y_point,
        )
        points = draw.LineString(
            [
                (-x_point + p.line_width / 2, -y_point + p.coupler_distance),
                (-x_point - p.line_width / 2, -y_point + p.coupler_distance),
            ]
        )

        c_items = [spiral_list, spiral_etch, points]
        c_items = draw.rotate(c_items, p.orientation, origin=(0, 0))
        c_items = draw.translate(c_items, p.pos_x, p.pos_y)
        [spiral_list, spiral_etch, points] = c_items

        self.add_qgeometry("path", {"n_spiral": spiral_list}, width=p.line_width)
        self.add_qgeometry("poly", {"n_spira_etch": spiral_etch}, subtract=True)

        pts = np.array(points.coords)
        if len(pts) == 2:
            self.add_pin(
                "spiralPin",
                points=pts,
                width=p.line_width,
                input_as_norm=True,
            )
        else:
            if hasattr(self, 'logger'):
                self.logger.warning("spiralPin points invalid length")
