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
Renderers (:mod:`alpha_metal.renderers`)
=================================================

.. currentmodule:: alpha_metal.renderers

.. _qrenderer:

Renderer Base
---------------

.. autosummary::
    :toctree: .

    QRenderer
    QRendererGui
    QRendererAnalysis


MPL Renderer
---------------

.. autosummary::
    :toctree: .

    PlotCanvas
    MplInteraction
    ZoomOnWheel
    PanAndZoom
    QMplRenderer
    AnimatedText


GDS Renderer
---------------

.. autosummary::
    :toctree: .

    QGDSRenderer
    Cheesing


Ansys Renderer
---------------

.. autosummary::
    :toctree: .

    QAnsysRenderer
    QHFSSRenderer
    QQ3DRenderer
    QPyaedt
    QQ3DPyaedt
    QHFSSPyaedt
    QHFSSDrivenmodalPyaedt
    QHFSSEigenmodePyaedt



GMSH Renderer
---------------

.. autosummary::
    :toctree: .

    QGmshRenderer
    Vec3DArray



"""

from alpha_metal.renderers.setup_default import setup_renderers
from alpha_metal import config
import importlib

_RENDERER_CLASSES = {
    "QRenderer": ("alpha_metal.renderers.renderer_base.renderer_base", "QRenderer"),
    "QRendererGui": ("alpha_metal.renderers.renderer_base.renderer_gui_base", "QRendererGui"),
    "QRendererAnalysis": ("alpha_metal.renderers.renderer_base.rndr_analysis", "QRendererAnalysis"),
    "PlotCanvas": ("alpha_metal.renderers.renderer_mpl.mpl_canvas", "PlotCanvas"),
    "MplInteraction": ("alpha_metal.renderers.renderer_mpl.mpl_interaction", "MplInteraction"),
    "ZoomOnWheel": ("alpha_metal.renderers.renderer_mpl.mpl_interaction", "ZoomOnWheel"),
    "PanAndZoom": ("alpha_metal.renderers.renderer_mpl.mpl_interaction", "PanAndZoom"),
    "QMplRenderer": ("alpha_metal.renderers.renderer_mpl.mpl_renderer", "QMplRenderer"),
    "AnimatedText": ("alpha_metal.renderers.renderer_mpl.extensions.animated_text", "AnimatedText"),
    "QGDSRenderer": ("alpha_metal.renderers.renderer_gds.gds_renderer", "QGDSRenderer"),
    "Cheesing": ("alpha_metal.renderers.renderer_gds.make_cheese", "Cheesing"),
    "QAnsysRenderer": ("alpha_metal.renderers.renderer_ansys.ansys_renderer", "QAnsysRenderer"),
    "QHFSSRenderer": ("alpha_metal.renderers.renderer_ansys.hfss_renderer", "QHFSSRenderer"),
    "QQ3DRenderer": ("alpha_metal.renderers.renderer_ansys.q3d_renderer", "QQ3DRenderer"),
    "QPyaedt": ("alpha_metal.renderers.renderer_ansys_pyaedt.pyaedt_base", "QPyaedt"),
    "QQ3DPyaedt": ("alpha_metal.renderers.renderer_ansys_pyaedt.q3d_renderer_aedt", "QQ3DPyaedt"),
    "QHFSSPyaedt": ("alpha_metal.renderers.renderer_ansys_pyaedt.hfss_renderer_aedt", "QHFSSPyaedt"),
    "QHFSSDrivenmodalPyaedt": ("alpha_metal.renderers.renderer_ansys_pyaedt.hfss_renderer_drivenmodal_aedt", "QHFSSDrivenmodalPyaedt"),
    "QHFSSEigenmodePyaedt": ("alpha_metal.renderers.renderer_ansys_pyaedt.hfss_renderer_eigenmode_aedt", "QHFSSEigenmodePyaedt"),
    "QGmshRenderer": ("alpha_metal.renderers.renderer_gmsh.gmsh_renderer", "QGmshRenderer"),
    "Vec3DArray": ("alpha_metal.renderers.renderer_gmsh.gmsh_utils", "Vec3DArray"),
}

__all__ = list(_RENDERER_CLASSES.keys()) + ["setup_renderers"]

def __getattr__(name):
    if name in _RENDERER_CLASSES:
        mod_name, cls_name = _RENDERER_CLASSES[name]
        mod = importlib.import_module(mod_name)
        val = getattr(mod, cls_name)
        globals()[name] = val
        return val
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

def __dir__():
    return sorted(set(globals().keys()) | set(_RENDERER_CLASSES.keys()) | {"setup_renderers"})
