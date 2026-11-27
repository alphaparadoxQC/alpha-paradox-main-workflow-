const fs = require('fs');

const file = '/Users/sourojitmondal/Desktop/quantum-workload-manager/composer/src/components/eda/ComponentLibrary.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the ComponentCard component at the end
content = content.replace(/function ComponentCard.*?\n\s*\);\n}\n/s, '');

// The items
const libraryItemsStr = `  const libraryItems = [
    { type: 'circle_caterpillar', name: 'Circle Caterpillar', category: 'qubits', svg: <svg viewBox="0 0 32 32"><circle cx="8" cy="16" r="3" fill="#b5cea8" /><circle cx="16" cy="16" r="3" fill="#b5cea8" /><circle cx="24" cy="16" r="3" fill="#b5cea8" /><line x1="8" y1="16" x2="24" y2="16" stroke="#b5cea8" strokeWidth="1" /></svg> },
    { type: 'circle_raster', name: 'Circle Raster', category: 'qubits', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="#dcdcaa" /></svg> },
    { type: 'transmon_cross', name: 'Transmon Cross', category: 'qubits', svg: <svg viewBox="0 0 32 32"><path d="M14 6v8H6v4h8v8h4v-8h8v-4h-8V6h-4z" fill="#007acc"/></svg> },
    { type: 'transmon_pocket', name: 'Transmon Pocket', category: 'qubits', svg: <svg viewBox="0 0 32 32"><rect x="6" y="10" width="20" height="12" fill="none" stroke="#007acc" strokeWidth="2"/><rect x="14" y="14" width="4" height="4" fill="#007acc"/></svg> },
    { type: 'fluxonium', name: 'Fluxonium', category: 'qubits', svg: <svg viewBox="0 0 32 32"><path d="M8 12h16v8H8z" fill="none" stroke="#007acc" strokeWidth="2"/><path d="M12 12v-4M20 12v-4" stroke="#007acc" strokeWidth="2"/></svg> },
    
    { type: 'rectangle', name: 'Rectangle', category: 'passives', svg: <svg viewBox="0 0 32 32"><rect x="6" y="10" width="20" height="12" fill="none" stroke="#ce9178" strokeWidth="2" /></svg> },
    { type: 'circle', name: 'Circle', category: 'passives', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="#ce9178" strokeWidth="2" /></svg> },
    { type: 'ellipse', name: 'Ellipse', category: 'passives', svg: <svg viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="12" ry="7" fill="none" stroke="#ce9178" strokeWidth="2" /></svg> },
    { type: 'rectangle_hollow', name: 'Rectangle Hollow', category: 'passives', svg: <svg viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" fill="none" stroke="#ce9178" strokeWidth="3" /><rect x="9" y="12" width="14" height="8" fill="none" stroke="#ce9178" strokeWidth="1" /></svg> },
    { type: 'circle_hollow', name: 'Circle Hollow (Ring)', category: 'passives', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#ce9178" strokeWidth="3" /><circle cx="16" cy="16" r="6" fill="none" stroke="#ce9178" strokeWidth="1" /></svg> },
    { type: 'cap_3_interdigital', name: 'Cap3Interdigital', category: 'passives', svg: <svg viewBox="0 0 32 32"><path d="M4 10h12v4H4M4 18h12v4H4M28 14H16v4h12" fill="#ce9178" /><path d="M6 10v12M26 14v4" stroke="#ce9178" strokeWidth="4" /></svg> },
    { type: 'cap_n_interdigital', name: 'CapNInterdigital', category: 'passives', svg: <svg viewBox="0 0 32 32"><path d="M4 6h12v4H4M4 14h12v4H4M4 22h12v4H4M28 10H16v4h12M28 18H16v4h12" fill="#ce9178" /><path d="M6 6v20M26 10v12" stroke="#ce9178" strokeWidth="4" /></svg> },
    { type: 'n_gon', name: 'N-Gon (Regular)', category: 'passives', svg: <svg viewBox="0 0 32 32"><polygon points="16,4 27,12 23,26 9,26 5,12" fill="none" stroke="#ce9178" strokeWidth="2" /></svg> },
    { type: 'interdigitated_cap', name: 'Interdigitated Cap', category: 'passives', svg: <svg viewBox="0 0 32 32"><path d="M8 8v16M14 12v12M20 8v16M26 12v12M8 8h12M14 24h12" fill="none" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'cap_finger_in_frame', name: 'Cap Finger In Frame', category: 'passives', svg: <svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="none" stroke="#ce9178" strokeWidth="2" /><path d="M8 8v16M14 12v12M20 8v16M26 12v12M8 8h12M14 24h12" fill="none" stroke="#ce9178" strokeWidth="1" /></svg> },
    { type: 'purcell_filter', name: 'Purcell Filter', category: 'passives', svg: <svg viewBox="0 0 32 32"><path d="M6 16h20M12 10v12M20 10v12" fill="none" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    
    { type: 'n_square_spiral', name: 'Square Spiral', category: 'resonators', svg: <svg viewBox="0 0 32 32"><path d="M12 16h8v-8h-12v12h16v-16h-20v20h24" fill="none" stroke="#dcdcaa" strokeWidth="2" /></svg> },
    { type: 'cpw_meander', name: 'CPW Meander', category: 'resonators', svg: <svg viewBox="0 0 32 32"><path d="M4 16h4v-6h4v12h4v-12h4v12h4v-6h4" fill="none" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'cpw_straight', name: 'CPW Straight', category: 'resonators', svg: <svg viewBox="0 0 32 32"><line x1="4" y1="16" x2="28" y2="16" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    
    { type: 'bond_pad', name: 'Bond Pad', category: 'io', svg: <svg viewBox="0 0 32 32"><rect x="10" y="10" width="12" height="12" fill="#d4d4d4"/></svg> },
    { type: 'microwave_port', name: 'Microwave Port', category: 'io', svg: <svg viewBox="0 0 32 32"><polygon points="6,12 18,16 6,20" fill="none" stroke="#d4d4d4" strokeWidth="2"/><line x1="18" y1="16" x2="26" y2="16" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'launchpad_wirebond', name: 'Launchpad Wirebond', category: 'io', svg: <svg viewBox="0 0 32 32"><rect x="8" y="4" width="16" height="12" fill="#c586c0" /><polygon points="12,16 20,16 18,24 14,24" fill="#c586c0" /></svg> },
    
    { type: 'airbridge', name: 'Airbridge', category: 'routing', svg: <svg viewBox="0 0 32 32"><path d="M6 20q10-16 20 0" fill="none" stroke="#d4d4d4" strokeWidth="2"/></svg> },
    { type: 'tsv', name: 'TSV', category: 'routing', svg: <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="none" stroke="#d4d4d4" strokeWidth="2"/><circle cx="16" cy="16" r="2" fill="#d4d4d4"/></svg> }
  ];

  const groupedCategories = {
    core: [],
    couplers: [],
    lumped: [],
    qubits: libraryItems.filter(i => i.category === 'qubits'),
    passives: libraryItems.filter(i => i.category === 'passives'),
    resonators: libraryItems.filter(i => i.category === 'resonators'),
    io: libraryItems.filter(i => i.category === 'io'),
    routing: libraryItems.filter(i => i.category === 'routing')
  };
`;

const treeJSX = `
            {/* QComponents Library Tree */}
            <div style={{ marginTop: '0px' }}>
              <div style={{ padding: '4px 8px', fontWeight: 'bold', background: '#333333', borderBottom: '1px solid #252526' }}>Name</div>
              <div style={{ padding: '8px 0' }}>
                {Object.entries(groupedCategories).map(([cat, items]) => (
                  <div key={cat}>
                    <div 
                      onClick={() => toggle(cat)} 
                      style={{ padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ width: '16px', display: 'inline-block', fontSize: '10px', color: '#888' }}>
                        {expanded[cat] ? '▼' : '▶'}
                      </span>
                      <span style={{ color: '#00a8ff', fontSize: '14px', marginRight: '8px' }}>📁</span>
                      <span style={{ fontSize: '13px', color: '#d4d4d4' }}>{cat}</span>
                    </div>
                    {expanded[cat] && items.length > 0 && (
                      <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {/* Vertical tree trunk line */}
                        <div style={{ position: 'absolute', left: '22px', top: 0, bottom: '24px', width: '1px', background: '#555' }} />
                        {items.map((item, idx) => {
                          return (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                              {/* Horizontal branch line */}
                              <div style={{ position: 'absolute', left: '6px', top: '50%', width: '12px', height: '1px', background: '#555' }} />
                              
                              <div 
                                onClick={() => addComponent(item.type)}
                                style={{
                                  display: 'flex', alignItems: 'center', padding: '8px 8px 8px 24px', cursor: 'pointer', flex: 1
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#37373d'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ width: '48px', height: '48px', marginRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {React.cloneElement(item.svg, { width: '48', height: '48' })}
                                </div>
                                <div style={{ fontSize: '13px', color: '#d4d4d4' }}>{item.name}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
`;

content = content.replace(/<TreeFolder name="QComponents Library".*?<\/div>/s, treeJSX);

const declarationInject = content.replace(/(const qgeometry =.*?;)/, `$1\n${libraryItemsStr}`);
fs.writeFileSync(file, declarationInject);
console.log('Successfully updated ComponentLibrary.jsx');
