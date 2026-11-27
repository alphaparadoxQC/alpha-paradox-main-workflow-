import sys
sys.path.append('.')
from alpha_metal.designs import DesignPlanar
from alpha_metal.qlibrary.qubits.transmon_cross import TransmonCross

try:
    design = DesignPlanar()
    q1 = TransmonCross(design, 'Q1', options={'connection_pads': {'a': {}, 'b': {}}, '_default_connection_pads': {}})
    design.rebuild()
    print("Success!")
except Exception as e:
    import traceback
    traceback.print_exc()
