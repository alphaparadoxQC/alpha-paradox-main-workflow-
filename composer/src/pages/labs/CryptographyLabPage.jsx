import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LabHeader from '../../components/labs/common/LabHeader';
import GuidedLabDrawer from '../../components/labs/common/GuidedLabDrawer';
import MetricKpiCard from '../../components/labs/common/MetricKpiCard';
import UnifiedNavbar from '../../components/shared/UnifiedNavbar';
import CryptographyExportModal from '../../components/labs/cryptography/CryptographyExportModal';
import {
  simulateQkdProtocolAdvanced,
  simulateTelecomQkdLink,
  simulateEndToEndEncryption,
  scanCodeForCbom,
  scanLiveEndpoint,
  scanRepositoryFile,
  generateAutoRemediationPatch,
  computeMigrationPriority,
  getHybridTlsComparison,
  PQC_CODE_PRESETS,
  exportQkdCircuitToQasm,
  NIST_FIPS_STANDARDS,
  getNistFipsParameters,
  simulateQuantumNetworkRepeater,
  computeGllpDecoyBounds,
  generateCryptographyNotebookJson
} from '../../quantum-engine/labs/cryptography-engine';
import { qasmToCircuit } from '../../quantum-engine/qasm-parser';
import { useCircuitStore } from '../../stores/circuitStore';
import { useNotebookStore } from '../../stores/notebookStore';
import '../../styles/labs.css';

export default function CryptographyLabPage({ session }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState('bb84-eve');

  // Active Tab: 'qkd' (Tab A), 'pqc' (Tab B), or 'repeater' (Tab C)
  const [activeTab, setActiveTab] = useState('qkd');

  // ── Tab A Config (QKD & Telecom Links) ──
  const [qkdMode, setQkdMode] = useState('educational'); // 'educational' (24-bit) | 'telecom' (10^6 pulses/sec)
  const [protocol, setProtocol] = useState('Decoy-BB84');
  const [bitCount, setBitCount] = useState(24);
  const [eveEnabled, setEveEnabled] = useState(true);
  const [channelNoise, setChannelNoise] = useState(0.02);
  const [eveAttackType, setEveAttackType] = useState('intercept-resend'); // 'intercept-resend' | 'pns' | 'beam-splitting'
  const [eveCount, setEveCount] = useState(1);
  const [photonLossRate, setPhotonLossRate] = useState(0.05);
  const [plaintextMessage, setPlaintextMessage] = useState('TRANSFER ₹50,00,000 TO ACC 98214');

  // Telecom Mode Config
  const [telecomDistanceKm, setTelecomDistanceKm] = useState(50);
  const [telecomRepRateMhz, setTelecomRepRateMhz] = useState(100);
  const [telecomFiberLoss, setTelecomFiberLoss] = useState(0.20);

  const [qkdResult, setQkdResult] = useState(() =>
    simulateQkdProtocolAdvanced({
      protocol: 'Decoy-BB84',
      bitCount: 24,
      eveEnabled: true,
      channelNoise: 0.02,
      eveAttackType: 'intercept-resend',
      eveCount: 1,
      photonLossRate: 0.05
    })
  );

  const telecomResult = useMemo(() =>
    simulateTelecomQkdLink({
      distanceKm: telecomDistanceKm,
      repRateMhz: telecomRepRateMhz,
      fiberAttenuationDbPerKm: telecomFiberLoss,
      eveEnabled,
      eveAttackType
    }),
    [telecomDistanceKm, telecomRepRateMhz, telecomFiberLoss, eveEnabled, eveAttackType]
  );

  // Dynamic GLLP Bounds tied directly to live channel QBER & Eve status (Bug 1 Fix)
  const gllpBounds = useMemo(() =>
    computeGllpDecoyBounds({
      mu: 0.5,
      nu: 0.1,
      isEavesdropperDetected: qkdResult.isEavesdropperDetected,
      qber: qkdResult.qber,
      eveAttackType
    }),
    [qkdResult.isEavesdropperDetected, qkdResult.qber, eveAttackType]
  );

  // Plaintext Encryption Demo Output
  const encryptionDemo = useMemo(() =>
    simulateEndToEndEncryption(
      plaintextMessage,
      qkdResult.reconciliation?.amplifiedKeyHex || qkdResult.finalKeyHex,
      qkdResult.status === 'SECURE'
    ),
    [plaintextMessage, qkdResult.status, qkdResult.reconciliation?.amplifiedKeyHex, qkdResult.finalKeyHex]
  );

  // ── Tab B Config (PQC & CBOM Scanner) ──
  const [pqcInputMode, setPqcInputMode] = useState('code'); // 'code' | 'upload' | 'endpoint' | 'patch'
  const [selectedPqcPreset, setSelectedPqcPreset] = useState('tls');
  const [customCode, setCustomCode] = useState(PQC_CODE_PRESETS.tls.code);
  const [liveEndpointInput, setLiveEndpointInput] = useState('api.hdfcbank.com:443');
  const [liveEndpointResult, setLiveEndpointResult] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [cbomResult, setCbomResult] = useState(() => scanCodeForCbom(PQC_CODE_PRESETS.tls.code));

  // ── Tab C Config (SeQUeNCe Quantum Network & Repeaters) ──
  const [selectedFips, setSelectedFips] = useState('fips203');
  const [repeaterDistKm, setRepeaterDistKm] = useState(80);
  const [numRepeaters, setNumRepeaters] = useState(2);
  const [purificationOn, setPurificationOn] = useState(true);
  const [fiberLossDbPerKm, setFiberLossDbPerKm] = useState(0.20);
  const [t2CoherenceMs, setT2CoherenceMs] = useState(150);
  const [bsmEfficiency, setBsmEfficiency] = useState(0.50);

  const repeaterResult = useMemo(() =>
    simulateQuantumNetworkRepeater({
      totalDistanceKm: repeaterDistKm,
      numRepeaters,
      rawFidelity: 0.88,
      fiberAttenuationDbPerKm: fiberLossDbPerKm,
      purificationEnabled: purificationOn,
      t2CoherenceMs,
      bsmEfficiency
    }),
    [repeaterDistKm, numRepeaters, fiberLossDbPerKm, purificationOn, t2CoherenceMs, bsmEfficiency]
  );

  // Run QKD simulation on parameters change
  const handleRunQkd = () => {
    const res = simulateQkdProtocolAdvanced({
      protocol,
      bitCount,
      eveEnabled,
      channelNoise,
      eveAttackType,
      eveCount,
      photonLossRate
    });
    setQkdResult(res);
  };

  useEffect(() => {
    handleRunQkd();
  }, [protocol, bitCount, eveEnabled, channelNoise, eveAttackType, eveCount, photonLossRate]);

  // Tab B: Enriched Migration Risk Priority Findings
  const enrichedFindings = useMemo(() =>
    computeMigrationPriority(cbomResult.findings),
    [cbomResult.findings]
  );

  // Tab B: Hybrid TLS Performance Comparison Rows
  const hybridTlsRows = useMemo(() => getHybridTlsComparison(), []);

  // Run CBOM Scan
  const handleScanCode = (code) => {
    const res = scanCodeForCbom(code);
    setCbomResult(res);
  };

  const handleSelectPqcPreset = (key) => {
    setSelectedPqcPreset(key);
    const code = PQC_CODE_PRESETS[key]?.code || '';
    setCustomCode(code);
    handleScanCode(code);
  };

  const handleLiveEndpointScan = () => {
    const res = scanLiveEndpoint(liveEndpointInput);
    setLiveEndpointResult(res);
    setCbomResult(res.scanResult);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      setCustomCode(content);
      const res = scanRepositoryFile(file.name, content);
      setCbomResult(res);
    };
    reader.readAsText(file);
  };

  // Bridge to Composer Studio
  const handleOpenInComposer = () => {
    const qasm = exportQkdCircuitToQasm(protocol);
    try {
      const circuitObj = qasmToCircuit(qasm);
      useCircuitStore.getState().loadCircuit(circuitObj);
      navigate('/composer');
    } catch {
      navigate('/composer');
    }
  };

  // Bridge to Jupyter Notebook (/lab)
  const handleOpenInNotebook = () => {
    const nbJson = generateCryptographyNotebookJson(activeTab, {
      qkd: qkdResult,
      repeater: repeaterResult,
      telecom: telecomResult
    });
    useNotebookStore.getState().fromIpynb(nbJson);
    navigate('/lab');
  };

  // Presets for Guided Lab Drawer
  const presets = [
    {
      id: 'bb84-clean',
      name: '1. Clean Optical QKD Channel (BB84)',
      config: { tab: 'qkd', protocol: 'BB84', bitCount: 24, eve: false, noise: 0.01, eveCount: 1, loss: 0.02 }
    },
    {
      id: 'bb84-eve',
      name: '2. Intercept-Resend Eavesdropper Attack',
      config: { tab: 'qkd', protocol: 'BB84', bitCount: 24, eve: true, noise: 0.02, attack: 'intercept-resend', eveCount: 1, loss: 0.05 }
    },
    {
      id: 'decoy-pns',
      name: '3. Photon Number Splitting (PNS) vs Decoy-State',
      config: { tab: 'qkd', protocol: 'Decoy-BB84', bitCount: 32, eve: true, noise: 0.01, attack: 'pns', eveCount: 1, loss: 0.05 }
    },
    {
      id: 'pqc-tls',
      name: '4. TLS 1.3 & Banking CBOM Audit (NIST FIPS)',
      config: { tab: 'pqc', pqcPreset: 'banking' }
    },
    {
      id: 'repeater-120km',
      name: '5. SeQUeNCe 120km Link with BBPSSW Purification',
      config: { tab: 'repeater', distKm: 120, repeaters: 3, purification: true }
    }
  ];

  const handleSelectPreset = (p) => {
    setActivePresetId(p.id);
    setActiveTab(p.config.tab);
    if (p.config.tab === 'qkd') {
      setProtocol(p.config.protocol);
      setBitCount(p.config.bitCount);
      setEveEnabled(p.config.eve);
      setChannelNoise(p.config.noise);
      if (p.config.attack) setEveAttackType(p.config.attack);
      if (p.config.eveCount) setEveCount(p.config.eveCount);
      if (p.config.loss !== undefined) setPhotonLossRate(p.config.loss);
    } else if (p.config.tab === 'repeater') {
      if (p.config.distKm) setRepeaterDistKm(p.config.distKm);
      if (p.config.repeaters) setNumRepeaters(p.config.repeaters);
      if (p.config.purification !== undefined) setPurificationOn(p.config.purification);
    } else {
      handleSelectPqcPreset(p.config.pqcPreset);
    }
  };

  const checklistSteps = [
    {
      id: 'step1',
      title: 'Run Clean Optical QKD Link',
      desc: 'Verify optical baseline QBER < 3.0% and distilled secret key is generated.',
      pass: !eveEnabled && qkdResult.status === 'SECURE',
      hint: 'Toggle Eve eavesdropper OFF in Tab A and observe green secure status.'
    },
    {
      id: 'step2',
      title: 'Intercept-Resend & PNS Attack Detection',
      desc: 'Observe QBER > 11.0% Shor-Preskill abort and Decoy-State yield anomaly.',
      pass: eveEnabled && (qkdResult.qber > 11.0 || eveAttackType === 'pns'),
      hint: 'Turn Eve ON with Intercept-Resend or PNS Attack model.'
    },
    {
      id: 'step3',
      title: 'Scan Cryptographic Codebase & CBOM',
      desc: 'Identify RSA-2048 / ECDSA primitives and map NIST FIPS 203/204 replacements.',
      pass: cbomResult.totalVulnerabilities > 0 && enrichedFindings.length > 0,
      hint: 'Inspect CBOM table in Tab B and review Harvest-Now-Decrypt-Later exposure.'
    },
    {
      id: 'step4',
      title: 'Deploy Quantum Repeaters with Purification',
      desc: 'Extend distance to 120 km and achieve > 85% fidelity via BBPSSW distillation.',
      pass: repeaterDistKm >= 100 && repeaterResult.purifiedFidelity >= 0.85,
      hint: 'Increase distance in Tab C and toggle BBPSSW Purification ON.'
    }
  ];

  return (
    <div className="lab-page-container">
      <LabHeader
        domain="Cybersecurity & Telecom"
        title="Quantum Cryptography, QKD & PQC Security Lab"
        status="ONLINE"
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        onOpenComposer={handleOpenInComposer}
        extraActions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleOpenInNotebook}
              className="lab-action-btn"
              title="Open executable Python QKD / PQC script in Jupyter Notebook (/lab)"
              style={{ fontSize: '0.74rem', padding: '4px 10px', background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
            >
              📓 Open in Notebook
            </button>
            <button
              onClick={handleOpenInComposer}
              className="lab-action-btn"
              title="Push QKD polarization / Bell-state circuit into Composer Studio"
              style={{ fontSize: '0.74rem', padding: '4px 10px', background: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.3)', color: '#a78bfa' }}
            >
              ⚛️ Open in Composer
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="lab-action-btn primary"
              title="Export CycloneDX 1.6 CBOM, SARIF 2.1.0, ETSI QKD KMS JSON, and Board-Ready Audit Report"
              style={{ fontSize: '0.74rem', padding: '4px 12px' }}
            >
              🚀 Export Model / CBOM
            </button>
          </div>
        }
      />

      <div className={`lab-workbench ${drawerOpen ? 'drawer-open' : ''}`}>
        {/* Left Config Panel */}
        <aside className="lab-config-panel">
          <div>
            <div className="lab-section-title">
              <span>Security Workbench</span>
            </div>
            <div className="lab-toggle-group">
              <button
                className={`lab-toggle-btn ${activeTab === 'qkd' ? 'active' : ''}`}
                onClick={() => setActiveTab('qkd')}
              >
                Tab A: QKD Simulator
              </button>
              <button
                className={`lab-toggle-btn ${activeTab === 'pqc' ? 'active' : ''}`}
                onClick={() => setActiveTab('pqc')}
              >
                Tab B: PQC CBOM
              </button>
              <button
                className={`lab-toggle-btn ${activeTab === 'repeater' ? 'active' : ''}`}
                onClick={() => setActiveTab('repeater')}
              >
                Tab C: SeQUeNCe Repeaters
              </button>
            </div>
          </div>

          {/* TAB A CONTROLS */}
          {activeTab === 'qkd' ? (
            <>
              <div>
                <div className="lab-section-title">
                  <span>QKD Simulation Mode</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                  <button
                    className={`lab-toggle-btn ${qkdMode === 'educational' ? 'active' : ''}`}
                    onClick={() => setQkdMode('educational')}
                    style={{ fontSize: '0.7rem', padding: '5px' }}
                  >
                    24-Bit Pulses
                  </button>
                  <button
                    className={`lab-toggle-btn ${qkdMode === 'telecom' ? 'active' : ''}`}
                    onClick={() => setQkdMode('telecom')}
                    style={{ fontSize: '0.7rem', padding: '5px' }}
                  >
                    Telecom 10⁶ Pulses
                  </button>
                </div>

                {qkdMode === 'educational' ? (
                  <>
                    <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                      <label className="lab-label">Quantum Protocol</label>
                      <select
                        className="lab-select"
                        value={protocol}
                        onChange={(e) => setProtocol(e.target.value)}
                      >
                        <option value="Decoy-BB84">Decoy-State BB84 (PNS Defense - Hwang 2003)</option>
                        <option value="BB84">BB84 (4-State Polarization)</option>
                        <option value="E91">E91 (Entangled Bell Pairs)</option>
                        <option value="Teleportation">Quantum Teleportation Channel</option>
                      </select>
                    </div>

                    <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                      <label className="lab-label">
                        <span>Pulse Register Length:</span>
                        <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{bitCount} Bits</span>
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        step="4"
                        value={bitCount}
                        onChange={(e) => setBitCount(Number(e.target.value))}
                        className="lab-slider"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                      <label className="lab-label">
                        <span>Fiber Distance (Dark Fiber):</span>
                        <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{telecomDistanceKm} km</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="150"
                        step="5"
                        value={telecomDistanceKm}
                        onChange={(e) => setTelecomDistanceKm(Number(e.target.value))}
                        className="lab-slider"
                      />
                    </div>

                    <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                      <label className="lab-label">
                        <span>Laser Repetition Rate:</span>
                        <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>{telecomRepRateMhz} MHz</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="10"
                        value={telecomRepRateMhz}
                        onChange={(e) => setTelecomRepRateMhz(Number(e.target.value))}
                        className="lab-slider"
                      />
                    </div>
                  </>
                )}

                {/* Threat Scenario / Eavesdropper Controls */}
                <div style={{ marginTop: '12px' }}>
                  <div className="lab-section-title">
                    <span>Threat Scenario (Eve)</span>
                  </div>
                  <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                    <label className="lab-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Eavesdropper Interception</span>
                      <input
                        type="checkbox"
                        checked={eveEnabled}
                        onChange={(e) => setEveEnabled(e.target.checked)}
                      />
                    </label>
                  </div>

                  {eveEnabled && (
                    <>
                      <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                        <label className="lab-label">Eve Attack Model</label>
                        <select
                          className="lab-select"
                          value={eveAttackType}
                          onChange={(e) => setEveAttackType(e.target.value)}
                        >
                          <option value="intercept-resend">Intercept-Resend (Basis Guessing)</option>
                          <option value="pns">Photon Number Splitting (PNS Attack)</option>
                          <option value="beam-splitting">Beam-Splitting (Partial Loss)</option>
                        </select>
                      </div>

                      {qkdMode === 'educational' && (
                        <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                          <label className="lab-label">
                            <span>Sequential Eavesdroppers:</span>
                            <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>{eveCount} Eve</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            value={eveCount}
                            onChange={(e) => setEveCount(Number(e.target.value))}
                            className="lab-slider"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {qkdMode === 'educational' && (
                    <>
                      <div className="lab-form-group" style={{ marginBottom: '8px' }}>
                        <label className="lab-label">
                          <span>Photon Loss Rate:</span>
                          <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{(photonLossRate * 100).toFixed(0)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0.0"
                          max="0.40"
                          step="0.05"
                          value={photonLossRate}
                          onChange={(e) => setPhotonLossRate(Number(e.target.value))}
                          className="lab-slider"
                        />
                      </div>

                      <div className="lab-form-group">
                        <label className="lab-label">
                          <span>Depolarizing Noise:</span>
                          <span style={{ fontFamily: 'var(--lab-font-mono)' }}>{(channelNoise * 100).toFixed(0)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0.0"
                          max="0.25"
                          step="0.01"
                          value={channelNoise}
                          onChange={(e) => setChannelNoise(Number(e.target.value))}
                          className="lab-slider"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                className="lab-action-btn primary"
                onClick={handleRunQkd}
                style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 'auto' }}
              >
                <span>⚡ Re-Transmit Photons</span>
              </button>
            </>
          ) : activeTab === 'pqc' ? (
            /* TAB B CONTROLS */
            <>
              <div>
                <div className="lab-section-title">
                  <span>PQC Input Stream</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '12px' }}>
                  <button
                    className={`lab-toggle-btn ${pqcInputMode === 'code' ? 'active' : ''}`}
                    onClick={() => setPqcInputMode('code')}
                    style={{ fontSize: '0.68rem', padding: '4px' }}
                  >
                    💻 Code / Presets
                  </button>
                  <button
                    className={`lab-toggle-btn ${pqcInputMode === 'upload' ? 'active' : ''}`}
                    onClick={() => setPqcInputMode('upload')}
                    style={{ fontSize: '0.68rem', padding: '4px' }}
                  >
                    📁 Repo Upload
                  </button>
                  <button
                    className={`lab-toggle-btn ${pqcInputMode === 'endpoint' ? 'active' : ''}`}
                    onClick={() => setPqcInputMode('endpoint')}
                    style={{ fontSize: '0.68rem', padding: '4px' }}
                  >
                    🌐 Live TLS Scan
                  </button>
                  <button
                    className={`lab-toggle-btn ${pqcInputMode === 'patch' ? 'active' : ''}`}
                    onClick={() => setPqcInputMode('patch')}
                    style={{ fontSize: '0.68rem', padding: '4px' }}
                  >
                    ⚡ Auto Patch
                  </button>
                </div>

                <div className="lab-section-title">
                  <span>Cryptographic Presets</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(PQC_CODE_PRESETS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectPqcPreset(key)}
                      className={`lab-action-btn ${selectedPqcPreset === key ? 'primary' : ''}`}
                      style={{ textAlign: 'left', fontSize: '0.74rem' }}
                    >
                      {val.title}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'auto', background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                  NIST FIPS STANDARDS
                </span>
                <p style={{ fontSize: '0.7rem', color: 'var(--lab-text-secondary)', margin: '4px 0 0 0' }}>
                  FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) compliance engine.
                </p>
              </div>
            </>
          ) : (
            /* TAB C CONTROLS (Dedicated Quantum Network & Repeaters Sidebar - Bug 2 Fix) */
            <>
              <div>
                <div className="lab-section-title">
                  <span>Quantum Network & Repeater Controls</span>
                </div>

                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Total Fiber Distance (L):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{repeaterDistKm} km</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={repeaterDistKm}
                    onChange={(e) => setRepeaterDistKm(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Repeater Nodes:</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>{numRepeaters} Repeaters</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={numRepeaters}
                    onChange={(e) => setNumRepeaters(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Fiber Attenuation:</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>{fiberLossDbPerKm.toFixed(2)} dB/km</span>
                  </label>
                  <input
                    type="range"
                    min="0.15"
                    max="0.35"
                    step="0.01"
                    value={fiberLossDbPerKm}
                    onChange={(e) => setFiberLossDbPerKm(Number(e.target.value))}
                    className="lab-slider"
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <button
                      onClick={() => setFiberLossDbPerKm(0.16)}
                      style={{ fontSize: '0.6rem', padding: '2px 5px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lab-border)', color: '#94a3b8', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      ULL (0.16)
                    </button>
                    <button
                      onClick={() => setFiberLossDbPerKm(0.20)}
                      style={{ fontSize: '0.6rem', padding: '2px 5px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lab-border)', color: '#94a3b8', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      SMF-28 (0.20)
                    </button>
                    <button
                      onClick={() => setFiberLossDbPerKm(0.28)}
                      style={{ fontSize: '0.6rem', padding: '2px 5px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lab-border)', color: '#94a3b8', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Dark Fiber (0.28)
                    </button>
                  </div>
                </div>

                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>Memory Coherence (T₂):</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{t2CoherenceMs} ms</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={t2CoherenceMs}
                    onChange={(e) => setT2CoherenceMs(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group" style={{ marginBottom: '10px' }}>
                  <label className="lab-label">
                    <span>BSM Swap Efficiency:</span>
                    <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>{(bsmEfficiency * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.40"
                    max="0.95"
                    step="0.05"
                    value={bsmEfficiency}
                    onChange={(e) => setBsmEfficiency(Number(e.target.value))}
                    className="lab-slider"
                  />
                </div>

                <div className="lab-form-group">
                  <label className="lab-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>BBPSSW Purification</span>
                    <input
                      type="checkbox"
                      checked={purificationOn}
                      onChange={(e) => setPurificationOn(e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 'auto', background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                  ARGONNE / UCHICAGO SIMULATOR
                </span>
                <p style={{ fontSize: '0.7rem', color: 'var(--lab-text-secondary)', margin: '4px 0 0 0' }}>
                  SeQUeNCe discrete-event optical quantum communication simulator (arxiv:2003.06557).
                </p>
              </div>
            </>
          )}
        </aside>

        {/* Center Workspace */}
        <main className="lab-center-workspace">
          {activeTab === 'qkd' ? (
            /* TAB A: QKD SIMULATOR VIEW */
            <>
              {qkdMode === 'educational' ? (
                <>
                  {/* Top KPI Telemetry Grid */}
                  <div className="lab-kpi-grid">
                    <MetricKpiCard
                      label="Quantum Channel QBER"
                      value={`${qkdResult.qber}%`}
                      subtext={qkdResult.qber > 11 ? '🚨 EXCEEDS 11.0% SHOR THRESHOLD' : '✓ Normal Operating Regime'}
                      highlight={qkdResult.qber > 11 ? 'red' : 'emerald'}
                    />
                    <MetricKpiCard
                      label="Sifted Key Bits"
                      value={`${qkdResult.siftedLength} / ${bitCount}`}
                      subtext={`${((qkdResult.siftedLength / bitCount) * 100).toFixed(0)}% Basis Match`}
                      highlight="cyan"
                    />
                    <MetricKpiCard
                      label="Decoy-State Error"
                      value={`${qkdResult.decoyQber}%`}
                      subtext="Photon Number Splitting Guard"
                      highlight={qkdResult.decoyQber > 15 ? 'amber' : 'cyan'}
                    />
                    <MetricKpiCard
                      label="Security Verdict"
                      value={qkdResult.status === 'SECURE' ? 'SECURE KEY' : 'ABORTED'}
                      subtext={qkdResult.status === 'SECURE' ? 'Distillation Converged' : (qkdResult.detectionReason || 'Eve Intercepted')}
                      highlight={qkdResult.status === 'SECURE' ? 'emerald' : 'red'}
                    />
                  </div>

                  {/* Sifted Photon Sequence Table */}
                  <div className="lab-card">
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>📜 Sifted Photon Sequence & Raw Key</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                        Raw Sifted Key: {qkdResult.finalKeyHex}
                      </span>
                    </div>

                    <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                      <table className="lab-table">
                        <thead>
                          <tr>
                            <th># Pulse</th>
                            <th>Alice Bit</th>
                            <th>Alice Basis</th>
                            <th>Eve Basis</th>
                            <th>Bob Basis</th>
                            <th>Bob Measured</th>
                            <th>Basis Match?</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qkdResult.aliceBits.slice(0, 16).map((bit, idx) => {
                            const match = qkdResult.aliceBases[idx] === qkdResult.bobBases[idx];
                            const err = match && bit !== qkdResult.bobMeasurements[idx];
                            const isLost = qkdResult.bobMeasurements[idx] === null;
                            return (
                              <tr key={idx} style={{ background: isLost ? 'rgba(100, 116, 139, 0.15)' : err ? 'rgba(239, 68, 68, 0.12)' : '' }}>
                                <td style={{ fontFamily: 'var(--lab-font-mono)' }}>{idx + 1}</td>
                                <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{bit}</td>
                                <td style={{ fontFamily: 'var(--lab-font-mono)' }}>{qkdResult.aliceBases[idx]}</td>
                                <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>{qkdResult.eves?.[0]?.bases?.[idx] || '-'}</td>
                                <td style={{ fontFamily: 'var(--lab-font-mono)' }}>{qkdResult.bobBases[idx]}</td>
                                <td style={{ fontFamily: 'var(--lab-font-mono)', color: isLost ? 'var(--lab-text-muted)' : err ? 'var(--lab-red)' : 'var(--lab-emerald)' }}>
                                  {isLost ? '∅ Lost' : qkdResult.bobMeasurements[idx]}
                                </td>
                                <td style={{ fontFamily: 'var(--lab-font-mono)', color: isLost ? 'var(--lab-text-muted)' : match ? 'var(--lab-emerald)' : 'var(--lab-text-muted)' }}>
                                  {isLost ? '— Photon Lost' : match ? (err ? '✗ ERROR (Eve)' : '✓ SIFTED') : '— Discarded'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Key Reconciliation & Privacy Amplification Workbench */}
                  <div className="lab-card" style={{ marginTop: '1.25rem' }}>
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>🔐 Key Reconciliation & Universal Hashing Privacy Amplification</span>
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--lab-font-mono)',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        background: qkdResult.status === 'SECURE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: qkdResult.status === 'SECURE' ? 'var(--lab-emerald)' : 'var(--lab-red)'
                      }}>
                        {qkdResult.status === 'SECURE' ? '✓ RECONCILIATION CONVERGED' : '🚨 PROTOCOL ABORTED'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-secondary)' }}>Cascade Parity Checks</div>
                        <div style={{ fontSize: '1.05rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: '700', marginTop: '2px' }}>
                          {qkdResult.reconciliation ? `${qkdResult.reconciliation.bitsDisclosed} Bits Disclosed` : '0 Bits'}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-muted)', marginTop: '2px' }}>Parity syndrome leakage</div>
                      </div>

                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-secondary)' }}>Eve Info Bound (Holevo)</div>
                        <div style={{ fontSize: '1.05rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)', fontWeight: '700', marginTop: '2px' }}>
                          {qkdResult.reconciliation ? `≤ ${qkdResult.reconciliation.eveInfoBound} Bits` : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-muted)', marginTop: '2px' }}>Bound from measured QBER</div>
                      </div>

                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-secondary)' }}>Reconciliation Efficiency</div>
                        <div style={{ fontSize: '1.05rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)', fontWeight: '700', marginTop: '2px' }}>
                          {qkdResult.reconciliation ? `f = ${qkdResult.reconciliation.reconciliationEfficiency}` : 'f = 1.0'}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-muted)', marginTop: '2px' }}>Relative to Shannon Limit</div>
                      </div>

                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-secondary)' }}>Net Secret Key Rate</div>
                        <div style={{ fontSize: '1.05rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: '700', marginTop: '2px' }}>
                          {qkdResult.keyGenerationRate > 0 ? `${(qkdResult.keyGenerationRate * 100).toFixed(1)}%` : '0.0%'}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-muted)', marginTop: '2px' }}>Final secure bits / pulse</div>
                      </div>
                    </div>

                    {qkdResult.reconciliation && qkdResult.reconciliation.amplifiedKeyBits.length > 0 ? (
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--lab-emerald)', fontWeight: '700' }}>
                            ✓ Final Privacy-Amplified Secure Cryptographic Key ({qkdResult.reconciliation.finalSecureKeyLength} bits):
                          </span>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-text-secondary)' }}>
                            Universal Hash Compression: {(qkdResult.reconciliation.privacyAmplificationRatio * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontSize: '0.85rem', fontWeight: '700', marginTop: '6px', wordBreak: 'break-all' }}>
                          {qkdResult.reconciliation.amplifiedKeyHex}
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '10px', color: 'var(--lab-red)', fontSize: '0.74rem' }}>
                        🚨 Key Distillation Suppressed: Leaked information bound exceeds sifted key entropy or channel compromised by Eve.
                      </div>
                    )}
                  </div>

                  {/* Dynamic GLLP Decoy State Security Bounds Card (Fix for Bug 1) */}
                  <div className="lab-card" style={{ marginTop: '1.25rem' }}>
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>🛡️ GLLP Rigorous Decoy-State Security Bounds (quant-ph/0003004)</span>
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--lab-font-mono)',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontWeight: '700',
                        background: gllpBounds.isSecure ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: gllpBounds.isSecure ? 'var(--lab-emerald)' : 'var(--lab-red)'
                      }}>
                        {gllpBounds.secureStatus}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.71rem', color: 'var(--lab-text-secondary)' }}>
                      Rigorous single-photon parameter estimation derived by Gottesman, Lo, Lütkenhaus, Preskill (GLLP). Dynamically tied to channel QBER: turns red (R = 0) whenever Eve causes Shor-Preskill threshold violation (11.0%) or decoy yield anomaly.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Single-Photon Yield Y₁</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: gllpBounds.isSecure ? 'var(--lab-cyan)' : 'var(--lab-red)', fontWeight: 'bold' }}>
                          {gllpBounds.singlePhotonYield_Y1}
                        </div>
                      </div>
                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Error Rate e₁ Bound</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: gllpBounds.isSecure ? 'var(--lab-emerald)' : 'var(--lab-red)', fontWeight: 'bold' }}>
                          {(gllpBounds.singlePhotonErrorRate_e1 * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Secret Key Rate R</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: gllpBounds.isSecure ? 'var(--lab-cyan)' : 'var(--lab-red)', fontWeight: 'bold' }}>
                          {gllpBounds.secretKeyRate} bit/pulse
                        </div>
                      </div>
                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Shannon Entropy H₂(e₁)</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)', fontWeight: 'bold' }}>
                          {gllpBounds.shannonEntropyCost_H2} bits
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* End-to-End Encrypted Message Demo (Alice -> Bob One-Time Pad) */}
                  <div className="lab-card" style={{ marginTop: '1.25rem' }}>
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>💬 End-to-End Encrypted Message Demo (Alice → Bob)</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                        Information-Theoretic One-Time Pad
                      </span>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--lab-text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Secret Plaintext Message to Encrypt:
                      </label>
                      <input
                        type="text"
                        value={plaintextMessage}
                        onChange={(e) => setPlaintextMessage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#05070a',
                          border: '1px solid var(--lab-border)',
                          borderRadius: '4px',
                          color: '#e2e8f0',
                          fontFamily: 'var(--lab-font-mono)',
                          fontSize: '0.8rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--lab-cyan)', fontWeight: '600' }}>Alice Transmitted Ciphertext (Hex)</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', wordBreak: 'break-all' }}>
                          {encryptionDemo.ciphertextHex}
                        </div>
                      </div>

                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                        <div style={{ fontSize: '0.66rem', color: qkdResult.status === 'SECURE' ? 'var(--lab-emerald)' : 'var(--lab-red)', fontWeight: '600' }}>
                          Bob Decrypted Output
                        </div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', fontSize: '0.75rem', color: qkdResult.status === 'SECURE' ? 'var(--lab-emerald)' : 'var(--lab-red)', marginTop: '4px', fontWeight: 'bold' }}>
                          {encryptionDemo.bobDecryptedText}
                        </div>
                      </div>

                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--lab-amber)', fontWeight: '600' }}>Eve Intercepted Decipherment</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', fontSize: '0.72rem', color: 'var(--lab-amber)', marginTop: '4px', wordBreak: 'break-all' }}>
                          {encryptionDemo.eveInterceptedText}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* TELECOM LINK HIGH-THROUGHPUT MODE (10^6 PULSES/SEC) */
                <>
                  <div className="lab-kpi-grid">
                    <MetricKpiCard
                      label="Link Attenuation"
                      value={`-${telecomResult.channelLossDb} dB`}
                      subtext={`${telecomDistanceKm} km Standard Dark Fiber (0.2 dB/km)`}
                      highlight="cyan"
                    />
                    <MetricKpiCard
                      label="Raw Detector Clicks"
                      value={`${(telecomResult.rawClickRateHz / 1e6).toFixed(2)} MHz`}
                      subtext={`Rep Rate: ${telecomRepRateMhz} MHz (InGaAs / SNSPD)`}
                      highlight="cyan"
                    />
                    <MetricKpiCard
                      label="Sifted Key Rate"
                      value={`${telecomResult.siftedRateKbps} kbps`}
                      subtext="Post-Sifting Throughput"
                      highlight="emerald"
                    />
                    <MetricKpiCard
                      label="Net Secret Key Rate"
                      value={`${telecomResult.secretKeyRateKbps} kbps`}
                      subtext={telecomResult.isAborted ? '🚨 ABORTED (QBER > 11%)' : 'Post-Amplification KMS Ready'}
                      highlight={telecomResult.isAborted ? 'red' : 'emerald'}
                    />
                  </div>

                  {/* Telecom Link Architecture Card */}
                  <div className="lab-card">
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>📡 Telecom Carrier Dark-Fiber Link Profile & SNSPD Detection</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                        ITU-T G.652.D SMF-28 Fiber Profile
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Transmissivity (η_channel)</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: 'bold' }}>
                          {(telecomResult.etaChannel * 100).toFixed(3)}%
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>Transmission probability</div>
                      </div>

                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Detector Dark Counts</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)', fontWeight: 'bold' }}>
                          1.0 × 10⁻⁷ / gate
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>Cryo-cooled SNSPD</div>
                      </div>

                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Detector Dead Time</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)', fontWeight: 'bold' }}>
                          50 ns
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>Max count limit ~20 MHz</div>
                      </div>

                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Telecom QBER</div>
                        <div style={{ fontFamily: 'var(--lab-font-mono)', color: telecomResult.qberPercent > 11 ? 'var(--lab-red)' : 'var(--lab-emerald)', fontWeight: 'bold' }}>
                          {telecomResult.qberPercent}%
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>Optical baseline + dark counts</div>
                      </div>
                    </div>
                  </div>

                  {/* ETSI GS QKD 014 Key Management System Container */}
                  <div className="lab-card" style={{ marginTop: '1.25rem' }}>
                    <div className="lab-card-header">
                      <span className="lab-card-title">
                        <span>🏛️ ETSI GS QKD 014 V1.1.1 Key Management System (KMS) Interface</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                        REST API Key Delivery Ready
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.71rem', color: 'var(--lab-text-secondary)' }}>
                      Conforms to European Telecommunications Standards Institute (ETSI) GS QKD 014 standard for carrier-grade secure key delivery to IPsec, MACsec, and 5G backhaul encryptors.
                    </p>
                    <pre style={{
                      margin: 0,
                      padding: '12px',
                      background: '#05070a',
                      border: '1px solid var(--lab-border)',
                      borderRadius: '6px',
                      fontFamily: 'var(--lab-font-mono)',
                      fontSize: '0.75rem',
                      color: '#38bdf8',
                      overflowX: 'auto'
                    }}>
                      {JSON.stringify(telecomResult.keyManagementSystem, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </>
          ) : activeTab === 'pqc' ? (
            /* TAB B: PQC & CBOM SCANNER VIEW */
            <>
              <div className="lab-kpi-grid">
                <MetricKpiCard
                  label="Vulnerabilities Found"
                  value={cbomResult.totalVulnerabilities}
                  subtext={`${cbomResult.criticalCount} Critical (Shor Vulnerable)`}
                  highlight="red"
                />
                <MetricKpiCard
                  label="Post-Quantum Readiness"
                  value={`${cbomResult.postQuantumReadinessScore}/100`}
                  subtext="NIST IR 8547 Standard"
                  highlight={cbomResult.postQuantumReadinessScore > 50 ? 'emerald' : 'amber'}
                />
                <MetricKpiCard
                  label="Recommended PQC KEM"
                  value="ML-KEM-768"
                  subtext="NIST FIPS 203 (Kyber)"
                  highlight="cyan"
                />
                <MetricKpiCard
                  label="Recommended Signature"
                  value="ML-DSA-65"
                  subtext="NIST FIPS 204 (Dilithium)"
                  highlight="cyan"
                />
              </div>

              {/* Multi-Format Input & Scanner Interface */}
              <div className="lab-card" style={{ marginBottom: '1.25rem' }}>
                <div className="lab-card-header">
                  <span className="lab-card-title">
                    <span>
                      {pqcInputMode === 'code' && '💻 Live Editable Code / Config Input'}
                      {pqcInputMode === 'upload' && '📁 Repository & File Ingestion Dropzone'}
                      {pqcInputMode === 'endpoint' && '🌐 Live TLS Domain Endpoint Probe'}
                      {pqcInputMode === 'patch' && '⚡ Auto-Remediation Unified Diff Patch'}
                    </span>
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {pqcInputMode === 'code' && (
                      <button
                        className="lab-action-btn primary"
                        onClick={() => handleScanCode(customCode)}
                        style={{ fontSize: '0.68rem', padding: '3px 10px' }}
                      >
                        ▶ Re-Scan CBOM
                      </button>
                    )}
                    {pqcInputMode === 'endpoint' && (
                      <button
                        className="lab-action-btn primary"
                        onClick={handleLiveEndpointScan}
                        style={{ fontSize: '0.68rem', padding: '3px 10px' }}
                      >
                        🔍 Inspect Endpoint
                      </button>
                    )}
                  </div>
                </div>

                {pqcInputMode === 'code' && (
                  <textarea
                    value={customCode}
                    onChange={(e) => {
                      setCustomCode(e.target.value);
                      handleScanCode(e.target.value);
                    }}
                    placeholder="Paste your nginx.conf, OpenSSL config, JWT auth middleware, or Solidity contract here..."
                    style={{
                      width: '100%',
                      height: '180px',
                      background: '#05070a',
                      color: '#e2e8f0',
                      border: '1px solid var(--lab-border)',
                      borderRadius: '4px',
                      fontFamily: 'var(--lab-font-mono)',
                      fontSize: '0.75rem',
                      padding: '10px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                )}

                {pqcInputMode === 'upload' && (
                  <div style={{
                    border: '2px dashed rgba(0, 229, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(0, 229, 255, 0.03)'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
                    <div style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: '600' }}>
                      Drag and drop your repository files or configuration here
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '4px 0 14px 0' }}>
                      Supports <code>pom.xml</code>, <code>package.json</code>, <code>requirements.txt</code>, <code>.pem</code> certificates, <code>.conf</code>, <code>.py</code>, <code>.java</code>
                    </p>
                    <input
                      type="file"
                      id="cbom-file-upload"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      accept=".json,.xml,.txt,.pem,.crt,.key,.conf,.py,.java,.sol,.yaml,.yml"
                    />
                    <label
                      htmlFor="cbom-file-upload"
                      className="lab-action-btn primary"
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      Browse Local Files
                    </label>
                    {uploadedFileName && (
                      <div style={{ marginTop: '10px', fontSize: '0.74rem', color: 'var(--lab-emerald)' }}>
                        ✓ Scanned file: <strong>{uploadedFileName}</strong>
                      </div>
                    )}
                  </div>
                )}

                {pqcInputMode === 'endpoint' && (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={liveEndpointInput}
                        onChange={(e) => setLiveEndpointInput(e.target.value)}
                        placeholder="e.g. api.bank.com:443"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#05070a',
                          border: '1px solid var(--lab-border)',
                          borderRadius: '4px',
                          color: '#e2e8f0',
                          fontFamily: 'var(--lab-font-mono)',
                          fontSize: '0.8rem'
                        }}
                      />
                      <button
                        className="lab-action-btn primary"
                        onClick={handleLiveEndpointScan}
                      >
                        Inspect TLS Endpoint
                      </button>
                    </div>

                    {liveEndpointResult && (
                      <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '0.72rem' }}>
                          <div>
                            <div style={{ color: 'var(--lab-text-secondary)' }}>Host & Port:</div>
                            <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: 'bold' }}>{liveEndpointResult.endpoint}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--lab-text-secondary)' }}>TLS Version:</div>
                            <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)', fontWeight: 'bold' }}>{liveEndpointResult.tlsVersion}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--lab-text-secondary)' }}>Cipher Suite:</div>
                            <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)', fontWeight: 'bold' }}>{liveEndpointResult.cipherSuite}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--lab-text-secondary)' }}>HNDL Exposure:</div>
                            <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-red)', fontWeight: 'bold' }}>CRITICAL</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {pqcInputMode === 'patch' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)' }}>
                        Nginx / OpenSSL Unified Diff Upgrade Patch (X25519+ML-KEM-768 & ML-DSA-65)
                      </span>
                      <button
                        className="lab-action-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(generateAutoRemediationPatch('CBOM-01', 'nginx'));
                          alert('Auto-remediation patch copied to clipboard!');
                        }}
                        style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                      >
                        📋 Copy Patch
                      </button>
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: '12px',
                      background: '#05070a',
                      border: '1px solid var(--lab-border)',
                      borderRadius: '4px',
                      fontFamily: 'var(--lab-font-mono)',
                      fontSize: '0.74rem',
                      color: '#38bdf8',
                      overflowX: 'auto'
                    }}>
                      {generateAutoRemediationPatch('CBOM-01', 'nginx')}
                    </pre>
                  </div>
                )}
              </div>

              {/* Full-Width Spacious CBOM Table (Fix for Bug 3 - No Truncation) */}
              <div className="lab-card" style={{ marginBottom: '1.25rem' }}>
                <div className="lab-card-header">
                  <span className="lab-card-title">
                    <span>🛡️ Cryptographic Bill of Materials (CBOM) & Migration Risk Priority Ranking</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setExportModalOpen(true)}
                      className="lab-action-btn"
                      style={{ fontSize: '0.68rem', padding: '3px 10px', borderColor: 'var(--lab-cyan)', color: 'var(--lab-cyan)' }}
                    >
                      📥 Export CycloneDX 1.6 / SARIF
                    </button>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-red)' }}>
                      Shor Threat Active
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="lab-table" style={{ width: '100%', minWidth: '950px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '120px' }}>Algorithm</th>
                        <th style={{ width: '160px' }}>Component</th>
                        <th style={{ width: '120px' }}>Logical Qubits</th>
                        <th style={{ width: '140px' }}>Physical Qubits</th>
                        <th style={{ width: '110px' }}>Data Risk</th>
                        <th style={{ width: '110px' }}>HNDL</th>
                        <th style={{ width: '140px' }}>NIST Deprecation</th>
                        <th style={{ width: '80px' }}>Priority</th>
                        <th style={{ width: '220px' }}>NIST Replacement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedFindings.map(f => (
                        <tr key={f.id}>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-red)', fontWeight: '700' }}>
                            {f.algorithm}
                          </td>
                          <td style={{ color: 'var(--lab-text-primary)' }}>
                            {f.component}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                            ~{f.shorLogicalQubits.toLocaleString()}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>
                            {f.shorPhysicalQubits}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.64rem',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: f.dataLifetimeRisk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                              color: f.dataLifetimeRisk === 'CRITICAL' ? 'var(--lab-red)' : 'var(--lab-amber)',
                              fontWeight: '600'
                            }}>
                              {f.dataLifetimeRisk}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: f.harvestNowDecryptLater ? 'var(--lab-red)' : 'var(--lab-emerald)', fontSize: '0.68rem', fontWeight: '600' }}>
                            {f.harvestNowDecryptLater ? '🚨 YES' : '— NO'}
                          </td>
                          <td style={{ fontSize: '0.66rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-text-secondary)' }}>
                            {f.nistDeprecationDate}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.66rem',
                              fontFamily: 'var(--lab-font-mono)',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: f.migrationPriorityScore >= 8 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 229, 255, 0.2)',
                              color: f.migrationPriorityScore >= 8 ? 'var(--lab-red)' : 'var(--lab-cyan)',
                              fontWeight: '700'
                            }}>
                              P{f.migrationPriorityScore}/10
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)', fontWeight: '600' }}>
                            {f.nistReplacement}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hybrid vs Pure PQC Performance Comparator Table */}
              <div className="lab-card" style={{ marginBottom: '1.25rem' }}>
                <div className="lab-card-header">
                  <span className="lab-card-title">
                    <span>⚡ Hybrid vs. Pure PQC Performance Comparator</span>
                  </span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                    Handshake Latency & Key Overhead Benchmarks
                  </span>
                </div>

                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Cryptographic Mode</th>
                      <th>Public Key Size</th>
                      <th>Ciphertext / Signature</th>
                      <th>Handshake Overhead</th>
                      <th>Post-Quantum Security</th>
                      <th>Deployment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hybridTlsRows.map((row, idx) => {
                      const isRecommended = row.status === 'RECOMMENDED';
                      const isBroken = row.status === 'VULNERABLE';
                      return (
                        <tr key={idx} style={{ background: isRecommended ? 'rgba(16, 185, 129, 0.08)' : isBroken ? 'rgba(239, 68, 68, 0.04)' : '' }}>
                          <td style={{
                            fontFamily: 'var(--lab-font-mono)',
                            color: isRecommended ? 'var(--lab-emerald)' : isBroken ? 'var(--lab-red)' : 'var(--lab-cyan)',
                            fontWeight: isRecommended ? '700' : '500'
                          }}>
                            {row.mode}
                          </td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)' }}>{row.keySize.toLocaleString()} Bytes</td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)' }}>{row.sigSize.toLocaleString()} Bytes</td>
                          <td style={{ fontFamily: 'var(--lab-font-mono)', color: row.handshakeMs > 10 ? 'var(--lab-amber)' : 'var(--lab-emerald)' }}>
                            {row.handshakeMs} ms
                          </td>
                          <td style={{
                            fontFamily: 'var(--lab-font-mono)',
                            color: isBroken ? 'var(--lab-red)' : 'var(--lab-emerald)',
                            fontWeight: '600'
                          }}>
                            {row.pqSecurity}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.66rem',
                              fontFamily: 'var(--lab-font-mono)',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: isRecommended ? 'rgba(16, 185, 129, 0.25)' : isBroken ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 229, 255, 0.15)',
                              color: isRecommended ? 'var(--lab-emerald)' : isBroken ? 'var(--lab-red)' : 'var(--lab-cyan)',
                              fontWeight: '600'
                            }}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* NIST FIPS 203 / 204 / 205 Standards Specifications Catalog */}
              <div className="lab-card">
                <div className="lab-card-header">
                  <span className="lab-card-title">
                    <span>📜 NIST Post-Quantum Cryptography Federal Standards (August 2024 Final)</span>
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className={`lab-toggle-btn ${selectedFips === 'fips203' ? 'active' : ''}`}
                      onClick={() => setSelectedFips('fips203')}
                      style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                    >
                      FIPS 203 (ML-KEM)
                    </button>
                    <button
                      className={`lab-toggle-btn ${selectedFips === 'fips204' ? 'active' : ''}`}
                      onClick={() => setSelectedFips('fips204')}
                      style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                    >
                      FIPS 204 (ML-DSA)
                    </button>
                    <button
                      className={`lab-toggle-btn ${selectedFips === 'fips205' ? 'active' : ''}`}
                      onClick={() => setSelectedFips('fips205')}
                      style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                    >
                      FIPS 205 (SLH-DSA)
                    </button>
                  </div>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.71rem', color: 'var(--lab-text-secondary)' }}>
                  {NIST_FIPS_STANDARDS[selectedFips].title} — {NIST_FIPS_STANDARDS[selectedFips].basis}
                </p>
                <table className="lab-table" style={{ fontSize: '0.68rem' }}>
                  <thead>
                    <tr>
                      <th>Parameter Variant</th>
                      <th>NIST Security Category</th>
                      <th>Public Key Size</th>
                      <th>Ciphertext / Signature</th>
                      <th>Quantum Strength</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NIST_FIPS_STANDARDS[selectedFips].variants.map(v => (
                      <tr key={v.name}>
                        <td style={{ fontFamily: 'var(--lab-font-mono)', fontWeight: 'bold', color: 'var(--lab-cyan)' }}>{v.name}</td>
                        <td style={{ color: 'var(--lab-text-primary)' }}>{v.securityCategory}</td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)' }}>{v.publicKeyBytes} Bytes</td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                          {v.ciphertextBytes ? `${v.ciphertextBytes} Bytes (ct)` : `${v.signatureBytes} Bytes (sig)`}
                        </td>
                        <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>{v.claimedQuantumSecurity_bits}-bit PQ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* TAB C: SeQUeNCe QUANTUM NETWORK & REPEATERS VIEW */
            <>
              <div className="lab-kpi-grid">
                <MetricKpiCard
                  label="End-to-End Distance"
                  value={`${repeaterResult.totalDistanceKm} km`}
                  subtext={`${repeaterResult.numRepeaters} Repeaters (${repeaterResult.segmentDistanceKm} km/hop)`}
                  highlight="cyan"
                />
                <MetricKpiCard
                  label="Purified Entangled Fidelity"
                  value={`${(repeaterResult.purifiedFidelity * 100).toFixed(1)}%`}
                  subtext={`Raw: ${(repeaterResult.unpurifiedFidelity * 100).toFixed(1)}% (${repeaterResult.fidelityGain})`}
                  highlight="emerald"
                />
                <MetricKpiCard
                  label="Entangled Pair Rate"
                  value={`${repeaterResult.endToEndEntangledRateHz} Hz`}
                  subtext={`Fiber Trans. η = ${(repeaterResult.fiberTransmissionProbability * 100).toFixed(1)}%`}
                  highlight="cyan"
                />
                <MetricKpiCard
                  label="BSM Swap Probability"
                  value={`${(repeaterResult.swapSuccessProbability * 100).toFixed(1)}%`}
                  subtext={`Memory Decoherence F_mem: ${(repeaterResult.memoryDecoherenceFactor * 100).toFixed(1)}%`}
                  highlight="amber"
                />
              </div>

              {/* SeQUeNCe Interactive Network Workbench */}
              <div className="lab-card">
                <div className="lab-card-header">
                  <span className="lab-card-title">
                    <span>🌐 SeQUeNCe Discrete-Event Quantum Network Simulator (arxiv:2003.06557)</span>
                  </span>
                  <button
                    className={`lab-toggle-btn ${purificationOn ? 'active' : ''}`}
                    onClick={() => setPurificationOn(!purificationOn)}
                    style={{ fontSize: '0.68rem', padding: '3px 10px' }}
                  >
                    {purificationOn ? '✓ BBPSSW Purification ON' : 'Purification OFF'}
                  </button>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.71rem', color: 'var(--lab-text-secondary)' }}>
                  Argonne National Lab & UChicago discrete-event quantum communication architecture. Simulates optical fiber attenuation ({fiberLossDbPerKm} dB/km), entanglement swapping via Bell State Measurements, quantum memory coherence (T₂ = {t2CoherenceMs} ms), and BBPSSW distillation.
                </p>

                {/* Network Topology Visualization */}
                <div style={{ background: 'var(--lab-bg-subpanel)', padding: '16px', borderRadius: '6px', border: '1px solid var(--lab-border)', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {/* Alice Node */}
                    <div style={{ textAlign: 'center', zIndex: 2 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.2)', border: '2px solid var(--lab-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto', fontWeight: 'bold', color: 'var(--lab-cyan)' }}>
                        A
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: '600' }}>Alice</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)' }}>Transmitter</div>
                    </div>

                    {/* Repeater Hops */}
                    {Array.from({ length: numRepeaters }).map((_, idx) => (
                      <React.Fragment key={`rep-${idx}`}>
                        <div style={{ flex: 1, height: '2px', background: 'dashed 2px var(--lab-cyan)', margin: '0 8px', position: 'relative' }}>
                          <span style={{ position: 'absolute', top: '-14px', left: '35%', fontSize: '0.6rem', color: 'var(--lab-text-muted)', fontFamily: 'var(--lab-font-mono)' }}>
                            {repeaterResult.segmentDistanceKm} km
                          </span>
                        </div>
                        <div style={{ textAlign: 'center', zIndex: 2 }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', border: '2px solid var(--lab-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--lab-emerald)' }}>
                            R{idx + 1}
                          </div>
                          <div style={{ fontSize: '0.7rem', fontWeight: '600' }}>Repeater {idx + 1}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>BSM Swap</div>
                        </div>
                      </React.Fragment>
                    ))}

                    {/* Final segment */}
                    <div style={{ flex: 1, height: '2px', background: 'dashed 2px var(--lab-cyan)', margin: '0 8px', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '-14px', left: '35%', fontSize: '0.6rem', color: 'var(--lab-text-muted)', fontFamily: 'var(--lab-font-mono)' }}>
                        {repeaterResult.segmentDistanceKm} km
                      </span>
                    </div>

                    {/* Bob Node */}
                    <div style={{ textAlign: 'center', zIndex: 2 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.2)', border: '2px solid var(--lab-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto', fontWeight: 'bold', color: 'var(--lab-cyan)' }}>
                        B
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: '600' }}>Bob</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)' }}>Receiver</div>
                    </div>
                  </div>
                </div>

                {/* Network Telemetry & Engineering Specs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Segment Distance</div>
                    <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', fontWeight: 'bold' }}>
                      {repeaterResult.segmentDistanceKm} km
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>Optimum: ~{repeaterResult.optimalRepeaterSpacingKm} km</div>
                  </div>

                  <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Memory Hold Decay</div>
                    <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)', fontWeight: 'bold' }}>
                      {((1 - repeaterResult.memoryDecoherenceFactor) * 100).toFixed(1)}% loss
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>T₂ = {t2CoherenceMs} ms limit</div>
                  </div>

                  <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Raw Swapped Fidelity</div>
                    <div style={{ fontFamily: 'var(--lab-font-mono)', color: '#94a3b8', fontWeight: 'bold' }}>
                      {(repeaterResult.unpurifiedFidelity * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>Before BBPSSW</div>
                  </div>

                  <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.64rem', color: 'var(--lab-text-secondary)' }}>Purified Fidelity</div>
                    <div style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)', fontWeight: 'bold' }}>
                      {(repeaterResult.purifiedFidelity * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-muted)' }}>{repeaterResult.fidelityGain} net gain</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {drawerOpen && (
        <GuidedLabDrawer
          labName="Quantum Cryptography, QKD & PQC Security Lab"
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onReset={() => {
            setEveEnabled(false);
            setChannelNoise(0.01);
          }}
          steps={checklistSteps}
          reportData={{
            tab: activeTab,
            qkd: activeTab === 'qkd' ? qkdResult : null,
            cbom: activeTab === 'pqc' ? cbomResult : null,
            repeater: activeTab === 'repeater' ? repeaterResult : null
          }}
          onOpenComposer={handleOpenInComposer}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {exportModalOpen && (
        <CryptographyExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          activeTab={activeTab}
          qkdResult={qkdResult}
          cbomResult={cbomResult}
          repeaterResult={repeaterResult}
          telecomResult={telecomResult}
        />
      )}

      <UnifiedNavbar session={session} />
    </div>
  );
}
