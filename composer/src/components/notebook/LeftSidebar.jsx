import React, { useState, useEffect } from 'react';
import useNotebookStore from '../../stores/notebookStore';
import { QUANTUM_SNIPPETS } from '../../data/quantum_snippets';
import { QUANTUM_REGISTRY } from '../../data/quantum_registry';
const PANELS = {
  toc: { icon: '☰', label: 'Table of contents' },
  search: { icon: '🔍', label: 'Find and replace' },
  snippets: { icon: '< >', label: 'Quantum Snippets' },
  secrets: { icon: '🔑', label: 'Provider Secrets' },
  files: { icon: '📁', label: 'Quantum Workspace' },
  data: { icon: '📊', label: 'Quantum Registry' },
};

const generateDynamicMoleculeSnippet = (moleculeName) => {
  return `# Comprehensive Quantum Chemistry VQE Pipeline for ${moleculeName}
import pubchempy as pcp
from IPython.display import display, HTML, clear_output
import matplotlib.pyplot as plt
from qiskit_nature.second_q.drivers import PySCFDriver
from qiskit_nature.second_q.mappers import JordanWignerMapper
from qiskit_nature.second_q.circuit.library import UCCSD, HartreeFock
from qiskit_nature.second_q.transformers import ActiveSpaceTransformer
from alpha.circuit.library import EfficientSU2
from qiskit_algorithms import VQE
from qiskit_algorithms.optimizers import SLSQP, SPSA
from alpha.primitives import StatevectorEstimator as Estimator
import time
import warnings
warnings.filterwarnings('ignore')

molecule_query = "${moleculeName}"
print(f"🔍 Searching PubChem database for '{molecule_query}'...", flush=True)

try:
    # 1. Fetch Metadata
    compounds = pcp.get_compounds(molecule_query, 'name')
    if not compounds:
        print(f"❌ Error: Could not find any compound matching '{molecule_query}'. Please check the spelling or chemical formula.")
    else:
        c = compounds[0]
        cid = c.cid
        name = getattr(c, 'iupac_name', molecule_query)
        formula = c.molecular_formula
        weight = float(c.molecular_weight)
        smiles = c.canonical_smiles
        
        # Display rich HTML output
        html_output = f"""
        <div style="background: #1e1e1e; padding: 15px; border-radius: 8px; color: #fff; font-family: sans-serif; border: 1px solid #333; margin-bottom: 20px;">
            <div style="display: flex; gap: 20px; align-items: center;">
                <img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/PNG" alt="Molecule" style="background: white; border-radius: 4px; padding: 5px; width: 150px; height: 150px; object-fit: contain;" />
                <div>
                    <h2 style="margin: 0 0 10px 0; color: #10b981;">{name}</h2>
                    <p style="margin: 4px 0;"><strong>Formula:</strong> {formula}</p>
                    <p style="margin: 4px 0;"><strong>Molecular Weight:</strong> {weight} g/mol</p>
                    <p style="margin: 4px 0;"><strong>Canonical SMILES:</strong> <code>{smiles}</code></p>
                    <p style="margin: 4px 0;"><strong>PubChem CID:</strong> <a href="https://pubchem.ncbi.nlm.nih.gov/compound/{cid}" target="_blank" style="color: #60a5fa;">{cid}</a></p>
                </div>
            </div>
        </div>
        """
        display(HTML(html_output))
        
        print(f"⚛️ Fetching 3D conformer coordinates...")
        # 2. Fetch 3D coordinates
        atom_str = ""
        compounds_3d = pcp.get_compounds(cid, 'cid', record_type='3d')
        if compounds_3d:
            c3d = compounds_3d[0]
            atom_str = '; '.join([f'{a.element} {a.x} {a.y} {a.z}' for a in c3d.atoms])
            print(f"✅ Successfully retrieved {len(c3d.atoms)} atoms from PubChem.\\n")
        else:
            print(f"⚠️ PubChem 3D conformer not found. Generating on-the-fly via NCI CACTVS...")
            import urllib.request, urllib.parse
            url = f"https://cactus.nci.nih.gov/chemical/structure/{urllib.parse.quote(smiles)}/file?format=xyz&get3d=true"
            try:
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req) as response:
                    xyz_data = response.read().decode('utf-8')
                lines = xyz_data.strip().split('\\n')[2:]
                atom_str = '; '.join([f"{line.split()[0]} {' '.join(line.split()[1:])}" for line in lines])
                print(f"✅ Successfully generated {len(lines)} atoms via NCI Fallback.\\n")
            except Exception as ex:
                raise ValueError(f"Could not generate 3D coordinates for {name}. Error: {ex}")
        
        # --- LOCAL CPU COMPUTE SAFETY CHECK ---
        # A 24-atom molecule has an O(N^4) integral tensor scaling. It will take hours locally.
        if len(c3d.atoms) if compounds_3d else len(lines) > 8:
            print(f"🛑 COMPUTE LIMIT REACHED: The molecule has too many atoms for a local CPU.")
            print(f"Calculating the exact quantum integrals for a molecule of this size takes supercomputers or cloud clusters, and will hang your local machine for hours.")
            print(f"💡 Try generating a snippet for a smaller molecule like 'Water' (H2O), 'Methane' (CH4), or 'Ammonia' (NH3) to see the real-time VQE dashboard instantly!")
            raise RuntimeError("Simulation aborted to prevent local system freeze.")

        # 3. Quantum Chemistry Setup
        print("🚀 Initializing Alpha PySCF Driver...")
        print("⏳ Running Classical Hartree-Fock calculation to generate molecular integrals...")
        print("   (Note: For large molecules like Glucose, this classical pre-processing can take 1-3 minutes before VQE starts)")
        start_time = time.time()
        driver = PySCFDriver(atom=atom_str, basis="sto3g")
        problem = driver.run()
        
        raw_orbitals = problem.num_spatial_orbitals
        raw_particles = problem.num_particles
        total_electrons = raw_particles[0] + raw_particles[1]
        
        print(f"   - Raw Spatial orbitals: {raw_orbitals}")
        print(f"   - Raw Total Electrons: {total_electrons}")
        
        # === ENTERPRISE UPGRADE: ACTIVE SPACE & HARDWARE EFFICIENT ANSATZ ===
        is_large_molecule = (raw_orbitals > 5 or total_electrons > 6)
        
        if is_large_molecule:
            print("\\n⚠️ MOLECULE IS TOO LARGE FOR FULL SIMULATION (OOM RISK).")
            print("   ↳ Applying Active Space Transformation (Freezing core electrons)...")
            # For demonstration, we reduce the problem to 2 active electrons in 2 active orbitals (HOMO/LUMO)
            transformer = ActiveSpaceTransformer(num_electrons=2, num_spatial_orbitals=2)
            problem = transformer.transform(problem)
            
            print(f"   - Reduced Active Spatial orbitals: {problem.num_spatial_orbitals}")
            print(f"   - Reduced Active Particles: {problem.num_particles}")
            
        mapper = JordanWignerMapper()
        fermionic_op = problem.hamiltonian.second_q_op()
        qubit_op = mapper.map(fermionic_op)
        
        print(f"   - Qubit Hamiltonian size: {len(qubit_op)} terms")
        
        # Setup Ansatz
        if is_large_molecule:
            print("   ↳ Swapping to Hardware-Efficient Ansatz (EfficientSU2) & SPSA Optimizer for large QPU workload...")
            ansatz = EfficientSU2(qubit_op.num_qubits, reps=3, entanglement='linear')
            optimizer = SPSA(maxiter=50)
        else:
            ansatz = UCCSD(
                problem.num_spatial_orbitals,
                problem.num_particles,
                mapper,
                initial_state=HartreeFock(problem.num_spatial_orbitals, problem.num_particles, mapper),
            )
            optimizer = SLSQP(maxiter=30)
        
        print("\\n⚡ Running VQE (Variational Quantum Eigensolver) in Real-Time...")
        
        # Real-time Callback to track energy and plot
        energy_history = []
        iter_count = []
        
        # Create a display handle for real-time updating
        out = display(HTML("<p style='color:#60a5fa;'>Starting VQE Optimizer...</p>"), display_id=True)
        
        def callback(eval_count, parameters, mean, std):
            energy_history.append(mean)
            iter_count.append(eval_count)
            
            # Generate the live plot
            plt.figure(figsize=(10, 4))
            
            # Subplot 1: Convergence
            plt.subplot(1, 2, 1)
            plt.plot(iter_count, energy_history, marker='o', linestyle='-', color='#10b981')
            plt.title(f'VQE Convergence ({formula})')
            plt.xlabel('Optimizer Iteration')
            plt.ylabel('Energy (Hartree)')
            plt.grid(True, alpha=0.3)
            
            # Subplot 2: Energy Change (Delta)
            plt.subplot(1, 2, 2)
            if len(energy_history) > 1:
                deltas = [energy_history[i] - energy_history[i-1] for i in range(1, len(energy_history))]
                plt.bar(range(1, len(deltas)+1), deltas, color='#3b82f6')
            plt.title('Energy Δ per Iteration')
            plt.xlabel('Iteration')
            plt.ylabel('Δ Energy')
            plt.grid(True, alpha=0.3)
            
            plt.tight_layout()
            
            # Save plot to HTML
            import io
            import base64
            buf = io.BytesIO()
            plt.savefig(buf, format='png', facecolor='#1e1e1e', edgecolor='none')
            plt.close()
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            
            # Update the display
            html_content = f"""
            <div style="background: #1e1e1e; padding: 15px; border-radius: 8px; color: #fff; border: 1px solid #333;">
                <h3 style="color: #60a5fa; margin-top: 0;">⚡ Real-time VQE Optimization ({"Hardware-Efficient" if is_large_molecule else "UCCSD"})</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Iteration:</strong> {eval_count}</span>
                    <span><strong>Current Energy:</strong> {mean:.6f} Hartree</span>
                </div>
                <img src="data:image/png;base64,{img_base64}" style="width: 100%; border-radius: 4px;" />
            </div>
            """
            out.update(HTML(html_content))
            
            # Small sleep to ensure UI updates
            time.sleep(0.05)
        
        vqe = VQE(Estimator(), ansatz, optimizer, callback=callback)
        
        result = vqe.compute_minimum_eigenvalue(qubit_op)
        elapsed = time.time() - start_time
        
        # Final Output
        final_html = f"""
        <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px; color: #a7f3d0; border: 1px solid rgba(16, 185, 129, 0.4); margin-top: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #10b981;">🎯 VQE Optimization Complete!</h2>
            <p style="margin: 4px 0;"><strong>Optimization Strategy:</strong> {"Active Space (2e, 2o) + EfficientSU2" if is_large_molecule else "Full Orbital Space + UCCSD"}</p>
            <p style="margin: 4px 0;"><strong>Time Elapsed:</strong> {elapsed:.2f} seconds</p>
            <p style="margin: 4px 0;"><strong>Total Iterations:</strong> {len(energy_history)}</p>
            <p style="margin: 8px 0 0 0; font-size: 1.2em; color: #fff;"><strong>Lowest Ground State Energy:</strong> {result.eigenvalue.real:.8f} Hartree</p>
        </div>
        """
        display(HTML(final_html))

except Exception as e:
    print(f"\\n❌ Error during processing: {e}")
`;
};

/**
 * LeftSidebar — Quantum-native, premium IDE sidebar panel.
 */
export default function LeftSidebar({ onInsertSnippet }) {
  const { cells, updateCellContent, secrets, setSecrets, resourceMetrics } = useNotebookStore();
  const [activePanel, setActivePanel] = useState(null);
  
  // Find & Replace State
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [snippetFilter, setSnippetFilter] = useState('');
  
  // Secrets State
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');

  // Data Explorer State
  const [dataSearchQuery, setDataSearchQuery] = useState('');
  const [dataSort, setDataSort] = useState('Most Votes');
  const [dataCategory, setDataCategory] = useState('Chemistry Simulation');

  const togglePanel = (key) => {
    setActivePanel(activePanel === key ? null : key);
  };

  // ── Table of Contents ──────────────────────────────────────────────────
  const tocEntries = [];
  cells.forEach(c => {
    if (c.type === 'markdown') {
      const regex = /^(#{1,6})\s+(.+)$/gm;
      let match;
      while ((match = regex.exec(c.content)) !== null) {
        // Detect quantum phases for custom UI markers
        let marker = '';
        const t = match[2].toLowerCase();
        if (t.includes('prep') || t.includes('init')) marker = '🔮';
        else if (t.includes('ansatz') || t.includes('circuit')) marker = '⚛️';
        else if (t.includes('measure') || t.includes('readout')) marker = '👁️';
        else if (t.includes('optimize') || t.includes('vqe') || t.includes('qaoa')) marker = '📈';

        tocEntries.push({ id: c.id, level: match[1].length, text: match[2], marker });
      }
    }
  });

  const handleScrollTo = (id) => {
    const el = document.getElementById(`cell-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ── Find and Replace ───────────────────────────────────────────────────
  const handleReplace = () => {
    if (!searchQuery) return;
    cells.forEach(c => {
      if (c.content.includes(searchQuery)) {
        updateCellContent(c.id, c.content.replace(searchQuery, replaceQuery));
      }
    });
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    cells.forEach(c => {
      if (c.content.includes(searchQuery)) {
        const regex = new RegExp(searchQuery, 'g');
        updateCellContent(c.id, c.content.replace(regex, replaceQuery));
      }
    });
  };

  // ── Code Snippets ────────────────────────────────────────────────────
  const filteredSnippets = QUANTUM_SNIPPETS.filter(s =>
    s.title.toLowerCase().includes(snippetFilter.toLowerCase()) ||
    s.desc.toLowerCase().includes(snippetFilter.toLowerCase())
  );

  // ── Secrets ────────────────────────────────────────────────────────────
  const addSecret = () => {
    if (!newSecretName.trim()) return;
    setSecrets([...secrets, { name: newSecretName, value: newSecretValue }]);
    setNewSecretName('');
    setNewSecretValue('');
  };

  const injectSecretSnippet = (secret) => {
    let code = `# Setup Environment Secret\nimport os\nos.environ['${secret.name}'] = '${secret.value}'\nprint(f"Secret '{secret.name}' successfully loaded into environment.")`;
    if (secret.name.toLowerCase().includes('alpha')) {
      code = `# Initialize Alpha Quantum\nfrom qiskit_ibm_provider import IBMProvider\nIBMProvider.save_account('${secret.value}', overwrite=True)\nprovider = IBMProvider()\nprint("Alpha Quantum Provider authenticated.")`;
    } else if (secret.name.toLowerCase().includes('braket')) {
      code = `# Initialize AWS Braket\nimport os\nos.environ['AWS_ACCESS_KEY_ID'] = '${secret.name}'\nos.environ['AWS_SECRET_ACCESS_KEY'] = '${secret.value}'\n# Initialize Braket device here...\nprint("AWS Braket credentials configured.")`;
    }
    
    if (onInsertSnippet) onInsertSnippet('code', code);
  };

  // ── Data Explorer Filter ───────────────────────────────────────────────
  const filteredData = QUANTUM_REGISTRY
    .filter(d => d.category === dataCategory)
    .filter(d => 
      d.name.toLowerCase().includes(dataSearchQuery.toLowerCase()) || 
      d.author.toLowerCase().includes(dataSearchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (dataSort === 'Most Votes') return b.votes - a.votes;
      if (dataSort === 'Most Recent') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return 0;
    });

  return (
    <div className="nb-left-sidebar" style={{ backgroundColor: '#111216', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
      {/* Icon strip */}
      <div className="nb-left-sidebar__icons">
        {Object.entries(PANELS).map(([key, { icon, label }]) => (
          <button
            key={key}
            className={`nb-left-sidebar__icon-btn ${activePanel === key ? 'nb-left-sidebar__icon-btn--active' : ''}`}
            onClick={() => togglePanel(key)}
            title={label}
            style={{ transition: 'all 0.2s ease-in-out' }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Panel content */}
      {activePanel && (
        <div className="nb-left-sidebar__panel" style={{ width: '320px', backgroundColor: '#181a20', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div className="nb-left-sidebar__panel-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '16px' }}>
            <span className="nb-left-sidebar__panel-title" style={{ fontSize: '0.95rem', fontWeight: '600', letterSpacing: '0.02em', textTransform: 'uppercase', color: '#8b949e' }}>
              {PANELS[activePanel].label}
            </span>
            <button className="nb-left-sidebar__panel-close" onClick={() => setActivePanel(null)} style={{ opacity: 0.6, cursor: 'pointer', background: 'transparent', border: 'none', color: '#fff' }}>✕</button>
          </div>

          <div className="nb-left-sidebar__panel-body" style={{ flex: 1, overflowY: 'auto' }}>
            {/* ── Table of Contents ─────────────────────────────────── */}
            {activePanel === 'toc' && (
              <div className="nb-sidebar-toc" style={{ padding: '16px' }}>
                {tocEntries.length === 0 ? (
                  <div className="nb-sidebar-empty" style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>
                    <p>Add Markdown headers to generate a table of contents.</p>
                    <button className="nb-sidebar-action-btn" onClick={() => onInsertSnippet && onInsertSnippet('markdown')} style={{ marginTop: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                      + Insert Section
                    </button>
                  </div>
                ) : (
                  <ul className="nb-sidebar-toc__list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {tocEntries.map((entry, i) => (
                      <li
                        key={i}
                        className="nb-sidebar-toc__item"
                        onClick={() => handleScrollTo(entry.id)}
                        style={{ 
                          padding: `6px 8px 6px ${(entry.level - 1) * 12 + 8}px`, 
                          cursor: 'pointer', 
                          fontSize: '0.9rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {entry.marker && <span style={{ fontSize: '0.8rem' }}>{entry.marker}</span>}
                        {entry.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── Find and Replace ─────────────────────────────────── */}
            {activePanel === 'search' && (
              <div className="nb-sidebar-search" style={{ padding: '16px' }}>
                <div className="nb-sidebar-search__field" style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: '#8b949e' }}>Find</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                  />
                </div>
                <div className="nb-sidebar-search__field" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: '#8b949e' }}>Replace With</label>
                  <input
                    type="text"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                  />
                </div>
                <div className="nb-sidebar-search__actions" style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleReplace} style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Replace</button>
                  <button onClick={handleReplaceAll} style={{ flex: 1, padding: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>Replace All</button>
                </div>
              </div>
            )}

            {/* ── Code Snippets ────────────────────────────────────── */}
            {activePanel === 'snippets' && (
              <div className="nb-sidebar-snippets" style={{ padding: '16px' }}>
                <input
                  className="nb-sidebar-snippets__filter"
                  placeholder="Filter quantum snippets..."
                  value={snippetFilter}
                  onChange={(e) => setSnippetFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', marginBottom: '16px' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredSnippets.map((snippet, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#e5e7eb' }}>{snippet.title}</span>
                        <button
                          onClick={() => onInsertSnippet && onInsertSnippet('code', snippet.code)}
                          title="Insert snippet"
                          style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          +
                        </button>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#8b949e', margin: 0 }}>{snippet.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Provider Secrets ─────────────────────────────────── */}
            {activePanel === 'secrets' && (
              <div className="nb-sidebar-secrets" style={{ padding: '16px' }}>
                <p style={{ fontSize: '0.8rem', color: '#8b949e', lineHeight: '1.4', marginBottom: '20px' }}>
                  Securely manage authentication tokens for hardware providers (Alpha, AWS, Rigetti). 
                  Secrets are injected into the kernel runtime directly.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {secrets.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                      No provider keys saved.
                    </div>
                  )}
                  {secrets.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#10b981' }}>🔑</span>
                        <span style={{ fontSize: '0.85rem' }}>{s.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => injectSecretSnippet(s)} title="Inject Authentication Snippet" style={{ background: 'transparent', border: 'none', color: '#8ab4f8', cursor: 'pointer', fontSize: '0.8rem' }}>Code</button>
                        <button onClick={() => setSecrets(secrets.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.8rem', color: '#e5e7eb', marginBottom: '8px', marginTop: 0 }}>Add Provider Key</h4>
                  <input
                    placeholder="e.g. IBMQ_TOKEN"
                    value={newSecretName}
                    onChange={(e) => setNewSecretName(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', marginBottom: '8px', fontSize: '0.85rem' }}
                  />
                  <input
                    placeholder="Value"
                    type="password"
                    value={newSecretValue}
                    onChange={(e) => setNewSecretValue(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', marginBottom: '12px', fontSize: '0.85rem' }}
                  />
                  <button onClick={addSecret} style={{ width: '100%', padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                    Save Securely
                  </button>
                </div>
              </div>
            )}

            {/* ── Workspace Files ──────────────────────────────────── */}
            {activePanel === 'files' && (
              <div className="nb-sidebar-files" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <button style={{ background: 'transparent', border: 'none', color: '#e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>📤 Upload</button>
                  <button style={{ background: 'transparent', border: 'none', color: '#e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>🔄 Refresh</button>
                </div>
                
                <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem', marginBottom: '8px', cursor: 'pointer' }}>
                    <span>📁</span> <span>/workspace</span>
                  </div>
                  
                  {/* Mock File Tree for Quantum */}
                  <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e5e7eb', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.7rem' }}>▾</span> <span>📁</span> <span>circuits</span>
                    </div>
                    <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem' }}>
                        <span>⚛️</span> <span>ghz_state.qasm</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem' }}>
                        <span>⚛️</span> <span>vqe_ansatz.qpy</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e5e7eb', fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.7rem' }}>▾</span> <span>📁</span> <span>layouts</span>
                    </div>
                    <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem' }}>
                        <span style={{ color: '#f59e0b' }}>📐</span> <span>chip_v2.lyrdb</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disk Space visualizer */}
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8b949e', marginBottom: '4px' }}>
                    <span>Virtual Storage</span>
                    <span>{resourceMetrics?.disk_used_gb || 20.09} / {resourceMetrics?.disk_total_gb || 107.72} GB</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${resourceMetrics?.disk_percent || 18}%`, height: '100%', background: '#3b82f6' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Quantum Data Registry ────────────────────────────── */}
            {activePanel === 'data' && (
              <div className="nb-sidebar-data" style={{ padding: '16px' }}>
                <input
                  placeholder="Search Hamiltonians, Models..."
                  value={dataSearchQuery}
                  onChange={(e) => setDataSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', marginBottom: '12px' }}
                />
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[...new Set(QUANTUM_REGISTRY.map(d => d.category))].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setDataCategory(cat)}
                      style={{ 
                        whiteSpace: 'nowrap',
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem',
                        border: '1px solid',
                        background: dataCategory === cat ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderColor: dataCategory === cat ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                        color: dataCategory === cat ? '#3b82f6' : '#8b949e',
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Dynamic Molecule Generator */}
                  {dataSearchQuery.trim() !== '' && (
                    <div
                      onClick={() => onInsertSnippet && onInsertSnippet('code', generateDynamicMoleculeSnippet(dataSearchQuery.trim()))}
                      style={{ 
                        background: 'rgba(16, 185, 129, 0.05)', 
                        border: '1px solid rgba(16, 185, 129, 0.3)', 
                        borderRadius: '6px', 
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'}
                    >
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'flex-start' }}>
                          ✨
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#10b981' }}>Generate VQE for "{dataSearchQuery.trim()}"</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>Auto-fetch 3D coordinates via PubChem</span>
                            <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              Dynamic
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {filteredData.map((ds, i) => (
                    <div 
                      key={i} 
                      onClick={() => onInsertSnippet && onInsertSnippet('code', ds.code)}
                      style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '6px', 
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                    >
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'flex-start' }}>
                          {dataCategory === 'Chemistry Simulation' ? '🧪' : dataCategory === 'Novel Component Discovery' ? '🧬' : '🧠'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#e5e7eb' }}>{ds.name}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>By {ds.author}</span>
                            <span style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              {ds.meta}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredData.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', padding: '20px 0' }}>
                      No assets found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
