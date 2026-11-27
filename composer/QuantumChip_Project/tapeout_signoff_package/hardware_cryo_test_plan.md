# 🔬 Experimental Hardware Validation & Cryogenic Test Plan
**Processor:** 1,100-Qubit Superconducting Crossbar Array (`verified_chip.gds`)  
**Target Environment:** 15 mK Dilution Refrigerator with 10-Channel Dispersive Multiplexing  
**Sign-Off Status:** Ready for First Cryogenic Validation Campaign

---

## Step-by-Step Experimental Protocol

### Stage 1: Room-Temperature Probing & Junction Resistance Screening
* **Procedure:** Automated 4-point probe wafer probing on all 138 perimeter test structures and witness junctions.
* **Pass Criteria:** Normal-state resistance $R_N = 7.2\text{ k}\Omega \pm 3.5\%$ across all 2,200 Josephson Junctions. Any die with $> 3$ outlier junctions ($\Delta R_N > 10\%$) is rejected prior to dicing.
* **Continuity Check:** Check room-temperature DC resistance of all 2,150 aluminum airbridge crossover spans ($R_{\text{span}} < 0.15\ \Omega$).

### Stage 2: Cryogenic Cooldown & Thermal Equilibrium (15 mK)
* **Procedure:** Mount diced `31 mm × 19 mm` chip inside gold-plated OFHC copper package (`packaging_spec.md`). Attach 138 aluminum wedge wirebonds (`150 µm pitch`).
* **Thermal Sink:** Verify base plate temperature reaches $T_{\text{base}} \le 12.5\text{ mK}$ with mixing chamber heat load $< 5\text{ µW}$ during continuous RF excitation.

### Stage 3: Resonator & Qubit Spectroscopy
* **Resonator Punchout:** Sweep microwave probe frequency across $7.10\text{ GHz}$ to $7.55\text{ GHz}$ at high power to map all 1,100 readout resonator bare frequencies.
* **Two-Tone Qubit Spectroscopy:** Apply low-power dispersive probe while sweeping qubit drive from $4.70\text{ GHz}$ to $5.15\text{ GHz}$ to verify the exact 4-color checkerboard frequency allocation.

### Stage 4: $T_1$ / $T_2^*$ / $T_{2,E}$ Coherence Characterization
* **Inversion Recovery ($T_1$):** Apply $\pi$ drive and measure decay across time delay $	au \in [0, 500\ \mu\text{s}]$. Target: $\langle T_1 \rangle \ge 84.0\ \mu\text{s}$.
* **Ramsey Fringe ($T_2^*$):** Verify bare dephasing time $\langle T_2^* \rangle \ge 95.0\ \mu\text{s}$.
* **Hahn Echo ($T_{2,E}$):** Verify low-frequency 1/f flux noise filtering $\langle T_{2,E} \rangle \ge 155.0\ \mu\text{s}$.

### Stage 5: Single & Two-Qubit Randomized Benchmarking (RB)
* **Single-Qubit RB:** Execute Clifford sequences of lengths $m \in [1, 2000]$ with DRAG-calibrated Gaussian pulses (`20 ns`). Target average fidelity: $\mathcal{F}_{1Q} \ge 99.98\%$.
* **Two-Qubit Interleaved RB:** Benchmark direct cross-resonance / tunable coupler CZ gates (`15 ns`) across nearest neighbors and bus-hop pairs (`46 ns`). Target fidelity: $\mathcal{F}_{\text{CZ}} \ge 99.85\%$.

### Stage 6: Readout Optimization & Active Reset
* **Purcell Filter & Discrimination:** Optimize readout integration window (`120 ns`) and heralding thresholds. Target assignment fidelity: $\mathcal{F}_{\text{RO}} \ge 99.60\%$.
* **Fast Depletion Reset:** Verify microwave-driven conditional or active depletion reset returns transmons to $|0\rangle$ within $20\text{ ns}$ with $99.80\%$ ground state population.

### Stage 7: 7-Step Syndrome Extraction Cycle Verification
* **Parallel Execution:** Execute all 7 steps of the `324.0 ns` syndrome extraction schedule simultaneously across all 360 check ancillas.
* **Crosstalk Check:** Verify simultaneous two-qubit gate execution induces $< 0.05\%$ phase error on neighboring inactive transmons.

### Stage 8: Real-Time FPGA Decoder-in-the-Loop Validation
* **FPGA Integration:** Stream $360$ syndrome bits per cycle (`324 ns`) via PCIe Gen4 / RFSoC optical links to our high-speed FPGA processing cluster running the log-domain min-sum BP-OSD engine.
* **Repeated Syndrome Filtering:** Execute 3 repeated syndrome cycles (`972 ns`) per logical correction step to filter readout measurement errors.

### Stage 9: Logical Qubit Lifetime ($T_L$) Measurement
* **Memory Preservation:** Initialize all 380 logical qubits in $|0_L\rangle$ and $|+_L\rangle$ states.
* **Logical Decay Extraction:** Run continuous BP-OSD error correction rounds for up to $100\text{ ms}$. Extract logical decay time $T_L$. Target: $T_L \ge 25.0\text{ ms}$ (a **$> 300\times$ enhancement** over physical $T_1$!).
