mod utils;

use wasm_bindgen::prelude::*;
use num_complex::Complex64;
use ndarray::{Array, Array1, Array2, ArrayView2};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct TensorEngine {
    num_qubits: usize,
    // A dense state vector for now; this will be upgraded to a tensor network
    // (MPS/PEPS) in the full implementation.
    state: Array1<Complex64>,
}

#[wasm_bindgen]
impl TensorEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(num_qubits: usize) -> TensorEngine {
        utils::set_panic_hook();
        let num_states = 1 << num_qubits;
        let mut state = Array1::<Complex64>::zeros(num_states);
        state[0] = Complex64::new(1.0, 0.0);
        
        TensorEngine {
            num_qubits,
            state,
        }
    }

    /// Apply a 2x2 single-qubit gate to the target qubit.
    /// `gate_matrix` must be a flat Float64Array of length 8: [r00, i00, r01, i01, r10, i10, r11, i11]
    #[wasm_bindgen(js_name = applySingleQubitGate)]
    pub fn apply_single_qubit_gate(&mut self, target: usize, gate_matrix: &[f64]) -> Result<(), JsValue> {
        if target >= self.num_qubits {
            return Err(JsValue::from_str("Target qubit out of bounds"));
        }
        if gate_matrix.len() != 8 {
            return Err(JsValue::from_str("Gate matrix must have 8 elements"));
        }

        let g00 = Complex64::new(gate_matrix[0], gate_matrix[1]);
        let g01 = Complex64::new(gate_matrix[2], gate_matrix[3]);
        let g10 = Complex64::new(gate_matrix[4], gate_matrix[5]);
        let g11 = Complex64::new(gate_matrix[6], gate_matrix[7]);

        let mask = 1 << target;
        let num_states = 1 << self.num_qubits;

        // Apply gate
        for i in 0..num_states {
            let partner = i ^ mask;
            if i > partner {
                continue;
            }

            let bit = (i >> target) & 1;
            let idx0 = if bit == 0 { i } else { partner };
            let idx1 = if bit == 0 { partner } else { i };

            let a = self.state[idx0];
            let b = self.state[idx1];

            self.state[idx0] = g00 * a + g01 * b;
            self.state[idx1] = g10 * a + g11 * b;
        }

        Ok(())
    }

    /// Apply a CNOT gate.
    #[wasm_bindgen(js_name = applyCnot)]
    pub fn apply_cnot(&mut self, control: usize, target: usize) -> Result<(), JsValue> {
        if control >= self.num_qubits || target >= self.num_qubits {
            return Err(JsValue::from_str("Qubit out of bounds"));
        }
        if control == target {
            return Err(JsValue::from_str("Control and target must be different"));
        }

        let num_states = 1 << self.num_qubits;
        let target_mask = 1 << target;

        for i in 0..num_states {
            let control_bit = (i >> control) & 1;
            if control_bit != 1 {
                continue;
            }

            let partner = i ^ target_mask;
            if i > partner {
                continue;
            }

            self.state.swap(i, partner);
        }

        Ok(())
    }

    /// Return probabilities for all basis states.
    #[wasm_bindgen(js_name = getProbabilities)]
    pub fn get_probabilities(&self) -> js_sys::Float64Array {
        let mut probs = Vec::with_capacity(self.state.len());
        for amp in self.state.iter() {
            probs.push(amp.norm_sqr());
        }
        js_sys::Float64Array::from(&probs[..])
    }

    /// Calculate the expectation value of a diagonal Hamiltonian.
    #[wasm_bindgen(js_name = expectationValueDiagonal)]
    pub fn expectation_value_diagonal(&self, energies: &[f64]) -> Result<f64, JsValue> {
        if energies.len() != self.state.len() {
            return Err(JsValue::from_str("Energies array length must match state vector dimension"));
        }

        let mut expectation = 0.0;
        for (i, amp) in self.state.iter().enumerate() {
            expectation += amp.norm_sqr() * energies[i];
        }

        Ok(expectation)
    }

    #[wasm_bindgen(js_name = memoryUsedBytes)]
    pub fn memory_used_bytes(&self) -> usize {
        self.state.len() * 16 // 16 bytes per Complex64
    }

    /// Return the full complex state vector as [re0, im0, re1, im1, ...]
    #[wasm_bindgen(js_name = getStateVector)]
    pub fn get_state_vector(&self) -> js_sys::Float64Array {
        let mut flat = Vec::with_capacity(self.state.len() * 2);
        for amp in self.state.iter() {
            flat.push(amp.re);
            flat.push(amp.im);
        }
        js_sys::Float64Array::from(&flat[..])
    }
}
