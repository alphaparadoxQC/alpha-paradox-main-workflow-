import React, { useRef, useEffect, useState } from 'react';
import { useEdaStore } from '../../stores/edaStore';
import Chip3DViewer from './Chip3DViewer';
import HFSSSuite from './HFSSSuite';
import { getMaterialVisuals, getComponentVisuals, COMPONENT_ROLE_PALETTE } from './edaColors';

export default function PhysicalCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const components = useEdaStore(state => state.components);
  const chips = useEdaStore(state => state.chips);
  const selectedComponentId = useEdaStore(state => state.selectedComponentId);
  const selectComponent = useEdaStore(state => state.selectComponent);
  const updateComponentParams = useEdaStore(state => state.updateComponentParams);
  const getQGeometry = useEdaStore(state => state.getQGeometry);
  const get_net_info = useEdaStore(state => state.get_net_info);

  const [activeLayer, setActiveLayer] = useState('all');
  const [toolMode, setToolMode] = useState('select');
  const [rulerStart, setRulerStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // world coords in mm
  const [lastClickPos, setLastClickPos] = useState({ x: 0, y: 0 });
  // Scale: 1 canvas pixel = how many um. Initial: chip fits in view.
  const [transform, setTransform] = useState({ x: 400, y: 300, scale: 0.08 });
  const [qgFilterType, setQgFilterType] = useState('path');
  const [qgFilterComp, setQgFilterComp] = useState('');
  const [qgFilterLayer, setQgFilterLayer] = useState('');
  const [showCheesing, setShowCheesing] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const serverQg = useEdaStore(state => state.server_qgeometry);
  const localQg = React.useMemo(() => (getQGeometry ? getQGeometry() : { path: [], poly: [], junction: [], pins: {} }), [getQGeometry, components]);
  
  // Merge server & local QGeometry:
  // If server has geometries for a component, use server; if any component in design is missing from server (e.g. unpinned routes), include localQg geometries!
  const qg = React.useMemo(() => {
    if (!serverQg) return localQg;
    
    const serverComps = new Set([
      ...(serverQg.poly || []).map(g => g.component),
      ...(serverQg.path || []).map(g => g.component),
      ...(serverQg.junction || []).map(g => g.component)
    ]);
    
    return {
      poly: [
        ...(serverQg.poly || []),
        ...(localQg.poly || []).filter(g => !serverComps.has(g.component))
      ],
      path: [
        ...(serverQg.path || []),
        ...(localQg.path || []).filter(g => !serverComps.has(g.component))
      ],
      junction: [
        ...(serverQg.junction || []),
        ...(localQg.junction || []).filter(g => !serverComps.has(g.component))
      ],
      pins: {
        ...(localQg.pins || {}),
        ...(serverQg.pins || {})
      }
    };
  }, [serverQg, localQg]);

  // Auto-Pan to Component when selected from the library
  useEffect(() => {
    if (selectedComponentId) {
      const comp = components.find(c => c.id === selectedComponentId);
      if (comp && comp.params && containerRef.current) {
        const parse = useEdaStore.getState().parseValue;
        const rawX = comp.params.pos_x || comp.params.start_x;
        const rawY = comp.params.pos_y || comp.params.start_y;
        if (rawX !== undefined && rawY !== undefined) {
          const px = Number(parse(rawX));
          const py = Number(parse(rawY));
          if (!isNaN(px) && !isNaN(py)) {
            const rect = containerRef.current.getBoundingClientRect();
            setTransform(t => ({
              ...t,
              x: (rect.width / 2) - (px * t.scale),
              y: (rect.height / 2) + (py * t.scale) // + because cartesian Y goes UP
            }));
          }
        }
      }
    }
  }, [selectedComponentId, components]);

  // Wheel zoom + pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.002;
        const newScale = Math.min(Math.max(0.01, transform.scale * (1 + delta)), 1000000);
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const newX = mx - (mx - transform.x) * (newScale / transform.scale);
        const newY = my - (my - transform.y) * (newScale / transform.scale);
        setTransform({ x: newX, y: newY, scale: newScale });
      } else {
        setTransform(t => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [transform]);

  // Main render loop
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const W = rect.width, H = rect.height;
      if (W === 0 || H === 0) return;

    // ── White background ──
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Grid drawing ──
    ctx.save();
    const gridSpacing = 20; // screen pixels for dot grid
    ctx.fillStyle = '#e5e5e5';
    for (let x = (transform.x % gridSpacing); x < W; x += gridSpacing) {
      for (let y = (transform.y % gridSpacing); y < H; y += gridSpacing) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }
    ctx.restore();

    const parse = useEdaStore.getState().parseValue;
    const s = transform.scale; // px per um

    // ── Axis tick labels (in mm, like matplotlib) ──
    ctx.save();
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Determine tick spacing in um based on zoom level
    const visibleUm = W / s;
    let tickUm = Math.pow(10, Math.floor(Math.log10(visibleUm / 10)));
    if (visibleUm / tickUm > 5) tickUm *= 2;

    const leftWorldX = -transform.x / s;
    const rightWorldX = (W - transform.x) / s;
    
    // In Cartesian, top of screen has higher Y.
    // screenY = transform.y - worldY * s  =>  worldY = (transform.y - screenY) / s
    const topWorldY = transform.y / s;
    const bottomWorldY = (transform.y - H) / s;

    const minTickX = Math.ceil(leftWorldX / tickUm) * tickUm;
    const maxTickX = Math.floor(rightWorldX / tickUm) * tickUm;
    
    const minTickY = Math.ceil(bottomWorldY / tickUm) * tickUm;
    const maxTickY = Math.floor(topWorldY / tickUm) * tickUm;

    // X-axis labels along bottom
    for (let u = minTickX; u <= maxTickX; u += tickUm) {
      const px = transform.x + u * s;
      if (px > 40 && px < W - 10) {
        ctx.fillText((u / 1000).toFixed(1), px, H - 18);
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, H - 22);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    // Y-axis labels along left
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let u = minTickY; u <= maxTickY; u += tickUm) {
      const py = transform.y - u * s;
      if (py > 10 && py < H - 20) {
        ctx.fillText((u / 1000).toFixed(1), 38, py);
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(42, py);
        ctx.lineTo(W, py);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    ctx.restore();

    // ── Draw in world space ──
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(s, -s);

    // ── Origin axes ──
    ctx.beginPath();
    ctx.moveTo(leftWorldX, 0); ctx.lineTo(rightWorldX, 0);
    ctx.moveTo(0, topWorldY); ctx.lineTo(0, bottomWorldY);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1.5 / s;
    ctx.stroke();

    // ── Chip boundary (Material-aware substrate colors: Silicon, Sapphire, GaAs, Quartz) ──
    Object.entries(chips).forEach(([chipName, chipDef]) => {
      if (activeLayer !== 'all' && activeLayer !== chipName) return;

      const chipW = parse(chipDef.size_x || chipDef.size?.size_x || '9mm');
      const chipH = parse(chipDef.size_y || chipDef.size?.size_y || '6mm');
      
      const mat = getMaterialVisuals(chipDef.material);
      const isMain = chipName === 'main';

      ctx.fillStyle = mat.bg2D;
      ctx.fillRect(-chipW / 2, -chipH / 2, chipW, chipH);
      ctx.strokeStyle = mat.border2D;
      ctx.lineWidth = 2 / s;
      ctx.strokeRect(-chipW / 2, -chipH / 2, chipW, chipH);
      
      // Live Cheesing Visual Preview (CMP ground perforation)
      if (showCheesing && isMain) {
        ctx.save();
        ctx.fillStyle = '#ffffff'; // white voids etched into ground metal
        const step = 180; // 180um step
        const holeSize = 50; // 50um hole
        const minX = -chipW / 2 + 150;
        const maxX = chipW / 2 - 150;
        const minY = -chipH / 2 + 150;
        const maxY = chipH / 2 - 150;
        
        for (let cx = minX; cx <= maxX; cx += step) {
          for (let cy = minY; cy <= maxY; cy += step) {
            let inKeepout = false;
            for (const comp of components) {
              const compX = Number(parse(comp.params?.pos_x || comp.params?.start_x || 0));
              const compY = Number(parse(comp.params?.pos_y || comp.params?.start_y || 0));
              if (Math.hypot(cx - compX, cy - compY) < 550) {
                inKeepout = true;
                break;
              }
            }
            if (!inKeepout) {
              ctx.fillRect(cx - holeSize / 2, cy - holeSize / 2, holeSize, holeSize);
            }
          }
        }
        ctx.restore();
      }

      // Draw chip name & material badge in top left
      ctx.save();
      ctx.translate(-chipW / 2 + 5, -chipH / 2 + 15);
      ctx.scale(1 / s, -1 / s);
      ctx.fillStyle = mat.text2D;
      ctx.font = 'bold 12px JetBrains Mono, monospace, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${chipName} (${mat.name}, \u03b5r=${mat.eps_r})`, 0, 0);
      ctx.restore();
    });

    // ── Render QGeometry ──
    // qg is defined in component scope

    // Filter QGeometry based on active layer
    const getCompChip = (compName) => {
      const c = components.find(c => c.name === compName);
      return c ? c.params.chip : 'main';
    };

    const filterActive = (geoArr) => geoArr.filter(g => {
      if (activeLayer === 'all') return true;
      return getCompChip(g.component) === activeLayer;
    });

    const activePolys = filterActive(qg.poly);
    const activePaths = filterActive(qg.path);
    const activeJunctions = filterActive(qg.junction);

    // Parse WKT-like geometry strings back to coordinate arrays
    const parseCoords = (geoStr) => {
      // Strip out shape names and parentheses (e.g., 'LINESTRING(', 'POLYGON((', '))')
      const inner = geoStr.replace(/^[A-Z]+\s*\(/, '').replace(/^[A-Z]+\s*\(\(/, '').replace(/\)+$/, '').replace(/^\(/, '');
      if (!inner) return [];
      return inner.split(',').map(s => {
        const parts = s.trim().split(/\s+/);
        return [parseFloat(parts[0]), parseFloat(parts[1])];
      });
    };

    // Sort polygons so subtractive shapes (pockets) draw first, behind the alpha
    const sortedPolys = [...activePolys].sort((a, b) => {
      if (a.subtract === b.subtract) return 0;
      return a.subtract ? -1 : 1; 
    });

    // Draw polygons
    sortedPolys.forEach(p => {
      const coords = p.points ? p.points : parseCoords(p.geometry);
      if (coords.length < 3) return;
      
      ctx.beginPath();
      ctx.moveTo(coords[0][0], coords[0][1]);
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i][0], coords[i][1]);
      }
      ctx.closePath();

      if (p.subtract) {
        // Ground plane cutout: semi-transparent gray fill + dashed border matching Qiskit Metal
        ctx.fillStyle = 'rgba(215, 215, 215, 0.65)';
        ctx.fill();
        ctx.save();
        ctx.setLineDash([4 / s, 3 / s]);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2 / s;
        ctx.stroke();
        ctx.restore();
      } else {
        // Metal conductor island: Semantic color coding (Qubit, Coupler, Resonator, Launchpad, Interconnect)
        const comp = components.find(c => c.name === p.component || c.id === p.component || String(c.id) === String(p.component));
        const isSelected = comp?.id === selectedComponentId;
        const visual = getComponentVisuals(comp, isSelected, false, p.chip || comp?.params?.chip);

        ctx.fillStyle = visual.hex;
        ctx.fill();
        ctx.strokeStyle = visual.strokeHex;
        ctx.lineWidth = isSelected ? 2.2 / s : 1.2 / s;
        ctx.stroke();
      }
    });

    // Sort paths so subtractive paths draw first
    const sortedPaths = [...activePaths].sort((a, b) => {
      if (a.subtract === b.subtract) return 0;
      return a.subtract ? -1 : 1;
    });

    // Draw paths (CPW traces)
    sortedPaths.forEach(p => {
      const coords = p.points ? p.points : parseCoords(p.geometry);
      if (coords.length < 2) return;

      const rawFillet = p.fillet !== undefined && p.fillet !== null && p.fillet !== '' ? p.fillet : 0;
      const parsedFillet = Number(parse(rawFillet));
      const r = !isNaN(parsedFillet) ? parsedFillet : 0;
      ctx.beginPath();
      ctx.moveTo(coords[0][0], coords[0][1]);
      
      if (r > 0 && coords.length > 2) {
        for (let i = 1; i < coords.length - 1; i++) {
          const prev = coords[i - 1];
          const curr = coords[i];
          const next = coords[i + 1];
          const d1 = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
          const d2 = Math.hypot(next[0] - curr[0], next[1] - curr[1]);
          const cornerR = Math.max(0, Math.min(r, (d1 / 2) - 1, (d2 / 2) - 1));
          if (cornerR > 2) {
            ctx.arcTo(curr[0], curr[1], next[0], next[1], cornerR);
          } else {
            ctx.lineTo(curr[0], curr[1]);
          }
        }
        ctx.lineTo(coords[coords.length - 1][0], coords[coords.length - 1][1]);
      } else {
        for (let i = 1; i < coords.length; i++) {
          ctx.lineTo(coords[i][0], coords[i][1]);
        }
      }
      
      const comp = components.find(c => c.name === p.component || c.id === p.component || String(c.id) === String(p.component));
      const isSelected = comp?.id === selectedComponentId;
      const rawWidth = p.width || (p.subtract ? 22 : 10);
      const minPxWidth = p.subtract ? (4.0 / s) : (2.0 / s);
      const effectiveWidth = Math.max(minPxWidth, rawWidth);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (p.subtract) {
        ctx.strokeStyle = 'rgba(215, 215, 215, 0.65)';
        ctx.lineWidth = effectiveWidth;
        ctx.stroke();
      } else {
        const visual = getComponentVisuals(comp, isSelected, false, p.chip || comp?.params?.chip);
        ctx.strokeStyle = visual.hex;
        ctx.lineWidth = effectiveWidth;
        ctx.stroke();
      }
    });

    // Draw junctions (red/orange lines)
    activeJunctions.forEach(j => {
      const coords = j.points ? j.points : parseCoords(j.geometry);
      if (coords.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(coords[0][0], coords[0][1]);
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i][0], coords[i][1]);
      }
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = Math.max(2.0 / s, j.width || 2);
      ctx.stroke();

      // Draw a small X at junction center to mark the JJ
      const cx = (coords[0][0] + coords[coords.length-1][0]) / 2;
      const cy = (coords[0][1] + coords[coords.length-1][1]) / 2;
      const sz = 4 / s; // 4 pixels on screen
      ctx.beginPath();
      ctx.moveTo(cx - sz, cy - sz); ctx.lineTo(cx + sz, cy + sz);
      ctx.moveTo(cx + sz, cy - sz); ctx.lineTo(cx - sz, cy + sz);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.5 / s;
      ctx.stroke();
    });

    // ── Draw CPW Pins / Port Indicators ──
    if (qg.pins) {
      Object.entries(qg.pins).forEach(([compName, compPins]) => {
        const comp = components.find(c => c.name === compName || c.id === compName || String(c.id) === String(compName));
        const isSelected = comp?.id === selectedComponentId;
        
        Object.entries(compPins).forEach(([pinName, pin]) => {
          if (!pin.middle) return;
          const [mx, my] = pin.middle;

          // Draw pin terminal line across the conductor (red line matching Qiskit Metal)
          ctx.save();
          if (pin.points && pin.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(pin.points[0][0], pin.points[0][1]);
            ctx.lineTo(pin.points[1][0], pin.points[1][1]);
            ctx.strokeStyle = isSelected ? '#ff3333' : '#e74c3c';
            ctx.lineWidth = Math.max(2.0 / s, 2.5);
            ctx.stroke();
          }

          // Outward normal directional arrow from port middle
          if (pin.normal) {
            const arrLen = 14 / s;
            const nx = mx + pin.normal[0] * arrLen;
            const ny = my + pin.normal[1] * arrLen;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(nx, ny);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1.5 / s;
            ctx.stroke();

            // Arrow head
            const aHead = 4.5 / s;
            const angle = Math.atan2(pin.normal[1], pin.normal[0]);
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(nx - aHead * Math.cos(angle - Math.PI / 6), ny - aHead * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(nx, ny);
            ctx.lineTo(nx - aHead * Math.cos(angle + Math.PI / 6), ny - aHead * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
          ctx.restore();

          if (showLabels && (s >= 0.12 || isSelected)) {
            // Port Badge / Label: display port badge when zoomed in or component selected
            ctx.save();
            ctx.translate(mx, my);
            ctx.scale(1 / s, -1 / s); // keep label upright in screen space
            
            const isInput = pinName.toLowerCase().includes('in') || 
                            pinName.toLowerCase().includes('flux') || 
                            pinName.toLowerCase().includes('charge') || 
                            pinName.toLowerCase().includes('control') || 
                            pinName === 'a';
            const roleLabel = isInput ? 'IN' : 'OUT';
            const badgeText = `${pinName} [${roleLabel}]`;
            ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
            const textMetrics = ctx.measureText(badgeText);
            const bw = textMetrics.width + 10;
            const bh = 14;
            const badgeY = (pin.normal && pin.normal[1] < 0) ? 8 : -20;
            
            // Badge background pill
            ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 41, 59, 0.88)';
            ctx.strokeStyle = isInput ? '#f59e0b' : '#38bdf8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(-bw / 2, badgeY, bw, bh, 3);
            } else {
              ctx.rect(-bw / 2, badgeY, bw, bh);
            }
            ctx.fill();
            ctx.stroke();
            
            // Badge text
            ctx.fillStyle = isInput ? '#fbbf24' : '#7dd3fc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, 0, badgeY + bh / 2);
            ctx.restore();
          }
        });
      });
    }

    // ── Selection highlight ──
    components.forEach(comp => {
      if (comp.id !== selectedComponentId) return;

      // Find all points belonging to this component across polygons and paths
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      [...(activePolys || []), ...(activePaths || [])].forEach(g => {
        if (g.component === comp.name || g.component === comp.id || String(g.component) === String(comp.id)) {
          const coords = g.points ? g.points : parseCoords(g.geometry);
          coords.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          });
        }
      });

      ctx.save();
      ctx.setLineDash([8 / s, 4 / s]);
      ctx.strokeStyle = '#007acc';
      ctx.lineWidth = 1.5 / s;

      if (isFinite(minX) && isFinite(maxX)) {
        const pad = Math.max(50, 10 / s);
        ctx.strokeRect(minX - pad, minY - pad, (maxX - minX) + 2 * pad, (maxY - minY) + 2 * pad);
      } else {
        const px = parse(comp.params.pos_x || '0');
        const py = parse(comp.params.pos_y || '0');
        ctx.strokeRect(px - 150, py - 150, 300, 300);
      }
      ctx.setLineDash([]);
      ctx.restore();
    });

    ctx.restore();

    // ── Alpha Paradox watermark ──
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.font = 'italic 28px serif';
    ctx.textAlign = 'right';
    ctx.fillText('Alpha Paradox', W - 15, H - 30);
    ctx.restore();
    } catch (renderErr) {
      console.error('PhysicalCanvas render loop error:', renderErr);
    }
  }, [components, selectedComponentId, transform, chips, serverQg, qg]);

  // ── Pointer handlers ──
  const handlePointerDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - transform.x) / transform.scale;
    const worldY = -(e.clientY - rect.top - transform.y) / transform.scale;
    const parse = useEdaStore.getState().parseValue;

    setLastClickPos({ x: worldX / 1000, y: worldY / 1000 });
    
    if (toolMode === 'get_point') {
      alert(`Point Coordinates:\nX: ${(worldX / 1000).toFixed(3)} mm\nY: ${(worldY / 1000).toFixed(3)} mm`);
      setToolMode('select');
      return;
    }
    
    if (toolMode === 'ruler') {
      if (!rulerStart) {
        setRulerStart({ x: worldX, y: worldY });
      } else {
        const dx = (worldX - rulerStart.x) / 1000;
        const dy = (worldY - rulerStart.y) / 1000;
        const dist = Math.sqrt(dx*dx + dy*dy);
        alert(`Distance: ${dist.toFixed(4)} mm`);
        setRulerStart(null);
        setToolMode('select');
      }
      return;
    }

    let clickedId = null;
    for (let i = components.length - 1; i >= 0; i--) {
      const comp = components[i];
      if (!comp?.params) continue;
      const rawX = comp.params.pos_x || comp.params.start_x;
      const rawY = comp.params.pos_y || comp.params.start_y;
      if (rawX === undefined || rawY === undefined) continue;
      const px = Number(parse(rawX));
      const py = Number(parse(rawY));
      if (isNaN(px) || isNaN(py)) continue;
      const hitRadius = 150; // um
      if (Math.abs(worldX - px) < hitRadius && Math.abs(worldY - py) < hitRadius) {
        clickedId = comp.id;
        break;
      }
    }
    selectComponent(clickedId);
    if (clickedId) {
      const comp = components.find(c => c.id === clickedId);
      if (comp?.params?.pos_x !== undefined && comp?.params?.pos_y !== undefined) {
        const cx = Number(parse(comp.params.pos_x));
        const cy = Number(parse(comp.params.pos_y));
        if (!isNaN(cx) && !isNaN(cy)) {
          setIsDragging(true);
          setDragOffset({ x: worldX - cx, y: worldY - cy });
        }
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - transform.x) / transform.scale;
    const worldY = -(e.clientY - rect.top - transform.y) / transform.scale;
    setMousePos({ x: worldX / 1000, y: worldY / 1000 }); // convert um -> mm for display

    if (!isDragging || !selectedComponentId) return;
    if (isNaN(worldX) || isNaN(worldY) || !dragOffset || isNaN(dragOffset.x) || isNaN(dragOffset.y)) return;
    updateComponentParams(selectedComponentId, {
      pos_x: `${Math.round(worldX - dragOffset.x)}um`,
      pos_y: `${Math.round(worldY - dragOffset.y)}um`
    });
  };

  const handlePointerUp = () => setIsDragging(false);

  // Autoscale: fit active chip in view
  const handleAutoscale = React.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const parse = useEdaStore.getState().parseValue;

    let maxW = 0, maxH = 0;
    let centerX = 0, centerY = 0;
    const chipList = Object.values(chips || {});
    if (chipList.length === 0) return;

    chipList.forEach(chip => {
      const w = parse(chip.size_x || chip.size?.size_x || '9mm');
      const h = parse(chip.size_y || chip.size?.size_y || '6mm');
      maxW = Math.max(maxW, w);
      maxH = Math.max(maxH, h);
      if (chip.center_x) centerX = parse(chip.center_x);
      if (chip.center_y) centerY = parse(chip.center_y);
    });
    if (maxW === 0 || maxH === 0) return;

    const scaleX = (rect.width - 60) / maxW;
    const scaleY = (rect.height - 60) / maxH;
    const s = Math.min(scaleX, scaleY);
    setTransform({
      x: (rect.width / 2) - (centerX * s),
      y: (rect.height / 2) + (centerY * s),
      scale: s
    });
  }, [chips]);

  // Automatically trigger autoscale when chips or server_qgeometry loads or window resizes
  useEffect(() => {
    handleAutoscale();
    const handleResize = () => handleAutoscale();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chips, serverQg, handleAutoscale]);

  const activeTab = useEdaStore(state => state.activeCanvasTab || 'Main View');
  const setActiveTab = useEdaStore(state => state.setActiveCanvasTab);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
      {/* Canvas Tabs */}
      <div style={{ display: 'flex', background: '#333333', borderBottom: '1px solid #252526', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex' }}>
          <div 
            onClick={() => setActiveTab('Main View')}
            style={{ cursor: 'pointer', padding: '4px 12px', background: activeTab === 'Main View' ? '#1e1e1e' : 'transparent', color: activeTab === 'Main View' ? 'white' : '#9ca3af', borderRight: '1px solid #1e1e1e', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            Main View
          </div>
          <div 
            onClick={() => setActiveTab('3D View')}
            style={{ cursor: 'pointer', padding: '4px 12px', background: activeTab === '3D View' ? '#1e1e1e' : 'transparent', color: activeTab === '3D View' ? '#38bdf8' : '#9ca3af', borderRight: '1px solid #1e1e1e', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: activeTab === '3D View' ? 600 : 400 }}
          >
            3D View
          </div>
          <div 
            onClick={() => setActiveTab('QGeometry')}
            style={{ cursor: 'pointer', padding: '4px 12px', background: activeTab === 'QGeometry' ? '#1e1e1e' : 'transparent', color: activeTab === 'QGeometry' ? 'white' : '#9ca3af', borderRight: '1px solid #1e1e1e', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            QGeometry
          </div>
          <div 
            onClick={() => setActiveTab('Net List')}
            style={{ cursor: 'pointer', padding: '4px 12px', background: activeTab === 'Net List' ? '#1e1e1e' : 'transparent', color: activeTab === 'Net List' ? 'white' : '#9ca3af', borderRight: '1px solid #1e1e1e', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            Net List
          </div>
          <div 
            onClick={() => setActiveTab('HFSS Suite')}
            style={{ cursor: 'pointer', padding: '4px 12px', background: activeTab === 'HFSS Suite' ? '#1e1e1e' : 'transparent', color: activeTab === 'HFSS Suite' ? '#38bdf8' : '#9ca3af', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: activeTab === 'HFSS Suite' ? 600 : 400 }}
          >
            HFSS Suite
          </div>
        </div>
        
        {/* MultiPlanar Layer Selector */}
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: '10px', fontSize: '11px', color: '#d4d4d4' }}>
          <span style={{ marginRight: '5px' }}>MultiPlanar Layer:</span>
          <select 
            value={activeLayer} 
            onChange={e => setActiveLayer(e.target.value)}
            style={{ background: '#252526', color: '#d4d4d4', border: '1px solid #3f3f46', fontSize: '10px' }}
          >
            <option value="all">All Layers</option>
            {Object.keys(chips).map(chipName => (
              <option key={chipName} value={chipName}>{chipName} (Layer {chips[chipName].layer_stack || 1})</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 2D Canvas Toolbar (Shown only in Main View) */}
      {activeTab === 'Main View' && (
        <div style={{ background: '#2d2d30', padding: '4px 10px', display: 'flex', gap: '12px', borderBottom: '1px solid #3f3f46', alignItems: 'center' }}>
          <CanvasTool icon="?" label="Help" onClick={() => alert("Alpha Paradox Canvas Help\n\n- Scroll to zoom\n- Middle click or drag background to pan\n- Click components to select\n- Use toolbar to measure, preview cheesing, and inspect geometry")} />
          <CanvasTool icon="[ ]" label="Autoscale" onClick={handleAutoscale} />
          <CanvasTool icon="+" label="Zoom In" onClick={() => setTransform(t => ({ ...t, scale: Math.min(1000, t.scale * 1.3) }))} />
          <CanvasTool icon="-" label="Zoom Out" onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.005, t.scale / 1.3) }))} />
          <div style={{ width: '1px', height: '18px', background: '#3f3f46' }} />
          <CanvasTool 
            icon="CMP" 
            label="Cheesing" 
            active={showCheesing}
            onClick={() => setShowCheesing(!showCheesing)} 
          />
          <CanvasTool 
            icon="Tags" 
            label="Labels" 
            active={showLabels}
            onClick={() => setShowLabels(!showLabels)} 
          />
          <div style={{ width: '1px', height: '18px', background: '#3f3f46' }} />
          <CanvasTool 
            icon="(x,y)" 
            label="Get point" 
            active={toolMode === 'get_point'}
            onClick={() => setToolMode(toolMode === 'get_point' ? 'select' : 'get_point')} 
          />
          <CanvasTool 
            icon="Dist" 
            label="Ruler" 
            active={toolMode === 'ruler'}
            onClick={() => {
              setToolMode(toolMode === 'ruler' ? 'select' : 'ruler');
              setRulerStart(null);
            }} 
          />
        </div>
      )}

      {/* 3D View Container */}
      {activeTab === '3D View' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Chip3DViewer />
        </div>
      )}

      {/* HFSS EM Suite Container */}
      {activeTab === 'HFSS Suite' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <HFSSSuite />
        </div>
      )}

      <div 
        ref={containerRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: activeTab === 'Main View' ? '#ffffff' : '#1e1e1e', display: (activeTab === '3D View' || activeTab === 'HFSS Suite') ? 'none' : 'block' }}
        onPointerDown={activeTab === 'Main View' ? handlePointerDown : undefined}
        onPointerMove={activeTab === 'Main View' ? handlePointerMove : undefined}
        onPointerUp={activeTab === 'Main View' ? handlePointerUp : undefined}
        onPointerLeave={activeTab === 'Main View' ? handlePointerUp : undefined}
      >
        {activeTab === 'Main View' && (
          <>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block', cursor: isDragging ? 'grabbing' : 'crosshair' }}
            />

            {/* AnimatedText HUD Overlay (Link 10) */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '16px',
              background: 'rgba(24, 24, 27, 0.88)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(63, 63, 70, 0.6)',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '11px',
              color: '#d4d4d8',
              fontFamily: 'JetBrains Mono, monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 10
            }}>
              <span>X: <strong style={{ color: '#38bdf8' }}>{mousePos.x.toFixed(3)}</strong> mm</span>
              <span>Y: <strong style={{ color: '#38bdf8' }}>{mousePos.y.toFixed(3)}</strong> mm</span>
              <span>Zoom: <strong style={{ color: '#34d399' }}>{(transform.scale * 100).toFixed(0)}%</strong></span>
              {showCheesing && (
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>CMP Cheesing Active</span>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'Net List' && (
          <div style={{ padding: '15px', height: '100%', overflowY: 'auto', color: '#d4d4d4' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal', color: '#569cd6' }}>QNet - Net Information (DataFrame)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'Consolas, monospace' }}>
              <thead>
                <tr style={{ background: '#2d2d30', textAlign: 'left', borderBottom: '1px solid #3f3f46' }}>
                  <th style={{ padding: '6px' }}>net_id</th>
                  <th style={{ padding: '6px' }}>component_name</th>
                  <th style={{ padding: '6px' }}>pin_name</th>
                </tr>
              </thead>
              <tbody>
                {get_net_info && get_net_info().length > 0 ? (
                  get_net_info().map((net, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #2d2d30', background: i % 2 === 0 ? '#1e1e1e' : '#252526' }}>
                      <td style={{ padding: '6px', color: '#b5cea8' }}>{net.net_id}</td>
                      <td style={{ padding: '6px', color: '#ce9178' }}>{net.component_name}</td>
                      <td style={{ padding: '6px', color: '#9cdcfe' }}>{net.pin_name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '10px', textAlign: 'center', color: '#666' }}>Empty DataFrame (No pins connected)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'QGeometry' && (
           <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#d4d4d4', background: '#1e1e1e', fontSize: '12px' }}>
             <div style={{ display: 'flex', alignItems: 'center', padding: '8px', background: '#2d2d30', borderBottom: '1px solid #1e1e1e', gap: '15px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <span>QGeometry type:</span>
                 <select 
                   value={qgFilterType} 
                   onChange={e => setQgFilterType(e.target.value)}
                   style={{ background: '#3c3c3c', color: 'white', border: '1px solid #555', padding: '2px 5px', fontSize: '11px', outline: 'none' }}
                 >
                   <option value="path">path</option>
                   <option value="poly">poly</option>
                   <option value="junction">junction</option>
                 </select>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <span>Filter: Component:</span>
                 <input 
                   type="text" 
                   value={qgFilterComp} 
                   onChange={e => setQgFilterComp(e.target.value)}
                   style={{ background: '#3c3c3c', color: 'white', border: '1px solid #555', padding: '2px 5px', width: '80px', fontSize: '11px', outline: 'none' }}
                 />
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <span>Layer:</span>
                 <input 
                   type="text" 
                   value={qgFilterLayer} 
                   onChange={e => setQgFilterLayer(e.target.value)}
                   style={{ background: '#3c3c3c', color: 'white', border: '1px solid #555', padding: '2px 5px', width: '80px', fontSize: '11px', outline: 'none' }}
                 />
               </div>
             </div>
             <div style={{ flex: 1, overflowY: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                 <thead style={{ background: '#252526', position: 'sticky', top: 0 }}>
                   <tr>
                     <th style={{ padding: '6px', borderBottom: '1px solid #333', borderRight: '1px solid #333' }}>component</th>
                     <th style={{ padding: '6px', borderBottom: '1px solid #333', borderRight: '1px solid #333' }}>name</th>
                     <th style={{ padding: '6px', borderBottom: '1px solid #333', borderRight: '1px solid #333' }}>geometry</th>
                     <th style={{ padding: '6px', borderBottom: '1px solid #333', borderRight: '1px solid #333' }}>layer</th>
                     <th style={{ padding: '6px', borderBottom: '1px solid #333', borderRight: '1px solid #333' }}>subtract</th>
                     <th style={{ padding: '6px', borderBottom: '1px solid #333', borderRight: '1px solid #333' }}>helper</th>
                     <th style={{ padding: '6px', borderBottom: '1px solid #333', borderRight: '1px solid #333' }}>chip</th>
                     <th style={{ padding: '6px', borderBottom: '1px solid #333' }}>fillet</th>
                   </tr>
                 </thead>
                 <tbody>
                   {Array.isArray(qg?.[qgFilterType]) ? qg[qgFilterType].filter(item => {
                     if (!item) return false;
                     if (qgFilterComp && !String(item.component || '').includes(qgFilterComp)) return false;
                     if (qgFilterLayer && !String(item.layer || '').includes(qgFilterLayer)) return false;
                     return true;
                   }).map((item, i) => (
                     <tr key={i} style={{ borderBottom: '1px solid #2d2d30', background: i % 2 === 0 ? '#1e1e1e' : '#252526' }}>
                       <td style={{ padding: '6px', borderRight: '1px solid #333' }}>{String(item?.component ?? '')}</td>
                       <td style={{ padding: '6px', borderRight: '1px solid #333' }}>{String(item?.name ?? '')}</td>
                       <td style={{ padding: '6px', fontFamily: 'monospace', color: '#ce9178', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', borderRight: '1px solid #333' }}>
                         {qgFilterType === 'poly' ? 'POLYGON ...' : 'LINESTRING ...'}
                       </td>
                       <td style={{ padding: '6px', borderRight: '1px solid #333' }}>{String(item?.layer ?? 1)}</td>
                       <td style={{ padding: '6px', borderRight: '1px solid #333' }}>{item?.subtract ? 'True' : 'False'}</td>
                       <td style={{ padding: '6px', borderRight: '1px solid #333' }}>{item?.helper ? 'True' : 'False'}</td>
                       <td style={{ padding: '6px', borderRight: '1px solid #333' }}>{String(item?.chip ?? 'main')}</td>
                       <td style={{ padding: '6px' }}>{String(item?.fillet !== undefined ? item.fillet : 'nan')}</td>
                     </tr>
                   )) : (
                     <tr><td colSpan="8" style={{ padding: '15px', color: '#f44', textAlign: 'center' }}>No valid array data for {qgFilterType}</td></tr>
                   )}
                 </tbody>
               </table>
               {(!qg || !Array.isArray(qg[qgFilterType]) || qg[qgFilterType].length === 0) && (
                 <div style={{ padding: '15px', color: '#666', textAlign: 'center' }}>No {qgFilterType} geometry found.</div>
               )}
             </div>
           </div>
        )}
      </div>
    </div>
  );
}

function CanvasTool({ icon, label, onClick, active }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', 
        color: active ? '#ffffff' : '#d4d4d4',
        background: active ? '#4d4d50' : 'transparent',
        padding: '2px 6px',
        borderRadius: '4px'
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span style={{ fontSize: '10px' }}>{label}</span>
    </div>
  );
}
