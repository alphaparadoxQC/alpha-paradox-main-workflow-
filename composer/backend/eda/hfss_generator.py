import json
import uuid

def generate_hfss_script(components: list) -> str:
    """
    Takes a list of component payloads from the EDA UI and generates
    a Python script using the pyEPR/Ansys AEDT API to build the 3D model in HFSS.
    Returns the generated python script as a string.
    """
    
    script_lines = [
        "import pyEPR as epr",
        "import pyaedt",
        "",
        "# Connect to Ansys Desktop",
        "hfss = pyaedt.Hfss(specified_version='2024.1', non_graphical=True)",
        "hfss.insert_design('Alpha_Paradox_QPU')",
        "modeler = hfss.modeler",
        ""
    ]
    
    for i, comp in enumerate(components):
        ctype = comp.get('type')
        p = comp.get('params', {})
        cid = comp.get('id', f'comp_{i}')
        
        script_lines.append(f"# Generating {ctype} ({cid})")
        
        if ctype == 'transmon_cross':
            w = p.get('cross_width', 20)
            l = p.get('cross_length', 200)
            x = p.get('pos_x', 0)
            y = p.get('pos_y', 0)
            # Simplistic HFSS 3D object generation commands
            script_lines.append(f"modeler.create_rectangle(csPlane=hfss.PLANE.XY, position=[{x-w/2}, {y-l/2}, 0], dimension_list=[{w}, {l}], name='{cid}_rect1', matname='pec')")
            script_lines.append(f"modeler.create_rectangle(csPlane=hfss.PLANE.XY, position=[{x-l/2}, {y-w/2}, 0], dimension_list=[{l}, {w}], name='{cid}_rect2', matname='pec')")
            script_lines.append(f"modeler.unite(['{cid}_rect1', '{cid}_rect2'])")
        elif ctype == 'bond_pad':
            w = p.get('width', 250)
            h = p.get('height', 250)
            x = p.get('pos_x', 0)
            y = p.get('pos_y', 0)
            script_lines.append(f"modeler.create_rectangle(csPlane=hfss.PLANE.XY, position=[{x-w/2}, {y-h/2}, 0], dimension_list=[{w}, {h}], name='{cid}_pad', matname='pec')")
        elif ctype == 'cpw_straight':
            sx = p.get('start_x', 0)
            sy = p.get('start_y', 0)
            ex = p.get('end_x', 1000)
            ey = p.get('end_y', 0)
            tw = p.get('trace_width', 10)
            script_lines.append(f"modeler.create_polyline([[ {sx}, {sy}, 0 ], [ {ex}, {ey}, 0 ]], name='{cid}_trace', matname='pec')")
            # In a real pyEPR script, we'd extrude or sweep the profile for the trace
        
        script_lines.append("")
    
    script_lines.append("# Setup Eigenmode Simulation")
    script_lines.append("setup = hfss.create_setup('Setup1')")
    script_lines.append("setup.props['MinimumFrequency'] = '4GHz'")
    script_lines.append("setup.props['NumModes'] = 4")
    script_lines.append("hfss.analyze_setup('Setup1')")
    script_lines.append("")
    script_lines.append("# Extract Energy Participation Ratios (EPR)")
    script_lines.append("eprd = epr.DistributedAnalysis(hfss)")
    script_lines.append("eprd.do_EPR_analysis()")
    script_lines.append("print('HFSS Simulation Complete')")

    return "\n".join(script_lines)
