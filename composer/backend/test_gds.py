import sys
sys.path.append('.')
try:
    import alpha_metal
    from alpha_metal.designs import DesignPlanar
    from alpha_metal.qlibrary.qubits.transmon_cross import TransmonCross

    design = DesignPlanar()
    q1 = TransmonCross(design, 'Q1', options=dict(pos_x='0mm', pos_y='0mm'))
    design.rebuild()
    
    a_gds = design.renderers.gds
    a_gds.options['short_segments_to_not_polygon'] = 'True'
    a_gds.export_to_gds('test_export.gds')
    print("GDS exported successfully.")

except Exception as e:
    import traceback
    traceback.print_exc()
