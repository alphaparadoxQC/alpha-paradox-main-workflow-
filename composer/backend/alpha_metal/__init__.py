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


# Get Alpha Paradox version from metadata without importing the package
from importlib.metadata import metadata, version

metal_metadata = {"Version": "0.1.0"}

"""Alpha Paradox"""
__version__ = metal_metadata["Version"]
__license__ = "Apache 2.0"
__author__ = "Alpha"
__copyright__ = "Copyright Alpha 2019-2020"
__status__ = "Development"

###########################################################################
### Windows OS catch for library geopandas not installed with setup.py
### TODO: Check if this is still needed with uv_build.

import os

if os.name == "nt":
    # Issue #1048: Qt 6.11 + integrated Intel GPU + WDDM 3.2 + touchscreen-
    # capable Windows 11 hardware (e.g. Dell Latitude 9440 2-in-1) hits a
    # native CRT __fastfail(7) inside Qt's accelerated D3D/RHI render path
    # at QMainWindow.show(). Forcing Qt's bundled Mesa software OpenGL
    # (opengl32sw.dll) bypasses the failure. The env var must be set
    # BEFORE any PySide6 module is imported -- the runtime Qt attribute
    # (Qt.AA_UseSoftwareOpenGL) is only a hint and is silently ignored on
    # the affected drivers. Power users on healthy GPUs can opt back into
    # accelerated GL by exporting QISKIT_METAL_QT_HARDWARE_GL=1 before
    # ``import alpha_metal``.
    if not os.environ.get("QISKIT_METAL_QT_HARDWARE_GL"):
        os.environ.setdefault("QT_OPENGL", "software")

    try:
        import geopandas
    except ImportError:
        print(
            " \
            QISKIT METAL INFORMATION: >>>>>>>>>> One last installation step. <<<<<<<<<<<\n \
            >>>>>> Packages fiona and gdal have a known install issue on Windows. <<<<<<\n \
            >>>>>>>>>> geopandas depends on fiona, and fiona depends on gdal. <<<<<<<<<<\n \
            >> To prevent the unavoidable pip installation fail, we excluded geopandas <\n \
            >>>>>> from the list of alpha-alpha package dependencies in Windows. <<<<<<\n \
            >>>>>>>> Before you can use Alpha Paradox, please install geopandas. <<<<<<<<\n \
            >>>> For more information, you can follow the instructions on this FAQ <<<<<\n \
            >>>>>>>>>>>>> https://alpha-community.github.io/alpha-alpha/faq.html <<<<<<<<<<<<<<\n"
        )
        raise


###########################################################################
### Basic Setups
## Qt backend setup is now opt-in.
##
## Historically this module always called ``__setup_Qt_backend()`` at
## import time, which forced ``import alpha_metal`` to drag in PySide6
## (PyQt6) and switch matplotlib's backend to ``QtAgg``. That's the
## right behavior for users running the desktop ``MetalGUI``, but it
## broke headless / Jupyter / Colab / Binder workflows where PySide6
## either isn't installed or shouldn't be used.
##
## The function is still here (renamed and public as
## ``setup_qt_backend``), but is no longer called on import. It is
## invoked automatically by ``MetalGUI.__init__`` so users running the
## desktop GUI don't have to think about it. Headless users — the
## ``qm.view(design)`` path — never trigger it.

_qt_backend_initialized = False


def setup_qt_backend():
    """Configure Qt application attributes and switch matplotlib to
    the ``QtAgg`` backend.

    Idempotent — safe to call multiple times; subsequent calls are
    no-ops. Called automatically by ``MetalGUI.__init__``. End users
    rarely need to call this directly.

    Set the ``QISKIT_METAL_HEADLESS`` environment variable to any
    non-empty value to skip the matplotlib-backend switch (useful in
    test runners and CI).
    """
    global _qt_backend_initialized
    if _qt_backend_initialized:
        return

    # When in vscode and in debug-mode, may want to comment
    # next line out, "os.environ["QT_API"] = "pyside2""
    os.environ["QT_API"] = "pyside6"

    from PySide6 import QtCore  # , QtWidgets
    from PySide6.QtCore import Qt

    def set_attribute(name: str, value=True):
        """Describes attributes that change the behavior of
        application-wide features."""
        if hasattr(Qt, name):
            attr = getattr(Qt, name)
            if not QtCore.QCoreApplication.testAttribute(attr) == value:
                QtCore.QCoreApplication.setAttribute(attr, value)

    if QtCore.QCoreApplication.instance() is None:
        # No application launched yet — set the global attributes
        # before the first QApplication is constructed.
        set_attribute("AA_ShareOpenGLContexts")
        set_attribute("AA_EnableHighDpiScaling")
        set_attribute("AA_UseHighDpiPixmaps")

    if not os.getenv("QISKIT_METAL_HEADLESS", None):
        import matplotlib as mpl

        mpl.use("QtAgg")
        import matplotlib.pyplot as plt

        plt.ion()  # interactive

    _qt_backend_initialized = True


## Setup logging
from alpha_metal import config
from alpha_metal.toolbox_python._logging import setup_logger

logger = setup_logger(
    "alpha", config.log.format, config.log.datefmt, capture_warnings=True
)  # type: logging.Logger
del setup_logger

###########################################################################
### User-accessible scope

# Alpha Dict
from alpha_metal.toolbox_python.attr_dict import Dict

# Due to order of imports
from alpha_metal._is_design import is_component, is_design

# Core modules for user to use
from alpha_metal.toolbox_metal.parsing import is_true
from alpha_metal import (
    analyses,
    designs,
    draw,
    qgeometries,
    qlibrary,
    renderers,
    toolbox_metal,
    toolbox_python,
)
from alpha_metal.qgeometries import QGeometryTables, is_qgeometry_table


# Alpha GUI and the matplotlib plotting helper are lazy attributes —
# importing them eagerly pulls in PySide6 (via ``_gui.main_window``)
# and Qt-tainted matplotlib helpers (via ``mpl_interaction``). For
# headless users running ``qm.view(design)`` from a script or Jupyter
# notebook, this means ``import alpha_metal`` no longer requires
# PySide6 to be installed.
#
# Access via ``qm.MetalGUI`` or ``qm.plt`` — both work as before, but
# only trigger the heavy import on first use.


def __getattr__(name):
    if name == "MetalGUI":
        try:
            from alpha_metal._gui.main_window import MetalGUI
            return MetalGUI
        except (ImportError, Exception):
            from alpha_metal.viewer.headless_gui import MetalGUIHeadless
            return MetalGUIHeadless
    if name in ("_gui", "gui"):
        import alpha_metal._gui as _gui_mod
        return _gui_mod
    if name == "plt":
        from alpha_metal.renderers.renderer_mpl import mpl_toolbox

        return mpl_toolbox
    raise AttributeError(f"module 'alpha_metal' has no attribute {name!r}")


# Utility functions
from alpha_metal.toolbox_python.display import Headings

# Common-use
from alpha_metal.qlibrary import QComponent

# Import default renderers
from alpha_metal.renderers import setup_renderers
from alpha_metal.toolbox_metal.about import about, open_docs

# Headless matplotlib viewer (``qm.view(design)``) — no Qt required.
# ``qm.gui(design)`` is a factory that returns either the Qt ``MetalGUI``
# or ``MetalGUIHeadless`` (Colab/Binder/no-display) so tutorial code
# (``gui.rebuild()``, ``gui.edit_component(...)``, ``gui.screenshot(...)``)
# runs unchanged in both environments.
from alpha_metal.viewer import MetalGUIHeadless, gui, show_inline, view
