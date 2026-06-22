/**
 * ============================================================
 * HUGGING FACE INFERENCE API
 * ============================================================
 * Lightweight client-side service that calls the Hugging Face
 * Serverless Inference API via the OpenAI-compatible endpoint.
 *
 * Designed to replace Gemini to avoid free-tier rate limits.
 * Default model: mistralai/Mistral-7B-Instruct-v0.3
 * ============================================================
 */

// ── Types ──────────────────────────────────────────────────

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── Constants ──────────────────────────────────────────────

const HF_MODEL = 'meta-llama/Llama-3.1-8B-Instruct:novita';
const HF_API_BASE = `https://router.huggingface.co/v1/chat/completions`;

/**
 * Compressed system prompt — optimised for token economy.
 * Covers the full domain (quantum computing + chemistry + drug discovery).
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

// ── Core Service ──────────────────────────────────────────

function getApiKey(): string {
  return (import.meta.env.VITE_HUGGINGFACE_API_KEY as string) ?? '';
}

/**
 * Convert the app's ConversationTurn[] to OpenAI/HF format.
 */
function buildMessages(
  history: ConversationTurn[],
  currentMessage: string,
): ChatMessage[] {
  const recent = history.slice(-6);

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
  ];

  recent.forEach((turn) => {
    messages.push({
      role: turn.role,
      content: turn.content,
    });
  });

  messages.push({
    role: 'user',
    content: currentMessage,
  });

  return messages;
}

/**
 * Reusable fetch wrapper with retries.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delayMs = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      // If rate limit or temporary server error, retry
      if (response.status === 429 || response.status === 503 || response.status >= 500) {
        console.warn(`[HF Service] API returned status ${response.status}. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`[HF Service] Fetch failed: ${error}. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  throw new Error('Failed to fetch after maximum retries.');
}

/**
 * Call Hugging Face API via OpenAI-compatible endpoint.
 */
export async function callHuggingFace(
  message: string,
  history: ConversationTurn[] = [],
): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === 'your_hf_token_here') {
    throw new Error(
      'Hugging Face API token not configured. Set VITE_HUGGINGFACE_API_KEY in your .env file.',
    );
  }

  const messages = buildMessages(history, message);

  const requestBody = {
    model: HF_MODEL,
    messages: messages,
    max_tokens: 512,
    temperature: 0.4,
    top_p: 0.8,
    stream: false,
  };

  const response = await fetchWithRetry(HF_API_BASE, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[HF Service] API error:', response.status, errorText);
    throw new Error(`Hugging Face API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Hugging Face error: ${data.error.message || data.error}`);
  }

  const text = data.choices?.[0]?.message?.content ?? "I couldn't generate a response. Please try again.";

  return text.trim();
}

/**
 * Convenience: Get the model name for logging/display.
 */
export function getModelName(): string {
  return HF_MODEL;
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
 * Call Hugging Face API to convert a natural language description into JSON representation.
 */
export async function generateCircuitFromPrompt(prompt: string): Promise<CircuitPromptResponse> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_hf_token_here') {
    throw new Error('Hugging Face API token not configured. Set VITE_HUGGINGFACE_API_KEY in your .env file.');
  }

  const systemPrompt = `You are a quantum circuit command and builder parser. Decide if the user's input is a circuit-building request (like "create a Bell state", "make a 3 qubit GHZ state", "design Grover's algorithm") or a direct command action (like "clear the circuit", "add a qubit", "remove a qubit", "run simulation", "undo", "redo", "add a Hadamard gate to qubit 0").

Respond ONLY with a valid JSON object in this exact format, with no markdown formatting or extra text:
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

Output ONLY JSON. Do not output anything before or after the JSON.`;

  const requestBody = {
    model: HF_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 2048,
    stream: false,
    response_format: { type: "json_object" } // Works on most HF chat completion endpoints
  };

  const response = await fetchWithRetry(HF_API_BASE, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error: ${errorText}`);
  }

  const data = await response.json();
  let text = data.choices?.[0]?.message?.content;
  
  if (!text) {
    throw new Error('No content returned from Hugging Face.');
  }

  // Strip possible markdown blocks if the model ignored response_format
  text = text.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(text.trim());
}
