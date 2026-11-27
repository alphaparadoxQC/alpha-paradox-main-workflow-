"""
Alpha-Paradox Analog Physics Engine
====================================
Solves 1D quantum mechanics problems:
  - Time-Independent Schrödinger Equation (TISE) via sparse diagonalization
  - Time-Dependent Schrödinger Equation (TDSE) via Crank-Nicolson propagation

Accepts a serialized node-graph from the frontend Analog Composer,
extracts the physics parameters, constructs the Hamiltonian,
and returns eigenvalues, eigenvectors, time-evolution frames,
fidelities, and expectation values for visualization.

Units: ℏ = m = 1 (natural units for the harmonic oscillator).
"""

import json
import time
import numpy as np
from scipy.sparse import diags, eye as speye
from scipy.sparse.linalg import eigsh, spsolve
from typing import Dict, Any, Optional, List
import re

# NumPy 2.0+ compatibility
trapezoid = getattr(np, 'trapezoid', getattr(np, 'trapz', None))
if trapezoid is None:
    from scipy.integrate import trapezoid


# ─── Material Constants ─────────────────────────────────────────────────────
# Effective mass (m_eff), Relative permittivity (epsilon_r), Bandgap (eV)
MATERIALS = {
    "Si":    {"m_eff": 0.19,  "epsilon_r": 11.7,  "bandgap_eV": 1.12},
    "GaAs":  {"m_eff": 0.067, "epsilon_r": 12.9,  "bandgap_eV": 1.42},
    "SiO2":  {"m_eff": 0.5,   "epsilon_r": 3.9,   "bandgap_eV": 9.0},
    "AlOx":  {"m_eff": 0.4,   "epsilon_r": 9.0,   "bandgap_eV": 8.8},
    "SiGe":  {"m_eff": 0.15,  "epsilon_r": 12.5,  "bandgap_eV": 0.95},
    "InAs":  {"m_eff": 0.023, "epsilon_r": 15.15, "bandgap_eV": 0.354},
}

# ─── Safe Math Expression Evaluator ──────────────────────────────────────────

_SAFE_MATH_NAMES = {
    "sin": np.sin, "cos": np.cos, "tan": np.tan,
    "exp": np.exp, "log": np.log, "sqrt": np.sqrt,
    "abs": np.abs, "pi": np.pi, "e": np.e,
    "arcsin": np.arcsin, "arccos": np.arccos, "arctan": np.arctan,
    "sinh": np.sinh, "cosh": np.cosh, "tanh": np.tanh,
    "heaviside": lambda x: np.heaviside(x, 0.5),
    "NaN": 0.0, "nan": 0.0, "NAN": 0.0, "null": 0.0, "undefined": 0.0,
}

_FORBIDDEN_PATTERN = re.compile(
    r"(import|exec|eval|compile|__\w+__|open|os\.|sys\.|subprocess|globals|locals|getattr|setattr|delattr)",
    re.IGNORECASE,
)


def safe_eval_expression(expr: str, variables: Dict[str, Any]) -> np.ndarray:
    """Safely evaluate a math expression string with given variables."""
    if _FORBIDDEN_PATTERN.search(expr):
        raise ValueError(f"Expression contains forbidden constructs: {expr}")
    normalized = expr.replace("^", "**")
    # Clean any NaN/nan/undefined strings gracefully
    normalized = re.sub(r"\b(NaN|nan|NAN|undefined|null)\b", "0.0", normalized)
    namespace = {}
    namespace.update(_SAFE_MATH_NAMES)
    namespace.update(variables)
    try:
        result = eval(normalized, {"__builtins__": {}}, namespace)  # noqa: S307
    except Exception as e:
        raise ValueError(f"Failed to evaluate expression '{expr}': {e}")
    return np.asarray(result, dtype=float)


def safe_eval_complex(expr: str, variables: Dict[str, Any]) -> np.ndarray:
    """Safely evaluate a math expression that may return complex values."""
    if _FORBIDDEN_PATTERN.search(expr):
        raise ValueError(f"Expression contains forbidden constructs: {expr}")
    normalized = expr.replace("^", "**")
    normalized = re.sub(r"\b(NaN|nan|NAN|undefined|null)\b", "0.0", normalized)
    namespace = {}
    namespace.update(_SAFE_MATH_NAMES)
    namespace.update(variables)
    namespace["1j"] = 1j
    namespace["j"] = 1j
    try:
        result = eval(normalized, {"__builtins__": {}}, namespace)  # noqa: S307
    except Exception as e:
        raise ValueError(f"Failed to evaluate expression '{expr}': {e}")
    return np.asarray(result, dtype=complex)


# ─── Core Physics: TISE Solver ───────────────────────────────────────────────

def build_kinetic_matrix(n_points: int, dx: float):
    """Build T = -(ℏ²/2m) d²/dx² via 3-point finite difference (ℏ=m=1)."""
    coeff = -0.5 / (dx * dx)
    main_diag = np.full(n_points, -2.0 * coeff)
    off_diag = np.full(n_points - 1, 1.0 * coeff)
    return diags([off_diag, main_diag, off_diag], [-1, 0, 1], format="csr")


def build_hamiltonian(x: np.ndarray, V: np.ndarray):
    """Build H = T + V as a sparse CSR matrix."""
    n = len(x)
    dx = x[1] - x[0]
    T = build_kinetic_matrix(n, dx)
    V_diag = diags([V], [0], format="csr")
    return T + V_diag


def solve_schrodinger(x, V, n_eigenstates=5):
    """Solve TISE: H|ψ⟩ = E|ψ⟩ for the n lowest eigenstates."""
    n = len(x)
    H = build_hamiltonian(x, V)
    max_k = min(n_eigenstates, n - 2)
    if max_k < 1:
        max_k = 1
    try:
        # which="SA" solves for smallest algebraic eigenvalues (ground state upwards)
        eigenvalues, eigenvectors = eigsh(H, k=max_k, which="SA")
    except Exception as e:
        # Robust LAPACK fallback for 1D grid (unconditionally converges without ARPACK iteration limits)
        import scipy.linalg as la
        H_dense = H.toarray()
        vals, vecs = la.eigh(H_dense)
        eigenvalues = vals[:max_k]
        eigenvectors = vecs[:, :max_k]

    idx = np.argsort(eigenvalues)
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]
    for i in range(eigenvectors.shape[1]):
        norm = np.sqrt(trapezoid(np.abs(eigenvectors[:, i]) ** 2, x))
        if norm > 1e-15:
            eigenvectors[:, i] /= norm
    return {
        "eigenvalues": eigenvalues.tolist(),
        "eigenvectors": eigenvectors.T.tolist(),
    }


# ─── Core Physics: TDSE Solver (Crank-Nicolson) ─────────────────────────────

def time_evolve_crank_nicolson(x, V, psi0, dt, n_steps, sample_every=1):
    """
    Propagate ψ(t) using the Crank-Nicolson scheme:
        (I + i·dt/2·H) ψ(t+dt) = (I - i·dt/2·H) ψ(t)

    Returns sampled frames of ψ at intervals of sample_every steps.
    """
    n = len(x)
    H = build_hamiltonian(x, V)
    I = speye(n, format="csr")

    # Build the LHS and RHS operators (they are constant for time-independent H)
    A = I + 1j * (dt / 2.0) * H   # LHS: (I + i dt/2 H)
    B = I - 1j * (dt / 2.0) * H   # RHS: (I - i dt/2 H)

    psi = np.array(psi0, dtype=complex)
    frames = []

    for step in range(n_steps):
        if step % sample_every == 0:
            frames.append(psi.copy())

        # Solve A · ψ_new = B · ψ_old
        rhs = B @ psi
        psi = spsolve(A, rhs)

    # Capture the final frame
    if n_steps % sample_every == 0:
        frames.append(psi.copy())

    return frames


# ─── Wavepacket Generator ───────────────────────────────────────────────────

def generate_wavepacket(x, x0=0.0, sigma=0.5, k0=0.0):
    """
    Generate a normalized Gaussian wavepacket:
        ψ(x) = (2πσ²)^{-1/4} exp(-(x-x₀)²/(4σ²)) exp(ik₀x)
    """
    psi = (2 * np.pi * sigma**2) ** (-0.25) * \
        np.exp(-(x - x0)**2 / (4 * sigma**2)) * \
        np.exp(1j * k0 * x)
    # Re-normalize on the discrete grid
    norm = np.sqrt(trapezoid(np.abs(psi)**2, x))
    if norm > 1e-15:
        psi /= norm
    return psi


# ─── Observables ─────────────────────────────────────────────────────────────

def compute_fidelity(psi, phi, x):
    """Compute |⟨ψ|φ⟩|² (overlap / fidelity)."""
    overlap = trapezoid(np.conj(psi) * phi, x)
    return float(np.abs(overlap) ** 2)


def compute_expectation_position(psi, x):
    """Compute ⟨x⟩ = ∫ ψ*(x) · x · ψ(x) dx."""
    return float(np.real(trapezoid(np.conj(psi) * x * psi, x)))


def compute_expectation_momentum(psi, x):
    """Compute ⟨p⟩ = -i ∫ ψ*(x) dψ/dx dx (ℏ=1)."""
    dx = x[1] - x[0]
    dpsi = np.gradient(psi, dx)
    return float(np.real(-1j * trapezoid(np.conj(psi) * dpsi, x)))


def compute_expectation_energy(psi, x, V):
    """Compute ⟨H⟩ = ⟨T⟩ + ⟨V⟩."""
    dx = x[1] - x[0]
    # ⟨T⟩ = -(1/2) ∫ ψ* d²ψ/dx² dx
    d2psi = np.gradient(np.gradient(psi, dx), dx)
    T_exp = float(np.real(-0.5 * trapezoid(np.conj(psi) * d2psi, x)))
    # ⟨V⟩ = ∫ ψ* V ψ dx
    V_exp = float(np.real(trapezoid(np.conj(psi) * V * psi, x)))
    return T_exp + V_exp


def compute_expectation_custom(psi, x, op_expr, scalars=None):
    """Compute ⟨O⟩ where O is a multiplicative operator given as expression."""
    variables = {"x": x}
    if scalars:
        variables.update(scalars)
    O = safe_eval_expression(op_expr, variables)
    return float(np.real(trapezoid(np.conj(psi) * O * psi, x)))


def compute_norm(psi, x):
    """Compute ∫ |ψ|² dx."""
    return float(np.real(trapezoid(np.abs(psi)**2, x)))


def compute_inner_product(psi, phi, x):
    """Compute ⟨ψ|φ⟩ = ∫ ψ* φ dx."""
    return complex(trapezoid(np.conj(psi) * phi, x))


def compute_expectation_squared_position(psi, x):
    """Compute ⟨x²⟩ = ∫ ψ* x² ψ dx."""
    return float(np.real(trapezoid(np.conj(psi) * (x**2) * psi, x)))


def compute_expectation_squared_momentum(psi, x):
    """Compute ⟨p²⟩ = - ∫ ψ* d²ψ/dx² dx (ℏ=1)."""
    dx = x[1] - x[0]
    d2psi = np.gradient(np.gradient(psi, dx), dx)
    return float(np.real(-trapezoid(np.conj(psi) * d2psi, x)))


def compute_variance_position(psi, x):
    """Compute σ²_x = ⟨x²⟩ - ⟨x⟩²."""
    exp_x = compute_expectation_position(psi, x)
    exp_x2 = compute_expectation_squared_position(psi, x)
    return max(0.0, exp_x2 - exp_x**2)


def compute_variance_momentum(psi, x):
    """Compute σ²_p = ⟨p²⟩ - ⟨p⟩²."""
    exp_p = compute_expectation_momentum(psi, x)
    exp_p2 = compute_expectation_squared_momentum(psi, x)
    return max(0.0, exp_p2 - exp_p**2)


def compute_uncertainty_position(psi, x):
    """Compute σ_x = √σ²_x."""
    return np.sqrt(compute_variance_position(psi, x))


def compute_uncertainty_momentum(psi, x):
    """Compute σ_p = √σ²_p."""
    return np.sqrt(compute_variance_momentum(psi, x))


# ─── Graph Interpreter ───────────────────────────────────────────────────────

def interpret_graph(graph_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Interpret a React Flow node-graph JSON payload and run the physics.

    Supports two modes:
      A) Static (TISE): Eigenstate computation + optional superposition
      B) Dynamic (TDSE): Time evolution with Crank-Nicolson + observables
    """
    start = time.time()

    nodes = {n["id"]: n for n in graph_data.get("nodes", [])}
    edges = graph_data.get("edges", [])

    # ── 1. Extract spatial dimension ────────────────────────────────────
    spatial_node = _find_node_by_type(nodes, "spatialDimension")
    if not spatial_node:
        raise ValueError("Graph must contain a SpatialDimension node.")

    xmin = float(spatial_node["data"].get("xmin", -5))
    xmax = float(spatial_node["data"].get("xmax", 5))
    n_points = int(spatial_node["data"].get("n", 256))
    x = np.linspace(xmin, xmax, n_points)

    # ── 2. Collect all scalar values ────────────────────────────────────
    scalars = {}
    for nid, node in nodes.items():
        if node.get("type") == "scalar":
            label = str(node["data"].get("label", nid))
            try:
                value = float(node["data"].get("value", 0))
            except (ValueError, TypeError):
                value = 0.0
            scalars[label] = value
            # Extract variable name from label (e.g. "Ej = 14200 MHz" -> "Ej", "omega_r = 6.5 GHz" -> "omega_r")
            if "=" in label:
                var_key = label.split("=")[0].strip().split(":")[0].strip().split()[0]
                if var_key and var_key.isidentifier():
                    scalars[var_key] = value
            elif ":" in label:
                var_key = label.split(":")[0].strip().split()[0]
                if var_key and var_key.isidentifier():
                    scalars[var_key] = value
            elif label.strip().isidentifier():
                scalars[label.strip()] = value

    # ── 3. Evaluate the potential ───────────────────────────────────────
    potential_node = _find_node_by_type(nodes, "potential")
    if not potential_node:
        raise ValueError("Graph must contain a Potential node.")

    expr = potential_node["data"].get("expression", "0")
    variables = {"x": x}
    variables.update(scalars)
    V = safe_eval_expression(expr, variables)

    # ── Check if this is a time-evolution graph ─────────────────────────
    time_evo_node = _find_node_by_type(nodes, "timeEvolution")

    if time_evo_node:
        return _run_time_evolution(x, V, nodes, edges, scalars, time_evo_node, start)
    else:
        return _run_static(x, V, nodes, edges, scalars, start)


def _run_static(x, V, nodes, edges, scalars, start):
    """Run the static TISE solver (original path)."""
    n_points = len(x)

    # Find spectrum / eigenstate request
    spectrum_node = _find_node_by_type(nodes, "spectrum")
    n_eigenstates = 3
    if spectrum_node:
        n_eigenstates = int(spectrum_node["data"].get("nEigenstates", 3))

    # Solve TISE
    solution = solve_schrodinger(x, V, n_eigenstates)

    # LinearCombination → superposition
    superposition = _build_superposition(nodes, solution, x, n_points)

    # Compute any fidelity nodes
    fidelity_results = _compute_fidelities(nodes, solution, x, n_points)

    # Compute any expectation value nodes
    expectation_results = _compute_expectations(nodes, x, V, solution, scalars, n_points)
    
    # Compute new math scalar nodes (norm, variance, etc)
    math_scalars = _compute_math_scalars(nodes, x, V, solution, scalars, n_points)

    elapsed = time.time() - start

    return {
        "status": "success",
        "mode": "static",
        "x": x.tolist(),
        "potential": V.tolist(),
        "eigenvalues": solution["eigenvalues"],
        "eigenvectors": solution["eigenvectors"],
        "superposition": superposition,
        "fidelities": fidelity_results,
        "expectations": expectation_results,
        "math_scalars": math_scalars,
        "n_points": n_points,
        "xmin": float(x[0]),
        "xmax": float(x[-1]),
        "execution_time_ms": round((time.time() - start) * 1000, 2),
    }


def _run_time_evolution(x, V, nodes, edges, scalars, time_evo_node, start):
    """Run the TDSE time-evolution path."""
    n_points = len(x)

    # Extract time evolution parameters
    dt = float(time_evo_node["data"].get("dt", 0.01))

    # Get loop parameters from forLoop node
    for_loop_node = _find_node_by_type(nodes, "forLoop")
    n_steps = 100
    sample_every = 1
    if for_loop_node:
        from_i = int(for_loop_node["data"].get("fromI", 0))
        to_i = int(for_loop_node["data"].get("toI", 100))
        delta_i = int(for_loop_node["data"].get("deltaI", 1))
        n_steps = max(1, (to_i - from_i) // max(1, delta_i))
        # Limit to prevent browser overload while maintaining high heatmap quality
        max_frames = 500
        if n_steps > max_frames:
            sample_every = max(1, n_steps // max_frames)

    # Build initial state ψ₀
    psi0 = _build_initial_state(nodes, x, n_points, V, scalars)

    # Propagate
    frames = time_evolve_crank_nicolson(x, V, psi0, dt, n_steps, sample_every)

    # Compute observables for each frame
    time_series = {
        "t": [],
        "fidelity": [],
        "expectation_x": [],
        "expectation_p": [],
        "expectation_E": [],
    }

    # Reference state for fidelity (the initial state)
    psi_ref = psi0.copy()

    # Check if there's a specific operator node
    operator_nodes = _find_all_nodes_by_type(nodes, "operator")
    custom_expectations = {n["id"]: {"label": n["data"].get("operatorType", "x"), "values": []}
                           for n in operator_nodes}

    # Prepare tracking for new math scalar nodes
    math_nodes = [n for n in nodes.values() if n.get("type") in ["norm", "expectationSquared", "variance", "uncertainty", "innerProduct"]]
    math_time_series = {n["id"]: [] for n in math_nodes}

    for i, psi_frame in enumerate(frames):
        t = i * sample_every * dt
        time_series["t"].append(float(t))
        time_series["fidelity"].append(compute_fidelity(psi_frame, psi_ref, x))
        time_series["expectation_x"].append(compute_expectation_position(psi_frame, x))
        time_series["expectation_p"].append(compute_expectation_momentum(psi_frame, x))
        time_series["expectation_E"].append(compute_expectation_energy(psi_frame, x, V))

        for op_node in operator_nodes:
            op_type = op_node["data"].get("operatorType", "x")
            if op_type == "x":
                val = compute_expectation_position(psi_frame, x)
            elif op_type == "p":
                val = compute_expectation_momentum(psi_frame, x)
            elif op_type == "custom":
                op_expr = op_node["data"].get("expression", "x")
                val = compute_expectation_custom(psi_frame, x, op_expr, scalars)
            else:
                val = 0.0
            custom_expectations[op_node["id"]]["values"].append(val)
            
        for math_node in math_nodes:
            nid = math_node["id"]
            t_type = math_node.get("type")
            if t_type == "norm":
                math_time_series[nid].append(compute_norm(psi_frame, x))
            elif t_type == "expectationSquared":
                op = math_node["data"].get("operatorType", "x")
                val = compute_expectation_squared_position(psi_frame, x) if op == "x" else compute_expectation_squared_momentum(psi_frame, x)
                math_time_series[nid].append(val)
            elif t_type == "variance":
                op = math_node["data"].get("operatorType", "x")
                val = compute_variance_position(psi_frame, x) if op == "x" else compute_variance_momentum(psi_frame, x)
                math_time_series[nid].append(val)
            elif t_type == "uncertainty":
                op = math_node["data"].get("operatorType", "x")
                val = compute_uncertainty_position(psi_frame, x) if op == "x" else compute_uncertainty_momentum(psi_frame, x)
                math_time_series[nid].append(val)
            elif t_type == "innerProduct":
                math_time_series[nid].append(np.abs(compute_inner_product(psi_frame, psi_ref, x)))

    # Serialize frames (downsample the wavefunction data for bandwidth)
    serialized_frames = []
    for psi_frame in frames:
        serialized_frames.append({
            "psi_real": np.real(psi_frame).tolist(),
            "psi_imag": np.imag(psi_frame).tolist(),
            "prob_density": (np.abs(psi_frame) ** 2).tolist(),
        })

    elapsed = time.time() - start

    return {
        "status": "success",
        "mode": "time_evolution",
        "x": x.tolist(),
        "potential": V.tolist(),
        "n_points": n_points,
        "xmin": float(x[0]),
        "xmax": float(x[-1]),
        "dt": dt,
        "n_steps": n_steps,
        "n_frames": len(frames),
        "frames": serialized_frames,
        "time_series": time_series,
        "custom_expectations": custom_expectations,
        "math_scalars_time_series": math_time_series,
        "execution_time_ms": round(elapsed * 1000, 2),
    }


def _build_initial_state(nodes, x, n_points, V, scalars):
    """Build ψ₀ from a wavefunction node, linearCombination, or default ground state."""
    wf_node = _find_node_by_type(nodes, "wavefunction")
    if wf_node:
        wf_type = wf_node["data"].get("wfType", "gaussian")
        if wf_type == "gaussian":
            x0 = float(wf_node["data"].get("x0", 0))
            sigma = float(wf_node["data"].get("sigma", 0.5))
            k0 = float(wf_node["data"].get("k0", 0))
            return generate_wavepacket(x, x0, sigma, k0)
        elif wf_type == "custom":
            expr = wf_node["data"].get("expression", "exp(-x**2)")
            variables = {"x": x}
            variables.update(scalars)
            psi = safe_eval_complex(expr, variables)
            norm = np.sqrt(trapezoid(np.abs(psi)**2, x))
            if norm > 1e-15:
                psi /= norm
            return psi

    # Fallback: use LinearCombination or ground state
    lc_node = _find_node_by_type(nodes, "linearCombination")
    if lc_node:
        spectrum_node = _find_node_by_type(nodes, "spectrum")
        n_eig = 3
        if spectrum_node:
            n_eig = int(spectrum_node["data"].get("nEigenstates", 3))
        solution = solve_schrodinger(x, V, n_eig)
        coeffs_data = lc_node["data"].get("coefficients", [])
        psi = np.zeros(n_points, dtype=complex)
        for i, c in enumerate(coeffs_data):
            if i >= len(solution["eigenvectors"]):
                break
            re_part = float(c.get("re", 0))
            im_part = float(c.get("im", 0))
            psi += complex(re_part, im_part) * np.array(solution["eigenvectors"][i])
        norm = np.sqrt(trapezoid(np.abs(psi)**2, x))
        if norm > 1e-15:
            psi /= norm
        return psi

    # Default: ground state of the potential
    solution = solve_schrodinger(x, V, 1)
    return np.array(solution["eigenvectors"][0], dtype=complex)


def _build_superposition(nodes, solution, x, n_points):
    """Build superposition from LinearCombination node if present."""
    lc_node = _find_node_by_type(nodes, "linearCombination")
    if not lc_node:
        return None

    coeffs_data = lc_node["data"].get("coefficients", [])
    n_avail = len(solution["eigenvectors"])
    psi = np.zeros(n_points, dtype=complex)
    for i, c in enumerate(coeffs_data):
        if i >= n_avail:
            break
        re_part = float(c.get("re", 0))
        im_part = float(c.get("im", 0))
        psi += complex(re_part, im_part) * np.array(solution["eigenvectors"][i])

    normalize = lc_node["data"].get("normalize", True)
    if normalize:
        norm = np.sqrt(trapezoid(np.abs(psi) ** 2, x))
        if norm > 1e-15:
            psi /= norm

    return {
        "psi_real": np.real(psi).tolist(),
        "psi_imag": np.imag(psi).tolist(),
        "prob_density": (np.abs(psi) ** 2).tolist(),
    }


def _compute_fidelities(nodes, solution, x, n_points):
    """Compute fidelity for all fidelity nodes."""
    fidelity_nodes = _find_all_nodes_by_type(nodes, "fidelity")
    results = {}
    for fn in fidelity_nodes:
        # For static mode, compute overlap between ground and first excited
        if len(solution["eigenvectors"]) >= 2:
            psi = np.array(solution["eigenvectors"][0], dtype=complex)
            phi = np.array(solution["eigenvectors"][1], dtype=complex)
            results[fn["id"]] = compute_fidelity(psi, phi, x)
        else:
            results[fn["id"]] = 1.0
    return results


def _compute_expectations(nodes, x, V, solution, scalars, n_points):
    """Compute expectation values for all expectation nodes."""
    exp_nodes = _find_all_nodes_by_type(nodes, "expectationValue")
    results = {}
    for en in exp_nodes:
        op_type = en["data"].get("operatorType", "x")
        # Use ground state by default
        if len(solution["eigenvectors"]) > 0:
            psi = np.array(solution["eigenvectors"][0], dtype=complex)
        else:
            psi = np.ones(n_points, dtype=complex) / np.sqrt(n_points)

        if op_type == "x":
            results[en["id"]] = compute_expectation_position(psi, x)
        elif op_type == "p":
            results[en["id"]] = compute_expectation_momentum(psi, x)
        elif op_type == "H":
            results[en["id"]] = compute_expectation_energy(psi, x, V)
        elif op_type == "custom":
            expr = en["data"].get("expression", "x")
            results[en["id"]] = compute_expectation_custom(psi, x, expr, scalars)
        else:
            results[en["id"]] = 0.0
    return results


def _compute_math_scalars(nodes, x, V, solution, scalars, n_points):
    """Compute scalars for new math nodes (norm, variance, inner product, etc)."""
    results = {}
    
    # Use ground state by default if not wired topologically
    if len(solution["eigenvectors"]) > 0:
        psi = np.array(solution["eigenvectors"][0], dtype=complex)
    else:
        psi = np.ones(n_points, dtype=complex) / np.sqrt(n_points)
        
    for nid, node in nodes.items():
        t = node.get("type")
        if t == "norm":
            results[nid] = compute_norm(psi, x)
        elif t == "expectationSquared":
            op = node["data"].get("operatorType", "x")
            if op == "x":
                results[nid] = compute_expectation_squared_position(psi, x)
            elif op == "p":
                results[nid] = compute_expectation_squared_momentum(psi, x)
            else:
                results[nid] = 0.0
        elif t == "variance":
            op = node["data"].get("operatorType", "x")
            if op == "x":
                results[nid] = compute_variance_position(psi, x)
            elif op == "p":
                results[nid] = compute_variance_momentum(psi, x)
            else:
                results[nid] = 0.0
        elif t == "uncertainty":
            op = node["data"].get("operatorType", "x")
            if op == "x":
                results[nid] = compute_uncertainty_position(psi, x)
            elif op == "p":
                results[nid] = compute_uncertainty_momentum(psi, x)
            else:
                results[nid] = 0.0
        elif t == "innerProduct":
            # For static inner product without edges, we just compute self inner product
            results[nid] = np.abs(compute_inner_product(psi, psi, x))
            
    return results


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _find_node_by_type(nodes: Dict, node_type: str):
    """Find the first node matching a given type."""
    for nid, node in nodes.items():
        if node.get("type") == node_type:
            return node
    return None


def _find_all_nodes_by_type(nodes: Dict, node_type: str) -> List:
    """Find all nodes matching a given type."""
    return [node for node in nodes.values() if node.get("type") == node_type]
