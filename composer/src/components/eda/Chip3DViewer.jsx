import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useEdaStore } from '../../stores/edaStore';
import { getMaterialVisuals, getComponentVisuals, COMPONENT_ROLE_PALETTE } from './edaColors';

// ─── Mathematical Helpers (Matrix & Vector) ─────────────────────────────────

function mat4Perspective(fovyRad, aspect, near, far) {
  const f = 1.0 / Math.tan(fovyRad / 2);
  const rangeInv = 1.0 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ]);
}

function mat4LookAt(eye, target, up) {
  let z0 = eye[0] - target[0], z1 = eye[1] - target[1], z2 = eye[2] - target[2];
  let len = Math.hypot(z0, z1, z2) || 1;
  z0 /= len; z1 /= len; z2 /= len;

  let x0 = up[1] * z2 - up[2] * z1;
  let x1 = up[2] * z0 - up[0] * z2;
  let x2 = up[0] * z1 - up[1] * z0;
  len = Math.hypot(x0, x1, x2) || 1;
  x0 /= len; x1 /= len; x2 /= len;

  let y0 = z1 * x2 - z2 * x1;
  let y1 = z2 * x0 - z0 * x2;
  let y2 = z0 * x1 - z1 * x0;

  return new Float32Array([
    x0, y0, z0, 0,
    x1, y1, z1, 0,
    x2, y2, z2, 0,
    -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]),
    -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]),
    -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]),
    1
  ]);
}

function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + j] * b[i * 4 + k];
      }
      out[i * 4 + j] = sum;
    }
  }
  return out;
}

function mat3FromMat4(m) {
  return new Float32Array([
    m[0], m[1], m[2],
    m[4], m[5], m[6],
    m[8], m[9], m[10]
  ]);
}

// ─── Ear-Clipping Polygon Triangulation ──────────────────────────────────────

function triangulatePolygon(pts) {
  if (!pts || pts.length < 3) return { vertices: [], triangles: [] };
  let vertices = pts.slice();
  const n = vertices.length;
  if (vertices[0][0] === vertices[n - 1][0] && vertices[0][1] === vertices[n - 1][1]) {
    vertices.pop();
  }
  const V = vertices.length;
  if (V < 3) return { vertices: [], triangles: [] };

  // Compute signed area
  let area = 0;
  for (let i = 0; i < V; i++) {
    const j = (i + 1) % V;
    area += vertices[i][0] * vertices[j][1] - vertices[j][0] * vertices[i][1];
  }
  let indices = [];
  for (let i = 0; i < V; i++) indices.push(i);
  if (area < 0) indices.reverse();

  function isPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const v0x = cx - ax, v0y = cy - ay;
    const v1x = bx - ax, v1y = by - ay;
    const v2x = px - ax, v2y = py - ay;
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01 || 1e-12);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    return u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6;
  }

  function isEar(i0, i1, i2, remaining) {
    const p0 = vertices[i0], p1 = vertices[i1], p2 = vertices[i2];
    const cross = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
    if (cross <= 0) return false;
    for (let i = 0; i < remaining.length; i++) {
      const idx = remaining[i];
      if (idx === i0 || idx === i1 || idx === i2) continue;
      const pt = vertices[idx];
      if (isPointInTriangle(pt[0], pt[1], p0[0], p0[1], p1[0], p1[1], p2[0], p2[1])) {
        return false;
      }
    }
    return true;
  }

  const triangles = [];
  let remaining = indices.slice();
  let attempts = 0;
  const maxAttempts = remaining.length * 3;

  while (remaining.length > 3 && attempts < maxAttempts) {
    let earFound = false;
    for (let i = 0; i < remaining.length; i++) {
      const prev = remaining[(i - 1 + remaining.length) % remaining.length];
      const curr = remaining[i];
      const next = remaining[(i + 1) % remaining.length];
      if (isEar(prev, curr, next, remaining)) {
        triangles.push([prev, curr, next]);
        remaining.splice(i, 1);
        earFound = true;
        break;
      }
    }
    if (!earFound) break;
    attempts++;
  }

  if (remaining.length >= 3) {
    for (let i = 1; i < remaining.length - 1; i++) {
      triangles.push([remaining[0], remaining[i], remaining[i + 1]]);
    }
  }

  return { vertices, triangles };
}

function parseWktCoords(geoStr) {
  if (!geoStr) return [];
  const inner = geoStr
    .replace(/^[A-Z]+\s*\(/, '')
    .replace(/^[A-Z]+\s*\(\(/, '')
    .replace(/\)+$/, '')
    .replace(/^\(/, '');
  if (!inner) return [];
  return inner.split(',').map(s => {
    const parts = s.trim().split(/\s+/);
    return [parseFloat(parts[0]), parseFloat(parts[1])];
  });
}

// ─── Shaders ─────────────────────────────────────────────────────────────────

const VS_SOURCE = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec4 a_color;
attribute vec3 a_emData; // x: u_E, y: u_H, z: eprLoss

uniform mat4 u_mvpMatrix;
uniform mat4 u_modelViewMatrix;
uniform mat3 u_normalMatrix;

varying vec4 v_color;
varying vec3 v_normal;
varying vec3 v_posEye;
varying vec3 v_posWorld;
varying vec3 v_emData;

void main() {
  vec4 posEye = u_modelViewMatrix * vec4(a_position, 1.0);
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
  v_posEye = posEye.xyz;
  v_posWorld = a_position;
  v_normal = normalize(u_normalMatrix * a_normal);
  v_color = a_color;
  v_emData = a_emData;
}
`;

const FS_SOURCE = `
precision mediump float;

varying vec4 v_color;
varying vec3 v_normal;
varying vec3 v_posEye;
varying vec3 v_posWorld;
varying vec3 v_emData;

uniform vec3 u_lightDir;
uniform float u_specularStrength;
uniform float u_ambientLight;
uniform int u_emMode; // 0: PBR, 1: Electric Energy (u_E), 2: Magnetic Energy (u_H), 3: EPR Loss
uniform float u_time;
uniform vec2 u_sources[16];
uniform int u_numSources;

// Jet / Turbo Rainbow Colormap for u_E Electric Energy Density
vec3 getTurboHeatmap(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.04, 0.08, 0.42);  // Low / Cold Blue
  vec3 c1 = vec3(0.05, 0.65, 0.90);  // Cyan
  vec3 c2 = vec3(0.18, 0.88, 0.32);  // Green
  vec3 c3 = vec3(0.98, 0.82, 0.12);  // Yellow
  vec3 c4 = vec3(0.95, 0.12, 0.10);  // Peak Hotspot Red
  if (t < 0.25) return mix(c0, c1, t / 0.25);
  if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
  if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
  return mix(c3, c4, (t - 0.75) / 0.25);
}

// Magnetic Plasma Colormap for u_H Magnetic Energy Density (Deep Indigo -> Purple -> Magenta -> White)
vec3 getMagneticPlasma(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.04, 0.06, 0.22);
  vec3 c1 = vec3(0.35, 0.08, 0.55);
  vec3 c2 = vec3(0.78, 0.16, 0.62);
  vec3 c3 = vec3(0.98, 0.48, 0.30);
  vec3 c4 = vec3(1.00, 0.96, 0.88);
  if (t < 0.25) return mix(c0, c1, t / 0.25);
  if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
  if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
  return mix(c3, c4, (t - 0.75) / 0.25);
}

// EPR / Dielectric Loss Colormap (Dark Blue-Grey -> Amber -> Fiery Glow)
vec3 getLossColormap(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.06, 0.08, 0.14);
  vec3 c1 = vec3(0.10, 0.30, 0.38);
  vec3 c2 = vec3(0.85, 0.46, 0.08);
  vec3 c3 = vec3(0.96, 0.22, 0.05);
  vec3 c4 = vec3(1.00, 0.86, 0.22);
  if (t < 0.25) return mix(c0, c1, t / 0.25);
  if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
  if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
  return mix(c3, c4, (t - 0.75) / 0.25);
}

void main() {
  vec3 norm = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  vec3 viewDir = normalize(-v_posEye);

  // Diffuse
  float diff = max(dot(norm, lightDir), 0.0);

  // Blinn-Phong Specular
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(norm, halfDir), 0.0), 32.0) * u_specularStrength;

  // Subtle rim lighting
  float rim = 1.0 - max(dot(norm, viewDir), 0.0);
  rim = pow(rim, 3.0) * 0.22;

  vec3 baseRgb = v_color.rgb * (u_ambientLight + diff * (1.0 - u_ambientLight)) + vec3(spec + rim);

  if (u_emMode == 0) {
    gl_FragColor = vec4(baseRgb, v_color.a);
    return;
  }

  // Calculate Euclidean distance to nearest active circuit component source
  float minDist = 999.0;
  for (int k = 0; k < 16; k++) {
    if (k >= u_numSources) break;
    float d = distance(v_posWorld.xy, u_sources[k]);
    if (d < minDist) {
      minDist = d;
    }
  }
  if (u_numSources == 0) {
    minDist = length(v_posWorld.xy);
  }

  // Physical RF standing wave & phase animation along component nodes
  float phaseWave = 0.5 + 0.5 * cos(minDist * 16.0 - u_time * 3.5);

  if (u_emMode == 1) {
    // Electric Energy Density u_E = 1/4 eps |E|^2
    // True edge singularity crowding, capacitor claw gaps & CPW slot fields
    float baseUE = v_emData.x;
    float fringeField = exp(-minDist * 3.0) * 0.35;
    float totalUE = clamp(baseUE * 0.82 + fringeField * 0.18 + (baseUE > 0.35 ? (phaseWave * 0.10) : 0.0), 0.0, 1.0);

    vec3 heatmap = getTurboHeatmap(totalUE);
    vec3 finalRgb = mix(baseRgb * 0.18, heatmap, 0.88);
    gl_FragColor = vec4(finalRgb, v_color.a);

  } else if (u_emMode == 2) {
    // Magnetic Energy Density u_H = 1/4 mu |H|^2
    // High at CPW center traces, Josephson junctions, TSVs, Indium micro-bumps
    float baseUH = v_emData.y;
    float currentMod = (baseUH > 0.25) ? (0.85 + 0.15 * phaseWave) : 0.15;
    float totalUH = clamp(baseUH * currentMod, 0.0, 1.0);

    vec3 magColor = getMagneticPlasma(totalUH);
    vec3 finalRgb = mix(baseRgb * 0.20, magColor, 0.85);
    gl_FragColor = vec4(finalRgb, v_color.a);

  } else if (u_emMode == 3) {
    // EPR (Energy Participation Ratio) & Interface TLS Dielectric Loss
    // Concentrated at substrate-air, metal-substrate interfaces and Josephson junctions
    float baseEPR = v_emData.z;
    float totalEPR = clamp(baseEPR, 0.0, 1.0);

    vec3 lossColor = getLossColormap(totalEPR);
    vec3 finalRgb = mix(baseRgb * 0.22, lossColor, 0.85);
    gl_FragColor = vec4(finalRgb, v_color.a);
  }
}
`;

// ─── Chip3DViewer Component ──────────────────────────────────────────────────

export default function Chip3DViewer() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const components = useEdaStore(s => s.components);
  const chips = useEdaStore(s => s.chips);
  const serverQg = useEdaStore(s => s.server_qgeometry);
  const getQGeometry = useEdaStore(s => s.getQGeometry);
  const selectedComponentId = useEdaStore(s => s.selectedComponentId);
  const selectComponent = useEdaStore(s => s.selectComponent);
  const netlist = useEdaStore(s => s.netlist);

  // View state
  const [camera, setCamera] = useState({
    distance: 14,          // mm from target
    azimuth: Math.PI / 4,  // 45 deg
    elevation: Math.PI / 5,// 36 deg
    target: [0, 0, 0]      // center
  });

  const [zScale, setZScale] = useState(8); // Z vertical exaggeration
  const [stackExplode, setStackExplode] = useState(1.5); // Multi-chip stack separation factor

  // 3D Integration Technology Toggles
  const [showSubstrate, setShowSubstrate] = useState(true);
  const [showMetal, setShowMetal] = useState(true);
  const [showPockets, setShowPockets] = useState(true);
  const [showJunctions, setShowJunctions] = useState(true);
  const [showAirbridges, setShowAirbridges] = useState(true);
  const [showWirebonds, setShowWirebonds] = useState(true);
  const [showTSVs, setShowTSVs] = useState(true);
  const [showMicroBumps, setShowMicroBumps] = useState(true);
  const [showHybridBonding, setShowHybridBonding] = useState(false);
  const [showMultiChipStack, setShowMultiChipStack] = useState(true);
  const [showRDL, setShowRDL] = useState(true);
  const [showInterconnects, setShowInterconnects] = useState(true);

  // 3D Connectivity & Waveguide Toggles (Clean, clutter-free defaults)
  const [showPins, setShowPins] = useState(true);
  const [showNets, setShowNets] = useState(false);
  const [showPinBadges, setShowPinBadges] = useState(false);
  const [thickTraces, setThickTraces] = useState(true);
  const [bgTheme, setBgTheme] = useState('white'); // 'white' | 'dark'

  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const emMode = useEdaStore(s => s.viewer3DEmMode) ?? 0;
  const setEmMode = useEdaStore(s => s.setViewer3DEmMode);
  const setActiveCanvasTab = useEdaStore(s => s.setActiveCanvasTab);

  const isDraggingRef = useRef(false);
  const dragModeRef = useRef('orbit'); // 'orbit' | 'pan'
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Merge local & server QGeometry
  const localQg = useMemo(() => (getQGeometry ? getQGeometry() : { path: [], poly: [], junction: [], pins: {} }), [getQGeometry, components]);
  const qg = useMemo(() => {
    if (!serverQg) return localQg;
    const serverComps = new Set([
      ...(serverQg.poly || []).map(g => g.component),
      ...(serverQg.path || []).map(g => g.component),
      ...(serverQg.junction || []).map(g => g.component)
    ]);
    return {
      poly: [...(serverQg.poly || []), ...(localQg.poly || []).filter(g => !serverComps.has(g.component))],
      path: [...(serverQg.path || []), ...(localQg.path || []).filter(g => !serverComps.has(g.component))],
      junction: [...(serverQg.junction || []), ...(localQg.junction || []).filter(g => !serverComps.has(g.component))],
      pins: { ...(localQg.pins || {}), ...(serverQg.pins || {}) }
    };
  }, [serverQg, localQg]);

  // Chip Dimensions (in mm)
  const chipDim = useMemo(() => {
    const parse = useEdaStore.getState().parseValue || (v => parseFloat(v) || 0);
    const mainChip = chips?.main || {};
    const qChip = chips?.Q_chip || chips?.C_chip || {};
    const w = (parse(mainChip.size_x || '10mm') || 10000) / 1000;
    const h = (parse(mainChip.size_y || '10mm') || 10000) / 1000;
    const d = Math.abs((parse(mainChip.size_z || '-500um') || 500) / 1000);
    const qw = (parse(qChip.size_x || '7.8mm') || (w * 0.82 * 1000)) / 1000;
    const qh = (parse(qChip.size_y || '5.2mm') || (h * 0.82 * 1000)) / 1000;
    const qd = Math.abs((parse(qChip.size_z || '300um') || 300) / 1000);
    return { w, h, d, qw, qh, qd };
  }, [chips]);

  // Preset Views
  const setPreset = useCallback((type) => {
    setCamera(c => {
      if (type === 'isometric') return { ...c, azimuth: Math.PI / 4, elevation: Math.PI / 5.5 };
      if (type === 'top') return { ...c, azimuth: 0, elevation: Math.PI / 2.05 };
      if (type === 'side') return { ...c, azimuth: 0, elevation: 0.08 };
      if (type === 'reset') return { distance: Math.max(chipDim.w, chipDim.h) * 1.5, azimuth: Math.PI / 4, elevation: Math.PI / 5.5, target: [0, 0, 0] };
      return c;
    });
  }, [chipDim]);

  // Initial Auto-Fit camera
  useEffect(() => {
    const initialDist = Math.max(chipDim.w, chipDim.h) * 1.5;
    setCamera(c => ({ ...c, distance: initialDist }));
  }, [chipDim]);

  // ─── Mouse / Pointer Interaction ──────────────────────────────────────────

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    dragModeRef.current = (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit';
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    if (e.currentTarget) e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    if (dragModeRef.current === 'orbit') {
      setCamera(c => {
        let newAzimuth = c.azimuth - dx * 0.008;
        let newElevation = Math.max(0.04, Math.min(Math.PI / 2.02, c.elevation + dy * 0.008));
        return { ...c, azimuth: newAzimuth, elevation: newElevation };
      });
    } else {
      setCamera(c => {
        const panSpeed = (c.distance * 0.0012);
        const cosA = Math.cos(c.azimuth);
        const sinA = Math.sin(c.azimuth);
        const rightX = -sinA;
        const rightY = cosA;
        const upX = -cosA * Math.sin(c.elevation);
        const upY = -sinA * Math.sin(c.elevation);

        return {
          ...c,
          target: [
            c.target[0] - (rightX * dx + upX * -dy) * panSpeed,
            c.target[1] - (rightY * dx + upY * -dy) * panSpeed,
            c.target[2]
          ]
        };
      });
    }
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    try {
      if (e.currentTarget) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) { }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    setCamera(c => ({
      ...c,
      distance: Math.max(1.0, Math.min(120, c.distance * zoomFactor))
    }));
  };

  // ─── Build 3D Mesh Geometry ───────────────────────────────────────────────

  const sceneMesh = useMemo(() => {
    const positions = [];
    const normals = [];
    const colors = [];
    const emData = []; // [u_E, u_H, eprLoss]

    function addTriangle(p1, p2, p3, n, color, em = [0.08, 0.04, 0.02]) {
      positions.push(...p1, ...p2, ...p3);
      normals.push(...n, ...n, ...n);
      colors.push(...color, ...color, ...color);
      if (Array.isArray(em[0])) {
        emData.push(...em[0], ...em[1], ...em[2]);
      } else {
        emData.push(...em, ...em, ...em);
      }
    }

    function addQuad(p1, p2, p3, p4, n, color, em = [0.08, 0.04, 0.02]) {
      if (Array.isArray(em[0])) {
        addTriangle(p1, p2, p3, n, color, [em[0], em[1], em[2]]);
        addTriangle(p1, p3, p4, n, color, [em[0], em[2], em[3]]);
      } else {
        addTriangle(p1, p2, p3, n, color, em);
        addTriangle(p1, p3, p4, n, color, em);
      }
    }

    function addCylinder(cx, cy, z0, z1, radius, nSegs, color, em = [0.45, 0.75, 0.25]) {
      for (let i = 0; i < nSegs; i++) {
        const a0 = (2 * Math.PI * i) / nSegs;
        const a1 = (2 * Math.PI * (i + 1)) / nSegs;
        const x0 = cx + radius * Math.cos(a0);
        const y0 = cy + radius * Math.sin(a0);
        const x1 = cx + radius * Math.cos(a1);
        const y1 = cy + radius * Math.sin(a1);
        const midA = (a0 + a1) / 2;
        const nx = Math.cos(midA);
        const ny = Math.sin(midA);
        addQuad([x0, y0, z0], [x1, y1, z0], [x1, y1, z1], [x0, y0, z1], [nx, ny, 0], color, em);
      }
    }

    function addDisc(cx, cy, z, radius, nSegs, isTop, color, em = [0.45, 0.75, 0.25]) {
      const nz = isTop ? 1 : -1;
      for (let i = 0; i < nSegs; i++) {
        const a0 = (2 * Math.PI * i) / nSegs;
        const a1 = (2 * Math.PI * (i + 1)) / nSegs;
        const p0 = [cx, cy, z];
        const p1 = [cx + radius * Math.cos(a0), cy + radius * Math.sin(a0), z];
        const p2 = [cx + radius * Math.cos(a1), cy + radius * Math.sin(a1), z];
        if (isTop) {
          addTriangle(p0, p1, p2, [0, 0, nz], color, em);
        } else {
          addTriangle(p0, p2, p1, [0, 0, nz], color, em);
        }
      }
    }

    function addAnnulus(cx, cy, z, rIn, rOut, nSegs, isTop, color, em = [0.35, 0.45, 0.20]) {
      const nz = isTop ? 1 : -1;
      for (let i = 0; i < nSegs; i++) {
        const a0 = (2 * Math.PI * i) / nSegs;
        const a1 = (2 * Math.PI * (i + 1)) / nSegs;
        const pIn0 = [cx + rIn * Math.cos(a0), cy + rIn * Math.sin(a0), z];
        const pIn1 = [cx + rIn * Math.cos(a1), cy + rIn * Math.sin(a1), z];
        const pOut0 = [cx + rOut * Math.cos(a0), cy + rOut * Math.sin(a0), z];
        const pOut1 = [cx + rOut * Math.cos(a1), cy + rOut * Math.sin(a1), z];
        if (isTop) {
          addQuad(pIn0, pIn1, pOut1, pOut0, [0, 0, nz], color, em);
        } else {
          addQuad(pIn0, pOut0, pOut1, pIn1, [0, 0, nz], color, em);
        }
      }
    }

    const { w: chipW, h: chipH, d: chipD } = chipDim;
    const effZ = zScale;
    const zTop = 0;
    const zBot = -chipD * 0.5 * (effZ * 0.35); // Base wafer thickness

    // ── 1. Silicon Interposer / Carrier Substrate ──
    if (showSubstrate) {
      // Interposer is slightly larger than active qubit die to provide breakout margin
      const interposerW = showMultiChipStack ? chipW * 1.15 : chipW;
      const interposerH = showMultiChipStack ? chipH * 1.15 : chipH;
      const x0 = -interposerW / 2, x1 = interposerW / 2;
      const y0 = -interposerH / 2, y1 = interposerH / 2;

      // Dynamic material visual properties (Silicon, Sapphire, GaAs, Quartz)
      const carrierMat = getMaterialVisuals(chips?.main?.material || 'silicon');
      const siliconTop = carrierMat.rgba3DTop;
      const siliconSide = carrierMat.rgba3DSide;
      const siliconBot = carrierMat.rgba3DBot;

      // Top face
      addQuad([x0, y0, zTop], [x1, y0, zTop], [x1, y1, zTop], [x0, y1, zTop], [0, 0, 1], siliconTop, [0.08, 0.04, 0.02]);
      // Bottom face
      addQuad([x0, y1, zBot], [x1, y1, zBot], [x1, y0, zBot], [x0, y0, zBot], [0, 0, -1], siliconBot, [0.02, 0.01, 0.01]);
      // 4 Sides
      addQuad([x0, y0, zBot], [x1, y0, zBot], [x1, y0, zTop], [x0, y0, zTop], [0, -1, 0], siliconSide, [0.03, 0.02, 0.01]);
      addQuad([x1, y0, zBot], [x1, y1, zBot], [x1, y1, zTop], [x1, y0, zTop], [1, 0, 0], siliconSide, [0.03, 0.02, 0.01]);
      addQuad([x1, y1, zBot], [x0, y1, zBot], [x0, y1, zTop], [x1, y1, zTop], [0, 1, 0], siliconSide, [0.03, 0.02, 0.01]);
      addQuad([x0, y1, zBot], [x0, y0, zBot], [x0, y0, zTop], [x0, y1, zTop], [-1, 0, 0], siliconSide, [0.03, 0.02, 0.01]);

      // Ground plane metallization on interposer
      const gndColor = carrierMat.gndColor;
      const borderW = 0.05;
      addQuad([x0, y0, zTop + 0.001], [x1, y0, zTop + 0.001], [x1, y0 + borderW, zTop + 0.001], [x0, y0 + borderW, zTop + 0.001], [0, 0, 1], gndColor, [0.20, 0.15, 0.05]);
      addQuad([x0, y1 - borderW, zTop + 0.001], [x1, y1 - borderW, zTop + 0.001], [x1, y1, zTop + 0.001], [x0, y1, zTop + 0.001], [0, 0, 1], gndColor, [0.20, 0.15, 0.05]);
      addQuad([x0, y0, zTop + 0.001], [x0 + borderW, y0, zTop + 0.001], [x0 + borderW, y1, zTop + 0.001], [x0, y1, zTop + 0.001], [0, 0, 1], gndColor, [0.20, 0.15, 0.05]);
      addQuad([x1 - borderW, y0, zTop + 0.001], [x1, y0, zTop + 0.001], [x1, y1, zTop + 0.001], [x1 - borderW, y1, zTop + 0.001], [0, 0, 1], gndColor, [0.20, 0.15, 0.05]);
    }

    // ── 2. Multi-Chip 3D Stack: Flipped Qubit Chip (Q_chip) ──
    const zStandoff = (0.035 * effZ) * stackExplode;
    const topDieThickness = 0.04 * effZ;
    const zTopChipBot = zStandoff;
    const zTopChipTop = zStandoff + topDieThickness;

    if (showMultiChipStack) {
      const qW = chipDim.qw || (chipW * 0.85);
      const qH = chipDim.qh || (chipH * 0.85);
      const qx0 = -qW / 2, qx1 = qW / 2;
      const qy0 = -qH / 2, qy1 = qH / 2;

      // Dynamic Flipped Qubit Die Material (Sapphire, Silicon, GaAs, Diamond)
      const topMat = getMaterialVisuals(chips?.Q_chip?.material || chips?.C_chip?.material || 'sapphire');
      const flippedSiTop = topMat.rgba3DTop;
      const flippedSiSide = topMat.rgba3DSide;
      const flippedSiBot = topMat.rgba3DBot;

      // Top face (Backside surface with crystalline sheen)
      addQuad([qx0, qy0, zTopChipTop], [qx1, qy0, zTopChipTop], [qx1, qy1, zTopChipTop], [qx0, qy1, zTopChipTop], [0, 0, 1], flippedSiTop);
      // Bottom face (active qubit mating surface facing standoff gap)
      addQuad([qx0, qy1, zTopChipBot], [qx1, qy1, zTopChipBot], [qx1, qy0, zTopChipBot], [qx0, qy0, zTopChipBot], [0, 0, -1], flippedSiBot);
      // 4 Die Sides
      addQuad([qx0, qy0, zTopChipBot], [qx1, qy0, zTopChipBot], [qx1, qy0, zTopChipTop], [qx0, qy0, zTopChipTop], [0, -1, 0], flippedSiSide);
      addQuad([qx1, qy0, zTopChipBot], [qx1, qy1, zTopChipBot], [qx1, qy1, zTopChipTop], [qx1, qy0, zTopChipTop], [1, 0, 0], flippedSiSide);
      addQuad([qx1, qy1, zTopChipBot], [qx0, qy1, zTopChipBot], [qx0, qy1, zTopChipTop], [qx1, qy1, zTopChipTop], [0, 1, 0], flippedSiSide);
      addQuad([qx0, qy1, zTopChipBot], [qx0, qy0, zTopChipBot], [qx0, qy0, zTopChipTop], [qx0, qy1, zTopChipTop], [-1, 0, 0], flippedSiSide);

      // Top face perimeter bevel/frame for clear die outline
      const edgeBorderColor = [0.18, 0.52, 0.75, 1.0];
      const edgeW = 0.035;
      addQuad([qx0, qy0, zTopChipTop + 0.001], [qx1, qy0, zTopChipTop + 0.001], [qx1, qy0 + edgeW, zTopChipTop + 0.001], [qx0, qy0 + edgeW, zTopChipTop + 0.001], [0, 0, 1], edgeBorderColor);
      addQuad([qx0, qy1 - edgeW, zTopChipTop + 0.001], [qx1, qy1 - edgeW, zTopChipTop + 0.001], [qx1, qy1, zTopChipTop + 0.001], [qx0, qy1, zTopChipTop + 0.001], [0, 0, 1], edgeBorderColor);
      addQuad([qx0, qy0, zTopChipTop + 0.001], [qx0 + edgeW, qy0, zTopChipTop + 0.001], [qx0 + edgeW, qy1, zTopChipTop + 0.001], [qx0, qy1, zTopChipTop + 0.001], [0, 0, 1], edgeBorderColor);
      addQuad([qx1 - edgeW, qy0, zTopChipTop + 0.001], [qx1, qy0, zTopChipTop + 0.001], [qx1, qy1, zTopChipTop + 0.001], [qx1 - edgeW, qy1, zTopChipTop + 0.001], [0, 0, 1], edgeBorderColor);

      // Active mating surface ground plane border on bottom face
      const qGndColor = topMat.gndColor || [0.25, 0.55, 0.70, 0.90];
      const qBorderW = 0.045;
      addQuad([qx0, qy0, zTopChipBot - 0.001], [qx1, qy0, zTopChipBot - 0.001], [qx1, qy0 + qBorderW, zTopChipBot - 0.001], [qx0, qy0 + qBorderW, zTopChipBot - 0.001], [0, 0, -1], qGndColor, [0.20, 0.15, 0.05]);
      addQuad([qx0, qy1 - qBorderW, zTopChipBot - 0.001], [qx1, qy1 - qBorderW, zTopChipBot - 0.001], [qx1, qy1, zTopChipBot - 0.001], [qx0, qy1, zTopChipBot - 0.001], [0, 0, -1], qGndColor, [0.20, 0.15, 0.05]);
      addQuad([qx0, qy0, zTopChipBot - 0.001], [qx0 + qBorderW, qy0, zTopChipBot - 0.001], [qx0 + qBorderW, qy1, zTopChipBot - 0.001], [qx0, qy1, zTopChipBot - 0.001], [0, 0, -1], qGndColor, [0.20, 0.15, 0.05]);
      addQuad([qx1 - qBorderW, qy0, zTopChipBot - 0.001], [qx1, qy0, zTopChipBot - 0.001], [qx1, qy1, zTopChipBot - 0.001], [qx1 - qBorderW, qy1, zTopChipBot - 0.001], [0, 0, -1], qGndColor, [0.20, 0.15, 0.05]);

      // Gold alignment fiducials on the corners of flipped chip
      const fidColor = [0.96, 0.75, 0.20, 1.0];
      const fidSize = 0.12;
      [
        [qx0 + 0.2, qy0 + 0.2],
        [qx1 - 0.2, qy0 + 0.2],
        [qx1 - 0.2, qy1 - 0.2],
        [qx0 + 0.2, qy1 - 0.2]
      ].forEach(([fx, fy]) => {
        addQuad(
          [fx - fidSize, fy - fidSize, zTopChipTop + 0.002],
          [fx + fidSize, fy - fidSize, zTopChipTop + 0.002],
          [fx + fidSize, fy + fidSize, zTopChipTop + 0.002],
          [fx - fidSize, fy + fidSize, zTopChipTop + 0.002],
          [0, 0, 1],
          fidColor
        );
      });
    }

    // ── 3. Polygons: Qubit Pads, Couplers, & Etched Pockets ──
    const polyArr = qg.poly || [];
    polyArr.forEach(p => {
      const rawPts = p.points ? p.points : parseWktCoords(p.geometry);
      if (!rawPts || rawPts.length < 3) return;

      const ptsMm = rawPts.map(([x, y]) => [x / 1000, y / 1000]);
      const { vertices, triangles } = triangulatePolygon(ptsMm);
      if (!triangles || triangles.length === 0) return;

      const isSub = p.subtract;
      const comp = components.find(c => c.name === p.component || c.id === p.component || String(c.id) === String(p.component));
      const isSelected = comp?.id === selectedComponentId;

      if (isSub && !showPockets) return;
      if (!isSub && !showMetal) return;

      const visual = getComponentVisuals(comp, isSelected, isSub, p.chip || comp?.params?.chip);
      const isQubitOrCoupler = visual.role === 'qubit' || visual.role === 'coupler';
      const isAssignedTop = comp?.params?.chip === 'Q_chip' || p.chip === 'Q_chip';
      const isTopDie = isAssignedTop || (showMultiChipStack && isQubitOrCoupler);
      const dieZ = (isTopDie && showMultiChipStack) ? zTopChipBot : 0;
      const zBase = dieZ + (isSub ? -0.015 * effZ : 0.004 * effZ);
      const zHeight = dieZ + (isSub ? -0.015 * effZ : 0.012 * effZ);
      const color = visual.rgba3D;

      // Top face with per-vertex physical edge singularity field gradient
      function getVertexEM(pt, polyBoundary, isSubtract) {
        let minD = Infinity;
        const bLen = polyBoundary.length;
        for (let b = 0; b < bLen; b++) {
          const nb = (b + 1) % bLen;
          const ax = polyBoundary[b][0], ay = polyBoundary[b][1];
          const bx = polyBoundary[nb][0], by = polyBoundary[nb][1];
          const dx = bx - ax, dy = by - ay;
          const l2 = dx * dx + dy * dy;
          let t = l2 > 0 ? ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / l2 : 0;
          t = Math.max(0, Math.min(1, t));
          const projX = ax + t * dx;
          const projY = ay + t * dy;
          const d = Math.hypot(pt[0] - projX, pt[1] - projY);
          if (d < minD) minD = d;
        }

        if (isSubtract) {
          // Dielectric gap region: electric field peaks near conductor borders
          const uE = Math.min(0.96, Math.max(0.20, 0.95 * Math.exp(-minD * 45.0)));
          const uH = 0.12;
          const epr = Math.min(0.90, Math.max(0.15, 0.90 * Math.exp(-minD * 50.0)));
          return [uE, uH, epr];
        } else {
          // Metal face: tangential E=0 on PEC, edge singularity crowding at perimeter d=0
          const uE = Math.min(0.95, Math.max(0.04, 0.95 * Math.exp(-minD * 75.0)));
          const uH = Math.min(0.75, Math.max(0.18, 0.70 * Math.exp(-minD * 40.0) + 0.12));
          const epr = Math.min(0.92, Math.max(0.02, 0.92 * Math.exp(-minD * 80.0)));
          return [uE, uH, epr];
        }
      }

      triangles.forEach(([i0, i1, i2]) => {
        const v0 = [vertices[i0][0], vertices[i0][1], zHeight];
        const v1 = [vertices[i1][0], vertices[i1][1], zHeight];
        const v2 = [vertices[i2][0], vertices[i2][1], zHeight];
        const em0 = getVertexEM(vertices[i0], ptsMm, isSub);
        const em1 = getVertexEM(vertices[i1], ptsMm, isSub);
        const em2 = getVertexEM(vertices[i2], ptsMm, isSub);
        addTriangle(v0, v1, v2, [0, 0, 1], color, [em0, em1, em2]);
      });

      // 3D Extruded Side Walls
      if (!isSub) {
        const sideColor = [color[0] * 0.75, color[1] * 0.75, color[2] * 0.75, 1.0];
        const sideEm = [0.98, 0.65, 0.88]; // Singular edge field concentration!
        const vLen = vertices.length;
        for (let i = 0; i < vLen; i++) {
          const j = (i + 1) % vLen;
          const pA = vertices[i];
          const pB = vertices[j];
          const nx = pB[1] - pA[1];
          const ny = -(pB[0] - pA[0]);
          const normLen = Math.hypot(nx, ny) || 1;
          const n = [nx / normLen, ny / normLen, 0];

          addQuad(
            [pA[0], pA[1], zBase],
            [pB[0], pB[1], zBase],
            [pB[0], pB[1], zHeight],
            [pA[0], pA[1], zHeight],
            n,
            sideColor,
            sideEm
          );
        }
      }
    });

    // ── 4. Paths: Volumetric 3D CPW Transmission Lines & Feedlines ──
    const pathArr = qg.path || [];
    pathArr.forEach(p => {
      const rawPts = p.points ? p.points : parseWktCoords(p.geometry);
      if (!rawPts || rawPts.length < 2) return;

      const ptsMm = rawPts.map(([x, y]) => [x / 1000, y / 1000]);
      const isSub = p.subtract;
      if (isSub && !showPockets) return;
      if (!isSub && !showMetal) return;

      const comp = components.find(c => c.name === p.component || c.id === p.component || String(c.id) === String(p.component));
      const isSelected = comp?.id === selectedComponentId;

      const visual = getComponentVisuals(comp, isSelected, isSub, p.chip || comp?.params?.chip);
      const isQubitOrCoupler = visual.role === 'qubit' || visual.role === 'coupler';
      const isAssignedTop = comp?.params?.chip === 'Q_chip' || p.chip === 'Q_chip' || visual.isTopDie;
      const isTopDie = isAssignedTop || (showMultiChipStack && isQubitOrCoupler);
      const dieZ = (isTopDie && showMultiChipStack) ? zTopChipBot : 0;

      const baseW = (p.width || (isSub ? 22 : 10)) / 1000;
      // In 3D CAD visualization, giving thin CPWs volumetric thickness prevents vanishing & clipping
      const widthMm = thickTraces ? Math.max(0.024, baseW * 1.6) : Math.max(0.008, baseW);
      const halfW = widthMm / 2;
      const zTop = dieZ + (isSub ? -0.003 * effZ : 0.014 * effZ);
      const zBase = dieZ + (isSub ? -0.015 * effZ : 0.003 * effZ);
      const color = visual.rgba3D;

      for (let i = 0; i < ptsMm.length - 1; i++) {
        const p0 = ptsMm[i];
        const p1 = ptsMm[i + 1];
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * halfW;
        const ny = (dx / len) * halfW;

        // Top vertices
        const a0Top = [p0[0] - nx, p0[1] - ny, zTop];
        const a1Top = [p0[0] + nx, p0[1] + ny, zTop];
        const b0Top = [p1[0] - nx, p1[1] - ny, zTop];
        const b1Top = [p1[0] + nx, p1[1] + ny, zTop];

        // Base vertices
        const a0Base = [p0[0] - nx, p0[1] - ny, zBase];
        const a1Base = [p0[0] + nx, p0[1] + ny, zBase];
        const b0Base = [p1[0] - nx, p1[1] - ny, zBase];
        const b1Base = [p1[0] + nx, p1[1] + ny, zBase];

        let quadEm;
        if (isSub) {
          quadEm = [0.90, 0.22, 0.88];
        } else {
          const s0 = i / Math.max(1, ptsMm.length - 1);
          const s1 = (i + 1) / Math.max(1, ptsMm.length - 1);
          const uH0 = 0.40 + 0.58 * Math.pow(Math.sin(Math.PI * s0 * 2.0), 2);
          const uH1 = 0.40 + 0.58 * Math.pow(Math.sin(Math.PI * s1 * 2.0), 2);
          const uE0 = 0.30 + 0.65 * Math.pow(Math.cos(Math.PI * s0 * 2.0), 2);
          const uE1 = 0.30 + 0.65 * Math.pow(Math.cos(Math.PI * s1 * 2.0), 2);
          const epr0 = 0.20 + 0.20 * Math.pow(Math.cos(Math.PI * s0 * 2.0), 2);
          const epr1 = 0.20 + 0.20 * Math.pow(Math.cos(Math.PI * s1 * 2.0), 2);
          quadEm = [[uE0, uH0, epr0], [uE0, uH0, epr0], [uE1, uH1, epr1], [uE1, uH1, epr1]];
        }

        // 1. Top face
        addQuad(a0Top, a1Top, b1Top, b0Top, [0, 0, 1], color, quadEm);

        if (!isSub && thickTraces) {
          const sideColor = [color[0] * 0.72, color[1] * 0.72, color[2] * 0.72, 1.0];
          const sideEm = [0.85, 0.60, 0.75];
          const leftNorm = [-ny / halfW, nx / halfW, 0];
          const rightNorm = [ny / halfW, -nx / halfW, 0];

          // 2. Left vertical extruded sidewall
          addQuad(a0Base, a0Top, b0Top, b0Base, leftNorm, sideColor, sideEm);
          // 3. Right vertical extruded sidewall
          addQuad(a1Top, a1Base, b1Base, b1Top, rightNorm, sideColor, sideEm);

          // 4. Start cap on first segment
          if (i === 0) {
            const startNorm = [-dx / len, -dy / len, 0];
            addQuad(a0Base, a1Base, a1Top, a0Top, startNorm, sideColor, sideEm);
          }
          // 5. End cap on last segment
          if (i === ptsMm.length - 2) {
            const endNorm = [dx / len, dy / len, 0];
            addQuad(b1Base, b0Base, b0Top, b1Top, endNorm, sideColor, sideEm);
          }
        }
      }
    });

    // ── 5. Josephson Junctions: Glowing 3D Quantum Bridges ──
    if (showJunctions && qg.junction) {
      qg.junction.forEach(j => {
        const rawPts = j.points ? j.points : parseWktCoords(j.geometry);
        if (!rawPts || rawPts.length < 2) return;
        const p0 = [rawPts[0][0] / 1000, rawPts[0][1] / 1000];
        const p1 = [rawPts[1][0] / 1000, rawPts[1][1] / 1000];

        const cx = (p0[0] + p1[0]) / 2;
        const cy = (p0[1] + p1[1]) / 2;
        const comp = components.find(c => c.name === j.component || c.id === j.component || String(c.id) === String(j.component));
        const isSelected = comp?.id === selectedComponentId;
        const visual = getComponentVisuals(comp, isSelected, false, j.chip || comp?.params?.chip);
        const isQubitOrCoupler = visual.role === 'qubit' || visual.role === 'coupler';
        const isAssignedTop = comp?.params?.chip === 'Q_chip' || j.chip === 'Q_chip' || visual.isTopDie;
        const isTopDie = isAssignedTop || (showMultiChipStack && (isQubitOrCoupler || !comp));
        const dieZ = (isTopDie && showMultiChipStack) ? zTopChipBot : 0;
        const zJ = dieZ + 0.018 * effZ;
        const jjW = 0.012;
        const jjH = 0.012;
        const jjColor = [0.95, 0.25, 0.25, 1.0];

        addQuad(
          [cx - jjW, cy - jjH, zJ],
          [cx + jjW, cy - jjH, zJ],
          [cx + jjW, cy + jjH, zJ],
          [cx - jjW, cy + jjH, zJ],
          [0, 0, 1],
          jjColor,
          [0.98, 0.99, 0.96]
        );
      });
    }

    // ── 6. 3D Component Pins & Lumped Port Terminals ──
    let activePinsCount = 0;
    if (showPins && qg.pins) {
      Object.entries(qg.pins).forEach(([compName, compPins]) => {
        const comp = components.find(c => c.name === compName || c.id === compName || String(c.id) === String(compName));
        const isSelected = comp?.id === selectedComponentId;

        Object.entries(compPins).forEach(([pinName, pin]) => {
          if (!pin.middle) return;
          activePinsCount++;

          const mx = pin.middle[0] / 1000;
          const my = pin.middle[1] / 1000;

          const isRdout = pinName.toLowerCase().includes('rdout') || pinName.toLowerCase().includes('readout');
          const isCpl = pinName.toLowerCase().includes('cpl') || pinName.toLowerCase().includes('coupl');
          const isDriveOrFlux = pinName.toLowerCase().includes('flux') || pinName.toLowerCase().includes('drive') || pinName.toLowerCase().includes('control') || pinName.toLowerCase().includes('charge');
          const isLaunchpad = compName.toLowerCase().startsWith('lp') || pinName.toLowerCase().includes('tie');

          let pinColor, pinEm;
          if (isSelected) {
            pinColor = [1.0, 0.90, 0.22, 1.0]; // Bright gold pulse
            pinEm = [0.98, 0.95, 0.50];
          } else if (isRdout) {
            pinColor = [0.22, 0.78, 0.98, 1.0]; // Electric Cyan (Readout)
            pinEm = [0.45, 0.85, 0.30];
          } else if (isCpl) {
            pinColor = [0.20, 0.88, 0.48, 1.0]; // Emerald Green (Coupler)
            pinEm = [0.40, 0.82, 0.25];
          } else if (isDriveOrFlux) {
            pinColor = [0.98, 0.70, 0.16, 1.0]; // Amber/Orange (Flux/Drive)
            pinEm = [0.85, 0.55, 0.20];
          } else if (isLaunchpad) {
            pinColor = [0.95, 0.25, 0.25, 1.0]; // Crimson/Ruby (RF I/O Launchpad)
            pinEm = [0.92, 0.30, 0.20];
          } else {
            pinColor = [0.92, 0.32, 0.35, 1.0]; // Standard Port Red
            pinEm = [0.85, 0.35, 0.25];
          }

          const compChip = comp?.params?.chip || 'main';
          const isQubitOrCoupler = !isLaunchpad && (isCpl || comp?.name?.toLowerCase().includes('q') || comp?.name?.toLowerCase().includes('qubit') || comp?.type?.toLowerCase().includes('transmon') || comp?.type?.toLowerCase().includes('coupler'));
          const isAssignedTop = compChip === 'Q_chip' || compChip === 'top' || compChip === 'chip_1';
          const isTopDie = isAssignedTop || (showMultiChipStack && isQubitOrCoupler);
          const dieZ = (isTopDie && showMultiChipStack) ? zTopChipBot : 0;
          const zBase = dieZ + 0.003 * effZ;
          const zPinTop = dieZ + 0.015 * effZ;

          // A. Terminal crossbar across the conductor
          if (pin.points && pin.points.length >= 2) {
            const p0 = [pin.points[0][0] / 1000, pin.points[0][1] / 1000];
            const p1 = [pin.points[1][0] / 1000, pin.points[1][1] / 1000];
            const dx = p1[0] - p0[0];
            const dy = p1[1] - p0[1];
            const len = Math.hypot(dx, dy) || 0.02;
            const barThick = 0.005;
            const bnx = (-dy / len) * (barThick / 2);
            const bny = (dx / len) * (barThick / 2);

            // Flush terminal mark across trace
            addQuad(
              [p0[0] - bnx, p0[1] - bny, zPinTop],
              [p1[0] - bnx, p1[1] - bny, zPinTop],
              [p1[0] + bnx, p1[1] + bny, zPinTop],
              [p0[0] + bnx, p0[1] + bny, zPinTop],
              [0, 0, 1],
              pinColor,
              pinEm
            );
          }

          // B. Subtle 3D port landing dot (flush, no flagpole)
          const rDisc = isSelected ? 0.010 : 0.006;
          addDisc(mx, my, zPinTop + 0.001, rDisc, 8, true, pinColor, pinEm);

          // C. If selected, add a subtle glowing terminal contact probe
          if (isSelected) {
            addCylinder(mx, my, zBase, zPinTop + 0.008 * effZ, 0.006, 8, pinColor, pinEm);
          }

          // D. Directional RF Normal Wave Arrow: ONLY if selected OR for launchpads (LP_*)
          if (pin.normal && (isSelected || isLaunchpad)) {
            const nx = pin.normal[0];
            const ny = pin.normal[1];
            const arrLen = 0.026;
            const ax = mx + nx * arrLen;
            const ay = my + ny * arrLen;
            const arrowW = 0.004;
            const pnx = -ny * arrowW;
            const pny = nx * arrowW;
            const zArr = zPinTop + 0.002;

            // Stem
            addQuad(
              [mx - pnx, my - pny, zArr],
              [mx + pnx, my + pny, zArr],
              [mx + nx * (arrLen * 0.6) + pnx, my + ny * (arrLen * 0.6) + pny, zArr],
              [mx + nx * (arrLen * 0.6) - pnx, my + ny * (arrLen * 0.6) - pny, zArr],
              [0, 0, 1],
              pinColor,
              pinEm
            );
            // Arrowhead
            const headBaseX = mx + nx * (arrLen * 0.55);
            const headBaseY = my + ny * (arrLen * 0.55);
            const headW = arrowW * 2.2;
            addTriangle(
              [headBaseX - ny * headW, headBaseY + nx * headW, zArr],
              [headBaseX + ny * headW, headBaseY - nx * headW, zArr],
              [ax, ay, zArr],
              [0, 0, 1],
              pinColor,
              pinEm
            );
          }
        });
      });
    }

    // ── 7. 3D Topological Netlist & Flight Lines (Ratsnest) ──
    let connectedNetsCount = 0;
    if (showNets) {
      const netConnections = [];
      const seenConnections = new Set();
      const parse = useEdaStore.getState().parseValue || (v => parseFloat(v) || 0);

      // A. Components with pin_inputs (resonators, CPW routes, couplers)
      components.forEach(comp => {
        const pi = comp.params?.pin_inputs;
        if (!pi?.start_pin?.component || !pi?.end_pin?.component) return;
        const c1Name = pi.start_pin.component;
        const p1Name = pi.start_pin.pin;
        const c2Name = pi.end_pin.component;
        const p2Name = pi.end_pin.pin;

        const pin1 = qg.pins?.[c1Name]?.[p1Name];
        const pin2 = qg.pins?.[c2Name]?.[p2Name];
        const c1Comp = components.find(c => c.name === c1Name || c.id === c1Name);
        const c2Comp = components.find(c => c.name === c2Name || c.id === c2Name);

        const x1 = pin1 ? pin1.middle[0] / 1000 : (c1Comp ? parse(c1Comp.params?.pos_x || c1Comp.pos_x || 0) / 1000 : 0);
        const y1 = pin1 ? pin1.middle[1] / 1000 : (c1Comp ? parse(c1Comp.params?.pos_y || c1Comp.pos_y || 0) / 1000 : 0);
        const x2 = pin2 ? pin2.middle[0] / 1000 : (c2Comp ? parse(c2Comp.params?.pos_x || c2Comp.pos_x || 0) / 1000 : 0);
        const y2 = pin2 ? pin2.middle[1] / 1000 : (c2Comp ? parse(c2Comp.params?.pos_y || c2Comp.pos_y || 0) / 1000 : 0);

        const key = [c1Name, p1Name, c2Name, p2Name].sort().join('::');
        if (!seenConnections.has(key)) {
          seenConnections.add(key);
          netConnections.push({
            id: comp.id || comp.name,
            compName: comp.name,
            compType: comp.type,
            from: { comp: c1Name, pin: p1Name, x: x1, y: y1 },
            to: { comp: c2Name, pin: p2Name, x: x2, y: y2 },
            isSelected: comp.id === selectedComponentId || c1Comp?.id === selectedComponentId || c2Comp?.id === selectedComponentId
          });
        }
      });

      // B. Store netlist entries
      const storeNetlist = (useEdaStore.getState().netlist || []);
      storeNetlist.forEach((entry, idx) => {
        if (entry.comp1 && entry.comp2) {
          const c1Name = entry.comp1;
          const p1Name = entry.pin1 || '';
          const c2Name = entry.comp2;
          const p2Name = entry.pin2 || '';
          const pin1 = qg.pins?.[c1Name]?.[p1Name];
          const pin2 = qg.pins?.[c2Name]?.[p2Name];
          const c1Comp = components.find(c => c.name === c1Name || c.id === c1Name);
          const c2Comp = components.find(c => c.name === c2Name || c.id === c2Name);
          const x1 = pin1 ? pin1.middle[0] / 1000 : (c1Comp ? parse(c1Comp.params?.pos_x || 0) / 1000 : 0);
          const y1 = pin1 ? pin1.middle[1] / 1000 : (c1Comp ? parse(c1Comp.params?.pos_y || 0) / 1000 : 0);
          const x2 = pin2 ? pin2.middle[0] / 1000 : (c2Comp ? parse(c2Comp.params?.pos_x || 0) / 1000 : 0);
          const y2 = pin2 ? pin2.middle[1] / 1000 : (c2Comp ? parse(c2Comp.params?.pos_y || 0) / 1000 : 0);

          const key = [c1Name, p1Name, c2Name, p2Name].sort().join('::');
          if (!seenConnections.has(key)) {
            seenConnections.add(key);
            netConnections.push({
              id: `net_${idx}`,
              compName: `Net ${idx + 1}`,
              compType: 'net',
              from: { comp: c1Name, pin: p1Name, x: x1, y: y1 },
              to: { comp: c2Name, pin: p2Name, x: x2, y: y2 },
              isSelected: c1Comp?.id === selectedComponentId || c2Comp?.id === selectedComponentId
            });
          }
        }
      });

      connectedNetsCount = netConnections.length;

      // Selective display: if a component is selected, ONLY draw its connected flight lines!
      // Otherwise, draw only up to 16 primary couplings so the view stays clean and readable.
      const visibleNets = selectedComponentId
        ? netConnections.filter(n => n.isSelected)
        : netConnections.slice(0, 16);

      visibleNets.forEach(net => {
        const { from, to, isSelected, compType } = net;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.001) return;

        const archHeight = (0.030 * effZ) + Math.min(0.08 * effZ, dist * 0.04);
        const nSegs = 10;
        const ribbonW = isSelected ? 0.010 : 0.006;

        let netColor = isSelected
          ? [1.0, 0.88, 0.22, 0.98]
          : compType?.includes('cpl') || compType?.includes('coupler')
            ? [0.65, 0.35, 0.98, 0.85]
            : compType?.includes('rdout') || compType?.includes('readout')
              ? [0.22, 0.82, 0.96, 0.85]
              : [0.98, 0.68, 0.20, 0.85];

        const netEm = isSelected ? [0.98, 0.95, 0.60] : [0.45, 0.65, 0.25];

        // Sleek terminal node dots
        addDisc(from.x, from.y, 0.016 * effZ, 0.008, 8, true, netColor, netEm);
        addDisc(to.x, to.y, 0.016 * effZ, 0.008, 8, true, netColor, netEm);

        for (let s = 0; s < nSegs; s++) {
          const t0 = s / nSegs;
          const t1 = (s + 1) / nSegs;

          const px0 = from.x + dx * t0;
          const py0 = from.y + dy * t0;
          const pz0 = 0.016 * effZ + archHeight * 4 * t0 * (1 - t0);

          const px1 = from.x + dx * t1;
          const py1 = from.y + dy * t1;
          const pz1 = 0.016 * effZ + archHeight * 4 * t1 * (1 - t1);

          const segDx = px1 - px0;
          const segDy = py1 - py0;
          const segLen = Math.hypot(segDx, segDy) || 1;
          const rnx = (-segDy / segLen) * (ribbonW / 2);
          const rny = (segDx / segLen) * (ribbonW / 2);

          addQuad(
            [px0 - rnx, py0 - rny, pz0],
            [px0 + rnx, py0 + rny, pz0],
            [px1 + rnx, py1 + rny, pz1],
            [px1 - rnx, py1 - rny, pz1],
            [0, 0, 1],
            netColor,
            netEm
          );
        }
      });
    }

    // ── 8. 3D Airbridges: Elevated Superconducting Arches ──
    if (showAirbridges) {
      const airbridgeComps = components.filter(c => {
        const t = (c.type || '').toLowerCase();
        const n = (c.name || '').toLowerCase();
        return t.includes('airbridge') || n.startsWith('ab') || n.includes('airbridge');
      });

      const goldColor = [0.96, 0.72, 0.15, 1.0];

      airbridgeComps.forEach(comp => {
        const parse = useEdaStore.getState().parseValue || (v => parseFloat(v) || 0);
        const x = (parse(comp.params?.pos_x || comp.pos_x || 0)) / 1000;
        const y = (parse(comp.params?.pos_y || comp.pos_y || 0)) / 1000;
        const rotDeg = parseFloat(comp.params?.orientation || comp.orientation || 0);
        const rad = (rotDeg * Math.PI) / 180;

        const spanMm = 0.065;
        const widthMm = 0.016;
        const archPeak = 0.045 * effZ;

        const cosR = Math.cos(rad);
        const sinR = Math.sin(rad);

        const nSegs = 8;
        for (let s = 0; s < nSegs; s++) {
          const t0 = s / nSegs;
          const t1 = (s + 1) / nSegs;

          const z0 = archPeak * 4 * t0 * (1 - t0) + 0.005;
          const z1 = archPeak * 4 * t1 * (1 - t1) + 0.005;

          const u0 = (t0 - 0.5) * spanMm;
          const u1 = (t1 - 0.5) * spanMm;

          const pA0 = [x + u0 * cosR - widthMm / 2 * -sinR, y + u0 * sinR - widthMm / 2 * cosR, z0];
          const pA1 = [x + u0 * cosR + widthMm / 2 * -sinR, y + u0 * sinR + widthMm / 2 * cosR, z0];
          const pB0 = [x + u1 * cosR - widthMm / 2 * -sinR, y + u1 * sinR - widthMm / 2 * cosR, z1];
          const pB1 = [x + u1 * cosR + widthMm / 2 * -sinR, y + u1 * sinR + widthMm / 2 * cosR, z1];

          addQuad(pA0, pA1, pB1, pB0, [0, 0, 1], goldColor);
        }
      });
    }

    // ── 9. Wirebonds along Chip Perimeter & Launchpads ──
    if (showWirebonds && qg.pins) {
      const wireColor = [0.98, 0.82, 0.22, 0.95];
      const padColor = [0.95, 0.76, 0.18, 1.0];
      Object.entries(qg.pins).forEach(([compName, pins]) => {
        if (!compName.toLowerCase().startsWith('lp')) return;
        Object.values(pins).forEach(pin => {
          if (!pin.middle) return;
          const startX = pin.middle[0] / 1000;
          const startY = pin.middle[1] / 1000;

          const dirX = Math.sign(startX) || 1;
          const dirY = Math.sign(startY) || 0;
          const endX = startX + dirX * 0.45;
          const endY = startY + dirY * 0.45;
          const peakZ = 0.08 * effZ;

          // Start ball bond pad on die
          addDisc(startX, startY, 0.016 * effZ, 0.024, 12, true, padColor, [0.85, 0.70, 0.20]);
          // End wedge bond pad on interposer package
          addDisc(endX, endY, 0.004, 0.030, 12, true, padColor, [0.85, 0.70, 0.20]);

          for (let s = 0; s < 6; s++) {
            const t0 = s / 6;
            const t1 = (s + 1) / 6;
            const px0 = startX + (endX - startX) * t0;
            const py0 = startY + (endY - startY) * t0;
            const pz0 = peakZ * Math.sin(t0 * Math.PI) + 0.01;

            const px1 = startX + (endX - startX) * t1;
            const py1 = startY + (endY - startY) * t1;
            const pz1 = peakZ * Math.sin(t1 * Math.PI) + 0.01;

            const w = 0.008;
            addQuad(
              [px0 - w, py0, pz0],
              [px0 + w, py0, pz0],
              [px1 + w, py1, pz1],
              [px1 - w, py1, pz1],
              [0, 0, 1],
              wireColor
            );
          }
        });
      });
    }

    // ── 10. 3D Through-Silicon Vias (TSVs) Anchored to Launchpads & I/O Ports ──
    let tsvsCount = 0;
    if (showTSVs) {
      const parse = useEdaStore.getState().parseValue || (v => parseFloat(v) || 0);
      const lpComps = components.filter(c => {
        const t = (c.type || '').toLowerCase();
        const n = (c.name || '').toLowerCase();
        return n.startsWith('lp') || t.includes('launchpad') || t === 'tsv' || n.includes('tsv');
      });

      const tsvPositions = [];
      if (lpComps.length > 0) {
        lpComps.forEach(c => {
          const compPins = qg.pins?.[c.name] || qg.pins?.[c.id];
          let px = null, py = null;
          if (compPins) {
            const pinObj = Object.values(compPins)[0];
            if (pinObj?.middle) {
              px = pinObj.middle[0] / 1000;
              py = pinObj.middle[1] / 1000;
            }
          }
          if (px === null) {
            px = (parse(c.params?.pos_x || c.pos_x || 0)) / 1000;
            py = (parse(c.params?.pos_y || c.pos_y || 0)) / 1000;
          }
          tsvPositions.push({
            x: px,
            y: py,
            rCore: 0.022,
            rCoax: 0.048
          });
        });
      } else {
        tsvPositions.push(
          { x: -chipW * 0.38, y: -chipH * 0.38, rCore: 0.02, rCoax: 0.045 },
          { x: chipW * 0.38, y: -chipH * 0.38, rCore: 0.02, rCoax: 0.045 },
          { x: chipW * 0.38, y: chipH * 0.38, rCore: 0.02, rCoax: 0.045 },
          { x: -chipW * 0.38, y: chipH * 0.38, rCore: 0.02, rCoax: 0.045 }
        );
      }

      tsvsCount = tsvPositions.length;
      const tsvCoreColor = [0.22, 0.74, 0.98, 1.0];
      const tsvCoaxTrench = [0.04, 0.06, 0.10, 1.0];
      const tsvBacksidePad = [0.96, 0.78, 0.20, 1.0];

      tsvPositions.forEach(tsv => {
        // Coaxial ground isolation trench penetrating through wafer
        addCylinder(tsv.x, tsv.y, zBot, 0.002, tsv.rCoax, 16, tsvCoaxTrench, [0.92, 0.28, 0.70]);
        // Inner superconducting TSV conductor core
        addCylinder(tsv.x, tsv.y, zBot - 0.005, 0.016 * effZ, tsv.rCore, 16, tsvCoreColor, [0.45, 0.88, 0.25]);
        // Top contact pad
        addDisc(tsv.x, tsv.y, 0.016 * effZ, tsv.rCore * 1.35, 16, true, tsvCoreColor, [0.45, 0.85, 0.25]);
        // Backside wafer landing pad
        addDisc(tsv.x, tsv.y, zBot - 0.005, tsv.rCore * 2.2, 16, false, tsvBacksidePad, [0.40, 0.60, 0.30]);
        // Coaxial ground ring collar on top surface
        addAnnulus(tsv.x, tsv.y, 0.002, tsv.rCoax, tsv.rCoax * 1.4, 16, true, [0.30, 0.40, 0.55, 1.0], [0.35, 0.45, 0.20]);
      });
    }

    // ── 11. 3D Indium Micro-Bumps (Flip-Chip Bonding) Anchored to Active Pin Terminals ──
    let bumpsCount = 0;
    if (showMicroBumps) {
      const parse = useEdaStore.getState().parseValue || (v => parseFloat(v) || 0);
      const bumpComps = components.filter(c => {
        const t = (c.type || '').toLowerCase();
        const n = (c.name || '').toLowerCase();
        return t === 'micro_bump' || n.includes('bump');
      });

      const bumpPositions = [];
      if (bumpComps.length > 0) {
        bumpComps.forEach(c => {
          bumpPositions.push({
            x: (parse(c.params?.pos_x || c.pos_x || 0)) / 1000,
            y: (parse(c.params?.pos_y || c.pos_y || 0)) / 1000,
            radius: (parse(c.params?.radius || '15')) / 1000
          });
        });
      } else {
        // Place micro-bumps directly under active qubit & coupler pins
        if (qg.pins) {
          Object.entries(qg.pins).forEach(([cName, cPins]) => {
            if (cName.toLowerCase().startsWith('lp')) return; // LP uses TSVs/wirebonds
            Object.values(cPins).forEach(pin => {
              if (pin.middle && bumpPositions.length < 24) {
                bumpPositions.push({
                  x: pin.middle[0] / 1000,
                  y: pin.middle[1] / 1000,
                  radius: 0.020
                });
              }
            });
          });
        }
        // Corner structural bumps
        bumpPositions.push(
          { x: -chipW * 0.42, y: -chipH * 0.42, radius: 0.030 },
          { x: chipW * 0.42, y: -chipH * 0.42, radius: 0.030 },
          { x: chipW * 0.42, y: chipH * 0.42, radius: 0.030 },
          { x: -chipW * 0.42, y: chipH * 0.42, radius: 0.030 }
        );
      }

      bumpsCount = bumpPositions.length;
      const indiumColor = [0.85, 0.89, 0.94, 1.0]; // Lustrous superconducting Indium metal
      const ubmColor = [0.95, 0.74, 0.18, 1.0];    // Under-Bump Metallization (Ti/Pt/Au)

      bumpPositions.forEach(b => {
        const zB0 = 0.002;
        const zB1 = Math.max(0.015, zStandoff);

        // Lower UBM landing pad on interposer
        addDisc(b.x, b.y, zB0, b.radius * 1.25, 14, true, ubmColor, [0.40, 0.65, 0.35]);
        // Indium cylindrical barrel bump
        addCylinder(b.x, b.y, zB0, zB1, b.radius, 14, indiumColor, [0.45, 0.78, 0.30]);
        // Upper UBM landing pad on flipped chip
        addDisc(b.x, b.y, zB1, b.radius * 1.25, 14, false, ubmColor, [0.40, 0.65, 0.35]);
      });
    }

    // ── 10. Direct Hybrid Bonding (Wafer-to-Wafer / Die-to-Die Planar Fusion) ──
    // Sub-micron pitch planar direct metal-to-metal & dielectric fusion
    if (showHybridBonding) {
      const parse = useEdaStore.getState().parseValue || (v => parseFloat(v) || 0);
      const hbComps = components.filter(c => {
        const t = (c.type || '').toLowerCase();
        const n = (c.name || '').toLowerCase();
        return t === 'hybrid_bond' || n.includes('hybrid');
      });

      const hbPositions = hbComps.length > 0
        ? hbComps.map(c => ({
          x: (parse(c.params?.pos_x || c.pos_x || 0)) / 1000,
          y: (parse(c.params?.pos_y || c.pos_y || 0)) / 1000,
          radius: (parse(c.params?.radius || '6')) / 1000
        }))
        : [
          { x: -0.5, y: 0.0, radius: 0.012 },
          { x: -0.2, y: 0.0, radius: 0.012 },
          { x: 0.2, y: 0.0, radius: 0.012 },
          { x: 0.5, y: 0.0, radius: 0.012 }
        ];

      const hybridMetal = [0.95, 0.35, 0.65, 1.0];  // Direct Cu-Cu / Al-Al direct contact pad
      const dielectricOxide = [0.28, 0.40, 0.55, 0.75]; // Polished SiO2 planar bonding surface

      // Flush bonding interface plane
      const ifW = chipW * 0.45;
      const ifH = chipH * 0.3;
      addQuad(
        [-ifW / 2, -ifH / 2, 0.003],
        [ifW / 2, -ifH / 2, 0.003],
        [ifW / 2, ifH / 2, 0.003],
        [-ifW / 2, ifH / 2, 0.003],
        [0, 0, 1],
        dielectricOxide,
        [0.65, 0.25, 0.50]
      );

      hbPositions.forEach(hp => {
        addDisc(hp.x, hp.y, 0.004, hp.radius, 12, true, hybridMetal, [0.50, 0.75, 0.35]);
        addCylinder(hp.x, hp.y, 0, 0.008, hp.radius, 12, hybridMetal, [0.50, 0.75, 0.35]);
      });
    }

    // ── 11. Redistribution Layers (RDL) ──
    // Multi-metal fan-out routing layers on the interposer
    if (showRDL) {
      const rdlTraceColor = [0.06, 0.78, 0.88, 1.0]; // Multi-layer RDL routing (cyan/teal)
      const rdlViaColor = [0.98, 0.72, 0.16, 1.0];   // Inter-metal via (IMV)

      // RDL breakout routing ribbons fanning out from central bump grid to periphery
      const rdlRoutes = [
        [[-chipW * 0.25, -chipH * 0.15], [-chipW * 0.38, -chipH * 0.32]],
        [[-chipW * 0.10, -chipH * 0.15], [-chipW * 0.15, -chipH * 0.35]],
        [[chipW * 0.10, -chipH * 0.15], [chipW * 0.15, -chipH * 0.35]],
        [[chipW * 0.25, -chipH * 0.15], [chipW * 0.38, -chipH * 0.32]],
        [[-chipW * 0.25, chipH * 0.15], [-chipW * 0.38, chipH * 0.32]],
        [[-chipW * 0.10, chipH * 0.15], [-chipW * 0.15, chipH * 0.35]],
        [[chipW * 0.10, chipH * 0.15], [chipW * 0.15, chipH * 0.35]],
        [[chipW * 0.25, chipH * 0.15], [chipW * 0.38, chipH * 0.32]]
      ];

      const rdlZ = -0.005 * effZ;
      const rdlHalfW = 0.006; // 12 um trace width

      rdlRoutes.forEach(([p0, p1]) => {
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * rdlHalfW;
        const ny = (dx / len) * rdlHalfW;

        addQuad(
          [p0[0] - nx, p0[1] - ny, rdlZ],
          [p0[0] + nx, p0[1] + ny, rdlZ],
          [p1[0] + nx, p1[1] + ny, rdlZ],
          [p1[0] - nx, p1[1] - ny, rdlZ],
          [0, 0, 1],
          rdlTraceColor,
          [0.55, 0.72, 0.30]
        );

        // Interlayer Vias (IMVs) at route endpoints
        addCylinder(p0[0], p0[1], rdlZ, 0.002, 0.008, 10, rdlViaColor, [0.40, 0.80, 0.25]);
        addCylinder(p1[0], p1[1], rdlZ, 0.002, 0.008, 10, rdlViaColor, [0.40, 0.80, 0.25]);
      });
    }

    // ── 12. Die-to-Die Interconnects: Modular Multi-QPU Bridge ──
    // Bridges across adjacent chiplets for modular multi-core QPUs
    if (showInterconnects) {
      const parse = useEdaStore.getState().parseValue || (v => parseFloat(v) || 0);
      const bridgeComps = components.filter(c => {
        const t = (c.type || '').toLowerCase();
        const n = (c.name || '').toLowerCase();
        return t === 'die_interconnect' || n.includes('bridge') || n.includes('interconnect');
      });

      const bridgeList = bridgeComps.length > 0
        ? bridgeComps.map(c => ({
          x: (parse(c.params?.pos_x || c.pos_x || 0)) / 1000,
          y: (parse(c.params?.pos_y || c.pos_y || 0)) / 1000,
          len: (parse(c.params?.length || '400')) / 1000,
          w: (parse(c.params?.width || '25')) / 1000
        }))
        : [
          // Standard modular die-to-die bridge chiplet spanning chip perimeter
          { x: chipW * 0.48, y: 0.0, len: 0.65, w: 0.18 }
        ];

      const bridgeSiCarrier = [0.12, 0.15, 0.20, 1.0]; // Silicon bridge carrier
      const bridgeConductor = [0.98, 0.78, 0.16, 1.0]; // Superconducting CPW bridge trace
      const bridgeZ = 0.025 * effZ;
      const bridgeThick = 0.015 * effZ;

      bridgeList.forEach(br => {
        const halfL = br.len / 2;
        const halfW = br.w / 2;

        // Bridge carrier silicon chiplet
        addQuad(
          [br.x - halfL, br.y - halfW, bridgeZ + bridgeThick],
          [br.x + halfL, br.y - halfW, bridgeZ + bridgeThick],
          [br.x + halfL, br.y + halfW, bridgeZ + bridgeThick],
          [br.x - halfL, br.y + halfW, bridgeZ + bridgeThick],
          [0, 0, 1],
          bridgeSiCarrier,
          [0.15, 0.10, 0.10]
        );

        // Center superconducting signal trace across bridge
        const trW = halfW * 0.35;
        addQuad(
          [br.x - halfL, br.y - trW, bridgeZ + bridgeThick + 0.002],
          [br.x + halfL, br.y - trW, bridgeZ + bridgeThick + 0.002],
          [br.x + halfL, br.y + trW, bridgeZ + bridgeThick + 0.002],
          [br.x - halfL, br.y + trW, bridgeZ + bridgeThick + 0.002],
          [0, 0, 1],
          bridgeConductor,
          [0.50, 0.82, 0.35]
        );

        // Micro-bump anchors on left and right dies
        addCylinder(br.x - halfL * 0.75, br.y, 0, bridgeZ, 0.020, 12, [0.85, 0.89, 0.94, 1.0], [0.40, 0.75, 0.30]);
        addCylinder(br.x + halfL * 0.75, br.y, 0, bridgeZ, 0.020, 12, [0.85, 0.89, 0.94, 1.0], [0.40, 0.75, 0.30]);
      });
    }

    const parse = useEdaStore.getState().parseValue || (v => parseFloat(v) || 0);
    const sources = [];
    components.forEach(c => {
      const px = (parse(c.params?.pos_x || c.pos_x || 0)) / 1000;
      const py = (parse(c.params?.pos_y || c.pos_y || 0)) / 1000;
      if (sources.length < 16) {
        sources.push([px, py]);
      }
    });
    const flatSources = new Float32Array(32);
    sources.forEach(([x, y], idx) => {
      flatSources[idx * 2] = x;
      flatSources[idx * 2 + 1] = y;
    });

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      colors: new Float32Array(colors),
      emData: new Float32Array(emData),
      flatSources,
      numSources: sources.length,
      vertexCount: positions.length / 3,
      stats: {
        activePinsCount,
        connectedNetsCount,
        tsvsCount,
        bumpsCount
      }
    };
  }, [
    chipDim, qg, components, zScale, stackExplode,
    showSubstrate, showMetal, showPockets, showJunctions, showAirbridges,
    showWirebonds, showTSVs, showMicroBumps, showHybridBonding, showMultiChipStack,
    showRDL, showInterconnects, selectedComponentId,
    showPins, showNets, thickTraces, netlist
  ]);

  // Viewport resize tracking for precise screen-space overlays
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setViewportSize({ width, height });
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Extract active pins for interactive 3D badges
  const activePinsList = useMemo(() => {
    if (!qg.pins) return [];
    const list = [];
    Object.entries(qg.pins).forEach(([compName, compPins]) => {
      const comp = components.find(c => c.name === compName || c.id === compName || String(c.id) === String(compName));
      const isSelected = comp?.id === selectedComponentId;

      Object.entries(compPins).forEach(([pinName, pin]) => {
        if (!pin.middle) return;
        const mx = pin.middle[0] / 1000;
        const my = pin.middle[1] / 1000;
        const isInput = pinName.toLowerCase().includes('in') ||
          pinName.toLowerCase().includes('flux') ||
          pinName.toLowerCase().includes('charge') ||
          pinName.toLowerCase().includes('control') ||
          pinName === 'a';
        const roleLabel = isInput ? 'IN' : 'OUT';

        const compChip = comp?.params?.chip || 'main';
        const isLaunchpad = compName.toLowerCase().startsWith('lp') || pinName.toLowerCase().includes('tie');
        const isQubitOrCoupler = !isLaunchpad && (pinName.toLowerCase().includes('cpl') || comp?.name?.toLowerCase().includes('q') || comp?.name?.toLowerCase().includes('qubit') || comp?.type?.toLowerCase().includes('transmon') || comp?.type?.toLowerCase().includes('coupler'));
        const isAssignedTop = compChip === 'Q_chip' || compChip === 'top' || compChip === 'chip_1';
        const isTopDie = isAssignedTop || (showMultiChipStack && isQubitOrCoupler);
        const zStandoff = (0.035 * zScale) * stackExplode;
        const pinZ = (isTopDie && showMultiChipStack ? zStandoff : 0) + 0.028 * zScale;

        list.push({
          id: `${compName}::${pinName}`,
          compName,
          pinName,
          compId: comp?.id,
          role: roleLabel,
          x: mx,
          y: my,
          z: pinZ,
          isSelected
        });
      });
    });
    return list;
  }, [qg.pins, components, selectedComponentId, zScale, showMultiChipStack, stackExplode]);

  // Project 3D pin coordinates into screen space (Smart Selective Display)
  const projectedPins = useMemo(() => {
    if (!showPinBadges || !containerRef.current) return [];
    const width = viewportSize.width;
    const height = viewportSize.height;
    if (!width || !height) return [];

    // Clutter prevention: Only show pin badges for the SELECTED component!
    // If no component is selected, keep the 3D chip view clean, aesthetic, and unobstructed.
    if (!selectedComponentId) return [];

    const candidatePins = activePinsList.filter(p => p.compId === selectedComponentId);
    if (candidatePins.length === 0) return [];

    const aspect = width / height;
    const eyeX = camera.target[0] + camera.distance * Math.cos(camera.elevation) * Math.sin(camera.azimuth);
    const eyeY = camera.target[1] - camera.distance * Math.cos(camera.elevation) * Math.cos(camera.azimuth);
    const eyeZ = camera.target[2] + camera.distance * Math.sin(camera.elevation);

    const projMatrix = mat4Perspective((42 * Math.PI) / 180, aspect, 0.1, 250.0);
    const viewMatrix = mat4LookAt([eyeX, eyeY, eyeZ], camera.target, [0, 0, 1]);
    const mvp = mat4Multiply(projMatrix, viewMatrix);

    const projected = [];
    for (const pin of candidatePins) {
      const x = pin.x;
      const y = pin.y;
      const z = pin.z;

      const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
      const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
      const cz = mvp[2] * x + mvp[6] * y + mvp[10] * z + mvp[14];
      const cw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];

      if (cw <= 0.05) continue;
      const ndcX = cx / cw;
      const ndcY = cy / cw;
      const ndcZ = cz / cw;

      if (ndcX < -1.05 || ndcX > 1.05 || ndcY < -1.05 || ndcY > 1.05 || ndcZ < -1.0 || ndcZ > 1.0) continue;

      const sx = (ndcX * 0.5 + 0.5) * width;
      const sy = (-ndcY * 0.5 + 0.5) * height;

      projected.push({
        ...pin,
        sx,
        sy,
        depth: ndcZ
      });
    }
    return projected;
  }, [showPinBadges, activePinsList, camera, viewportSize, selectedComponentId]);

  // ─── WebGL Render Loop ────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true });
    if (!gl) {
      console.error('[Chip3DViewer] WebGL not supported');
      return;
    }

    function compileShader(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compileShader(VS_SOURCE, gl.VERTEX_SHADER);
    const fs = compileShader(FS_SOURCE, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Buffers
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sceneMesh.positions, gl.STATIC_DRAW);

    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sceneMesh.normals, gl.STATIC_DRAW);

    const colBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sceneMesh.colors, gl.STATIC_DRAW);

    const emBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, emBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sceneMesh.emData, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    const aNorm = gl.getAttribLocation(program, 'a_normal');
    const aCol = gl.getAttribLocation(program, 'a_color');
    const aEm = gl.getAttribLocation(program, 'a_emData');

    const uMvp = gl.getUniformLocation(program, 'u_mvpMatrix');
    const uMv = gl.getUniformLocation(program, 'u_modelViewMatrix');
    const uNormMat = gl.getUniformLocation(program, 'u_normalMatrix');
    const uLightDir = gl.getUniformLocation(program, 'u_lightDir');
    const uSpec = gl.getUniformLocation(program, 'u_specularStrength');
    const uAmb = gl.getUniformLocation(program, 'u_ambientLight');
    const uEmMode = gl.getUniformLocation(program, 'u_emMode');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uSources = gl.getUniformLocation(program, 'u_sources');
    const uNumSources = gl.getUniformLocation(program, 'u_numSources');

    let animId;

    const render = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      if (bgTheme === 'white') {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
      } else {
        gl.clearColor(0.08, 0.09, 0.12, 1.0);
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const aspect = canvas.width / canvas.height;
      const eyeX = camera.target[0] + camera.distance * Math.cos(camera.elevation) * Math.sin(camera.azimuth);
      const eyeY = camera.target[1] - camera.distance * Math.cos(camera.elevation) * Math.cos(camera.azimuth);
      const eyeZ = camera.target[2] + camera.distance * Math.sin(camera.elevation);

      const projMatrix = mat4Perspective((42 * Math.PI) / 180, aspect, 0.1, 250.0);
      const viewMatrix = mat4LookAt([eyeX, eyeY, eyeZ], camera.target, [0, 0, 1]);
      const mvpMatrix = mat4Multiply(projMatrix, viewMatrix);
      const normMatrix = mat3FromMat4(viewMatrix);

      gl.uniformMatrix4fv(uMvp, false, mvpMatrix);
      gl.uniformMatrix4fv(uMv, false, viewMatrix);
      gl.uniformMatrix3fv(uNormMat, false, normMatrix);
      gl.uniform3f(uLightDir, 0.8, -0.6, 1.2);
      gl.uniform1f(uSpec, 0.45);
      gl.uniform1f(uAmb, 0.42);
      gl.uniform1i(uEmMode, emMode);
      gl.uniform1f(uTime, performance.now() * 0.001);
      if (uSources) gl.uniform2fv(uSources, sceneMesh.flatSources);
      if (uNumSources) gl.uniform1i(uNumSources, sceneMesh.numSources);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
      gl.enableVertexAttribArray(aNorm);
      gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
      gl.enableVertexAttribArray(aCol);
      gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, 0, 0);

      if (aEm !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, emBuffer);
        gl.enableVertexAttribArray(aEm);
        gl.vertexAttribPointer(aEm, 3, gl.FLOAT, false, 0, 0);
      }

      gl.drawArrays(gl.TRIANGLES, 0, sceneMesh.vertexCount);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      gl.deleteProgram(program);
      gl.deleteBuffer(posBuffer);
      gl.deleteBuffer(normBuffer);
      gl.deleteBuffer(colBuffer);
      gl.deleteBuffer(emBuffer);
    };
  }, [sceneMesh, camera, emMode, bgTheme]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', background: bgTheme === 'white' ? '#ffffff' : '#13161c' }}>

      {/* 3D Controls Toolbar */}
      <div style={{
        background: '#1a1e27',
        borderBottom: '1px solid #2d3342',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        zIndex: 20
      }}>
        {/* Preset Camera Views */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginRight: '2px' }}>Camera:</span>
          <button onClick={() => setPreset('isometric')} style={btnStyle} title="Isometric 3D Perspective (45°)">Isometric</button>
          <button onClick={() => setPreset('top')} style={btnStyle} title="Top-Down Planar Layout (90°)">Top-Down</button>
          <button onClick={() => setPreset('side')} style={btnStyle} title="Cross-Section Layer Stack Profile">Profile</button>
          <button onClick={() => setPreset('reset')} style={{ ...btnStyle, color: '#38bdf8' }} title="Reset Camera">Reset</button>
          <button
            onClick={() => setBgTheme(t => (t === 'white' ? 'dark' : 'white'))}
            style={{
              ...btnStyle,
              background: bgTheme === 'white' ? '#f8fafc' : '#272d3b',
              color: bgTheme === 'white' ? '#0f172a' : '#f8fafc',
              border: bgTheme === 'white' ? '1px solid #38bdf8' : '1px solid #3b4457',
              fontWeight: 600
            }}
            title="Toggle 3D Viewport Background (White / Dark)"
          >
            BG: {bgTheme === 'white' ? 'White' : 'Dark'}
          </button>
        </div>

        {/* Z-Exaggeration & Stack Explode Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Z-Scale:</span>
          {[1, 4, 8, 16].map(scale => (
            <button
              key={scale}
              onClick={() => setZScale(scale)}
              style={{
                ...btnStyle,
                background: zScale === scale ? '#38bdf8' : '#272d3b',
                color: zScale === scale ? '#0f172a' : '#d4d4d8',
                fontWeight: zScale === scale ? 700 : 500,
                padding: '2px 6px'
              }}
              title={`Vertical relief exaggeration: ${scale}x`}
            >
              {scale}x
            </button>
          ))}

          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginLeft: '6px' }}>Explode:</span>
          {[1.0, 1.8, 3.0].map(exp => (
            <button
              key={exp}
              onClick={() => setStackExplode(exp)}
              style={{
                ...btnStyle,
                background: stackExplode === exp ? '#fbbf24' : '#272d3b',
                color: stackExplode === exp ? '#0f172a' : '#d4d4d8',
                fontWeight: stackExplode === exp ? 700 : 500,
                padding: '2px 6px'
              }}
              title={`Separate stacked chips vertically: ${exp}x`}
            >
              {exp}x
            </button>
          ))}
        </div>

        {/* 3D Integration Technologies & Connectivity Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#cbd5e1', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showSubstrate} onChange={e => setShowSubstrate(e.target.checked)} />
            <span>Interposer</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showMultiChipStack} onChange={e => setShowMultiChipStack(e.target.checked)} />
            <span style={{ color: '#67e8f9' }}>3D Stack</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showTSVs} onChange={e => setShowTSVs(e.target.checked)} />
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>TSV</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showMicroBumps} onChange={e => setShowMicroBumps(e.target.checked)} />
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Micro-Bumps</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showHybridBonding} onChange={e => setShowHybridBonding(e.target.checked)} />
            <span style={{ color: '#f43f5e' }}>Hybrid Bond</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showRDL} onChange={e => setShowRDL(e.target.checked)} />
            <span style={{ color: '#2dd4bf' }}>RDL</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showInterconnects} onChange={e => setShowInterconnects(e.target.checked)} />
            <span style={{ color: '#fbbf24' }}>Die-to-Die</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showMetal} onChange={e => setShowMetal(e.target.checked)} />
            <span>Metal</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showAirbridges} onChange={e => setShowAirbridges(e.target.checked)} />
            <span>Airbridges</span>
          </label>

          <div style={{ height: '14px', width: '1px', background: '#3b4457', margin: '0 2px' }} />

          {/* Core 3D Connectivity Toggles */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            background: showPins ? 'rgba(239, 68, 68, 0.18)' : 'transparent',
            padding: '1px 6px',
            borderRadius: '4px',
            border: showPins ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent'
          }}>
            <input type="checkbox" checked={showPins} onChange={e => setShowPins(e.target.checked)} />
            <span style={{ color: '#f87171', fontWeight: 700 }}>Pins & Ports</span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            background: showNets ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
            padding: '1px 6px',
            borderRadius: '4px',
            border: showNets ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent'
          }}>
            <input type="checkbox" checked={showNets} onChange={e => setShowNets(e.target.checked)} />
            <span style={{ color: '#c084fc', fontWeight: 700 }}>Nets & Flight Lines</span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            background: showPinBadges ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
            padding: '1px 6px',
            borderRadius: '4px',
            border: showPinBadges ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent'
          }} title="Display interactive 3D pin labels for the selected component">
            <input type="checkbox" checked={showPinBadges} onChange={e => setShowPinBadges(e.target.checked)} />
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Pin Badges (Selection)</span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            background: thickTraces ? 'rgba(52, 211, 153, 0.18)' : 'transparent',
            padding: '1px 6px',
            borderRadius: '4px',
            border: thickTraces ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid transparent'
          }}>
            <input type="checkbox" checked={thickTraces} onChange={e => setThickTraces(e.target.checked)} />
            <span style={{ color: '#34d399', fontWeight: 600 }}>3D CPW Volume</span>
          </label>
        </div>
      </div>

      {/* HFSS Electromagnetic Field Energy Shading Mode Bar */}
      <div style={{
        background: '#151821',
        borderBottom: '1px solid #252c3a',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        zIndex: 19
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>HFSS EM Field Mode:</span>
          </span>
          <button
            onClick={() => setEmMode(0)}
            style={{
              ...btnStyle,
              background: emMode === 0 ? '#38bdf8' : '#202532',
              color: emMode === 0 ? '#0f172a' : '#d4d4d8',
              fontWeight: emMode === 0 ? 700 : 500
            }}
            title="Standard PBR Material Textures"
          >
            PBR Base
          </button>
          <button
            onClick={() => setEmMode(1)}
            style={{
              ...btnStyle,
              background: emMode === 1 ? '#e11d48' : '#202532',
              color: emMode === 1 ? '#ffffff' : '#f43f5e',
              fontWeight: emMode === 1 ? 700 : 500
            }}
            title="Electric Energy Density u_E = 1/4 ε |E|² (V/m field crowding at edges & gaps)"
          >
            u_E (E-Field)
          </button>
          <button
            onClick={() => setEmMode(2)}
            style={{
              ...btnStyle,
              background: emMode === 2 ? '#9333ea' : '#202532',
              color: emMode === 2 ? '#ffffff' : '#c084fc',
              fontWeight: emMode === 2 ? 700 : 500
            }}
            title="Magnetic Energy Density u_H = 1/4 μ |H|² (Circulating flux around lines & SQUIDs)"
          >
            u_H (H-Field)
          </button>
          <button
            onClick={() => setEmMode(3)}
            style={{
              ...btnStyle,
              background: emMode === 3 ? '#d97706' : '#202532',
              color: emMode === 3 ? '#ffffff' : '#fbbf24',
              fontWeight: emMode === 3 ? 700 : 500
            }}
            title="Energy Participation Ratio (EPR) & Surface TLS Dielectric Loss"
          >
            EPR Loss
          </button>
        </div>

        {/* Shortcut to HFSS Full S-Parameter Suite */}
        <button
          onClick={() => setActiveCanvasTab('HFSS Suite')}
          style={{
            ...btnStyle,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="Open Full Ansys HFSS Suite (S-Parameters, Smith Chart, Resonance & Loss Matrix)"
        >
          <span>Open HFSS S-Param Suite →</span>
        </button>
      </div>

      {/* WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: 'grab',
          background: bgTheme === 'white' ? '#ffffff' : '#13161c'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={e => e.preventDefault()}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Floating 3D Screen-Projected Pin Badges */}
        {showPinBadges && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {projectedPins.map(pin => (
              <div
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (pin.compId) selectComponent(pin.compId);
                }}
                style={{
                  position: 'absolute',
                  left: `${pin.sx}px`,
                  top: `${pin.sy}px`,
                  transform: 'translate(-50%, -100%)',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  background: pin.isSelected ? 'rgba(15, 23, 42, 0.96)' : 'rgba(30, 41, 59, 0.88)',
                  border: `1px solid ${pin.isSelected ? '#fbbf24' : pin.role === 'IN' ? '#f59e0b' : '#38bdf8'}`,
                  color: pin.isSelected ? '#fbbf24' : '#f8fafc',
                  boxShadow: pin.isSelected ? '0 0 12px rgba(251, 191, 36, 0.7)' : '0 2px 6px rgba(0,0,0,0.6)',
                  whiteSpace: 'nowrap',
                  zIndex: pin.isSelected ? 25 : 15,
                  userSelect: 'none',
                  transition: 'transform 0.1s ease, border-color 0.15s ease'
                }}
                title={`Component: ${pin.compName}\nPin: ${pin.pinName} [${pin.role}]\nClick to select component in EDA`}
              >
                <span style={{ color: pin.isSelected ? '#fbbf24' : '#94a3b8' }}>{pin.compName}:</span>
                <span style={{ color: pin.role === 'IN' ? '#38bdf8' : '#34d399' }}>{pin.pinName}</span>
                <span style={{
                  marginLeft: '4px',
                  fontSize: '8px',
                  background: pin.role === 'IN' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(52, 211, 153, 0.22)',
                  color: pin.role === 'IN' ? '#38bdf8' : '#34d399',
                  padding: '1px 3px',
                  borderRadius: '2px'
                }}>
                  {pin.role}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Helper Tip when Pin Badges toggle is on but no component is selected */}
        {showPinBadges && !selectedComponentId && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '10px',
            color: '#94a3b8',
            fontFamily: 'JetBrains Mono, monospace',
            pointerEvents: 'none',
            zIndex: 15,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Pin Badges:</span> Click any component to inspect its port pins
          </div>
        )}

        {/* Selected Component Quick Inspector */}
        {selectedComponentId && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(245, 158, 11, 0.6)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '11px',
            color: '#f8fafc',
            maxWidth: '300px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
            pointerEvents: 'none'
          }}>
            {(() => {
              const comp = components.find(c => c.id === selectedComponentId);
              if (!comp) return null;
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#fbbf24', fontSize: '12px' }}>{comp.name}</strong>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>{comp.type}</span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '10px' }}>
                    Position: ({comp.params?.pos_x || comp.pos_x || '0'}, {comp.params?.pos_y || comp.pos_y || '0'})
                  </div>
                  <div style={{ color: '#38bdf8', fontSize: '10px', marginTop: '4px' }}>
                    Active 3D Elevation: {(() => {
                      const isAssignedTop = comp.params?.chip === 'Q_chip';
                      const isQubitOrCoupler = comp.type?.toLowerCase().includes('qubit') || comp.type?.toLowerCase().includes('transmon') || comp.name?.toLowerCase().startsWith('q') || comp.type?.toLowerCase().includes('coupler');
                      const isTop = isAssignedTop || (showMultiChipStack && isQubitOrCoupler);
                      const zMm = isTop && showMultiChipStack
                        ? ((0.035 * zScale * stackExplode) + 0.012 * zScale).toFixed(3)
                        : (0.012 * zScale).toFixed(3);
                      return `Z = +${zMm} mm (${isTop && showMultiChipStack ? 'Q_chip Surface' : 'Carrier Interposer'})`;
                    })()}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  background: '#272d3b',
  border: '1px solid #3b4457',
  borderRadius: '5px',
  color: '#e2e8f0',
  padding: '3px 8px',
  fontSize: '11px',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};
