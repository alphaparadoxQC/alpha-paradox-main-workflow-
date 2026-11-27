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
"""Headless matplotlib viewer for Quantum Alpha designs.

Exposes :func:`view`, a one-line entry point that returns a matplotlib
:class:`~matplotlib.figure.Figure` populated with every component's
geometry. No Qt, no :class:`~alpha_metal._gui.main_window.MetalGUI`;
works in plain Python, Jupyter notebooks, headless CI, Binder, Colab.

The viewer reuses :class:`~alpha_metal.renderers.renderer_mpl.mpl_renderer.QMplRenderer`
internally — same rendering logic the Qt GUI uses — but in standalone
mode (no Qt canvas).

Example
-------

>>> import alpha_metal as qm
>>> from alpha_metal.designs import DesignPlanar
>>> from alpha_metal.qlibrary.qubits.transmon_pocket import TransmonPocket
>>> design = DesignPlanar()
>>> TransmonPocket(design, 'Q1', options={'connection_pads': {'a': {}}})
>>> fig = qm.view(design)
>>> fig.savefig('q1.png')
"""

from __future__ import annotations

from typing import Iterable, Optional, Tuple

from .view import view
from .headless_gui import MetalGUIHeadless, gui
from .show_inline import show_inline

__all__ = ["MetalGUIHeadless", "gui", "show_inline", "view"]
