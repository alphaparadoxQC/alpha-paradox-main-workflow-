import numpy as np

from alpha_metal import draw
from alpha_metal.toolbox_python.attr_dict import Dict
from alpha_metal.qlibrary.core.base import QComponent


class ReadoutResFC(QComponent):
    """ReadoutResFC"""

    default_options = Dict(
        pos_x="0 um",
        pos_y="0 um",
        readout_radius="50 um",
        readout_cpw_width="5 um",
        readout_cpw_gap="5 um",
        readout_cpw_turnradius="50 um",
        readout_l1="400 um",
        readout_l2="400 um",
        readout_l3="400 um",
        readout_l4="250 um",
        readout_l5="400 um",
        arc_step="1 um",
        orientation="0",
        layer="1",
        layer_subtract="2",
        subtract=True,
        chip="main",
        _default_connection_pads=Dict(),
    )
    
    component_metadata = Dict(
        short_name="readoutresfc",
        _qgeometry_table_poly="True",
        _qgeometry_table_junction="False",
    )

    def make(self):
        self.make_ro()

    def make_ro(self):
        p = self.p
        chip = p.chip

        r = p.readout_radius
        w = p.readout_cpw_width
        g = p.readout_cpw_gap
        turnradius = p.readout_cpw_turnradius
        l_1 = p.readout_l1
        l_2 = p.readout_l2
        l_3 = p.readout_l3
        l_4 = p.readout_l4
        l_5 = p.readout_l5

        cppatch = draw.Point(0, 0).buffer(r)

        x_1, y_1 = l_1 * np.cos(np.pi / 4), -l_1 * np.sin(np.pi / 4)
        x_2, y_2 = (
            x_1 + turnradius * (1 - np.cos(np.pi / 4)),
            y_1 - turnradius * np.sin(np.pi / 4),
        )
        coord_init = draw.Point(x_1, y_1)
        coord_center = draw.Point(
            x_1 - turnradius * np.cos(np.pi / 4), y_1 - turnradius * np.sin(np.pi / 4)
        )
        x_3, y_3 = x_2, y_2
        x_4, y_4 = x_3, y_3 - l_2
        x_5, y_5 = x_4 + turnradius, y_4
        coord_init1 = draw.Point(x_4, y_4)
        coord_center1 = draw.Point(x_5, y_5)
        x_6, y_6 = x_5, y_5 - turnradius
        x_7, y_7 = x_5 + l_3, y_6
        x_8, y_8 = x_7, y_7 + turnradius
        coord_init2 = draw.Point((x_7, y_7))
        coord_center2 = draw.Point((x_8, y_8))
        x_9, y_9 = x_8, y_8 + turnradius
        x_10, y_10 = x_8 - l_4, y_9
        x_11, y_11 = x_10, y_10 + turnradius
        coord_init3 = draw.Point((x_10, y_10))
        coord_center3 = draw.Point((x_11, y_11))
        arc3 = self.arc(coord_init3, coord_center3, -np.pi)
        x_12, y_12 = x_11, y_11 + turnradius
        x_13, y_13 = x_12 + l_5, y_12
        line12 = draw.LineString([(x_12, y_12), (x_13, y_13)])
        x_14, y_14 = x_13, y_13 + turnradius
        coord_init4 = draw.Point((x_13, y_13))
        coord_center4 = draw.Point((x_14, y_14))
        arc4 = self.arc(coord_init4, coord_center4, np.pi)
        cparm_line = draw.shapely.ops.unary_union(
            [
                draw.LineString([(0, 0), coord_init]),
                self.arc(coord_init, coord_center, -np.pi / 4),
                draw.LineString([(x_3, y_3), (x_4, y_4)]),
                self.arc(coord_init1, coord_center1, np.pi / 2),
                draw.LineString([(x_6, y_6), (x_7, y_7)]),
                self.arc(coord_init2, coord_center2, np.pi),
                draw.LineString([(x_9, y_9), (x_10, y_10)]),
                arc3,
                line12,
                arc4,
                draw.translate(line12, 0, 2 * turnradius),
                draw.translate(arc3, 0, 4 * turnradius),
                draw.translate(line12, 0, 4 * turnradius),
                draw.translate(arc4, 0, 4 * turnradius),
                draw.translate(line12, 0, 6 * turnradius),
                draw.translate(arc3, 0, 8 * turnradius),
                draw.translate(line12, 0, 8 * turnradius),
            ]
        )
        cparm = cparm_line.buffer(w / 2, cap_style=2, join_style=1)
        eps = 1e-3
        cparm = draw.Polygon(cparm.exterior)
        cparm = cparm.buffer(eps, join_style=2).buffer(-eps, join_style=2)

        ro = draw.shapely.ops.unary_union([cppatch, cparm])
        ro_etch = ro.buffer(g, cap_style=2, join_style=2)
        x_15, y_15 = x_14, y_14 + 7 * turnradius
        x_16, y_16 = x_15 + g / 2, y_15
        port_line = draw.LineString([(x_15, y_15 + w / 2), (x_15, y_15 - w / 2)])
        subtract_patch = draw.LineString(
            [(x_16, y_16 - w / 2 - g - eps), (x_16, y_16 + w / 2 + g + eps)]
        ).buffer(g / 2, cap_style=2)
        ro_etch = ro_etch.difference(subtract_patch)

        polys = [ro, ro_etch, port_line]
        polys = draw.rotate(polys, p.orientation, origin=(0, 0))
        polys = draw.translate(polys, p.pos_x, p.pos_y)

        [ro, ro_etch, port_line] = polys

        self.add_qgeometry("poly", dict(ro=ro), chip=chip, layer=p.layer)
        self.add_qgeometry(
            "poly",
            dict(ro_etch=ro_etch),
            chip=chip,
            layer=p.layer_subtract,
            subtract=p.subtract,
        )

        pts = np.array(port_line.coords)
        self.add_pin("readout", pts, width=w, gap=g, chip=chip)

    def arc(self, coord_init, coord_center, angle):
        p = self.p
        r = p.readout_cpw_turnradius
        step = p.arc_step

        step_angle = step / r if angle >= 0 else -step / r
        step_N = abs(int(angle / step_angle))
        laststep_flag = bool(angle % step_angle != 0)

        coord = [coord_init]
        point = coord_init
        for i in range(step_N):
            point = draw.rotate(
                point, step_angle, origin=coord_center, use_radians=True
            )
            coord.append(point)
        if laststep_flag:
            point = draw.rotate(
                coord_init, angle, origin=coord_center, use_radians=True
            )
            coord.append(point)
        coord = draw.LineString(coord)
        return coord
