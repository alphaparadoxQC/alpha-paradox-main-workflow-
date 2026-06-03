/**
 * ============================================================
 * VQE Optimization Web Worker
 * ============================================================
 * Runs the entire VQE optimization loop off the main thread
 * to keep the UI at 60fps during heavy gradient calculations.
 *
 * Messages:
 *   IN:  { type: 'start', molecule, parameters, config, bitOrder }
 *   IN:  { type: 'abort' }
 *   OUT: { type: 'iteration', data: VQEIteration }
 *   OUT: { type: 'complete', result: VQEResult }
 *   OUT: { type: 'error', message: string }
 * ============================================================
 */

import { MoleculeData } from '../moleculeData';
import {
  VQEResult,
  VQEIteration,
  VQEConfig,
  runVQEOptimization,
} from '../vqeOptimizer';
import { BitOrder } from '@/lib/quantum/bitOrder';

let aborted = false;

interface StartMessage {
  type: 'start';
  molecule: MoleculeData;
  parameters: number[];
  config: Partial<VQEConfig>;
  bitOrder: BitOrder;
}

interface AbortMessage {
  type: 'abort';
}

type IncomingMessage = StartMessage | AbortMessage;

self.addEventListener('message', async (event: MessageEvent<IncomingMessage>) => {
  const msg = event.data;

  if (msg.type === 'abort') {
    aborted = true;
    return;
  }

  if (msg.type === 'start') {
    aborted = false;
    const { molecule, parameters, config, bitOrder } = msg;

    try {
      const result: VQEResult = await runVQEOptimization(
        molecule,
        parameters,
        config,
        (iteration: VQEIteration) => {
          if (aborted) {
            throw new Error('Optimization aborted');
          }
          // Post each iteration back to the UI thread
          self.postMessage({ type: 'iteration', data: iteration });
        },
        bitOrder
      );

      if (!aborted) {
        self.postMessage({ type: 'complete', result });
      }
    } catch (error) {
      if ((error as Error).message === 'Optimization aborted') {
        self.postMessage({ type: 'aborted' });
      } else {
        self.postMessage({
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
});
