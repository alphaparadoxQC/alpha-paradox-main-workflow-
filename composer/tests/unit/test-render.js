import React from 'react';
import { renderToString } from 'react-dom/server';
import { QuantumCircuit } from './src/quantum-engine/circuit.js';

const qc = new QuantumCircuit(3, 3);
qc.barrier('all');
console.log(qc.toGrid());
