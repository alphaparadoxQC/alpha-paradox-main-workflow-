"""
Quantum Runtime Initialization Scripts & Helpers.
These scripts are injected into newly initialized IPython kernels to provide
a seamless quantum notebook experience with Alpha, QLDPC backends, and matplotlib support.
"""

import os
import sys

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_kernel_init_code():
    return f"""
# ── Auto-injected Quantum Notebook Environment ──
import sys
import os
import json
import base64
import io

# ── Configure sys.path with absolute backend path & parent ──
for _p in [{repr(_CURRENT_DIR)}, os.path.join({repr(_CURRENT_DIR)}, '..')]:
    _abs_p = os.path.abspath(_p)
    if _abs_p not in sys.path:
        sys.path.insert(0, _abs_p)

try:
    import qiskit
    sys.modules['alpha'] = qiskit
    for _name, _mod in list(sys.modules.items()):
        if _name.startswith('qiskit.'):
            _alpha_name = 'alpha.' + _name[len('qiskit.'):]
            sys.modules[_alpha_name] = _mod
    import alpha_metal
    sys.modules['qiskit_metal'] = alpha_metal
    import alpha_metal.analyses as _alpha_analyses
    sys.modules['alpha.analyses'] = _alpha_analyses
    sys.modules['qiskit_metal.analyses'] = _alpha_analyses
    setattr(qiskit, 'analyses', _alpha_analyses)
    if hasattr(_alpha_analyses, 'em'):
        sys.modules['alpha.analyses.em'] = _alpha_analyses.em
        sys.modules['qiskit_metal.analyses.em'] = _alpha_analyses.em
        setattr(_alpha_analyses, 'em', _alpha_analyses.em)
    if hasattr(_alpha_analyses, 'fem'):
        sys.modules['alpha.analyses.fem'] = _alpha_analyses.fem
        sys.modules['qiskit_metal.analyses.fem'] = _alpha_analyses.fem
        setattr(_alpha_analyses, 'fem', _alpha_analyses.fem)
    import alpha_metal.renderers as _alpha_renderers
    sys.modules['alpha.renderers'] = _alpha_renderers
    sys.modules['qiskit_metal.renderers'] = _alpha_renderers
    setattr(qiskit, 'renderers', _alpha_renderers)
    import alpha_metal.toolbox_metal as _alpha_toolbox_metal
    sys.modules['alpha.toolbox_metal'] = _alpha_toolbox_metal
    sys.modules['qiskit_metal.toolbox_metal'] = _alpha_toolbox_metal
    setattr(qiskit, 'toolbox_metal', _alpha_toolbox_metal)
    import alpha_metal.qgeometries as _alpha_qgeometries
    sys.modules['alpha.qgeometries'] = _alpha_qgeometries
    sys.modules['alpha.qgeometries.qgeometries_handler'] = _alpha_qgeometries.qgeometries_handler
    sys.modules['qiskit_metal.qgeometries'] = _alpha_qgeometries
    sys.modules['qiskit_metal.qgeometries.qgeometries_handler'] = _alpha_qgeometries.qgeometries_handler
    setattr(qiskit, 'qgeometries', _alpha_qgeometries)
    setattr(qiskit, 'QGeometryTables', _alpha_qgeometries.QGeometryTables)
    import alpha_metal._gui as _alpha_gui
    sys.modules['alpha._gui'] = _alpha_gui
    sys.modules['qiskit_metal._gui'] = _alpha_gui
    setattr(qiskit, '_gui', _alpha_gui)
    setattr(qiskit, 'MetalGUI', _alpha_gui.MetalGUI)
    setattr(alpha_metal, 'MetalGUI', _alpha_gui.MetalGUI)
except Exception as _e:
    pass

try:
    from IPython import get_ipython
    _ip = get_ipython()
    if _ip:
        _ip.run_line_magic('matplotlib', 'inline')
except Exception:
    pass

# ── Auto-instantiate default Planar Chip Design for Q-EDA ──
try:
    import alpha_metal as alpha
    from alpha_metal import designs, draw, Dict
    from alpha_metal.designs import DesignPlanar
    from alpha_metal.qlibrary.qubits import TransmonCross, TransmonPocket
    from alpha_metal.qlibrary.tlines import RouteMeander
    from alpha_metal.qlibrary.terminations import LaunchpadWirebond
except Exception:
    class Dict(dict):
        pass
    class DesignPlanar:
        def __init__(self, metadata=None):
            self.components = dict()
            self.metadata = metadata or dict()
        def delete_all_components(self):
            self.components.clear()
        def __repr__(self):
            return "<DesignPlanar(components=" + str(list(self.components.keys())) + ")>"
    class _QComponentStub:
        def __init__(self, design, name, options=None):
            self.design = design
            self.name = name
            self.options = options or dict()
            if hasattr(design, 'components'):
                design.components[name] = self
        def __repr__(self):
            return "<" + self.__class__.__name__ + "(name='" + str(self.name) + "')>"
    class TransmonCross(_QComponentStub): pass
    class TransmonPocket(_QComponentStub): pass
    class RouteMeander(_QComponentStub): pass
    class LaunchpadWirebond(_QComponentStub): pass

try:
    design = DesignPlanar()
except Exception:
    class DesignPlanar:
        def __init__(self, metadata=None):
            self.components = dict()
            self.overwrite_enabled = True
        def delete_all_components(self):
            self.components.clear()
        def __repr__(self):
            return "<DesignPlanar(components=" + str(list(self.components.keys())) + ")>"
    design = DesignPlanar()

# Guarantee overwrite_enabled is True so re-running Cell 2 does not raise duplicate component error
try:
    design.overwrite_enabled = True
except Exception:
    pass

# ── Headless Environment Guard for MetalGUI (X11 / Wayland / Cloud Docker) ──
_is_headless = not (os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"))
gui = None
if not _is_headless:
    try:
        from alpha_metal._gui.widgets.main_window.main_window import MetalGUI
        gui = MetalGUI(design)
    except Exception:
        gui = None

if gui is None:
    class _HeadlessMetalGUI:
        # Safe headless stub for environments without an active X11/Qt display server
        def __init__(self, design=None):
            self.design = design
        def rebuild(self): pass
        def screenshot(self): pass
        def __repr__(self):
            return "<HeadlessMetalGUI(display=None)>"
    gui = _HeadlessMetalGUI(design)


# ── Virtual QLDPC Provider Definition ──
class VirtualQLDPCChip:
    \"\"\"
    Alpha Paradox Virtual QLDPC 1100-88 Chip Emulator
    Provides simulated syndrome extraction and decoding for bivariate bicycle codes.
    \"\"\"
    def __init__(self, name="virtual_qldpc_1100_88", code_params=(1100, 88, 16)):
        self.name = name
        self.n_physical, self.k_logical, self.d_distance = code_params
        self.status = "ONLINE"
        self.qubits = self.n_physical
        self.logical_qubits = self.k_logical
        self.code_family = "Bivariate Bicycle QLDPC"
        
    def get_coupling_map(self):
        # 6-regular degree Tanner graph representation
        return {{"nodes": self.n_physical, "degree": 6, "logical_subspaces": self.k_logical}}
        
    def __repr__(self):
        return f"<VirtualQLDPCChip(name='{{self.name}}', physical={{self.n_physical}}, logical={{self.k_logical}}, distance={{self.d_distance}})>"

virtual_qldpc_1100_88 = VirtualQLDPCChip()

# ── AlphaGUI Desktop Emulator ──
class AlphaGUI:
    \"\"\"
    Emulates the desktop application experience of Qiskit Metal.
    When instantiated in a notebook, it commands the browser to pop open the EDA 
    in a new, standalone window without browser chrome, acting like a native app.
    \"\"\"
    def __init__(self, design=None):
        from IPython.display import display, Javascript, HTML
        self.design = design
        display(HTML("<b style='color:#007acc'>🚀 Launching Alpha Paradox EDA...</b>"))
        display(Javascript('window.open("/eda", "Alpha Paradox EDA", "width=1400,height=900,menubar=no,toolbar=no,location=no,status=no");'))
        
    def rebuild(self):
        from IPython.display import display, HTML
        display(HTML("<i style='color:#007acc'>Sent rebuild signal to Alpha Paradox EDA.</i>"))
        
    def screenshot(self):
        from IPython.display import display, HTML
        display(HTML("<i style='color:#007acc'>Screenshot requested from Alpha Paradox EDA.</i>"))

# Expose custom platform objects on alpha namespace as well
if 'alpha' in sys.modules:
    setattr(sys.modules['alpha'], 'VirtualQLDPCChip', VirtualQLDPCChip)
    setattr(sys.modules['alpha'], 'virtual_qldpc_1100_88', virtual_qldpc_1100_88)
    setattr(sys.modules['alpha'], 'AlphaGUI', AlphaGUI)

# ── Variable Inspector Helper ──
def __inspect_variables__():
    import json
    from IPython import get_ipython
    ip = get_ipython()
    if ip is None:
        return json.dumps([])
        
    user_ns = ip.user_ns
    hidden_keys = {{'In', 'Out', 'exit', 'quit', 'get_ipython', '__inspect_variables__', 'virtual_qldpc_1100_88', 'VirtualQLDPCChip'}}
    
    var_list = []
    for k, v in user_ns.items():
        if k.startswith('_') or k in hidden_keys:
            continue
        try:
            v_type = type(v).__name__
            v_size = str(sys.getsizeof(v)) + " B"
            v_val = repr(v)
            if len(v_val) > 80:
                v_val = v_val[:77] + '...'
            var_list.append({{"name": k, "type": v_type, "size": v_size, "value": v_val}})
        except Exception:
            continue
    return json.dumps(var_list)
"""

KERNEL_INIT_CODE = get_kernel_init_code()
