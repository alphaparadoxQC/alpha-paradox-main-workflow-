import React, { useState, useEffect } from 'react';
import { useEdaStore, COMPONENT_DEFINITIONS } from '../../stores/edaStore';
import Editor from '@monaco-editor/react';

export default function NewComponentModal({ componentType, onClose, onCreate }) {
  const [activeTab, setActiveTab] = useState('Source');
  const [compInfo, setCompInfo] = useState(null);
  const [params, setParams] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState({});

  const isRoute = Boolean(
    componentType?.startsWith('route_') || 
    componentType?.startsWith('Route') ||
    ['RouteStraight', 'RouteFramed', 'RouteMeander', 'RouteAnchors', 'RoutePathfinder', 'RouteMixed'].includes(componentType)
  );

  const def = (componentType && COMPONENT_DEFINITIONS[componentType]) || {};
  const className = def.label ? def.label.replace(/\s+/g, '') : (componentType || 'Component');
  const defaultName = `${className}_1`;

  // Initialize params from default definitions
  useEffect(() => {
    if (componentType) {
      const compDef = COMPONENT_DEFINITIONS[componentType];
      if (compDef && compDef.defaultParams) {
        let routeOptions = JSON.parse(JSON.stringify(compDef.defaultParams));
        if (isRoute) {
          const storeComps = useEdaStore.getState().components || [];
          const existingComps = (window.__eda_components && window.__eda_components.length > 0) ? window.__eda_components : storeComps;
          const nonRoutes = (existingComps || []).filter(c => c && c.type && !c.type.startsWith('route_') && !c.type.startsWith('Route'));
          if (nonRoutes.length >= 2) {
            const comp1 = nonRoutes[0];
            const comp2 = nonRoutes[1];
            const pin1 = (comp1.params?.connection_pads && Object.keys(comp1.params.connection_pads)[0]) || 'readout';
            const pin2 = (comp2.params?.connection_pads && Object.keys(comp2.params.connection_pads)[0]) || 'readout';
            routeOptions = {
              ...routeOptions,
              pin_inputs: {
                start_pin: { component: comp1.name, pin: pin1 },
                end_pin: { component: comp2.name, pin: pin2 }
              }
            };
          }
        }
        
        const topParams = {
          name: defaultName,
          options: routeOptions,
          ...(isRoute ? { type: 'CPW' } : {})
        };
        setParams(topParams);
        // Expand options and common nested dicts by default matching Qiskit Metal
        setExpandedKeys({ 
          options: true, 
          'options.connection_pads': true,
          'options.connection_pads.readout': true,
          'options.pin_inputs': isRoute,
          'options.pin_inputs.start_pin': isRoute,
          'options.pin_inputs.end_pin': isRoute,
          'options.lead': isRoute,
          'options.meander': isRoute && (componentType === 'route_meander' || componentType === 'RouteMeander')
        });
      }
    }
  }, [componentType, defaultName, isRoute]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch component info (Source & Help)
  useEffect(() => {
    if (!componentType) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/eda/component_info/${componentType}`)
      .then(res => res.json())
      .then(data => {
        setCompInfo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch component info", err);
        setCompInfo({ source: "Error loading source.", help: "Error loading docs." });
        setLoading(false);
      });
  }, [componentType]);

  const handleCreate = () => {
    const finalOptions = params.options ? { ...params.options } : { ...params };
    const customName = params.name || null;
    onCreate(finalOptions, customName);
  };

  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleAddRow = () => {
    const keyName = prompt("Enter parameter name:", "new_param");
    if (keyName && !(keyName in params)) {
      setParams(prev => ({ ...prev, [keyName]: "" }));
    }
  };

  const handleRemove = () => {
    const keyName = prompt("Enter parameter name to remove:");
    if (keyName && (keyName in params)) {
      setParams(prev => {
        const next = { ...prev };
        delete next[keyName];
        return next;
      });
    }
  };

  const handleNestDict = () => {
    const keyName = prompt("Enter dictionary name:", "new_dict");
    if (keyName && !(keyName in params)) {
      setParams(prev => ({ ...prev, [keyName]: {} }));
    }
  };

  const toggleExpand = (path) => {
    setExpandedKeys(prev => ({...prev, [path]: !prev[path]}));
  };

  // Helper for deep updates
  const updateNestedParam = (obj, pathArray, value) => {
    if (pathArray.length === 1) {
      return { ...obj, [pathArray[0]]: value };
    }
    const key = pathArray[0];
    return { ...obj, [key]: updateNestedParam(obj[key], pathArray.slice(1), value) };
  };

  const getParsedDisplay = (val, key) => {
    if (typeof val === 'object' && val !== null) return '';
    if (typeof val === 'boolean') return val ? 'True' : 'False';
    if (val === '' || val === undefined || val === null) return '';
    if (val === 'True' || val === 'False') return val;
    if (val === 'main' || val === 'CPW' || key === 'name' || key === 'chip') return String(val);
    if (val === 'cpw_width') return '0.01';
    if (val === 'cpw_gap') return '0.006';

    const strVal = String(val).trim();
    if (strVal.endsWith('mm')) {
      const num = parseFloat(strVal.slice(0, -2));
      if (!isNaN(num)) return num === Math.floor(num) ? `${num}` : `${num}`;
    }
    if (strVal.endsWith('um')) {
      const num = parseFloat(strVal.slice(0, -2));
      if (!isNaN(num)) {
        const inMm = num / 1000;
        return inMm === 0 ? '0.0' : String(inMm);
      }
    }
    if (strVal.endsWith('nm')) {
      const num = parseFloat(strVal.slice(0, -2));
      if (!isNaN(num)) return String(num / 1e6);
    }

    // Pure numbers: "0" -> "0.0", "1" -> "1.0", "5" -> "5.0"
    if (!isNaN(Number(strVal))) {
      const num = parseFloat(strVal);
      return num % 1 === 0 ? `${num}.0` : `${num}`;
    }
    
    try {
      const parse = useEdaStore.getState().parseValue;
      const num = parse(val);
      if (!isNaN(num) && typeof num === 'number') {
        const inMm = num / 1000;
        return inMm === Math.floor(inMm) ? `${inMm.toFixed(1)}` : `${inMm}`;
      }
    } catch (e) {}
    return String(val);
  };

  const getTypeDisplay = (val, isDict) => {
    if (isDict) return 'Dict';
    if (typeof val === 'boolean' || val === 'True' || val === 'False') return 'bool';
    return 'str';
  };

  const renderRows = (obj, pathPrefix = [], depth = 0) => {
    let rows = [];
    Object.entries(obj).forEach(([key, value], i) => {
      const currentPath = [...pathPrefix, key];
      const pathStr = currentPath.join('.');
      const isDict = typeof value === 'object' && value !== null;
      const isBool = typeof value === 'boolean';
      const displayVal = isBool ? (value ? 'True' : 'False') : value;
      
      rows.push(
        <tr key={pathStr} style={{ background: i % 2 === 0 ? '#1e1e1e' : '#252526', borderBottom: '1px solid #3c3c3c' }}>
          <td style={{ padding: `4px 6px 4px ${6 + depth * 15}px`, borderRight: '1px solid #3c3c3c', whiteSpace: 'nowrap' }}>
            {isDict ? (
              <span onClick={() => toggleExpand(pathStr)} style={{ cursor: 'pointer', marginRight: '6px', color: '#888' }}>
                {expandedKeys[pathStr] ? '▼' : '▶'}
              </span>
            ) : (
              <span style={{ marginRight: '6px', color: '#888' }}>
                {key === 'name' ? '▾' : <span style={{ display: 'inline-block', width: '10px' }}></span>}
              </span>
            )}
            {key}
          </td>
          <td style={{ padding: '0', borderRight: '1px solid #3c3c3c' }}>
            {isDict ? (
              <span style={{ padding: '4px 6px', color: '#888' }}></span>
            ) : isBool ? (
              <select
                value={value ? 'True' : 'False'}
                onChange={(e) => setParams(prev => updateNestedParam(prev, currentPath, e.target.value === 'True'))}
                style={{ width: '100%', padding: '4px 6px', background: 'transparent', border: 'none', color: '#ce9178', outline: 'none' }}
              >
                <option value="False" style={{ background: '#252526' }}>False</option>
                <option value="True" style={{ background: '#252526' }}>True</option>
              </select>
            ) : (
              <input 
                type="text" 
                value={displayVal} 
                onChange={(e) => setParams(prev => updateNestedParam(prev, currentPath, e.target.value))}
                style={{ width: '100%', padding: '4px 6px', background: 'transparent', border: 'none', color: '#ce9178', outline: 'none' }}
              />
            )}
          </td>
          <td style={{ padding: '4px 6px', color: '#b5cea8', borderRight: '1px solid #3c3c3c', whiteSpace: 'nowrap' }}>
            {isDict ? '' : getParsedDisplay(value, key)}
          </td>
          <td style={{ padding: '4px 6px', color: '#569cd6' }}>{getTypeDisplay(value, isDict)}</td>
        </tr>
      );

      if (isDict && expandedKeys[pathStr]) {
        rows.push(...renderRows(value, currentPath, depth + 1));
      }
    });
    return rows;
  };

  if (!componentType) return null;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
      }}>
      <div style={{
        background: '#1e1e1e', width: '90%', maxWidth: '1000px', height: '80vh',
        border: '1px solid #3c3c3c', borderRadius: '6px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: '#2d2d30', padding: '8px 12px', borderBottom: '1px solid #3c3c3c',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ color: '#d4d4d4', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>New {COMPONENT_DEFINITIONS[componentType]?.label?.replace(/\s+/g, '') || componentType}</span>
          </div>
          <button 
            id="modal-close-button"
            onClick={onClose} 
            style={{ 
              background: 'transparent', border: 'none', color: '#aaaaaa', cursor: 'pointer', 
              fontSize: '16px', padding: '4px 8px', borderRadius: '4px' 
            }}
            onMouseOver={(e) => e.target.style.color = '#ffffff'}
            onMouseOut={(e) => e.target.style.color = '#aaaaaa'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Pane - Options Editor */}
          <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #3c3c3c' }}>
            <div style={{ padding: '8px', color: '#d4d4d4', fontSize: '13px', background: '#252526', borderBottom: '1px solid #3c3c3c' }}>
              Options to create with
            </div>
            
            <div style={{ display: 'flex', padding: '4px', background: '#2d2d30', gap: '4px', borderBottom: '1px solid #3c3c3c' }}>
              <button onClick={handleAddRow} style={{ flex: 1, padding: '4px', background: '#3c3c3c', border: '1px solid #555', color: '#d4d4d4', cursor: 'pointer', fontSize: '12px' }}>Add Row</button>
              <button onClick={handleNestDict} style={{ flex: 1, padding: '4px', background: '#3c3c3c', border: '1px solid #555', color: '#d4d4d4', cursor: 'pointer', fontSize: '12px' }}>Nest Dictionary</button>
              <button onClick={handleRemove} style={{ flex: 1, padding: '4px', background: '#3c3c3c', border: '1px solid #555', color: '#d4d4d4', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#d4d4d4', fontSize: '12px', textAlign: 'left' }}>
                <thead style={{ background: '#252526' }}>
                  <tr>
                    <th style={{ padding: '6px', borderBottom: '1px solid #3c3c3c', borderRight: '1px solid #3c3c3c' }}>Name</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #3c3c3c', borderRight: '1px solid #3c3c3c' }}>Value</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #3c3c3c', borderRight: '1px solid #3c3c3c' }}>Parsed Value</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #3c3c3c' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {renderRows(params)}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '10px', background: '#252526', borderTop: '1px solid #3c3c3c' }}>
              <button 
                onClick={handleCreate}
                style={{ 
                  width: '100%', padding: '6px 8px', background: '#2d3238', color: '#ffffff', 
                  border: '1px solid #d35400', cursor: 'pointer', borderRadius: '3px', fontWeight: 'bold'
                }}>
                Create
              </button>
            </div>
          </div>

          {/* Right Pane - Source & Help */}
          <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
            <div style={{ display: 'flex', background: '#2d2d30', borderBottom: '1px solid #3c3c3c' }}>
              <div 
                onClick={() => setActiveTab('Source')}
                style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', borderRight: '1px solid #3c3c3c',
                         background: activeTab === 'Source' ? '#1e1e1e' : 'transparent',
                         color: activeTab === 'Source' ? '#d4d4d4' : '#888',
                         borderTop: activeTab === 'Source' ? '2px solid #007acc' : '2px solid transparent' }}
              >
                Source
              </div>
              <div 
                onClick={() => setActiveTab('Help')}
                style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', borderRight: '1px solid #3c3c3c',
                         background: activeTab === 'Help' ? '#1e1e1e' : 'transparent',
                         color: activeTab === 'Help' ? '#d4d4d4' : '#888',
                         borderTop: activeTab === 'Help' ? '2px solid #007acc' : '2px solid transparent' }}
              >
                Help
              </div>
            </div>

            <div style={{ flex: 1, padding: activeTab === 'Source' ? '0' : '10px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ color: '#888', fontSize: '13px', padding: '10px' }}>Loading...</div>
              ) : (
                <>
                  {activeTab === 'Source' && (
                    <Editor
                      height="100%"
                      defaultLanguage="python"
                      theme="vs-dark"
                      value={compInfo?.source || '# No source available'}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, wordWrap: 'on' }}
                    />
                  )}
                  {activeTab === 'Help' && (
                    <div style={{ padding: '12px', color: '#d4d4d4', fontSize: '12px' }}>
                      {/* Summary Table */}
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>Summary:</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', background: '#252526', border: '1px solid #3c3c3c' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                            <th style={{ width: '80px', padding: '5px 8px', color: '#9cdcfe', textAlign: 'left', fontWeight: 'normal' }}>Class</th>
                            <td style={{ padding: '5px 8px', color: '#ce9178', fontFamily: 'monospace' }}>{compInfo?.class_name || componentType}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                            <th style={{ padding: '5px 8px', color: '#9cdcfe', textAlign: 'left', fontWeight: 'normal' }}>Module</th>
                            <td style={{ padding: '5px 8px', color: '#4ec9b0', fontFamily: 'monospace' }}>{compInfo?.module_name || 'alpha_metal.qlibrary'}</td>
                          </tr>
                          <tr>
                            <th style={{ padding: '5px 8px', color: '#9cdcfe', textAlign: 'left', fontWeight: 'normal' }}>Path</th>
                            <td style={{ padding: '5px 8px', color: '#888888', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{compInfo?.path || ''}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Official Image Preview */}
                      <div style={{ background: '#ffffff', padding: '12px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={`/components/${compInfo?.image_name || (compInfo?.class_name ? compInfo.class_name + '.png' : 'RouteStraight.png')}`} 
                          alt={compInfo?.class_name} 
                          style={{ maxHeight: '36px', maxWidth: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>

                      {/* Class Docstring */}
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>Class docstring:</div>
                      <pre style={{ 
                        background: '#181818', padding: '10px 12px', borderRadius: '4px', border: '1px solid #333', 
                        color: '#d4d4d4', fontSize: '11.5px', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'monospace',
                        marginBottom: '16px'
                      }}>
                        {compInfo?.class_doc || compInfo?.help || 'No docstring available.'}
                      </pre>

                      {/* Init Docstring */}
                      {compInfo?.init_doc && (
                        <>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>Init docstring:</div>
                          <pre style={{ 
                            background: '#181818', padding: '10px 12px', borderRadius: '4px', border: '1px solid #333', 
                            color: '#d4d4d4', fontSize: '11.5px', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'monospace' 
                          }}>
                            {compInfo.init_doc}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
