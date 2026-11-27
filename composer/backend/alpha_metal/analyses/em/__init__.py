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
"""Electromagnetic analyses module."""

from alpha_metal.analyses.em import cpw_calculations
from alpha_metal.analyses.em import kappa_calculation
from alpha_metal.analyses.em import package_modes
from alpha_metal.analyses.em import multipoles
from alpha_metal.analyses.em.package_modes import (
    C0,
    C0_MM,
    EPS0,
    MU0,
    ImpedanceFit,
    LSMMode,
    circuit_couplings,
    circuit_eigenfrequencies,
    circuit_impedance,
    dipole_coupling,
    fit_amplitude,
    fit_impedance,
    g_on_resonance,
    lsm_mode,
    lsm_mode_approx,
    qubit_centers,
)

__all__ = [
    "cpw_calculations",
    "kappa_calculation",
    "package_modes",
    "multipoles",
    "C0",
    "C0_MM",
    "EPS0",
    "MU0",
    "ImpedanceFit",
    "LSMMode",
    "circuit_couplings",
    "circuit_eigenfrequencies",
    "circuit_impedance",
    "dipole_coupling",
    "fit_amplitude",
    "fit_impedance",
    "g_on_resonance",
    "lsm_mode",
    "lsm_mode_approx",
    "qubit_centers",
]
