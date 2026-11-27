import { create } from 'zustand';
import { streamFromGemini } from '../ai/geminiClient';
import { QUANTUM_SYSTEM_PROMPT } from '../ai/quantumAIPrompt';

/**
 * AI Chat Store
 * =============
 * Manages the AI assistant conversation state, message history,
 * and interactions with the Gemini API.
 */

const useAIChatStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  messages: [],          // Array of { id, role: 'user'|'ai', text, timestamp, codeBlocks }
  isOpen: false,         // Whether the chat panel is visible
  isLoading: false,      // Whether AI is generating a response
  streamingText: '',     // Current streaming response text
  error: null,           // Error message if API fails

  // ── Actions ────────────────────────────────────────────────────────────────

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  clearChat: () => set({ messages: [], error: null, streamingText: '' }),

  /**
   * Send a user message and get an AI response via streaming.
   */
  sendMessage: async (userText) => {
    if (!userText.trim() || get().isLoading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
      streamingText: '',
    }));

    // Build conversation history for Gemini API format
    const conversationHistory = get().messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    try {
      if (!apiKey) {
        // No API key — provide a helpful offline response
        const offlineResponse = getOfflineResponse(userText);
        const aiMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'ai',
          text: offlineResponse,
          timestamp: new Date().toISOString(),
          codeBlocks: extractCodeBlocks(offlineResponse),
        };
        set((state) => ({
          messages: [...state.messages, aiMessage],
          isLoading: false,
          streamingText: '',
        }));
        return;
      }

      // Stream response from Gemini
      let fullText = '';
      await streamFromGemini(apiKey, conversationHistory, QUANTUM_SYSTEM_PROMPT, (chunk) => {
        fullText += chunk;
        set({ streamingText: fullText });
      });

      // Finalize the AI message
      const aiMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        text: fullText,
        timestamp: new Date().toISOString(),
        codeBlocks: extractCodeBlocks(fullText),
      };

      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
        streamingText: '',
      }));

    } catch (err) {
      console.error('AI Chat Error:', err);
      
      let errorText = 'Something went wrong. Please try again.';
      if (err.message === 'NO_API_KEY') {
        errorText = 'No API key configured. Add your free Gemini API key to the .env file as VITE_GEMINI_API_KEY.';
      } else if (err.message.includes('API_KEY_INVALID')) {
        errorText = 'Invalid API key. Please check your VITE_GEMINI_API_KEY in the .env file.';
      }

      set({
        isLoading: false,
        streamingText: '',
        error: errorText,
      });
    }
  },
}));

/**
 * Extract code blocks from markdown text.
 * Returns array of { language, code } objects.
 */
function extractCodeBlocks(text) {
  const codeBlockRegex = /```([a-zA-Z0-9_:-]*)\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'python',
      code: match[2].trim(),
    });
  }
  return blocks;
}

/**
 * Provide helpful offline responses when no API key is configured.
 */
function getOfflineResponse(userText) {
  const lower = userText.toLowerCase();

  if (lower.includes('bell') || lower.includes('entanglement')) {
    return `## Bell State Circuit 🔗

A Bell state is the simplest example of quantum entanglement between two qubits. Here is the circuit to create one in the Composer:

\`\`\`json:composer
{
  "numQubits": 2,
  "numClbits": 2,
  "operations": [
    { "gate": "H", "qubits": [0] },
    { "gate": "CX", "qubits": [0, 1] },
    { "gate": "MEASURE", "qubits": [0], "clbits": [0] },
    { "gate": "MEASURE", "qubits": [1], "clbits": [1] }
  ]
}
\`\`\`

> 💡 **Tip:** Click the "Build in Composer" button above to automatically load this circuit! To get real AI responses for any circuit, add your Gemini API key to the \`.env\` file.`;
  }

  if (lower.includes('qubit')) {
    return `## What is a Qubit? 🎯

A **qubit** (quantum bit) is the fundamental unit of quantum information — the quantum equivalent of a classical bit.

While a classical bit can only be **0** or **1**, a qubit can exist in a **superposition** of both states simultaneously:

$$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$$

where $|\\alpha|^2 + |\\beta|^2 = 1$.

In the Alpha-Paradox chip, each qubit is a **Transmon** — a superconducting circuit cooled to near absolute zero (~15 millikelvin) that behaves as a quantum two-level system.

### Try it in the Composer!
Drag an **H** (Hadamard) gate onto qubit q0 to put it into superposition, then add a **Measure** gate to observe the result.

> 💡 **Tip**: To use the full AI assistant with unlimited responses, add your free Gemini API key to the \`.env\` file as \`VITE_GEMINI_API_KEY\`. Get one free at [aistudio.google.com](https://aistudio.google.com).`;
  }

  if (lower.includes('bell') || lower.includes('entangle')) {
    return `## Bell State Circuit 🔗

A **Bell State** creates maximum entanglement between two qubits. Here's how to build it:

\`\`\`python
from alpha import QuantumCircuit

# Create a 2-qubit Bell State circuit
qc = QuantumCircuit(2, 2)

# Step 1: Put q0 into superposition
qc.h(0)

# Step 2: Entangle q0 and q1 with CNOT
qc.cx(0, 1)

# Step 3: Measure both qubits
qc.measure([0, 1], [0, 1])

print(qc)
\`\`\`

After measurement, you will always get either **|00⟩** or **|11⟩** with 50% probability each. The qubits are perfectly correlated!

### In the Composer
1. Drag **H** onto q0
2. Drag **CX** connecting q0 → q1  
3. Add **Measure** on both qubits
4. Click **Run** → You'll see only "00" and "11" in the histogram

> 💡 Add your free Gemini API key to unlock unlimited AI conversations.`;
  }

  if (lower.includes('alpha') || lower.includes('chip') || lower.includes('architecture')) {
    return `## Alpha-Paradox Chip Architecture 🏗️

The Alpha-Paradox quantum processor is a cutting-edge superconducting chip:

| Specification | Value |
|---|---|
| Physical Qubits | **1,625** |
| Logical Qubits | **130** |
| Qubit Type | Transmon (~5 GHz) |
| Error Correction | QLDPC Bivariate Bicycle (d=16) |
| Decoder | Belief Propagation + OSD |
| Native Gates | \`rz\`, \`sx\`, \`x\`, \`cz\` |
| CZ Gate Time | 15 ns |
| QLDPC Threshold | 0.83% physical error rate |

### How it works
Every 12.5 physical qubits protect 1 logical qubit through quantum error correction. The QLDPC code has distance 16, meaning it can detect and correct up to 7 simultaneous physical errors per logical qubit.

> 💡 Add your free Gemini API key to unlock unlimited AI conversations.`;
  }

  // Default response
  return `## Welcome to Alpha AI! ✨

I'm the AI assistant built into the Alpha-Paradox Quantum Workload Manager. I can help you:

- 📚 **Learn** quantum computing concepts
- 🔧 **Build** quantum circuits with code
- 🧪 **Design** experiments (VQE, QAOA, Grover's)
- 📊 **Understand** simulation results

### Quick Start
Try asking me:
- *"What is superposition?"*
- *"Create a Bell State circuit"*
- *"Explain the Alpha-Paradox chip"*
- *"Write a VQE circuit for H₂"*

> ⚠️ **Full AI is not connected yet.** To unlock unlimited AI responses, add your free Google Gemini API key to the \`.env\` file:
> \`\`\`
> VITE_GEMINI_API_KEY=your_key_here
> \`\`\`
> Get your free key at [aistudio.google.com](https://aistudio.google.com).`;
}

export default useAIChatStore;
