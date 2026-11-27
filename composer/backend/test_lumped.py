import sys
sys.path.append('.')
from alpha_metal.designs import DesignPlanar
from alpha_metal.qlibrary.lumped.cap_n_interdigital import CapNInterdigital
design = DesignPlanar()
q1 = CapNInterdigital(design, 'Q1')
print("Successfully initialized!")
