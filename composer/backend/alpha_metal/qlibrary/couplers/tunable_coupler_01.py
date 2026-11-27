import numpy as np
from alpha_metal import draw
from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.qlibrary.core.qubit import BaseQubit


class TunableCoupler01(BaseQubit):
    """TunableCoupler01"""

    default_options = Dict(
        c_width="400um",
        l_width="20um",
        l_gap="10um",
        a_height="60um",
        cp_height="15um",
        cp_arm_length="30um",
        cp_arm_width="6um",
        cp_gap="6um",
        cp_gspace="3um",
        fl_width="5um",
        fl_gap="3um",
        fl_length="10um",
        fl_ground="2um",
        layer="1"
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

        btm = draw.shapely.geometry.box(
            -p.c_width / 2, -p.l_width / 2, 0, p.l_width / 2
        )

        x_spot = p.c_width / 2 - p.l_width / 2

        arm1 = draw.shapely.geometry.box(
            -(x_spot + p.l_width / 2),
            p.l_width / 2,
            -(x_spot - p.l_width / 2),
            p.a_height,
        )
        arm2 = draw.shapely.geometry.box(
            -((x_spot) * 3 / 5 + p.l_width / 2),
            p.l_width / 2,
            -((x_spot) * 3 / 5 - p.l_width / 2),
            p.a_height,
        )
        arm3 = draw.shapely.geometry.box(
            -((x_spot) * 1 / 5 + p.l_width / 2),
            p.l_width / 2,
            -((x_spot) * 1 / 5 - p.l_width / 2),
            p.a_height,
        )

        left_side = draw.shapely.ops.unary_union([btm, arm1, arm2, arm3])
        cap_island = draw.shapely.ops.unary_union(
            [
                left_side,
                draw.shapely.affinity.scale(
                    left_side, xfact=-1, yfact=1, origin=(0, 0)
                ),
            ]
        )

        cap_subtract = cap_island.buffer(p.l_gap, cap_style=3, join_style=2)

        cpl_x = 1 / 5 * x_spot
        cpl_y = p.a_height + p.l_gap + p.cp_gap + p.cp_gspace
        fl_y = p.a_height + p.l_gap + p.fl_ground + p.fl_gap + p.fl_width / 2

        rect_jj = draw.LineString(
            [(-cpl_x * 3, p.a_height), (-cpl_x * 3, p.a_height + p.l_gap)]
        )

        flux_line = draw.LineString(
            [
                [-cpl_x * 3 - p.fl_length, fl_y],
                [-cpl_x * 3, fl_y],
                [-cpl_x * 3, fl_y + 0.01],
            ]
        )

        cpl_x = 1 / 5 * x_spot
        cpl_y = p.a_height + p.l_gap + p.cp_gap + p.cp_gspace

        con_pad = draw.shapely.geometry.box(
            cpl_x - 1 / 5 * x_spot - p.cp_arm_width / 2,
            cpl_y,
            cpl_x + 1 / 5 * x_spot + p.cp_arm_width / 2,
            cpl_y + p.cp_height,
        )

        con_arm_l = draw.shapely.geometry.box(
            cpl_x - 1 / 5 * x_spot - p.cp_arm_width / 2,
            cpl_y - p.cp_arm_length,
            cpl_x - 1 / 5 * x_spot + p.cp_arm_width / 2,
            cpl_y,
        )

        con_arm_r = draw.shapely.geometry.box(
            cpl_x + 1 / 5 * x_spot - p.cp_arm_width / 2,
            cpl_y - p.cp_arm_length,
            cpl_x + 1 / 5 * x_spot + p.cp_arm_width / 2,
            cpl_y,
        )

        con_body = draw.shapely.ops.unary_union([con_pad, con_arm_l, con_arm_r])
        con_sub = con_body.buffer(p.cp_gap, cap_style=3, join_style=2)
        con_pin = draw.LineString([[cpl_x, cpl_y], [cpl_x, cpl_y + p.cp_height]])

        c_items = [
            cap_island,
            cap_subtract,
            rect_jj,
            con_body,
            con_sub,
            flux_line,
            con_pin,
        ]
        c_items = draw.rotate(c_items, p.orientation, origin=(0, 0))
        c_items = draw.translate(c_items, p.pos_x, p.pos_y)
        [cap_island, cap_subtract, rect_jj, con_body, con_sub, flux_line, con_pin] = (
            c_items
        )

        layer = p.layer
        self.add_qgeometry(
            "poly",
            {"cap_island": cap_island, "connector_body": con_body},
            layer=layer,
        )
        self.add_qgeometry(
            "poly",
            {"cap_subtract": cap_subtract, "connector_sub": con_sub},
            layer=layer,
            subtract=True,
        )

        self.add_qgeometry(
            "path", {"flux_line": flux_line}, width=p.fl_width, layer=layer
        )
        self.add_qgeometry(
            "path",
            {"flux_line_sub": flux_line},
            width=p.fl_width + 2 * p.fl_gap,
            subtract=True,
            layer=layer,
        )

        self.add_qgeometry("junction", dict(rect_jj=rect_jj), width=p.l_width)

        pts_con = np.array(con_pin.coords)
        if len(pts_con) == 2:
            self.add_pin("Control", points=pts_con, width=p.l_width, input_as_norm=True)
        else:
            if hasattr(self, 'logger'): self.logger.warning("Control pin invalid")

        pts_flux = np.array(flux_line.coords[-2:])
        if len(pts_flux) == 2:
            self.add_pin("Flux", points=pts_flux, width=p.l_width, input_as_norm=True)
        else:
            if hasattr(self, 'logger'): self.logger.warning("Flux pin invalid")
