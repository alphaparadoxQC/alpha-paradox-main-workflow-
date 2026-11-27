# Issue Tracker
## 1100-Qubit Quantum Processor Verification

**Date:** 2026-07-16 20:20:23  
**Total Issues:** 2  

---

### ISS-001: Geometry - Polygon Overlap

| Field | Value |
|---|---|
| **Id** | ISS-001 |
| **Category** | Geometry - Polygon Overlap |
| **Severity** | LOW |
| **Location** | Distributed across chip (bus resonator endpoints, qubit boundaries) |
| **Description** | 13104 overlapping polygon pairs detected on metal layer |
| **Reason** | Qiskit Metal RouteStraight endpoints overlap with TransmonPocket connection pad polygons. This is normal for pin-based routing. |
| **Fix** | Run polygon merge before tape-out to eliminate duplicates. Use: region.merge() in post-processing. |
| **Priority** | LOW (Cosmetic) |

---

### ISS-002: DRC - Layer Violation

| Field | Value |
|---|---|
| **Id** | ISS-002 |
| **Category** | DRC - Layer Violation |
| **Severity** | MEDIUM |
| **Location** | Air bridge trace regions overlapping base metal |
| **Description** | 2150 air bridge polygons overlap base metal layer |
| **Reason** | Air bridges are 3D structures spanning over CPW traces. In a 2D GDS projection, their footprints may overlap the metal layer below. |
| **Fix** | This is expected for 3D air bridges in 2D GDS. Add a process layer exclusion rule for the foundry. |
| **Priority** | LOW (Expected 3D projection artifact) |

---

