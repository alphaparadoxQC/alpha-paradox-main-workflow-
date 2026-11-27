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
====================================================
Analysis (:mod:`alpha_metal.analyses.simulation`)
====================================================

.. currentmodule:: alpha_metal.analyses.simulation

Module containing all Alpha Paradox simulation analyses.

"""

from alpha_metal import config
from alpha_metal.analyses.simulation.lumped_elements import LumpedElementsSim
from alpha_metal.analyses.simulation.eigenmode import EigenmodeSim
from alpha_metal.analyses.simulation.scattering_impedance import ScatteringImpedanceSim
