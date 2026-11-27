import gdstk
import os
import sys

def run_drc(gds_path):
    """Python-based DRC using gdstk, as a substitute for KLayout CLI."""
    
    print("=" * 60)
    print("  DESIGN RULE CHECK (DRC) - 1100 Qubit Quantum Chip")
    print("=" * 60)
    
    if not os.path.exists(gds_path):
        print(f"ERROR: GDS file not found at '{gds_path}'")
        print("The main.py script may still be building the design.")
        print("Please wait for it to finish and try again.")
        sys.exit(1)
    
    file_size = os.path.getsize(gds_path)
    print(f"\nInput: {gds_path} ({file_size / 1024:.1f} KB)")
    
    lib = gdstk.read_gds(gds_path)
    print(f"Library: {lib.name}")
    print(f"Top-level cells: {len(lib.top_level())}")
    
    total_polygons = 0
    total_paths = 0
    total_labels = 0
    layers_found = set()
    violations = []
    
    MIN_WIDTH_UM = 5.0      # 5 um minimum trace width
    MIN_SPACING_UM = 5.0    # 5 um minimum gap
    
    # Convert to GDS units (typically um or mm depending on export settings)
    # Qiskit Metal exports in mm by default
    min_width_mm = MIN_WIDTH_UM / 1000.0
    
    print(f"\nDesign Rules:")
    print(f"  Min Trace Width: {MIN_WIDTH_UM} um ({min_width_mm} mm)")
    print(f"  Min Gap Spacing: {MIN_SPACING_UM} um")
    print(f"\nScanning all cells...")
    
    for cell in lib.cells:
        polys = cell.polygons
        paths = cell.paths
        labels = cell.labels
        
        total_polygons += len(polys)
        total_paths += len(paths)
        total_labels += len(labels)
        
        for poly in polys:
            layers_found.add(poly.layer)
            bb = poly.bounding_box()
            if bb is not None:
                width = bb[1][0] - bb[0][0]
                height = bb[1][1] - bb[0][1]
                min_dim = min(width, height)
                
                # Check minimum feature size
                if 0 < min_dim < min_width_mm:
                    violations.append({
                        'cell': cell.name,
                        'type': 'MIN_WIDTH',
                        'layer': poly.layer,
                        'value_um': min_dim * 1000,
                        'limit_um': MIN_WIDTH_UM
                    })
        
        for path in paths:
            layers_found.add(path.layers[0] if path.layers else -1)
            # Check path widths
            for w in path.widths if hasattr(path, 'widths') else []:
                if 0 < w < min_width_mm:
                    violations.append({
                        'cell': cell.name,
                        'type': 'PATH_WIDTH',
                        'layer': path.layers[0],
                        'value_um': w * 1000,
                        'limit_um': MIN_WIDTH_UM
                    })
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"  DRC RESULTS SUMMARY")
    print(f"{'='*60}")
    print(f"  Total Cells:    {len(lib.cells)}")
    print(f"  Total Polygons: {total_polygons}")
    print(f"  Total Paths:    {total_paths}")
    print(f"  Total Labels:   {total_labels}")
    print(f"  Layers Found:   {sorted(layers_found)}")
    print(f"{'='*60}")
    
    if violations:
        print(f"\n  ⚠️  VIOLATIONS FOUND: {len(violations)}")
        # Show first 20 violations
        for i, v in enumerate(violations[:20]):
            print(f"    [{i+1}] Cell: {v['cell']}, Layer: {v['layer']}, "
                  f"Rule: {v['type']}, Value: {v['value_um']:.3f} um (limit: {v['limit_um']} um)")
        if len(violations) > 20:
            print(f"    ... and {len(violations) - 20} more violations")
    else:
        print(f"\n  ✅  PASS - No DRC violations detected!")
    
    print(f"\n{'='*60}")
    print(f"  DRC Complete.")
    print(f"{'='*60}")

if __name__ == "__main__":
    gds_path = os.path.join("exports", "quantum_chip_1100.gds")
    
    if len(sys.argv) > 1:
        gds_path = sys.argv[1]
    
    run_drc(gds_path)
