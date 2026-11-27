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
Toolbox_metal (:mod:`alpha_metal.toolbox_metal`)
=================================================

.. currentmodule:: alpha_metal.toolbox_metal

This folder contains code that is more specific to Alpha.

Custom Exceptions
-----------------

.. autosummary::
    :toctree: .

    QiskitMetalExceptions
    QiskitMetalDesignError


Submodules
---------------

.. autosummary::
    :toctree: .

    about
    import_export
    math_and_overrides
    parsing
    layer_stack_handler
    bounds_for_path_and_poly_tables
    determine_larger_box

"""

from alpha_metal.toolbox_metal.exceptions import (
    QiskitMetalExceptions,
    QiskitMetalDesignError,
    QLibraryGUIException,
    IncorrectQtException,
    InputError,
)

from alpha_metal.toolbox_metal.parsing import (
    parse_value,
    is_variable_name,
    is_numeric_possible,
    parse_units,
    extract_value_unit,
    fix_units,
)
from alpha_metal.toolbox_metal.layer_stack_handler import LayerStackHandler
from alpha_metal.toolbox_metal.bounds_for_path_and_poly_tables import (
    BoundsForPathAndPolyTables,
    determine_larger_box,
)
from alpha_metal.toolbox_metal.import_export import save_metal, load_metal_design

from alpha_metal.toolbox_metal import about
from alpha_metal.toolbox_metal import import_export
from alpha_metal.toolbox_metal import math_and_overrides
from alpha_metal.toolbox_metal import parsing
from alpha_metal.toolbox_metal import layer_stack_handler
from alpha_metal.toolbox_metal import bounds_for_path_and_poly_tables

__all__ = [
    "QiskitMetalExceptions",
    "QiskitMetalDesignError",
    "QLibraryGUIException",
    "IncorrectQtException",
    "InputError",
    "about",
    "import_export",
    "math_and_overrides",
    "parsing",
    "layer_stack_handler",
    "bounds_for_path_and_poly_tables",
    "determine_larger_box",
    "BoundsForPathAndPolyTables",
    "LayerStackHandler",
    "parse_value",
    "is_variable_name",
    "is_numeric_possible",
    "parse_units",
    "extract_value_unit",
    "fix_units",
    "save_metal",
    "load_metal_design",
]
