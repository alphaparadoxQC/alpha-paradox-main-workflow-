import gdspy
import tempfile
import os
import math

def generate_gdsii(components: list) -> str:
    """
    Takes a list of component payloads from the Alpha Paradox EDA UI
    and converts them into a standard GDSII file for fab.
    Returns the path to the generated .gds file.
    """
    # Create a new GDSII library
    lib = gdspy.GdsLibrary()
    
    # Create a top-level cell
    top_cell = lib.new_cell('ALPHA_CHIP_TOP')
    
    layer_metal = 1 # e.g., Niobium or Aluminum
    
    for comp in components:
        p = comp.get('params', {})
        pos_x = p.get('pos_x', 0)
        pos_y = p.get('pos_y', 0)
        ctype = comp.get('type')
        
        # Apply orientation if present
        orientation = p.get('orientation', 0)
        rotation_rad = math.radians(orientation)

        if ctype == 'transmon_cross':
            w = p.get('cross_width', 20)
            l = p.get('cross_length', 200)
            rect1 = gdspy.Rectangle((-w/2, -l/2), (w/2, l/2), layer=layer_metal)
            rect2 = gdspy.Rectangle((-l/2, -w/2), (l/2, w/2), layer=layer_metal)
            cross = gdspy.boolean(rect1, rect2, 'or', layer=layer_metal)
            cross.rotate(rotation_rad).translate(pos_x, pos_y)
            top_cell.add(cross)
            
        elif ctype == 'bond_pad':
            w = p.get('width', 250)
            h = p.get('height', 250)
            pad = gdspy.Rectangle((-w/2, -h/2), (w/2, h/2), layer=layer_metal)
            pad.rotate(rotation_rad).translate(pos_x, pos_y)
            top_cell.add(pad)
            
        elif ctype == 'cpw_straight':
            sx = p.get('start_x', 0)
            sy = p.get('start_y', 0)
            ex = p.get('end_x', 1000)
            ey = p.get('end_y', 0)
            tw = p.get('trace_width', 10)
            path = gdspy.FlexPath([(sx, sy), (ex, ey)], tw, layer=layer_metal)
            top_cell.add(path)
            
        # Can add more component types (fluxonium, meander, interdigitated_cap, etc.)

    # Save to a temporary file
    temp_fd, temp_path = tempfile.mkstemp(suffix='.gds', prefix='alpha_layout_')
    os.close(temp_fd)
    
    lib.write_gds(temp_path)
    return temp_path
