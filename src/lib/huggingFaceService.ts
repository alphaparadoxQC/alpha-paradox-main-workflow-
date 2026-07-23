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
 */
const SYSTEM_INSTRUCTION = `You are Alpha, a voice assistant for quantum & chemistry in Alpha ParadoxQC.
Rules: ≤2 sentences. Voice style (no markdown, plain text).
If user gives circuit context (qubits, gates, simulation), reference it.
Action Tags (append at end of response ONLY when commanded/implied):
- Add gate: [ACTION: ADD_GATE type=TYPE qubit=Q] (TYPE: H,X,Y,Z,S,T,M. Q: index)
- Add CNOT: [ACTION: ADD_GATE type=CNOT control=C target=T]
- Clear: [ACTION: CLEAR_CIRCUIT]
- +1 qubit: [ACTION: INCREMENT_QUBITS]
- -1 qubit: [ACTION: DECREMENT_QUBITS]
- Undo/Redo/Simulate: [ACTION: UNDO], [ACTION: REDO], [ACTION: SIMULATE]`;

// ── Core Service ──────────────────────────────────────────

function getApiKey(): string {
  const deepseekKey = (import.meta.env.VITE_DEEPSEEK_API_KEY as string) ?? '';
  if (deepseekKey) return deepseekKey;
  return (import.meta.env.VITE_HUGGINGFACE_API_KEY as string) ?? '';
}

/**
 * Convert the app's ConversationTurn[] to OpenAI/HF format.
 */
function buildMessages(
  history: ConversationTurn[],
  currentMessage: string,
): ChatMessage[] {
  const recent = history.slice(-4);

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



export async function callOpenAILikeAPI(
  messages: ChatMessage[],
  jsonMode = false
): Promise<string> {
  const deepseekKey = (import.meta.env.VITE_DEEPSEEK_API_KEY as string) ?? '';
  const hfKey = (import.meta.env.VITE_HUGGINGFACE_API_KEY as string) ?? '';

  let apiBase = HF_API_BASE;
  let model = HF_MODEL;
  let key = hfKey;

  if (deepseekKey) {
    apiBase = 'https://api.deepseek.com/chat/completions';
    model = 'deepseek-v4-flash';
    key = deepseekKey;
  } else if (!hfKey || hfKey === 'your_hf_token_here') {
    throw new Error('No AI API key found. Set VITE_DEEPSEEK_API_KEY or VITE_HUGGINGFACE_API_KEY in .env');
  }

  const requestBody: any = {
    model: model,
    messages: messages,
    max_tokens: jsonMode ? 2048 : 512,
    temperature: jsonMode ? 0.1 : 0.4,
    top_p: 0.8,
    stream: false,
  };

  if (jsonMode) {
    requestBody.response_format = { type: 'json_object' };
  }

  const response = await fetchWithRetry(apiBase, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return text.trim();
}

/**
 * Call API via OpenAI-compatible endpoint.
 */
export async function callHuggingFace(
  message: string,
  history: ConversationTurn[] = [],
): Promise<string> {
  const messages = buildMessages(history, message);
  return callOpenAILikeAPI(messages, false);
}

/**
 * Convenience: Get the model name for logging/display.
 */
export function getModelName(): string {
  const deepseekKey = (import.meta.env.VITE_DEEPSEEK_API_KEY as string) ?? '';
  if (deepseekKey) return 'deepseek-v4-flash';
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

export function localQuantumAgent(prompt: string): CircuitPromptResponse {
  const norm = prompt.toLowerCase().trim();

  // 1. CLEAR / RESET / UNDO / REDO / SIMULATE
  if (norm === 'clear' || norm.includes('clear circuit') || norm === 'reset') {
    return { type: 'command', commandData: { action: 'CLEAR_ALL' as any } };
  }
  if (norm.includes('add a qubit') || norm.includes('add qubit') || norm.includes('increment qubit')) {
    return { type: 'command', commandData: { action: 'INCREMENT_QUBITS' } };
  }
  if (norm.includes('remove a qubit') || norm.includes('remove qubit') || norm.includes('decrement qubit') || norm.includes('delete qubit')) {
    return { type: 'command', commandData: { action: 'DECREMENT_QUBITS' } };
  }
  if (norm === 'undo' || norm === 'undo last' || norm.includes('undo that')) {
    return { type: 'command', commandData: { action: 'UNDO' } };
  }
  if (norm === 'redo') {
    return { type: 'command', commandData: { action: 'REDO' } };
  }
  if (norm === 'simulate' || norm.includes('run simulation') || norm === 'run') {
    return { type: 'command', commandData: { action: 'SIMULATE' } };
  }

  // 2. Single gate addition commands
  const hadamardMatch = norm.match(/(?:hadamard|h gate|h)\s*(?:on|to)?\s*(?:qubit)?\s*(\d+)/i);
  if (hadamardMatch) {
    return {
      type: 'command',
      commandData: {
        action: 'ADD_GATE',
        params: { type: 'H', qubit: hadamardMatch[1] }
      }
    };
  }

  const xMatch = norm.match(/(?:pauli x|not gate|x gate|not|x)\s*(?:on|to)?\s*(?:qubit)?\s*(\d+)/i);
  if (xMatch) {
    return {
      type: 'command',
      commandData: {
        action: 'ADD_GATE',
        params: { type: 'X', qubit: xMatch[1] }
      }
    };
  }

  const yMatch = norm.match(/(?:pauli y|y gate|y)\s*(?:on|to)?\s*(?:qubit)?\s*(\d+)/i);
  if (yMatch) {
    return {
      type: 'command',
      commandData: {
        action: 'ADD_GATE',
        params: { type: 'Y', qubit: yMatch[1] }
      }
    };
  }

  const zMatch = norm.match(/(?:pauli z|z gate|phase gate|z)\s*(?:on|to)?\s*(?:qubit)?\s*(\d+)/i);
  if (zMatch) {
    return {
      type: 'command',
      commandData: {
        action: 'ADD_GATE',
        params: { type: 'Z', qubit: zMatch[1] }
      }
    };
  }

  const sMatch = norm.match(/(?:s gate|s)\s*(?:on|to)?\s*(?:qubit)?\s*(\d+)/i);
  if (sMatch) {
    return {
      type: 'command',
      commandData: {
        action: 'ADD_GATE',
        params: { type: 'S', qubit: sMatch[1] }
      }
    };
  }

  const tMatch = norm.match(/(?:t gate|t)\s*(?:on|to)?\s*(?:qubit)?\s*(\d+)/i);
  if (tMatch) {
    return {
      type: 'command',
      commandData: {
        action: 'ADD_GATE',
        params: { type: 'T', qubit: tMatch[1] }
      }
    };
  }

  const mMatch = norm.match(/(?:measure|measurement|m gate|m)\s*(?:on|to)?\s*(?:qubit)?\s*(\d+)/i);
  if (mMatch) {
    return {
      type: 'command',
      commandData: {
        action: 'ADD_GATE',
        params: { type: 'M', qubit: mMatch[1] }
      }
    };
  }

  // CNOT match: "cnot control 0 target 1", "cnot 0 to 1", "cnot on 0 and 1"
  const cnotMatch = norm.match(/(?:cnot|cx)\s*(?:control|on)?\s*(\d+)\s*(?:target|to)?\s*(\d+)/i);
  if (cnotMatch) {
    return {
      type: 'command',
      commandData: {
        action: 'ADD_GATE',
        params: { type: 'CNOT', control: cnotMatch[1], target: cnotMatch[2] }
      }
    };
  }

  // 3. Complete Circuit Templates
  // Bell state (2 qubits)
  if (norm.includes('bell state') || norm.includes('bellstate') || (norm.includes('superposition') && norm.includes('entangle') && norm.includes('2 qubit'))) {
    return {
      type: 'circuit',
      circuitData: {
        qubitCount: 2,
        gates: [
          { type: 'H', qubit: 0, position: 0 },
          { type: 'CNOT', qubit: 0, targetQubit: 1, position: 1 },
        ]
      }
    };
  }

  // GHZ state (3 qubits or custom)
  if (norm.includes('ghz state') || norm.includes('ghzstate') || norm.includes('greenberger')) {
    const matchQubits = norm.match(/(\d+)\s*qubit/);
    const numQubits = matchQubits ? parseInt(matchQubits[1]) : 3;
    const finalQubits = Math.max(2, Math.min(numQubits, 15));

    const gates = [{ type: 'H', qubit: 0, position: 0 }];
    for (let q = 0; q < finalQubits - 1; q++) {
      gates.push({ type: 'CNOT', qubit: q, targetQubit: q + 1, position: q + 1 });
    }

    return {
      type: 'circuit',
      circuitData: {
        qubitCount: finalQubits,
        gates
      }
    };
  }

  // Superposition on all qubits
  if (norm.includes('superposition on all') || norm.includes('hadamard on all') || norm.includes('random superposition') || norm.includes('superposition on all qubits')) {
    const matchQubits = norm.match(/(\d+)\s*qubit/);
    const numQubits = matchQubits ? parseInt(matchQubits[1]) : 5;
    const finalQubits = Math.max(2, Math.min(numQubits, 15));

    const gates = [];
    for (let q = 0; q < finalQubits; q++) {
      gates.push({ type: 'H', qubit: q, position: 0 });
    }

    return {
      type: 'circuit',
      circuitData: {
        qubitCount: finalQubits,
        gates
      }
    };
  }

  // Grover's Search (4 qubits)
  if (norm.includes('grover') || norm.includes('search algorithm')) {
    return {
      type: 'circuit',
      circuitData: {
        qubitCount: 4,
        gates: [
          // Superposition
          { type: 'H', qubit: 0, position: 0 },
          { type: 'H', qubit: 1, position: 0 },
          { type: 'H', qubit: 2, position: 0 },
          { type: 'H', qubit: 3, position: 0 },
          // Oracle
          { type: 'CZ', qubit: 0, targetQubit: 1, position: 1 },
          { type: 'CZ', qubit: 2, targetQubit: 3, position: 2 },
          // Diffuser
          { type: 'H', qubit: 0, position: 3 },
          { type: 'H', qubit: 1, position: 3 },
          { type: 'H', qubit: 2, position: 3 },
          { type: 'H', qubit: 3, position: 3 },
          { type: 'X', qubit: 0, position: 4 },
          { type: 'X', qubit: 1, position: 4 },
          { type: 'X', qubit: 2, position: 4 },
          { type: 'X', qubit: 3, position: 4 },
          { type: 'CZ', qubit: 0, targetQubit: 3, position: 5 },
          { type: 'X', qubit: 0, position: 6 },
          { type: 'X', qubit: 1, position: 6 },
          { type: 'X', qubit: 2, position: 6 },
          { type: 'X', qubit: 3, position: 6 },
          { type: 'H', qubit: 0, position: 7 },
          { type: 'H', qubit: 1, position: 7 },
          { type: 'H', qubit: 2, position: 7 },
          { type: 'H', qubit: 3, position: 7 },
        ]
      }
    };
  }

  // Hadamard and CNOT Chain
  if (norm.includes('hadamard followed by cnot') || norm.includes('hadamard and cnot chain') || norm.includes('cnot chain')) {
    return {
      type: 'circuit',
      circuitData: {
        qubitCount: 4,
        gates: [
          { type: 'H', qubit: 0, position: 0 },
          { type: 'CNOT', qubit: 0, targetQubit: 1, position: 1 },
          { type: 'CNOT', qubit: 1, targetQubit: 2, position: 2 },
          { type: 'CNOT', qubit: 2, targetQubit: 3, position: 3 },
        ]
      }
    };
  }

  // Dynamic fallback error message that gives tips
  throw new Error(`The local Quantum Assistant compiled error: I couldn't automatically parse "${prompt}". Try asking for "Bell state", "GHZ state", "Grover's search on 4 qubits", "Hadamard on qubit 0", or direct command actions like "clear the circuit".`);
}

/**
 * Call API to convert a natural language description into JSON representation.
 */
export async function generateCircuitFromPrompt(prompt: string): Promise<CircuitPromptResponse> {
  const deepseekKey = (import.meta.env.VITE_DEEPSEEK_API_KEY as string) ?? '';
  const hfKey = (import.meta.env.VITE_HUGGINGFACE_API_KEY as string) ?? '';
  const hasKey = deepseekKey || (hfKey && hfKey !== 'your_hf_token_here');

  if (hasKey) {
    try {
      const systemPrompt = `You are Alpha, an AI Quantum Circuit builder. Compile the request into a JSON object:
{
  "type": "circuit" | "command",
  "circuitData": {
    "qubitCount": <number>,
    "gates": [
      {"type": "H"|"X"|"Y"|"Z"|"S"|"T"|"M"|"CNOT"|"CZ"|"SWAP", "qubit": <number>, "position": <number>, "targetQubit": <optional number>}
    ]
  },
  "commandData": {
    "action": "CLEAR_CIRCUIT" | "INCREMENT_QUBITS" | "DECREMENT_QUBITS" | "UNDO" | "REDO" | "SIMULATE" | "ADD_GATE",
    "params": {
      "type": "<gate type>",
      "qubit": "<index>",
      "control": "<index>",
      "target": "<index>"
    }
  }
}

For CNOT/CZ/SWAP target, use "targetQubit". Position column starts from 0. Qubit wire starts from 0.
Return ONLY the raw JSON object.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      const apiResponse = await callOpenAILikeAPI(messages, true);
      let cleaned = apiResponse.trim();
      
      // Strip markdown code fences if present
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const parsed: CircuitPromptResponse = JSON.parse(cleaned.trim());
      return parsed;
    } catch (apiError) {
      console.warn('[Natural Builder API] Call failed, falling back to local compilation:', apiError);
    }
  }

  // Fallback to offline local compiler if keys are missing or API fails
  return localQuantumAgent(prompt);
}
