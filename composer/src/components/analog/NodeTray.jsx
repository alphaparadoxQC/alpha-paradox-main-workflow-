/**
 * NodeTray — Collapsible left sidebar for the Analog Composer.
 * Organized into physics categories matching the ScienceAtHome layout.
 * Nodes are dragged from here onto the React Flow canvas.
 */

import { useState } from 'react';
import PresetsDropdown from './PresetsDropdown';

const NODE_CATEGORIES = [
  {
    name: 'Operators',
    nodes: [
      { type: 'hamiltonian', label: 'H', icon: <span style={{fontStyle:'italic'}}>Ĥ</span>, tooltip: 'Hamiltonian' },
      { type: 'operatorWavefunction', label: 'O·ψ', icon: <span style={{fontStyle:'italic'}}>Ô·ψ</span>, tooltip: 'Operator on Wavefunction' },
      { type: 'spatialDimension', label: 'x', icon: <span style={{fontStyle:'italic'}}>x̂</span>, tooltip: 'Position Operator' },
      { type: 'momentum', label: 'p', icon: <span style={{fontStyle:'italic'}}>p̂</span>, tooltip: 'Momentum Operator' },
      { type: 'potential', label: 'V', icon: <span style={{fontStyle:'italic'}}>V̂</span>, tooltip: 'Potential Operator' },
    ],
  },
  {
    name: 'State Analysis',
    nodes: [
      { type: 'innerProduct', label: '⟨ψ|φ⟩', icon: <span>⟨ψ|φ⟩</span>, tooltip: 'Inner Product' },
      { type: 'expectationValue', label: '⟨O⟩', icon: <span>⟨Ô⟩</span>, tooltip: 'Expectation Value' },
      { type: 'expectationSquared', label: '⟨O²⟩', icon: <span>⟨Ô²⟩</span>, tooltip: 'Expectation Squared' },
      { type: 'uncertainty', label: 'σ', icon: <span style={{fontStyle:'italic'}}>σ</span>, tooltip: 'Uncertainty' },
      { type: 'variance', label: 'σ²', icon: <span style={{fontStyle:'italic'}}>σ²</span>, tooltip: 'Variance' },
      { type: 'fidelity', label: 'Fidelity', icon: <span>|⟨ψ|φ⟩|²</span>, tooltip: 'Fidelity' },
      { type: 'norm', label: 'Norm', icon: <span>∫|ψ|²dx</span>, tooltip: 'Norm / Integral' },
    ],
  },
  {
    name: 'Linear Algebra',
    nodes: [
      { type: 'spectrum', label: 'Spectrum', icon: <span>{'{ψₙ, Eₙ}'}</span>, tooltip: 'Eigenstate Solver' },
      { type: 'energyLevel', label: 'E_m', icon: <span>Eₘ</span>, tooltip: 'Energy Level' },
      { type: 'linearCombination', label: 'Σcₘψₘ', icon: <span>Σcₘψₘ</span>, tooltip: 'Linear Combination' },
    ],
  },
  {
    name: 'Scalars',
    nodes: [
      { type: 'scalar', label: 'a', icon: <span style={{fontStyle:'italic'}}>a</span>, tooltip: 'Scalar' },
      { type: 'string', label: '"a"', icon: <span>"a"</span>, tooltip: 'String / Label' },
      { type: 'array', label: '{aₙ}', icon: <span>{'{aₙ}'}</span>, tooltip: 'Array of Scalars' },
      { type: 'mathFunction', label: 'f(...)', icon: <span style={{fontStyle:'italic'}}>f(...)</span>, tooltip: 'Math Function' },
      { type: 'realPart', label: 'Re', icon: <span>Re</span>, tooltip: 'Real Part' },
      { type: 'imaginaryPart', label: 'Im', icon: <span>Im</span>, tooltip: 'Imaginary Part' },
    ],
  },
  {
    name: 'Plots',
    nodes: [
      { type: 'wavefunctionPlot', label: 'Wave', icon: <span>ψ(x)</span>, tooltip: 'Wavefunction Plot' },
      { type: 'energyPlot', label: 'Energy', icon: <span>E(x)</span>, tooltip: 'Energy Plot' },
      { type: 'superpositionPlot', label: 'Superpos', icon: <span>|c|²</span>, tooltip: 'State Comparison Plot' },
      { type: 'stateEvolutionPlot', label: 'Evolve', icon: <span>ψ(t)</span>, tooltip: 'State Evolution Plot (Heatmap)' },
      { type: 'scalarTimePlot', label: 'Time', icon: <span>a(t)</span>, tooltip: 'Scalar Time Trace Plot' },
      { type: 'multiLinePlot', label: 'Multi', icon: <span>f(t)</span>, tooltip: 'Multi-line Plot' },
      { type: 'placeholderPlot', label: 'N/A', icon: <span>Plot</span>, tooltip: 'No Image Available' },
    ],
  },
  {
    name: 'Hardware Layout',
    nodes: [
      { type: 'transmonPocket', label: 'Transmon', icon: <span>Qubit</span>, tooltip: 'Transmon Pocket Qubit' },
      { type: 'launchpad', label: 'Launch', icon: <span>Port</span>, tooltip: 'Readout / Control Launchpad' },
      { type: 'cpw', label: 'CPW', icon: <span>CPW</span>, tooltip: 'Coplanar Waveguide' },
    ],
  },
  {
    name: 'GPE Physics',
    nodes: [],
  },
  {
    name: 'Control',
    nodes: [
      { type: 'timeEvolution', label: 'Evolve', icon: <span>U(t)</span>, tooltip: 'Time Evolution' },
      { type: 'forLoop', label: 'Loop', icon: <span>Loop</span>, tooltip: 'For Loop' },
    ],
  },
  {
    name: 'Misc',
    nodes: [
      { type: 'comment', label: 'Comment', icon: <span>Text</span>, tooltip: 'Comment' },
      { type: 'loopUpdate', label: 'Update', icon: <span>Step</span>, tooltip: 'Loop Update' },
      { type: 'placeholderMisc', label: 'N/A', icon: <span>Misc</span>, tooltip: 'No Image Available' },
    ],
  }
];

export default function NodeTray() {
  const [collapsed, setCollapsed] = useState({});

  const toggleCategory = (name) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const onDragStart = (e, nodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-tray">
      <PresetsDropdown />
      
      {NODE_CATEGORIES.map((cat) => (
        <div key={cat.name} className="tray-category">
          <button
            className="tray-category-header"
            onClick={() => toggleCategory(cat.name)}
          >
            <span className="tray-arrow">{collapsed[cat.name] ? '▶' : '▼'}</span>
            <span>{cat.name}</span>
          </button>

          {!collapsed[cat.name] && (
            <div className="tray-nodes-grid">
              {cat.nodes.map((node) => (
                <div
                  key={node.type}
                  className="tray-node-tile"
                  title={node.tooltip}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                >
                  <span className="tray-node-icon">{node.icon}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
