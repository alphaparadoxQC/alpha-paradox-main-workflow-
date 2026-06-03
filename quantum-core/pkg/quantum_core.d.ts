/* tslint:disable */
/* eslint-disable */

export class TensorEngine {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Apply a CNOT gate.
     */
    applyCnot(control: number, target: number): void;
    /**
     * Apply a 2x2 single-qubit gate to the target qubit.
     * `gate_matrix` must be a flat Float64Array of length 8: [r00, i00, r01, i01, r10, i10, r11, i11]
     */
    applySingleQubitGate(target: number, gate_matrix: Float64Array): void;
    /**
     * Calculate the expectation value of a diagonal Hamiltonian.
     */
    expectationValueDiagonal(energies: Float64Array): number;
    /**
     * Return probabilities for all basis states.
     */
    getProbabilities(): Float64Array;
    /**
     * Return the full complex state vector as [re0, im0, re1, im1, ...]
     */
    getStateVector(): Float64Array;
    memoryUsedBytes(): number;
    constructor(num_qubits: number);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_tensorengine_free: (a: number, b: number) => void;
    readonly tensorengine_applyCnot: (a: number, b: number, c: number) => [number, number];
    readonly tensorengine_applySingleQubitGate: (a: number, b: number, c: number, d: number) => [number, number];
    readonly tensorengine_expectationValueDiagonal: (a: number, b: number, c: number) => [number, number, number];
    readonly tensorengine_getProbabilities: (a: number) => any;
    readonly tensorengine_getStateVector: (a: number) => any;
    readonly tensorengine_memoryUsedBytes: (a: number) => number;
    readonly tensorengine_new: (a: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
