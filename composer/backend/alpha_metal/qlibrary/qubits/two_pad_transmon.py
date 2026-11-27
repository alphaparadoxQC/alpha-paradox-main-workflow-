# This code is part of Alpha.
#
# (C) Copyright Alpha 2017, 2021.
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Two-Pad Transmon (Bare Transmon for Package-Mode Studies).

.. code-block::
     __________        __________
    |          |      |          |
    | pad_left |==jj==| pad_right|
    |__________|      |__________|
"""

from __future__ import annotations

import numpy as np
from alpha_metal import Dict, draw
from alpha_metal.qlibrary.core import BaseQubit


class TwoPadTransmon(BaseQubit):
    """Two rectangular paddles and a junction across the gap -- no ground pocket.

    The bare transmon of the validation device in:
        R. Molavi et al., "Extracting electromagnetic bare mode couplings
        in large superconducting quantum processors," arXiv:2609.22442 (2026).

    The paddles are separated along x (before rotation), and the junction
    is a line across the gap.

    Default Options:
        * pad_width: '0.5mm' -- paddle size along the junction direction (x)
        * pad_height: '1mm' -- paddle size across the junction direction (y)
        * pad_gap: '0.2mm' -- gap between the paddles (the junction length)
        * jj_width: '20um' -- drawn width of the junction line
        * pos_x: '0mm' -- center x position
        * pos_y: '0mm' -- center y position
        * orientation: '0' -- rotation angle in degrees
        * chip: 'main' -- chip name
        * layer: '1' -- metallization layer
    """

    default_options = Dict(
        pad_width="0.5mm",
        pad_height="1mm",
        pad_gap="0.2mm",
        jj_width="20um",
        pos_x="0mm",
        pos_y="0mm",
        orientation="0",
        chip="main",
        layer="1",
    )
    component_metadata = Dict(
        short_name="Q",
        _qgeometry_table_poly="True",
        _qgeometry_table_junction="True",
    )

    TOOLTIP = """Two rectangular paddles and a junction across the gap (no ground pocket)."""

    def make(self):
        """Construct the two rectangular pads and junction geometry."""
        p = self.p
        pad = draw.rectangle(p.pad_width, p.pad_height)
        shift = (p.pad_gap + p.pad_width) / 2
        pad_left = draw.translate(pad, -shift, 0)
        pad_right = draw.translate(pad, +shift, 0)
        jj = draw.LineString([(-p.pad_gap / 2, 0), (p.pad_gap / 2, 0)])

        # Construct pin reference lines
        pin_line_left = draw.LineString([
            (-shift - p.pad_width / 2 + 0.01, 0.0),
            (-shift - p.pad_width / 2, 0.0)
        ])
        pin_line_right = draw.LineString([
            (shift + p.pad_width / 2 - 0.01, 0.0),
            (shift + p.pad_width / 2, 0.0)
        ])

        # Rotate and translate all geometries together
        geoms = draw.rotate(
            [pad_left, pad_right, jj, pin_line_left, pin_line_right],
            p.orientation,
            origin=(0, 0),
        )
        pad_left, pad_right, jj, pin_line_left, pin_line_right = draw.translate(
            geoms, p.pos_x, p.pos_y
        )

        # Add polygons and junction
        self.add_qgeometry(
            "poly",
            dict(pad_left=pad_left, pad_right=pad_right),
            chip=p.chip,
            layer=p.layer,
        )
        self.add_qgeometry(
            "junction",
            dict(jj=jj),
            width=p.jj_width,
            chip=p.chip,
            layer=p.layer,
        )

        # Add pins for external CPW routing if connected to readout/control
        self.add_pin(
            "left",
            points=np.array(pin_line_left.coords),
            width=p.pad_height,
            input_as_norm=True,
            chip=p.chip,
        )
        self.add_pin(
            "right",
            points=np.array(pin_line_right.coords),
            width=p.pad_height,
            input_as_norm=True,
            chip=p.chip,
        )
