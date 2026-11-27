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
Analyses (:mod:`alpha_metal.analyses.quantization`)
====================================================

.. currentmodule:: alpha_metal.analyses.quantization

Module containing all Alpha Paradox quantization analyses.

"""

from alpha_metal import config
from alpha_metal.analyses.quantization.lumped_oscillator_model import LOManalysis
from alpha_metal.analyses.quantization.energy_participation_ratio import EPRanalysis
