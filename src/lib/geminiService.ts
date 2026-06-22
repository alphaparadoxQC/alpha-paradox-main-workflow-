/**
 * ============================================================
 * GEMINI 2.5 FLASH — Direct API Wrapper
 * ============================================================
 * Lightweight client-side service that calls the Google Gemini
 * REST API directly (no Supabase edge function needed).
 *
 * Fine-tuned for MINIMUM token usage:
 *   • Compressed system instruction (avoids per-turn overhead)
 *   • Low maxOutputTokens (512 default — voice answers should be short)
 *   • Tight topK / topP to avoid rambling
 *   • Temperature 0.4 for focused, deterministic answers
 * ============================================================
 */

// ── Types ──────────────────────────────────────────────────

interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiGenerationConfig {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
  thinkingConfig?: {
    thinkingBudget: number;
  };
}

interface GeminiRequest {
  system_instruction?: { parts: { text: string }[] };
  contents: GeminiContent[];
  generationConfig: GeminiGenerationConfig;
}

interface GeminiCandidate {
  content: { parts: { text: string }[]; role: string };
  finishReason: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string; code: number };
}

// ── Conversation turn (mirroring existing ConversationEntry) ──
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

// ── Constants ──────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Compressed system prompt — optimised for token economy.
 * Key decisions:
 *   • Removed verbose preamble; uses terse bullet style.
 *   • Instructs the model to keep answers ≤ 3 sentences for voice output.
 *   • Covers the full domain (quantum computing + chemistry + drug discovery)
 *     so the same service works across all platform pages.
 */
const SYSTEM_INSTRUCTION = `You are Alpha, a concise quantum-computing & computational-chemistry voice assistant inside the Alpha ParadoxQC platform.

You can control the user's circuit builder in real-time by appending special action tags to the end of your response text.

Rules:
• Answer in ≤3 sentences. Voice output—be brief.
• Use quantum notation (|0⟩,|1⟩,|+⟩) when relevant.
• Supported gates: H,X,Y,Z,CNOT,SWAP,CZ,CCX,Rx,Ry,Rz,S,T,M.
• If user provides circuit context (qubits, gates, simulation results), reference it.
• For chemistry: understand SMILES, Hartree-Fock, VQE, ADMET, Lipinski rules.
• Never output markdown formatting—plain speech only.
• If unsure, say so honestly in one sentence.

Action Tags (append at the end of the text ONLY when explicitly commanded or strongly implied by user):
- To add a single-qubit gate: [ACTION: ADD_GATE type=GATE_TYPE qubit=INDEX] (GATE_TYPE can be H, X, Y, Z, S, T, M. INDEX is 0-indexed). Example: [ACTION: ADD_GATE type=H qubit=0]
- To add a CNOT gate: [ACTION: ADD_GATE type=CNOT control=C target=T] (C and T are qubit indexes). Example: [ACTION: ADD_GATE type=CNOT control=0 target=1]
- To clear the circuit: [ACTION: CLEAR_CIRCUIT]
- To add a qubit: [ACTION: INCREMENT_QUBITS]
- To remove a qubit: [ACTION: DECREMENT_QUBITS]
- To undo: [ACTION: UNDO]
- To redo: [ACTION: REDO]
- To run the simulation: [ACTION: SIMULATE]`;

/**
 * Default generation parameters — tuned for minimal token spend.
 *
 * maxOutputTokens: 512 keeps voice responses tight (~60-80 spoken words).
 * temperature: 0.4 avoids creative hallucination.
 * topK: 20, topP: 0.8 — focused sampling window.
 * thinkingBudget: 0 disables reasoning thoughts, saving token overhead and latency.
 */
const DEFAULT_GENERATION_CONFIG: GeminiGenerationConfig = {
  temperature: 0.4,
  topK: 20,
  topP: 0.8,
  maxOutputTokens: 512,
  thinkingConfig: {
    thinkingBudget: 0,
  },
};

// ── Core Service ──────────────────────────────────────────

/**
 * Get the Gemini API key from Vite environment variables.
 * Falls back to empty string (will produce a clear error below).
 */
function getApiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY as string) ?? '';
}

/**
 * Convert the app's ConversationTurn[] to Gemini's content format.
 * Gemini expects `role: "user" | "model"` — we map `assistant → model`.
 *
 * We also cap at the last 6 turns (3 exchanges) to minimise input tokens.
 */
function buildContents(
  history: ConversationTurn[],
  currentMessage: string,
): GeminiContent[] {
  // Take only the last 6 entries to bound input tokens
  const recent = history.slice(-6);

  const contents: GeminiContent[] = recent.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }],
  });

  return contents;
}

/**
 * Reusable fetch wrapper with retries and exponential backoff for handling transient Gemini API errors (e.g. 503 / 429).
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delayMs = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      // If rate limit (429) or temporary server error (503 / 500), retry
      if (response.status === 429 || response.status === 503 || response.status >= 500) {
        console.warn(`[GeminiService] API returned status ${response.status}. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
        continue;
      }
      
      return response; // Return other errors (like 400 bad request) immediately
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`[GeminiService] Fetch failed: ${error}. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  throw new Error('Failed to fetch after maximum retries.');
}

/**
 * Call Gemini 2.5 Flash via the public REST API.
 *
 * @param message         - The user's current input (may include context suffix)
 * @param history         - Prior conversation turns
 * @param overrides       - Optional generation config overrides
 * @returns               - The model's text response
 * @throws                - On network / API errors
 */
export async function callGemini(
  message: string,
  history: ConversationTurn[] = [],
  overrides?: Partial<GeminiGenerationConfig>,
): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env file.',
    );
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const requestBody: GeminiRequest = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: buildContents(history, message),
    generationConfig: {
      ...DEFAULT_GENERATION_CONFIG,
      ...overrides,
    },
  };

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GeminiService] API error:', response.status, errorText);
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`);
  }

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "I couldn't generate a response. Please try again.";

  return text.trim();
}

/**
 * Convenience: Get the model name for logging/display.
 */
export function getGeminiModel(): string {
  return GEMINI_MODEL;
}

export interface CircuitPromptResponse {
  type: 'circuit' | 'command';
  circuitData?: {
    qubitCount: number;
    gates: {
      type: string;
      qubit: number;
      position: number;
      targetQubit?: number;
      controlQubit2?: number;
      angle?: string;
    }[];
  };
  commandData?: {
    action: 'CLEAR_CIRCUIT' | 'INCREMENT_QUBITS' | 'DECREMENT_QUBITS' | 'UNDO' | 'REDO' | 'SIMULATE' | 'ADD_GATE';
    params?: {
      type?: string;
      qubit?: string;
      control?: string;
      target?: string;
    };
  };
}

/**
 * Call Gemini 2.5 Flash to convert a natural language description into a JSON representation of a quantum circuit or a command action.
 */
export async function generateCircuitFromPrompt(prompt: string): Promise<CircuitPromptResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env file.');
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const systemPrompt = `You are a quantum circuit command and builder parser. Decide if the user's input is a circuit-building request (like "create a Bell state", "make a 3 qubit GHZ state", "design Grover's algorithm") or a direct command action (like "clear the circuit", "add a qubit", "remove a qubit", "run simulation", "undo", "redo", "add a Hadamard gate to qubit 0").

Respond ONLY with a valid JSON object in this exact format:
{
  "type": "circuit" | "command",
  "circuitData": {
    "qubitCount": <number>,
    "gates": [
      {"type": "<gate type>", "qubit": <number>, "position": <number>, "targetQubit": <optional number>}
    ]
  },
  "commandData": {
    "action": "CLEAR_CIRCUIT" | "INCREMENT_QUBITS" | "DECREMENT_QUBITS" | "UNDO" | "REDO" | "SIMULATE" | "ADD_GATE",
    "params": {
      "type": "<gate type for ADD_GATE>",
      "qubit": "<qubit index>",
      "control": "<control qubit index for CNOT>",
      "target": "<target qubit index for CNOT>"
    }
  }
}

Rules for "circuit":
- Valid gate types: H, X, Y, Z, S, T, CNOT, SWAP, CZ, CCX, M, Rx, Ry, Rz
- For CNOT/CZ, use "qubit" for control and "targetQubit" for target.
- For CCX, also include "controlQubit2".
- Position is the column (0-indexed, left to right).
- Qubit is the row (0-indexed, top to bottom).

Rules for "command":
- Use "action": "CLEAR_CIRCUIT" to reset the canvas/clear circuit.
- Use "action": "INCREMENT_QUBITS" to add/increment a qubit.
- Use "action": "DECREMENT_QUBITS" to remove/decrement a qubit.
- Use "action": "UNDO" to undo.
- Use "action": "REDO" to redo.
- Use "action": "SIMULATE" to simulate/run simulation.
- Use "action": "ADD_GATE" to add a single gate. Provide parameters in "params" (e.g. type=H, qubit=0).

Only respond with JSON. Do not include markdown code block syntax (like \`\`\`json).`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json"
    },
  };

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No content returned from Gemini.');
  }

  return JSON.parse(text.trim());
}


