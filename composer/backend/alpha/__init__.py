"""
Alpha Quantum SDK — Facade for Alpha Paradox Quantum Platform.
Transparently maps Alpha Quantum APIs to Qiskit with extended platform capabilities and Alpha Metal analyses.
"""
import sys
import importlib
import qiskit
from qiskit import *

import alpha_metal

# Inherit submodule search paths from qiskit and alpha_metal so that
# `alpha.circuit`, `alpha.quantum_info`, `alpha._gui`, `alpha.qgeometries`, etc.
# resolve dynamically to their counterparts.
__path__ = list(qiskit.__path__) + list(alpha_metal.__path__)


# Ensure alpha is registered in sys.modules
sys.modules['alpha'] = sys.modules[__name__]

try:
    import alpha_metal.analyses as _alpha_analyses
    sys.modules['alpha.analyses'] = _alpha_analyses
    sys.modules['qiskit_metal.analyses'] = _alpha_analyses
    if hasattr(_alpha_analyses, 'em'):
        sys.modules['alpha.analyses.em'] = _alpha_analyses.em
        sys.modules['qiskit_metal.analyses.em'] = _alpha_analyses.em
        if hasattr(_alpha_analyses.em, 'package_modes'):
            sys.modules['alpha.analyses.em.package_modes'] = _alpha_analyses.em.package_modes
            sys.modules['qiskit_metal.analyses.em.package_modes'] = _alpha_analyses.em.package_modes
        if hasattr(_alpha_analyses.em, 'multipoles'):
            sys.modules['alpha.analyses.em.multipoles'] = _alpha_analyses.em.multipoles
            sys.modules['qiskit_metal.analyses.em.multipoles'] = _alpha_analyses.em.multipoles
    if hasattr(_alpha_analyses, 'fem'):
        sys.modules['alpha.analyses.fem'] = _alpha_analyses.fem
        sys.modules['qiskit_metal.analyses.fem'] = _alpha_analyses.fem
        if hasattr(_alpha_analyses.fem, 'solver'):
            sys.modules['alpha.analyses.fem.solver'] = _alpha_analyses.fem.solver
            sys.modules['qiskit_metal.analyses.fem.solver'] = _alpha_analyses.fem.solver
except Exception:
    _alpha_analyses = None

try:
    import alpha_metal.renderers as _alpha_renderers
    sys.modules['alpha.renderers'] = _alpha_renderers
    sys.modules['qiskit_metal.renderers'] = _alpha_renderers
except Exception:
    _alpha_renderers = None

try:
    import alpha_metal.toolbox_metal as _alpha_toolbox_metal
    sys.modules['alpha.toolbox_metal'] = _alpha_toolbox_metal
    sys.modules['qiskit_metal.toolbox_metal'] = _alpha_toolbox_metal
except Exception:
    _alpha_toolbox_metal = None

try:
    import alpha_metal.qgeometries as _alpha_qgeometries
    sys.modules['alpha.qgeometries'] = _alpha_qgeometries
    sys.modules['alpha.qgeometries.qgeometries_handler'] = _alpha_qgeometries.qgeometries_handler
    sys.modules['qiskit_metal.qgeometries'] = _alpha_qgeometries
    sys.modules['qiskit_metal.qgeometries.qgeometries_handler'] = _alpha_qgeometries.qgeometries_handler
except Exception:
    _alpha_qgeometries = None

try:
    import alpha_metal._gui as _alpha_gui
    sys.modules['alpha._gui'] = _alpha_gui
    if hasattr(_alpha_gui, 'main_window'):
        sys.modules['alpha._gui.main_window'] = _alpha_gui.main_window
    sys.modules['qiskit_metal._gui'] = _alpha_gui
    if hasattr(_alpha_gui, 'main_window'):
        sys.modules['qiskit_metal._gui.main_window'] = _alpha_gui.main_window
except Exception:
    _alpha_gui = None

def __getattr__(name):
    """Fallback attribute lookup to alpha_metal or qiskit."""
    if name == 'analyses':
        if _alpha_analyses is not None:
            return _alpha_analyses
        import alpha_metal.analyses as analyses_mod
        return analyses_mod
    if name == 'renderers':
        if _alpha_renderers is not None:
            return _alpha_renderers
        import alpha_metal.renderers as renderers_mod
        return renderers_mod
    if name == 'toolbox_metal':
        if _alpha_toolbox_metal is not None:
            return _alpha_toolbox_metal
        import alpha_metal.toolbox_metal as tm_mod
        return tm_mod
    if name == 'qgeometries':
        if _alpha_qgeometries is not None:
            return _alpha_qgeometries
        import alpha_metal.qgeometries as qg_mod
        return qg_mod
    if name == 'QGeometryTables':
        from alpha_metal.qgeometries import QGeometryTables
        return QGeometryTables
    if name in ('_gui', 'gui'):
        if _alpha_gui is not None:
            return _alpha_gui
        import alpha_metal._gui as gui_mod
        return gui_mod
    if name == 'MetalGUI':
        if _alpha_gui is not None and hasattr(_alpha_gui, 'MetalGUI'):
            return _alpha_gui.MetalGUI
        from alpha_metal._gui import MetalGUI
        return MetalGUI
    try:
        return getattr(qiskit, name)
    except AttributeError:
        raise AttributeError(f"module 'alpha' has no attribute '{name}'")

def __dir__():
    return sorted(set(globals().keys()) | set(dir(qiskit)) | {'analyses', 'renderers', 'toolbox_metal', 'qgeometries', 'QGeometryTables', '_gui', 'gui', 'MetalGUI'})


