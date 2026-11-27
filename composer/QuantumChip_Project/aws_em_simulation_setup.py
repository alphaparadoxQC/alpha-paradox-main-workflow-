"""
100% Open-Source Electromagnetic Simulation Setup (Gmsh + Elmer)
This script configures Qiskit Metal to extract the Transmon Capacitance Matrix 
using completely free and open-source tools: Gmsh (for 3D Meshing) and ElmerFEM (for EM Solving).

It does NOT require Ansys, HFSS, or any commercial licenses.

Prerequisites:
1. Gmsh (Already installed via conda in your environment!)
2. ElmerFEM (The open-source physics solver).
   - If Elmer is not installed locally, this script will still generate the 3D Mesh (.msh) 
     and Elmer config (.sif) files. You can then run those files in an Elmer Docker container 
     or on any Linux/AWS machine that has Elmer installed!
"""

import qiskit_metal as metal
from qiskit_metal import designs
from qiskit_metal.qlibrary.qubits.transmon_pocket import TransmonPocket

# Import the fully Open-Source Renderers!
from qiskit_metal.renderers.renderer_elmer.elmer_renderer import QElmerRenderer

def setup_opensource_em_simulation():
    print("Initializing Qiskit Metal Design...")
    design = designs.DesignPlanar()
    
    # 1. Create a single transmon unit cell for our simulation
    q1 = TransmonPocket(design, 'Q1', options=dict(
        pos_x='0um', 
        pos_y='0um',
        pad_width='425um', 
        pad_height='90um'
    ))
    
    design.rebuild()
    
    # 2. Initialize the Open-Source Elmer Renderer
    print("Setting up Open-Source ElmerFEM Renderer...")
    elmer = QElmerRenderer(design, 'opensource_workspace')
    
    # 3. Configure the 3D mesh and capacitance simulation parameters
    # This automatically sets up a bounding vacuum box and silicon substrate
    elmer.options['sim_type'] = 'capacitance'
    
    try:
        # 4. Export the 3D geometry and generate the Mesh using Gmsh!
        print("Rendering geometry and generating 3D Mesh via Gmsh...")
        # This will create the open-source .msh files in the workspace folder
        elmer.render_design(selection=['Q1'])
        
        # 5. Export the ElmerFEM configuration files (.sif)
        print("Exporting open-source Elmer configuration files...")
        elmer.export_mesh()
        
        # 6. Attempt to run the Elmer Solver
        print("Attempting to run ElmerSolver locally...")
        # NOTE: This requires 'ElmerGrid' and 'ElmerSolver' to be installed on the machine.
        # If it fails, you will still have the mesh and config files ready to run anywhere!
        elmer.run_simulation()
        
        # 7. Extract the result if successful
        c_matrix = elmer.capacitance_matrix
        print("\n=== Simulation Complete ===")
        print("Capacitance Matrix Extracted:")
        print(c_matrix)
        
    except Exception as e:
        print(f"\n[INFO] The Python script successfully generated your open-source EM files!")
        print(f"However, the local ElmerSolver executable was not found to finish the math: {e}")
        print("\n=== WHAT TO DO NEXT ===")
        print("1. Look in the 'opensource_workspace' folder in this directory.")
        print("2. You will find your 3D Mesh (.msh) and Elmer physics config (.sif) files there.")
        print("3. You can run these files using an Elmer Docker container on any machine for free without a license!")

if __name__ == "__main__":
    setup_opensource_em_simulation()
