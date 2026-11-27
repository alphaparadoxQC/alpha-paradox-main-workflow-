#!/usr/bin/env python3
"""
Qiskit Metal Headless High-Resolution Showcase Renderer
Renders the Qiskit Metal `DesignPlanar` components (DataFrames of Shapely geometries)
directly into high-DPI matplotlib figures showing both the full 1,100-qubit array
and a zoomed unit-cell intersection in Qiskit Metal's signature color scheme.
"""

import os
import sys
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.collections import PatchCollection
from shapely.geometry import Polygon, MultiPolygon, LineString

# Import our chip generator
from main import generate_1100_qubit_array

def render_qiskit_metal_showcase():
    out_dir = os.path.join("validation_output", "screenshots")
    os.makedirs(out_dir, exist_ok=True)
    artifacts_dir = "/Users/sourojitmondal/.gemini/antigravity-ide/brain/d297bb20-b248-4151-b990-5260c629fc52"
    
    print("=" * 80)
    print("  QISKIT METAL HEADLESS RENDERING ENGINE")
    print("  Building DesignPlanar across 1,100 Qubits...")
    print("=" * 80)

    # 1. Generate design using Qiskit Metal API
    design = generate_1100_qubit_array()
    
    print("\n[1/3] Extracting Qiskit Metal QGeometry tables (Poly & Path)...")
    poly_table = design.qgeometry.tables.get('poly', None)
    path_table = design.qgeometry.tables.get('path', None)
    
    if poly_table is None or len(poly_table) == 0:
        print("Error: Qiskit Metal poly table is empty.")
        return

    print(f"Loaded {len(poly_table)} poly geometries and {len(path_table) if path_table is not None else 0} path geometries from Qiskit Metal database.")

    # Layer color mapping (Qiskit Metal Theme)
    layer_colors = {
        1: '#1f77b4',    # Layer 1/10 Base Signal (Electric Blue)
        10: '#00d2ff',   # Layer 10/10 Airbridge Spans (Cyan)
        11: '#9467bd',   # Layer 11/10 Landing Pads (Purple)
        99: '#333333',   # Layer 1/99 NoCheese (Dark Gray)
        102: '#ff7f0e'   # Layer 1/102 Die Outline (Orange)
    }

    # -------------------------------------------------------------------------
    # Plot 1: Full Qiskit Metal 1,100-Qubit Array
    # -------------------------------------------------------------------------
    print("\n[2/3] Rendering Full Qiskit Metal Array (`qiskit_metal_full_array.png`)....")
    fig, ax = plt.subplots(figsize=(18, 11), dpi=300)
    ax.set_facecolor('#0d1117') # Dark theme like Qiskit Metal GUI
    fig.patch.set_facecolor('#0d1117')

    # Group polygons by layer for clean drawing order
    for layer_num in sorted(layer_colors.keys()):
        color = layer_colors[layer_num]
        sub_df = poly_table[poly_table['layer'] == layer_num] if 'layer' in poly_table.columns else poly_table
        
        patch_list = []
        for idx, row in sub_df.iterrows():
            geom = row['geometry']
            if geom.is_empty:
                continue
            if isinstance(geom, Polygon):
                patch_list.append(patches.Polygon(np.array(geom.exterior.coords), closed=True))
            elif isinstance(geom, MultiPolygon):
                for poly in geom.geoms:
                    patch_list.append(patches.Polygon(np.array(poly.exterior.coords), closed=True))
                    
        if patch_list:
            pc = PatchCollection(patch_list, facecolor=color, edgecolor=color, linewidth=0.1, alpha=0.9)
            ax.add_collection(pc)

    ax.set_aspect('equal')
    ax.autoscale_view()
    ax.set_title("Qiskit Metal DesignPlanar: 1,100-Qubit Superconducting Processor Core", color='white', fontsize=16, pad=15)
    ax.set_xlabel("X Coordinate (mm)", color='white', fontsize=12)
    ax.set_ylabel("Y Coordinate (mm)", color='white', fontsize=12)
    ax.tick_params(colors='white')
    for spine in ax.spines.values():
        spine.set_color('#30363d')

    full_png = os.path.join(out_dir, "qiskit_metal_full_array.png")
    plt.tight_layout()
    plt.savefig(full_png, facecolor=fig.get_facecolor(), edgecolor='none', dpi=300)
    plt.close(fig)
    print(f"  -> Saved Full Array Rendering: {full_png}")

    # Copy to artifacts directory
    if os.path.exists(artifacts_dir):
        import shutil
        shutil.copyfile(full_png, os.path.join(artifacts_dir, "qiskit_metal_full_array.png"))

    # -------------------------------------------------------------------------
    # Plot 2: Zoomed Qiskit Metal Unit Cell (3x3 Qubit Grid around Q1-Q3 & Q45-Q47)
    # -------------------------------------------------------------------------
    print("\n[3/3] Rendering Zoomed Qiskit Metal Unit Cell (`qiskit_metal_zoomed_cell.png`)...")
    fig, ax = plt.subplots(figsize=(14, 12), dpi=300)
    ax.set_facecolor('#0d1117')
    fig.patch.set_facecolor('#0d1117')

    for layer_num in sorted(layer_colors.keys()):
        color = layer_colors[layer_num]
        sub_df = poly_table[poly_table['layer'] == layer_num] if 'layer' in poly_table.columns else poly_table
        
        patch_list = []
        for idx, row in sub_df.iterrows():
            geom = row['geometry']
            if geom.is_empty:
                continue
            if isinstance(geom, Polygon):
                patch_list.append(patches.Polygon(np.array(geom.exterior.coords), closed=True))
            elif isinstance(geom, MultiPolygon):
                for poly in geom.geoms:
                    patch_list.append(patches.Polygon(np.array(poly.exterior.coords), closed=True))
                    
        if patch_list:
            pc = PatchCollection(patch_list, facecolor=color, edgecolor='white' if layer_num==1 else color, linewidth=0.3, alpha=0.92)
            ax.add_collection(pc)

    # Set bounding box around first 3x3 qubits (~ -14 mm to -12 mm X, -8 mm to -6 mm Y depending on layout coordinates)
    # Let's inspect coordinates of Q1 and Q46 to center the zoom box dynamically
    q1_poly = poly_table[poly_table['component'] == 'Q1'] if 'component' in poly_table.columns else None
    if q1_poly is not None and len(q1_poly) > 0:
        bounds = q1_poly.total_bounds
        cx, cy = (bounds[0] + bounds[2])/2.0, (bounds[1] + bounds[3])/2.0
        ax.set_xlim(cx - 1.2, cx + 1.2)
        ax.set_ylim(cy - 1.2, cy + 1.2)
    else:
        ax.set_xlim(-13.5, -11.5)
        ax.set_ylim(-8.5, -6.5)

    ax.set_aspect('equal')
    ax.set_title("Qiskit Metal Zoomed Unit Cell: Transmon Qubits & Direct Bus Resonators", color='white', fontsize=16, pad=15)
    ax.set_xlabel("X Coordinate (mm)", color='white', fontsize=12)
    ax.set_ylabel("Y Coordinate (mm)", color='white', fontsize=12)
    ax.tick_params(colors='white')
    for spine in ax.spines.values():
        spine.set_color('#30363d')

    zoomed_png = os.path.join(out_dir, "qiskit_metal_zoomed_cell.png")
    plt.tight_layout()
    plt.savefig(zoomed_png, facecolor=fig.get_facecolor(), edgecolor='none', dpi=300)
    plt.close(fig)
    print(f"  -> Saved Zoomed Unit Cell Rendering: {zoomed_png}")

    if os.path.exists(artifacts_dir):
        shutil.copyfile(zoomed_png, os.path.join(artifacts_dir, "qiskit_metal_zoomed_cell.png"))

    print("\n[PASS] Qiskit Metal showcase renderings exported successfully.")

if __name__ == "__main__":
    render_qiskit_metal_showcase()
