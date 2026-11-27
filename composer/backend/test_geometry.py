import sys
sys.path.append('.')
try:
    import alpha_metal
    from alpha_metal.designs import DesignPlanar
    from alpha_metal.qlibrary.qubits.transmon_cross import TransmonCross

    design = DesignPlanar()
    q1 = TransmonCross(design, 'Q1', options=dict(pos_x='0mm', pos_y='0mm'))
    design.rebuild()
    
    print("Poly keys:", design.qgeometry.tables['poly'].keys())
    # We want to extract the shapely polygons and convert them to simple coordinate lists for the frontend
    poly_df = design.qgeometry.tables['poly']
    paths_df = design.qgeometry.tables['path']
    
    print(poly_df[['component', 'name', 'geometry']].head())
    
    # Check if shapely is installed and how to get coordinates
    from shapely.geometry import Polygon, LineString
    
    coords = []
    for idx, row in poly_df.iterrows():
        geom = row['geometry']
        if isinstance(geom, Polygon):
            coords.append(list(geom.exterior.coords))
    print(f"Extracted {len(coords)} polygons.")

except Exception as e:
    print(f"Error: {e}")
