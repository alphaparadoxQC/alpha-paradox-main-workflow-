"""
Qiskit Metal compatibility shim.
Forwards all calls directly to alpha_metal.
"""
import sys
import alpha_metal
__path__ = list(alpha_metal.__path__)
from alpha_metal import *
import alpha_metal.analyses as analyses
import alpha_metal.renderers as renderers
import alpha_metal.toolbox_metal as toolbox_metal
import alpha_metal.qgeometries as qgeometries
import alpha_metal._gui as _gui

sys.modules['qiskit_metal'] = sys.modules[__name__]
sys.modules['qiskit_metal.analyses'] = analyses
if hasattr(analyses, 'em'):
    sys.modules['qiskit_metal.analyses.em'] = analyses.em
    if hasattr(analyses.em, 'package_modes'):
        sys.modules['qiskit_metal.analyses.em.package_modes'] = analyses.em.package_modes
    if hasattr(analyses.em, 'multipoles'):
        sys.modules['qiskit_metal.analyses.em.multipoles'] = analyses.em.multipoles
if hasattr(analyses, 'fem'):
    sys.modules['qiskit_metal.analyses.fem'] = analyses.fem
    if hasattr(analyses.fem, 'solver'):
        sys.modules['qiskit_metal.analyses.fem.solver'] = analyses.fem.solver
sys.modules['qiskit_metal.renderers'] = renderers
sys.modules['qiskit_metal.toolbox_metal'] = toolbox_metal
sys.modules['qiskit_metal.qgeometries'] = qgeometries
sys.modules['qiskit_metal.qgeometries.qgeometries_handler'] = qgeometries.qgeometries_handler
sys.modules['qiskit_metal._gui'] = _gui
if hasattr(_gui, 'main_window'):
    sys.modules['qiskit_metal._gui.main_window'] = _gui.main_window

def __getattr__(name):
    if name == 'renderers':
        return renderers
    if name == 'analyses':
        return analyses
    if name == 'toolbox_metal':
        return toolbox_metal
    if name == 'qgeometries':
        return qgeometries
    if name in ('_gui', 'gui'):
        return _gui
    if name == 'MetalGUI':
        return getattr(_gui, 'MetalGUI', getattr(alpha_metal, 'MetalGUI', None))
    return getattr(alpha_metal, name)

def __dir__():
    return sorted(set(globals().keys()) | set(dir(alpha_metal)) | {'analyses', 'renderers', 'toolbox_metal', 'qgeometries', '_gui', 'gui', 'MetalGUI'})


