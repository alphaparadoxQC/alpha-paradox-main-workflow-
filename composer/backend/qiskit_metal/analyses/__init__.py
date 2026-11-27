"""
Qiskit Metal analyses compatibility shim.
Forwards all calls directly to alpha_metal.analyses.
"""
import sys
import alpha_metal.analyses as _analyses
from alpha_metal.analyses import *

sys.modules['qiskit_metal.analyses'] = sys.modules[__name__]

def __getattr__(name):
    return getattr(_analyses, name)

def __dir__():
    return dir(_analyses)
