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

# modified by Chalmers/SK 20210611 to add DesignFlipChip
"""
=================================================
Designs (:mod:`alpha_metal.designs`)
=================================================

.. currentmodule:: alpha_metal.designs

Module containing all Alpha Paradox designs.

.. _qdesign:

QDesign
---------------

.. autosummary::
    :toctree: .

    QDesign


DesignPlanar
---------------

.. autosummary::
    :toctree: .

    DesignPlanar


MultiPlanar
---------------

.. autosummary::
    :toctree: .

    MultiPlanar


DesignFlipChip
---------------

.. autosummary::
    :toctree: .

    DesignFlipChip

QNet
---------------

.. autosummary::
    :toctree: .

    QNet


InterfaceComponents
-------------------

.. autosummary::
    :toctree: .

    Components
"""

from alpha_metal import Dict
from alpha_metal import is_design
from alpha_metal.designs.design_base import QDesign
from alpha_metal.designs.design_planar import DesignPlanar
from alpha_metal.designs.design_multiplanar import MultiPlanar
from alpha_metal.designs.design_flipchip import DesignFlipChip
from alpha_metal.designs.net_info import QNet
from alpha_metal.designs.interface_components import Components

from alpha_metal.designs.barends_5q import build_barends_5q
from alpha_metal.designs.iswap_gates import (
    build_iswap_concentric,
    build_iswap_pocket,
    build_iswap_xmon,
)
from alpha_metal.designs.wallraff_17q import Wallraff17Qubit
