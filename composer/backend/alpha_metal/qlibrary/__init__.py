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
"""
=================================================
QLibrary (:mod:`alpha_metal.qlibrary`)
=================================================

.. currentmodule:: alpha_metal.qlibrary

Module containing all Alpha Paradox QLibrary.

.. _qlibrary:

Core Classes
----------------

.. autosummary::
    :toctree: .

    QComponent
    ParsedDynamicAttributes_Component
    BaseQubit
    QRoute
    QRouteLead
    QRoutePoint


Sample Shapes
-----------------

.. autosummary::
    :toctree: .

    CircleCaterpillar
    CircleRaster
    NGon
    NSquareSpiral
    Rectangle
    RectangleHollow


Lumped
----------

.. autosummary::
    :toctree: .

    Cap3Interdigital
    CapFingerInFrame
    CapNInterdigital
    ResonatorCoilRect


Couplers
------------

.. autosummary::
    :toctree: .

    CoupledLineTee
    LineTee
    CapNInterdigitalTee
    TunableCoupler01
    TunableCoupler02


Resonator
------------

.. autosummary::
    :toctree: .

    ReadoutResFC
    ResonatorLumped


Terminations
----------------

.. autosummary::
    :toctree: .

    LaunchpadWirebond
    LaunchpadWirebondCoupled
    LaunchpadWirebondDriven
    OpenToGround
    ShortToGround


Transmission Lines
----------------------

.. autosummary::
    :toctree: .

    RouteStraight
    RouteFramed
    RouteMeander
    RouteAnchors
    RouteMixed
    RoutePathfinder
    PolylineCPW


Qubits
----------

.. autosummary::
    :toctree: .

    jj_dolan
    jj_manhattan
    TransmonConcentric
    TransmonConcentricType2
    TransmonCross
    TransmonCrossFL
    TransmonInterdigitated
    TransmonPocket
    TransmonPocketCL
    TransmonPocket6
    TransmonPocketTeeth
    TunableCoupler01
    SQUID_LOOP
    SNAIL
    StarQubit
    TwoPadTransmon


Submodules
--------------

.. autosummary::
    :toctree: .

    anchored_path

"""

from alpha_metal import config
from alpha_metal.qlibrary.core import BaseQubit, QComponent, QRoute

_LAZY_IMPORTS = {
    "PolylineCPW": ".tlines.polyline_cpw",
    "jj_dolan": ".qubits.JJ_Dolan",
    "jj_manhattan": ".qubits.JJ_Manhattan",
    "TransmonConcentric": ".qubits.transmon_concentric",
    "TransmonConcentricType2": ".qubits.transmon_concentric_type_2",
    "TransmonCross": ".qubits.transmon_cross",
    "TransmonCrossFL": ".qubits.transmon_cross_fl",
    "TransmonPocket": ".qubits.transmon_pocket",
    "TransmonPocket6": ".qubits.transmon_pocket_6",
    "TransmonPocketCL": ".qubits.transmon_pocket_cl",
    "TransmonPocketTeeth": ".qubits.transmon_pocket_teeth",
    "TransmonInterdigitated": ".qubits.Transmon_Interdigitated",
    "RouteStraight": ".tlines.straight_path",
    "RouteFramed": ".tlines.framed_path",
    "RouteMeander": ".tlines.meandered",
    "RouteAnchors": ".tlines.anchored_path",
    "RouteMixed": ".tlines.mixed_path",
    "RoutePathfinder": ".tlines.pathfinder",
    "Cap3Interdigital": ".lumped.cap_3_interdigital",
    "CapFingerInFrame": ".lumped.cap_finger_in_frame",
    "CapNInterdigital": ".lumped.cap_n_interdigital",
    "ResonatorCoilRect": ".lumped.resonator_coil_rect",
    "CircleCaterpillar": ".sample_shapes.circle_caterpillar",
    "CircleRaster": ".sample_shapes.circle_raster",
    "NGon": ".sample_shapes.n_gon",
    "NSquareSpiral": ".sample_shapes.n_square_spiral",
    "Rectangle": ".sample_shapes.rectangle",
    "RectangleHollow": ".sample_shapes.rectangle_hollow",
    "LaunchpadWirebond": ".terminations.launchpad_wb",
    "LaunchpadWirebondCoupled": ".terminations.launchpad_wb_coupled",
    "LaunchpadWirebondDriven": ".terminations.launchpad_wb_driven",
    "OpenToGround": ".terminations.open_to_ground",
    "ShortToGround": ".terminations.short_to_ground",
    "LineTee": ".couplers.line_tee",
    "CoupledLineTee": ".couplers.coupled_line_tee",
    "CapNInterdigitalTee": ".couplers.cap_n_interdigital_tee",
    "TunableCoupler01": ".couplers.tunable_coupler_01",
    "TunableCoupler02": ".couplers.tunable_coupler_02",
    "ReadoutResFC": ".resonators.readoutres_fc",
    "ResonatorLumped": ".resonators.resonator_lumped",
    "SQUID_LOOP": ".qubits.SQUID_loop",
    "SNAIL": ".qubits.SNAIL",
    "StarQubit": ".qubits.star_qubit",
    "TwoPadTransmon": ".qubits.two_pad_transmon",
}

def __getattr__(name: str):
    if name in _LAZY_IMPORTS:
        import importlib
        mod = importlib.import_module(_LAZY_IMPORTS[name], __name__)
        return getattr(mod, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

