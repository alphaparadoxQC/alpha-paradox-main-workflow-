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
GUI (:mod:`alpha_metal._gui`)
=================================================

.. currentmodule:: alpha_metal._gui

GUI module, handles user interface.

The gui module is only loaded if right python qt module
(such as pyside or pyqt) can be found.


Main Window
---------------

.. autosummary::
    :toctree: .

    MetalGUI

"""

import logging
from alpha_metal import __version__

try:
    from alpha_metal._gui.main_window import MetalGUI, QMainWindowExtension
except Exception as _e:
    try:
        from alpha_metal.viewer.headless_gui import MetalGUIHeadless as MetalGUI
        QMainWindowExtension = None
    except Exception:
        MetalGUI = None
        QMainWindowExtension = None

from alpha_metal import config

if config.is_building_docs():

    # imported here for the docstrings
    from alpha_metal._gui.list_model_base import DynamicList
    from alpha_metal._gui.main_window_base import QMainWindowExtensionBase
    from alpha_metal._gui.main_window_base import QMainWindowBaseHandler
    from alpha_metal._gui.tree_view_base import QTreeView_Base
    from alpha_metal._gui.renderer_gds_gui import RendererGDSWidget
    from alpha_metal._gui.renderer_gds_model import RendererGDS_Model
    from alpha_metal._gui.elements_window import ElementsWindow
    from alpha_metal._gui.elements_window import ElementTableModel

    from alpha_metal._gui.widgets.all_components.table_view_all_components import (
        QTableView_AllComponents,
    )
    from alpha_metal._gui.widgets.all_components.table_model_all_components import (
        QTableModel_AllComponents,
    )
    from alpha_metal._gui.widgets.bases.dict_tree_base import BranchNode
    from alpha_metal._gui.widgets.bases.dict_tree_base import LeafNode
    from alpha_metal._gui.widgets.bases.dict_tree_base import QTreeModel_Base
    from alpha_metal._gui.widgets.bases.QWidget_PlaceholderText import (
        QWidget_PlaceholderText,
    )
    from alpha_metal._gui.widgets.edit_component.component_widget import (
        ComponentWidget,
    )
    from alpha_metal._gui.widgets.edit_component.table_model_options import (
        QTableModel_Options,
    )
    from alpha_metal._gui.widgets.edit_component.table_view_options import (
        QTableView_Options,
    )
    from alpha_metal._gui.widgets.edit_component.tree_model_options import (
        QTreeModel_Options,
    )
    from alpha_metal._gui.widgets.edit_component.tree_view_options import (
        QTreeView_Options,
    )
    from alpha_metal._gui.widgets.log_widget.log_metal import QTextEditLogger
    from alpha_metal._gui.widgets.log_widget.log_metal import LogHandler_for_QTextLog
    from alpha_metal._gui.widgets.plot_widget.plot_window import QMainWindowPlot
    from alpha_metal._gui.widgets.variable_table.prop_val_table_gui import (
        PropertyTableWidget,
    )
    from alpha_metal._gui.widgets.variable_table.prop_val_table_model import (
        PropValTable,
    )
    from alpha_metal._gui.widgets.variable_table.right_click_table_view import (
        RightClickView,
    )

    from alpha_metal._gui.utility import _handle_qt_messages
    from alpha_metal._gui.utility import _toolbox_qt
    from alpha_metal._gui.widgets.bases import dict_tree_base
    from alpha_metal._gui.widgets.edit_component import component_widget
    from alpha_metal._gui.widgets.edit_component import table_model_options
    from alpha_metal._gui.widgets.edit_component import tree_model_options
