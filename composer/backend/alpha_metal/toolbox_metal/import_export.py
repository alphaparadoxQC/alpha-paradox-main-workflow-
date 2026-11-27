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

"""Saving and load alpha data."""

import pickle

# from ..designs.base
from alpha_metal.toolbox_python.utility_functions import log_error_easy

__all__ = ["load_metal_design", "save_metal"]


def save_metal(filename: str, design):
    """Save alpha design to file using pickle.

    Args:
        filename (str): File path
        design (QDesign): Design object

    Returns:
        bool: True if successful, False otherwise
    """
    result = False

    self = design
    logger = getattr(self, 'logger', None)
    self.logger = None
    renderers = getattr(self, '_renderers', None)
    self._renderers = {}

    try:
        with open(filename, "wb") as f:
            pickle.dump(self, f)
        result = True
    except Exception as e:
        text = f"ERROR WHILE SAVING: {e}"
        log_error_easy(logger, post_text=text)
        result = False
    finally:
        self.logger = logger
        if renderers is not None:
            self._renderers = renderers

    return result


def load_metal_design(filename: str):
    """Load alpha design from file.

    Args:
        filename (str): File path

    Returns:
        QDesign: The loaded design object
    """
    with open(filename, "rb") as f:
        design = pickle.load(f)

    design.save_path = str(filename)

    from .. import logger
    design.logger = logger

    if hasattr(design, '_start_renderers'):
        try:
            design._start_renderers()
        except Exception:
            pass

    return design
