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
Analyses (:mod:`alpha_metal.analyses`)
=================================================

.. currentmodule:: alpha_metal.analyses

Module containing all Quantum Alpha analyses.

.. _qanalysis:


Core analysis bases
-------------------

.. autosummary::
    :toctree: .

    QAnalysis
    QSimulation


Quantization
------------

.. autosummary::
    :toctree: .

    LOManalysis
    EPRanalysis


Simulation
----------

.. autosummary::
    :toctree: .

    LumpedElementsSim
    EigenmodeSim
    ScatteringImpedanceSim


Hamiltonians
------------

.. autosummary::
    :toctree: .

    Hcpb
    Hcpb_analytic
    HO_wavefunctions
    transmon_analytics


Electromagnetics
----------------

.. autosummary::
    :toctree: .

    cpw_calculations
    kappa_calculation
    lumped_capacitive


Sweeping
--------

.. autosummary::
    :toctree: .

    Sweeper

"""

from alpha_metal import config

from alpha_metal.analyses.core import QAnalysis
from alpha_metal.analyses.core import QSimulation
import alpha_metal.analyses.em as em
import alpha_metal.analyses.fem as fem
from alpha_metal.analyses.em import cpw_calculations
from alpha_metal.analyses.em import kappa_calculation
from alpha_metal.analyses.em import package_modes
from alpha_metal.analyses.em import multipoles
from alpha_metal.analyses.quantization import lumped_capacitive
from alpha_metal.analyses.quantization import EPRanalysis
from alpha_metal.analyses.quantization import LOManalysis
from alpha_metal.analyses.simulation import LumpedElementsSim
from alpha_metal.analyses.simulation import EigenmodeSim
from alpha_metal.analyses.simulation import ScatteringImpedanceSim
from alpha_metal.analyses.hamiltonian.transmon_charge_basis import Hcpb
from alpha_metal.analyses.hamiltonian import HO_wavefunctions
from alpha_metal.analyses.hamiltonian import transmon_analytics
from alpha_metal.analyses.hamiltonian.transmon_CPB_analytic import Hcpb_analytic
from alpha_metal.analyses.sweep_and_optimize.sweeper import Sweeper

from alpha_metal.analyses.quantization import _scqubits_compat

# scqubits < 4.2 (what macOS resolves next to a current scipy) needs two numpy
# aliases that numpy 2 removed, also when called directly (tutorial 4.34).
_scqubits_compat.restore_numpy_aliases_if_needed()
