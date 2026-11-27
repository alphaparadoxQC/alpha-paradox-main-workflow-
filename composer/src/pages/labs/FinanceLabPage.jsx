import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LabHeader from '../../components/labs/common/LabHeader';
import GuidedLabDrawer from '../../components/labs/common/GuidedLabDrawer';
import MetricKpiCard from '../../components/labs/common/MetricKpiCard';
import UnifiedNavbar from '../../components/shared/UnifiedNavbar';
import {
  MARKET_DATASETS,
  ASSET_UNIVERSE,
  solvePortfolioQubo,
  buildQuboAndIsing,
  analyzePenaltyAlphaSensitivity,
  solveHybridBlockDecomposition,
  computeClassicalBaselines,
  generateEfficientFrontier,
  calculateBlackScholes,
  generateQaeConvergenceData,
  simulateMlqae,
  exportFinanceCircuitToQasm,
  calculateQuantumGreeks,
  simulateCreditRisk,
  calculateExoticPayoff
} from '../../quantum-engine/labs/finance-engine';
import { qasmToCircuit } from '../../quantum-engine/qasm-parser';
import { useCircuitStore } from '../../stores/circuitStore';
import '../../styles/labs.css';

export default function FinanceLabPage({ session }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState('sp500-balanced');

  // Studio Mode: 'portfolio' (Pillar A), 'options' (Pillar B: QAE Options), or 'mlqae' (Pillar B: MLQAE Risk)
  const [activeMode, setActiveMode] = useState('portfolio');
  const [portfolioSubTab, setPortfolioSubTab] = useState('overview'); // 'overview' | 'baselines' | 'ising' | 'sensitivity' | 'blockDecomp'

  // Pillar A Configuration (Portfolio Optimization)
  const [datasetKey, setDatasetKey] = useState('sp500');
  const currentDataset = MARKET_DATASETS[datasetKey] || MARKET_DATASETS.sp500;
  const [selectedAssetIndices, setSelectedAssetIndices] = useState([0, 1, 2, 3, 4]);
  const [riskAversion, setRiskAversion] = useState(0.5);
  const [budgetConstraint, setBudgetConstraint] = useState(3);
  const [penaltyAlpha, setPenaltyAlpha] = useState(2.5);
  const [depthP, setDepthP] = useState(2);
  const [optimizer, setOptimizer] = useState('COBYLA');
  const [warmStart, setWarmStart] = useState(true);
  const [noiseMode, setNoiseMode] = useState('ideal');

  // Pillar B Configuration (Options & QAE)
  const [spotPrice, setSpotPrice] = useState(100);
  const [strikePrice, setStrikePrice] = useState(105);
  const [volatility, setVolatility] = useState(0.20);
  const [riskFreeRate, setRiskFreeRate] = useState(0.04);
  const [maturity, setMaturity] = useState(0.5);

  // Pillar B Configuration (MLQAE Risk - Suzuki et al. 2020)
  const [mlqaeTargetProb, setMlqaeTargetProb] = useState(0.38);
  const [mlqaeShots, setMlqaeShots] = useState(150);

  // Advanced Derivatives & Risk Extensions
  const [selectedExotic, setSelectedExotic] = useState('bull-spread');
  const quantumGreeks = useMemo(() =>
    calculateQuantumGreeks(spotPrice, strikePrice, volatility, riskFreeRate, maturity, 'call'),
    [spotPrice, strikePrice, volatility, riskFreeRate, maturity]
  );
  const creditRisk = useMemo(() =>
    simulateCreditRisk(5, 0.05, 0.35, 1000000),
    []
  );
  const exoticResult = useMemo(() =>
    calculateExoticPayoff(spotPrice, strikePrice, selectedExotic),
    [spotPrice, strikePrice, selectedExotic]
  );

  // Update indices when dataset changes
  useEffect(() => {
    setSelectedAssetIndices(Array.from({ length: Math.min(5, currentDataset.assets.length) }, (_, i) => i));
    setBudgetConstraint(3);
  }, [datasetKey]);

  // Pillar A Solvers
  const portfolioResult = useMemo(() =>
    solvePortfolioQubo(selectedAssetIndices, budgetConstraint, riskAversion, penaltyAlpha, {
      datasetKey,
      depthP,
      optimizer,
      warmStart,
      noiseMode
    }),
    [selectedAssetIndices, budgetConstraint, riskAversion, penaltyAlpha, datasetKey, depthP, optimizer, warmStart, noiseMode]
  );

  const isingData = useMemo(() =>
    buildQuboAndIsing(datasetKey, selectedAssetIndices, budgetConstraint, riskAversion, penaltyAlpha),
    [datasetKey, selectedAssetIndices, budgetConstraint, riskAversion, penaltyAlpha]
  );

  const classicalBaselines = useMemo(() =>
    computeClassicalBaselines(datasetKey, selectedAssetIndices, budgetConstraint, riskAversion),
    [datasetKey, selectedAssetIndices, budgetConstraint, riskAversion]
  );

  const sensitivityData = useMemo(() =>
    analyzePenaltyAlphaSensitivity(datasetKey, selectedAssetIndices, budgetConstraint, riskAversion),
    [datasetKey, selectedAssetIndices, budgetConstraint, riskAversion]
  );

  const blockDecompResult = useMemo(() =>
    solveHybridBlockDecomposition(datasetKey, budgetConstraint, riskAversion),
    [datasetKey, budgetConstraint, riskAversion]
  );

  const frontierData = useMemo(() =>
    generateEfficientFrontier(selectedAssetIndices, datasetKey),
    [selectedAssetIndices, datasetKey]
  );

  // Pillar B Solvers
  const optionsData = useMemo(() =>
    generateQaeConvergenceData(spotPrice, strikePrice, volatility, riskFreeRate, maturity),
    [spotPrice, strikePrice, volatility, riskFreeRate, maturity]
  );

  const bsBenchmark = useMemo(() =>
    calculateBlackScholes(spotPrice, strikePrice, volatility, riskFreeRate, maturity, 'call'),
    [spotPrice, strikePrice, volatility, riskFreeRate, maturity]
  );

  const mlqaeResult = useMemo(() =>
    simulateMlqae(mlqaeTargetProb, [0, 1, 2, 4, 8], mlqaeShots),
    [mlqaeTargetProb, mlqaeShots]
  );

  // Toggle asset in universe
  const handleToggleAsset = (idx) => {
    if (selectedAssetIndices.includes(idx)) {
      if (selectedAssetIndices.length > 3) {
        setSelectedAssetIndices(selectedAssetIndices.filter(i => i !== idx));
      }
    } else {
      setSelectedAssetIndices([...selectedAssetIndices, idx]);
    }
  };

  // Bridge to Composer
  const handleOpenInComposer = () => {
    const qasm = exportFinanceCircuitToQasm(activeMode, 1024, depthP, warmStart);
    try {
      const circuitObj = qasmToCircuit(qasm);
      useCircuitStore.getState().loadCircuit(circuitObj);
      navigate('/composer');
    } catch {
      navigate('/composer');
    }
  };

  // Presets
  const presets = [
    {
      id: 'sp500-balanced',
      name: 'S&P 500 Tech Portfolio (QAOA Warm-Start)',
      config: { mode: 'portfolio', dataset: 'sp500', budget: 3, q: 0.5, alpha: 2.5, depth: 2, warm: true }
    },
    {
      id: 'nifty-bluechip',
      name: 'NIFTY 50 Bluechip (Cardin=3, α=3.5)',
      config: { mode: 'portfolio', dataset: 'nifty50', budget: 3, q: 0.6, alpha: 3.5, depth: 2, warm: true }
    },
    {
      id: 'option-pricing-qae',
      name: 'European Call Option QAE (Mode B)',
      config: { mode: 'options', spot: 100, strike: 105, vol: 0.20, r: 0.04, T: 0.5 }
    },
    {
      id: 'global-tail-risk',
      name: 'Global Multi-Asset CVaR Analysis',
      config: { mode: 'portfolio', dataset: 'global', budget: 2, q: 0.8, alpha: 2.5, depth: 3, warm: true }
    }
  ];

  const handleSelectPreset = (p) => {
    setActivePresetId(p.id);
    setActiveMode(p.config.mode);
    if (p.config.mode === 'portfolio') {
      setDatasetKey(p.config.dataset);
      setBudgetConstraint(p.config.budget);
      setRiskAversion(p.config.q);
      setPenaltyAlpha(p.config.alpha || 2.5);
      setDepthP(p.config.depth || 2);
      setWarmStart(p.config.warm !== undefined ? p.config.warm : true);
    } else {
      setSpotPrice(p.config.spot);
      setStrikePrice(p.config.strike);
      setVolatility(p.config.vol);
      setRiskFreeRate(p.config.r);
      setMaturity(p.config.T);
    }
  };

  const checklistSteps = [
    {
      id: 'step1',
      title: activeMode === 'portfolio' ? 'Configure Markowitz QUBO & Penalty α' : 'Configure Black-Scholes Parameters',
      desc: activeMode === 'portfolio' ? 'Set budget B, risk aversion q, and verify Ising mapping.' : 'Set spot, strike, and maturity parameters.',
      pass: activeMode === 'portfolio' ? portfolioResult.feasible : spotPrice > 0,
      hint: 'Ensure budget constraint B matches selected portfolio size.'
    },
    {
      id: 'step2',
      title: activeMode === 'portfolio' ? 'Verify Feasibility & Constraint Repair' : 'Option Payoff & CVaR Distribution',
      desc: activeMode === 'portfolio' ? 'Verify raw vs post-repair 100% feasibility and greedy repair.' : 'Verify log-normal distribution, 95% & 99% VaR, and CVaR tail risk.',
      pass: activeMode === 'portfolio' ? portfolioResult.postRepairFeasibilityRate === 100 : optionsData.histogram.length > 0,
      hint: 'Inspect raw vs repaired feasibility rates.'
    },
    {
      id: 'step3',
      title: activeMode === 'portfolio' ? 'Benchmark Against Classical Markowitz' : 'QAE Quadratic Speedup Scaling',
      desc: activeMode === 'portfolio' ? 'Evaluate QAOA Sharpe ratio against classical brute force and greedy heuristic.' : 'Observe O(1/N) QAE error decaying faster than Monte Carlo O(1/√N).',
      pass: activeMode === 'portfolio' ? portfolioResult.sharpeRatio > 0.4 : optionsData.convergenceData.length >= 5,
      hint: 'Run classical baseline comparisons.'
    }
  ];

  return (
    <div className="lab-page-container">
      <LabHeader
        domain="Quantitative Finance"
        title="Quantum Finance & Risk Lab"
        status="ONLINE"
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        onOpenComposer={handleOpenInComposer}
      />

      <div className={`lab-workbench ${drawerOpen ? 'drawer-open' : ''}`}>
        {/* Left Config Panel */}
        <aside className="lab-config-panel">
          <div>
            <div className="lab-section-title">
              <span>Finance Studio Mode</span>
            </div>
            <div className="lab-toggle-group">
              <button
                className={`lab-toggle-btn ${activeMode === 'portfolio' ? 'active' : ''}`}
                onClick={() => setActiveMode('portfolio')}
              >
                Pillar A: Portfolio
              </button>
              <button
                className={`lab-toggle-btn ${activeMode === 'options' ? 'active' : ''}`}
                onClick={() => setActiveMode('options')}
              >
                Mode B: QAE Options
              </button>
              <button
                className={`lab-toggle-btn ${activeMode === 'mlqae' ? 'active' : ''}`}
                onClick={() => setActiveMode('mlqae')}
              >
                Mode C: MLQAE Risk
              </button>
            </div>
          </div>

          {activeMode === 'portfolio' && (
            <>
              {/* Market Dataset Selection */}
              <div>
                <div className="lab-section-title">
                  <span>Market Dataset</span>
                </div>
                <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                  <select
                    className="lab-select"
                    value={datasetKey}
                    onChange={(e) => setDatasetKey(e.target.value)}
                  >
                    <option value="sp500">S&P 500 Tech Giants (US Equities)</option>
                    <option value="nifty50">NIFTY 50 Bluechip (Indian Equities)</option>
                    <option value="global">Global Multi-Asset Allocation</option>
                    <option value="crypto">Digital Assets / DeFi Universe</option>
                    <option value="stoxx50">EURO STOXX 50 Mega-Caps</option>
                  </select>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-muted)' }}>
                  {currentDataset.description}
                </div>
              </div>

              {/* Asset Pool Selection */}
              <div>
                <div className="lab-section-title">
                  <span>Asset Universe Pool</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
                  {currentDataset.assets.map((asset, idx) => {
                    const isSelected = selectedAssetIndices.includes(idx);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => handleToggleAsset(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 8px',
                          background: isSelected ? 'rgba(0, 229, 255, 0.08)' : 'var(--lab-bg-input)',
                          border: `1px solid ${isSelected ? 'var(--lab-cyan)' : 'var(--lab-border)'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.72rem'
                        }}
                      >
                        <span style={{ fontWeight: '600', color: isSelected ? 'var(--lab-cyan)' : 'var(--lab-text-primary)' }}>
                          {asset.id} · {asset.name}
                        </span>
                        <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-text-secondary)', fontSize: '0.66rem' }}>
                          +{(asset.expectedReturn * 100).toFixed(0)}% / σ={(asset.volatility * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk & Budget Controls */}
              <div>
                <div className="lab-section-title">
                  <span>Constraints & Penalties</span>
                </div>
                <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                  <label className="lab-label">
                    <span>Risk Aversion (q):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{riskAversion.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={riskAversion}
                    onChange={(e) => setRiskAversion(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                  <label className="lab-label">
                    <span>Target Budget (B):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                      {budgetConstraint} Assets
                    </span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max={Math.min(5, selectedAssetIndices.length)}
                    value={budgetConstraint}
                    onChange={(e) => setBudgetConstraint(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group">
                  <label className="lab-label">
                    <span>Penalty Weight (α):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>
                      α = {penaltyAlpha.toFixed(1)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.5"
                    value={penaltyAlpha}
                    onChange={(e) => setPenaltyAlpha(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>
              </div>

              {/* QAOA & Solver Parameters */}
              <div>
                <div className="lab-section-title">
                  <span>QAOA Solver Configuration</span>
                </div>
                <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                  <label className="lab-label">
                    <span>QAOA Depth (p):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>p = {depthP}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={depthP}
                    onChange={(e) => setDepthP(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                  <label className="lab-label">Classical Optimizer</label>
                  <select
                    className="lab-select"
                    value={optimizer}
                    onChange={(e) => setOptimizer(e.target.value)}
                  >
                    <option value="COBYLA">COBYLA (Constrained Simplex)</option>
                    <option value="Nelder-Mead">Nelder-Mead (Downhill Simplex)</option>
                    <option value="L-BFGS">L-BFGS (Quasi-Newton)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    className={`lab-toggle-btn ${warmStart ? 'active' : ''}`}
                    onClick={() => setWarmStart(!warmStart)}
                    style={{ flex: 1, fontSize: '0.68rem' }}
                  >
                    {warmStart ? '✓ Warm-Start' : 'Zero-State'}
                  </button>
                  <button
                    className={`lab-toggle-btn ${noiseMode === 'depolarizing' ? 'active' : ''}`}
                    onClick={() => setNoiseMode(noiseMode === 'ideal' ? 'depolarizing' : 'ideal')}
                    style={{ flex: 1, fontSize: '0.68rem' }}
                  >
                    {noiseMode === 'depolarizing' ? '⚠ Noisy NISQ' : 'Ideal State'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeMode === 'options' && (
            <>
              <div>
                <div className="lab-section-title">
                  <span>Option Parameters</span>
                </div>
                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Spot Price (S₀):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)' }}>${spotPrice}</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={spotPrice}
                    onChange={(e) => setSpotPrice(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Strike Price (K):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)' }}>${strikePrice}</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={strikePrice}
                    onChange={(e) => setStrikePrice(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Volatility (σ):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)' }}>{(volatility * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.80"
                    step="0.05"
                    value={volatility}
                    onChange={(e) => setVolatility(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group">
                  <label className="lab-label">
                    <span>Maturity (T):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)' }}>{maturity} Years</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={maturity}
                    onChange={(e) => setMaturity(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>
              </div>
            </>
          )}

          {activeMode === 'mlqae' && (
            <>
              <div>
                <div className="lab-section-title">
                  <span>MLQAE Configuration</span>
                </div>
                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Target Tail Probability (a):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                      {(mlqaeTargetProb * 100).toFixed(1)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.95"
                    step="0.01"
                    value={mlqaeTargetProb}
                    onChange={(e) => setMlqaeTargetProb(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Shots Per Grover Power:</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                      {mlqaeShots} shots
                    </span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={mlqaeShots}
                    onChange={(e) => setMlqaeShots(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div style={{ background: 'var(--lab-bg-subpanel)', padding: '8px', borderRadius: '4px', fontSize: '0.68rem', color: 'var(--lab-text-secondary)' }}>
                  <span>Grover Powers: </span>
                  <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                    m ∈ {'{0, 1, 2, 4, 8}'}
                  </span>
                  <div style={{ marginTop: '4px', color: 'var(--lab-text-muted)' }}>
                    Maximum Likelihood reconstruction eliminates QFT ancillae.
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: 'auto', background: 'var(--lab-bg-subpanel)', padding: '8px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
            <span style={{ fontSize: '0.66rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
              ⚡ QUANTUM FINANCE ENGINE
            </span>
            <p style={{ fontSize: '0.68rem', color: 'var(--lab-text-secondary)', margin: '4px 0 0 0' }}>
              Ising cost Hamiltonian H_C, variational QAOA, constraint repair, and MLQAE.
            </p>
          </div>
        </aside>

        {/* Center Workspace */}
        <main className="lab-center-workspace">
          {activeMode === 'portfolio' ? (
            <>
              {/* Top KPI Telemetry Grid */}
              <div className="lab-kpi-grid">
                <MetricKpiCard
                  label="Expected Return"
                  value={`+${portfolioResult.expectedReturn}%`}
                  subtext="Annualized E[R]"
                  highlight="emerald"
                />
                <MetricKpiCard
                  label="Portfolio Volatility"
                  value={`${portfolioResult.volatility}%`}
                  subtext="Standard Deviation (σ)"
                  highlight="cyan"
                />
                <MetricKpiCard
                  label="Sharpe Ratio"
                  value={portfolioResult.sharpeRatio}
                  subtext="Rf = 4.0% Benchmark"
                  highlight="emerald"
                />
                <MetricKpiCard
                  label="Feasibility & Repair"
                  value={portfolioResult.postRepairFeasibilityRate === 100 ? '100% FEASIBLE' : 'INFEASIBLE'}
                  subtext={`Raw QAOA: ${portfolioResult.rawFeasibilityRate}% → Repaired`}
                  highlight="emerald"
                />
              </div>

              {/* Sub-Tabs Navigation */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid var(--lab-border)', paddingBottom: '8px' }}>
                <button
                  className={`lab-toggle-btn ${portfolioSubTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setPortfolioSubTab('overview')}
                >
                  📈 Efficient Frontier & Allocation
                </button>
                <button
                  className={`lab-toggle-btn ${portfolioSubTab === 'baselines' ? 'active' : ''}`}
                  onClick={() => setPortfolioSubTab('baselines')}
                >
                  ⚔️ Classical Baselines (Markowitz vs QAOA)
                </button>
                <button
                  className={`lab-toggle-btn ${portfolioSubTab === 'ising' ? 'active' : ''}`}
                  onClick={() => setPortfolioSubTab('ising')}
                >
                  ⚛️ QUBO & Ising Hamiltonian (h_i, J_ij)
                </button>
                <button
                  className={`lab-toggle-btn ${portfolioSubTab === 'sensitivity' ? 'active' : ''}`}
                  onClick={() => setPortfolioSubTab('sensitivity')}
                >
                  🎚️ Penalty (α) Sensitivity Tool
                </button>
                <button
                  className={`lab-toggle-btn ${portfolioSubTab === 'blockDecomp' ? 'active' : ''}`}
                  onClick={() => setPortfolioSubTab('blockDecomp')}
                >
                  🧩 Hybrid Block Decomposition
                </button>
              </div>

              {/* Sub-Tab 1: Overview (Frontier & Allocation) */}
              {portfolioSubTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem' }}>
                  {/* Markowitz Efficient Frontier Plot */}
                  <div className="lab-card">
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>📈 Markowitz Efficient Frontier Curve</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                        {currentDataset.name.split(' ')[0]}
                      </span>
                    </div>

                    <div style={{ background: '#05070a', borderRadius: '4px', padding: '10px', height: '230px' }}>
                      <svg width="100%" height="100%" viewBox="0 0 400 210" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="40" y1="20" x2="40" y2="190" stroke="rgba(255,255,255,0.1)" />
                        <line x1="40" y1="190" x2="380" y2="190" stroke="rgba(255,255,255,0.1)" />

                        {/* Random Scatter Points */}
                        {frontierData.scatterPoints.map((pt, i) => {
                          const px = 40 + ((pt.volatility - 10) / 45) * 340;
                          const py = 190 - ((pt.expectedReturn - 5) / 30) * 160;
                          return (
                            <circle
                              key={i}
                              cx={px}
                              cy={py}
                              r="2"
                              fill="rgba(255, 255, 255, 0.25)"
                            />
                          );
                        })}

                        {/* Frontier Upper Envelope Line */}
                        <polyline
                          fill="none"
                          stroke="#00E5FF"
                          strokeWidth="2.5"
                          points={frontierData.frontierCurve.map(pt => {
                            const px = 40 + ((pt.volatility - 10) / 45) * 340;
                            const py = 190 - ((pt.expectedReturn - 5) / 30) * 160;
                            return `${px},${py}`;
                          }).join(' ')}
                        />

                        {/* Quantum Optimal Solution Point */}
                        {(() => {
                          const qx = 40 + ((portfolioResult.volatility - 10) / 45) * 340;
                          const qy = 190 - ((portfolioResult.expectedReturn - 5) / 30) * 160;
                          return (
                            <g>
                              <circle cx={qx} cy={qy} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                              <text x={qx + 10} y={qy - 5} fill="#10b981" fontSize="10" fontFamily="JetBrains Mono, monospace">
                                QAOA (Sharpe {portfolioResult.sharpeRatio})
                              </text>
                            </g>
                          );
                        })()}
                      </svg>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--lab-text-muted)' }}>
                      <span>· Random Portfolios</span>
                      <span style={{ color: 'var(--lab-cyan)' }}>― Continuous Markowitz Frontier</span>
                      <span style={{ color: 'var(--lab-emerald)' }}>● QAOA Discrete Solution</span>
                    </div>
                  </div>

                  {/* Selected Asset Allocation & Constraint Repair Card */}
                  <div className="lab-card">
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>💼 Optimal Quantum Allocation</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                        Budget B = {budgetConstraint}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {portfolioResult.selectedAssets.map(asset => (
                        <div
                          key={asset.id}
                          style={{
                            background: 'var(--lab-bg-subpanel)',
                            border: '1px solid var(--lab-border)',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--lab-cyan)', fontSize: '0.78rem' }}>
                              {asset.id}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-secondary)' }}>
                              {asset.name} · {asset.sector}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--lab-font-mono)', fontWeight: '600', color: 'var(--lab-emerald)', fontSize: '0.78rem' }}>
                              +{(asset.expectedReturn * 100).toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)' }}>
                              Vol: {(asset.volatility * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Constraint Repair Telemetry Box */}
                      <div style={{ marginTop: '6px', padding: '6px 8px', background: 'var(--lab-bg-input)', borderRadius: '4px', fontSize: '0.68rem', border: '1px solid var(--lab-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ color: 'var(--lab-text-secondary)' }}>Sampled Raw Bitstring:</span>
                          <span style={{ fontFamily: 'var(--lab-font-mono)', color: portfolioResult.wasRepaired ? 'var(--lab-amber)' : 'var(--lab-emerald)' }}>
                            |{portfolioResult.rawBitstring}⟩
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ color: 'var(--lab-text-secondary)' }}>Post-Repair Bitstring:</span>
                          <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                            |{portfolioResult.repairedBitstring}⟩ ({portfolioResult.wasRepaired ? `✓ Repaired ${portfolioResult.bitsRepaired} bit` : 'Valid'})
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--lab-text-secondary)' }}>Feasibility Gain:</span>
                          <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                            {portfolioResult.rawFeasibilityRate}% → 100.0% Feasible
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Classical Baselines */}
              {portfolioSubTab === 'baselines' && (
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>⚔️ Side-by-Side Classical vs Quantum Baselines</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                      Same Expected Returns & Covariance Matrix
                    </span>
                  </div>

                  <p style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', margin: '0 0 10px 0' }}>
                    Compare Quantum QAOA against exact classical Quadratic Programming (Markowitz Brute Force) and a greedy heuristic.
                  </p>

                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>Algorithm</th>
                        <th>Expected Return</th>
                        <th>Volatility (σ)</th>
                        <th>Sharpe Ratio</th>
                        <th>Feasibility</th>
                        <th>Solve Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ color: 'var(--lab-cyan)', fontWeight: '600' }}>
                          {classicalBaselines.qaoa.name}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                          {classicalBaselines.qaoa.expectedReturn}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.qaoa.volatility}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)', fontWeight: '600', color: 'var(--lab-cyan)' }}>
                          {classicalBaselines.qaoa.sharpeRatio}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                          {classicalBaselines.qaoa.feasibility}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.qaoa.solveTime}
                        </td>
                      </tr>
                      <tr>
                        <td>{classicalBaselines.exact.name}</td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                          {classicalBaselines.exact.expectedReturn}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.exact.volatility}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)', fontWeight: '600' }}>
                          {classicalBaselines.exact.sharpeRatio}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.exact.feasibility}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.exact.solveTime}
                        </td>
                      </tr>
                      <tr>
                        <td>{classicalBaselines.greedy.name}</td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.greedy.expectedReturn}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.greedy.volatility}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.greedy.sharpeRatio}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.greedy.feasibility}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                          {classicalBaselines.greedy.solveTime}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-Tab 3: QUBO & Ising Hamiltonian */}
              {portfolioSubTab === 'ising' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
                  {/* Pauli-Z Cost Hamiltonian Table */}
                  <div className="lab-card">
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>⚛️ Pauli-Z Cost Hamiltonian H_C</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                        x_i = (1 - Z_i)/2
                      </span>
                    </div>

                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <table className="lab-table">
                        <thead>
                          <tr>
                            <th>Pauli String</th>
                            <th>Coeff (Ha)</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isingData.pauliStrings.map((term, idx) => (
                            <tr key={idx}>
                              <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: '600' }}>
                                {term.pauli}
                              </td>
                              <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                                {term.coeff}
                              </td>
                              <td style={{ fontSize: '0.7rem', color: 'var(--lab-text-secondary)' }}>
                                {term.label}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* QUBO Matrix View & Convergence */}
                  <div className="lab-card">
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>🔄 QAOA Convergence Loop ({optimizer})</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                        p = {depthP}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '110px', background: 'var(--lab-bg-subpanel)', padding: '8px', borderRadius: '4px' }}>
                        {portfolioResult.convergenceTrajectory.map((step, idx) => (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              height: `${Math.min(100, Math.max(15, (Math.abs(step.energy) / 4) * 100))}%`,
                              background: 'var(--lab-cyan)',
                              borderRadius: '2px',
                              opacity: 0.85
                            }}
                            title={`Iter ${step.iteration}: E=${step.energy}, γ=${step.gamma}, β=${step.beta}`}
                          />
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--lab-text-muted)' }}>
                        <span>Iter 1: E={portfolioResult.convergenceTrajectory[0]?.energy}</span>
                        <span style={{ color: 'var(--lab-emerald)' }}>Iter 15: Converged (E={portfolioResult.quboEnergy})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 4: Penalty (α) Sensitivity Tool */}
              {portfolioSubTab === 'sensitivity' && (
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>🎚️ Penalty Weight (α) Sensitivity Analyzer</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>
                      Optimal Sweet Spot Identification
                    </span>
                  </div>

                  <p style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', margin: '0 0 10px 0' }}>
                    If α is too low, budget constraints break (infeasible solutions). If α is too high, the penalty dominates the objective, hurting the Sharpe ratio.
                  </p>

                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>Penalty (α)</th>
                        <th>Feasibility Rate</th>
                        <th>Sharpe Ratio</th>
                        <th>Expected Return</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivityData.map((row, idx) => (
                        <tr key={idx} style={{ background: row.isOptimal ? 'rgba(0, 229, 255, 0.08)' : 'transparent' }}>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', fontWeight: '600', color: row.isOptimal ? 'var(--lab-cyan)' : 'var(--lab-text-primary)' }}>
                            α = {row.alpha.toFixed(1)}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: row.feasibilityRate >= 70 ? 'var(--lab-emerald)' : 'var(--lab-amber)' }}>
                            {row.feasibilityRate}%
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                            {row.sharpeRatio.toFixed(2)}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                            +{row.expectedReturn}%
                          </td>
                          <td style={{ fontSize: '0.72rem', color: row.isOptimal ? 'var(--lab-cyan)' : 'var(--lab-text-muted)' }}>
                            {row.isOptimal ? '★ Optimal Balance' : row.alpha < 2.0 ? 'Under-penalized' : 'Over-penalized'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-Tab 5: Hybrid Block Decomposition */}
              {portfolioSubTab === 'blockDecomp' && (
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>🧩 Hybrid Block Decomposition (Clustered Scaling)</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                      NISQ Scalability
                    </span>
                  </div>

                  <p style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', margin: '0 0 10px 0' }}>
                    Clusters correlated assets into independent sub-blocks, solves each sub-problem on NISQ-sized QAOA registers ({blockDecompResult.totalQubitsPerSubproblem} qubits), and stitches the global portfolio allocation classically.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)' }}>Block 1 (Core Sub-problem):</div>
                      <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: '600', marginTop: '4px' }}>
                        {blockDecompResult.blockAAssets.join(', ')}
                      </div>
                    </div>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)' }}>Block 2 (Complementary Sub-problem):</div>
                      <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)', fontWeight: '600', marginTop: '4px' }}>
                        {blockDecompResult.blockBAssets.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '0.74rem' }}>
                    <div style={{ flex: 1, background: 'var(--lab-bg-input)', padding: '8px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--lab-text-secondary)' }}>Combined Expected Return: </span>
                      <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>+{blockDecompResult.expectedReturn}%</span>
                    </div>
                    <div style={{ flex: 1, background: 'var(--lab-bg-input)', padding: '8px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--lab-text-secondary)' }}>Combined Sharpe Ratio: </span>
                      <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{blockDecompResult.sharpeRatio}</span>
                    </div>
                    <div style={{ flex: 1, background: 'var(--lab-bg-input)', padding: '8px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--lab-text-secondary)' }}>Tracking Error vs Exact: </span>
                      <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-text-primary)' }}>{blockDecompResult.trackingErrorVsExact}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Mode B: Options & QAE KPIs */}
              <div className="lab-kpi-grid">
                <MetricKpiCard
                  label="Black-Scholes Price"
                  value={`$${bsBenchmark.price.toFixed(2)}`}
                  subtext="Exact Analytical Benchmark"
                  highlight="cyan"
                />
                <MetricKpiCard
                  label="Delta (Δ) & Gamma (Γ)"
                  value={`Δ ${bsBenchmark.delta.toFixed(2)}`}
                  subtext={`Γ = ${bsBenchmark.gamma.toFixed(3)}`}
                  highlight="emerald"
                />
                <MetricKpiCard
                  label="Value at Risk (VaR)"
                  value={`$${optionsData.var95}`}
                  subtext={`95% VaR (99% VaR: $${optionsData.var99})`}
                  highlight="amber"
                />
                <MetricKpiCard
                  label="Conditional VaR (CVaR)"
                  value={`$${optionsData.cvar95}`}
                  subtext={`95% CVaR (99% CVaR: $${optionsData.cvar99})`}
                  highlight="red"
                />
              </div>

              {/* Payoff Histogram & QAE Convergence Log-Log Chart Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Payoff Distribution Histogram */}
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>📊 Terminal Price & Payoff Distribution</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                      Strike K = ${strikePrice}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '170px', background: '#05070a', padding: '10px', borderRadius: '4px' }}>
                    {optionsData.histogram.map((bin, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: `${Math.min(100, bin.probability * 6)}%`,
                          background: bin.inTheMoney ? 'var(--lab-emerald)' : 'var(--lab-border)',
                          borderRadius: '2px',
                          opacity: 0.85
                        }}
                        title={`Spot $${bin.spotPrice}: ${bin.probability}% prob, Payoff: $${bin.payoff}`}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--lab-text-muted)' }}>
                    <span>Out of Money</span>
                    <span style={{ color: 'var(--lab-emerald)' }}>In the Money (Payoff &gt; 0)</span>
                  </div>
                </div>

                {/* QAE Convergence Rate Log-Log Chart */}
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>⚡ Convergence: QAE O(1/N) vs Monte Carlo O(1/√N)</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                      Quadratic Speedup
                    </span>
                  </div>

                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>Samples (N)</th>
                        <th>Monte Carlo Error</th>
                        <th>QAE Error</th>
                        <th>Speedup</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optionsData.convergenceData.slice(1, 6).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--lab-font-mono)' }}>{row.samples}</td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>
                            ${row.mcError}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)', fontWeight: '600' }}>
                            ${row.qaeError}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                            {row.speedupFactor}x Faster
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quantum Greeks & Credit Risk Simulation Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                {/* Quantum Greeks Card */}
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>📐 Quantum Greeks Estimation (MLQAE Differentials)</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                      O(1/ε) QUADRATIC ADVANTAGE
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.71rem', color: 'var(--lab-text-secondary)' }}>
                    Computes financial price sensitivity metrics (Greeks) via finite difference perturbations over the quantum amplitude estimation engine (arxiv:1806.06893).
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-secondary)' }}>Delta (∂V/∂S)</div>
                      <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: 'bold' }}>{quantumGreeks.greeks.delta}</div>
                    </div>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-secondary)' }}>Gamma (∂²V/∂S²)</div>
                      <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)', fontWeight: 'bold' }}>{quantumGreeks.greeks.gamma}</div>
                    </div>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-secondary)' }}>Vega (∂V/∂σ)</div>
                      <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)', fontWeight: 'bold' }}>{quantumGreeks.greeks.vega}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--lab-bg-subpanel)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.68rem' }}>
                    <span style={{ color: 'var(--lab-text-secondary)' }}>Theta: <strong style={{ color: 'var(--lab-text-primary)' }}>{quantumGreeks.greeks.theta}/day</strong></span>
                    <span style={{ color: 'var(--lab-text-secondary)' }}>Rho: <strong style={{ color: 'var(--lab-text-primary)' }}>{quantumGreeks.greeks.rho}/1%</strong></span>
                  </div>
                </div>

                {/* Credit Risk Gaussian Copula Card */}
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>🏦 Woerner & Egger Credit Risk Engine (Gaussian Copula)</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                      {creditRisk.quantumSpeedup.speedupFactor}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.71rem', color: 'var(--lab-text-secondary)' }}>
                    Simulates loan default probabilities via Gaussian copula latent factor model with MLQAE quadratic speedup for tail events (arxiv:1806.06893).
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-secondary)' }}>Expected Loss (EL)</div>
                      <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: 'bold' }}>${creditRisk.expectedLoss.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-secondary)' }}>VaR (99% Conf.)</div>
                      <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)', fontWeight: 'bold' }}>${Math.round(creditRisk.var99).toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-secondary)' }}>CVaR / Shortfall</div>
                      <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-red)', fontWeight: 'bold' }}>${Math.round(creditRisk.cvar99).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-secondary)', background: 'var(--lab-bg-subpanel)', padding: '6px 8px', borderRadius: '4px' }}>
                    Queries: Classical MC requires <strong>{creditRisk.quantumSpeedup.classicalQueries.toLocaleString()}</strong> vs Quantum MLQAE <strong>{creditRisk.quantumSpeedup.quantumQueries}</strong> queries.
                  </div>
                </div>
              </div>
            </>
          )}

          {activeMode === 'mlqae' && (
            <>
              {/* Mode C: MLQAE KPIs */}
              <div className="lab-kpi-grid">
                <MetricKpiCard
                  label="Target Tail Amplitude"
                  value={`${(mlqaeResult.trueProbability * 100).toFixed(1)}%`}
                  subtext="True Distribution a = sin²(θ)"
                  highlight="cyan"
                />
                <MetricKpiCard
                  label="MLQAE Estimate"
                  value={`${(mlqaeResult.mlqaeEstimate * 100).toFixed(2)}%`}
                  subtext="Maximum Likelihood â"
                  highlight="emerald"
                />
                <MetricKpiCard
                  label="Estimation Error"
                  value={`${(mlqaeResult.estimationError * 100).toFixed(2)}%`}
                  subtext="|â - a| Reconstructed"
                  highlight={mlqaeResult.estimationError < 0.05 ? 'emerald' : 'amber'}
                />
                <MetricKpiCard
                  label="Quantum Advantage"
                  value="Zero QFT"
                  subtext="3 Ancilla Qubits Saved"
                  highlight="emerald"
                />
              </div>

              {/* Grover Powers & Likelihood Maximization Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
                {/* Grover Powers Table */}
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>⚛️ Grover Schedule Powers & Counts</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                      m_k ∈ {'{0, 1, 2, 4, 8}'}
                    </span>
                  </div>

                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>Grover Power (m)</th>
                        <th>Rotations (2m+1)</th>
                        <th>Counts / Shots</th>
                        <th>Empirical P_m</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mlqaeResult.experimentalData.map((d, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: '600' }}>
                            m = {d.power}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)' }}>{2 * d.power + 1} θ</td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                            {d.count1} / {d.shots}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                            {(d.empiricalProb * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)', marginTop: '8px' }}>
                    Each Grover schedule power amplifies eigenvalue phase θ by an odd factor (2m+1) for classical likelihood reconstruction.
                  </div>
                </div>

                {/* Maximum Likelihood Reconstruction Info */}
                <div className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-card-title">
                      <span>📈 Likelihood Reconstruction Engine</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                      Suzuki et al. (2020)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--lab-text-secondary)' }}>Log-Likelihood Optimization:</div>
                      <div style={{ fontSize: '0.82rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', marginTop: '4px' }}>
                        ln L(a) = ∑ [h_k ln sin²((2m_k+1)θ) + (N_k - h_k) ln cos²((2m_k+1)θ)]
                      </div>
                    </div>

                    <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', fontSize: '0.74rem' }}>
                      <div style={{ color: 'var(--lab-emerald)', fontWeight: '600', marginBottom: '4px' }}>
                        ✓ Hardware Efficiency Gains
                      </div>
                      <div style={{ color: 'var(--lab-text-secondary)', lineHeight: '1.4' }}>
                        Canonical QAE requires Quantum Phase Estimation (QPE) with controlled Grover operators and an inverse QFT register. MLQAE removes all ancillary evaluation qubits and deep multi-qubit controlled gates, achieving optimal Heisenberg-limited scaling directly on noisy intermediate-scale quantum (NISQ) hardware.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {drawerOpen && (
        <GuidedLabDrawer
          labName="Quantum Finance & Risk Lab"
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onReset={() => {
            setRiskAversion(0.5);
            setBudgetConstraint(3);
            setPenaltyAlpha(2.5);
          }}
          steps={checklistSteps}
          reportData={{
            mode: activeMode,
            dataset: datasetKey,
            portfolioResult: activeMode === 'portfolio' ? portfolioResult : null,
            classicalBaselines: activeMode === 'portfolio' ? classicalBaselines : null,
            optionsResult: activeMode === 'options' ? {
              spotPrice,
              strikePrice,
              volatility,
              bsBenchmark,
              var95: optionsData.var95,
              cvar95: optionsData.cvar95,
              var99: optionsData.var99,
              cvar99: optionsData.cvar99
            } : null,
            mlqaeResult: activeMode === 'mlqae' ? mlqaeResult : null
          }}
          onOpenComposer={handleOpenInComposer}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      <UnifiedNavbar session={session} />
    </div>
  );
}
