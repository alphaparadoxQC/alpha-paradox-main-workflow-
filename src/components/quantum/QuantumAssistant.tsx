import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Mic, Square, Play, Volume2, VolumeX, Send, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { callHuggingFace, localQuantumAgent, type ConversationTurn } from '@/lib/huggingFaceService';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { BRANDING } from '@/config/branding';
import AICharacter2D, { AICharacterState } from './AICharacter2D';

// ─────────────────────────────────────────────
// Dismissal phrases — case-insensitive match
// ─────────────────────────────────────────────
const DISMISSAL_PHRASES = [
  'no',
  "that's all",
  'thats all',
  'stop',
  'goodbye',
  'bye',
  "thanks that's all",
  'nevermind',
  'never mind',
  'close',
  'exit',
  'close assistant',
];

// ─────────────────────────────────────────────
// Wake words — passive listen triggers
// ─────────────────────────────────────────────
const WAKE_WORDS = ['hey alpha', 'hey quantum', 'hello assistant'];

function containsWakeWord(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/[.,!?]/g, '');
  return WAKE_WORDS.some((w) => normalized.includes(w));
}

function isDismissal(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/[.,!?]/g, '');
  return DISMISSAL_PHRASES.some(
    (phrase) => normalized === phrase || normalized.startsWith(phrase + ' ')
  );
}

// ─────────────────────────────────────────────
// SpeechRecognition type shim for browsers
// ─────────────────────────────────────────────
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: any;
}

type SpeechRecognitionInstance = any; // Fallback to any to avoid typeof SpeechRecognition error

function createSpeechRecognition(): SpeechRecognitionInstance | null {
  const SR =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  return new SR() as SpeechRecognitionInstance;
}

// ─────────────────────────────────────────────
// Conversation history for multi-turn (type imported from geminiService)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export const QuantumAssistant = () => {
  const navigate = useNavigate();

  // ── Core state ──
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // toggle button expanded into capsule+circle
  const [isWakeWordListening, setIsWakeWordListening] = useState(false); // tracks wake word mic for UI
  const [assistantMode, setAssistantMode] = useState<
    'idle' | 'listening' | 'speaking'
  >('idle');
  const [transcript, setTranscript] = useState('');
  const [statusText, setStatusText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [spokenCaption, setSpokenCaption] = useState(''); // live subtitle of assistant speech

  // ── Chat interface states ──
  const [messages, setMessages] = useState<ConversationTurn[]>([
    {
      role: 'assistant',
      content: "Hello! I am Alpha, your AI Quantum Copilot. Ask me to 'create a Bell state', 'add superposition', or 'run simulation'!"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [speakResponses, setSpeakResponses] = useState(false); // defaults to muted for a pleasant text UX
  const [showSandbox, setShowSandbox] = useState(true);

  // ── Refs ──
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wakeWordRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wakeWordActiveRef = useRef(false); // true when passive listener is running
  const conversationRef = useRef<ConversationTurn[]>([]);
  const isActiveRef = useRef(false); // mirrors isAssistantActive for async callbacks
  const speechInterruptedRef = useRef(false); // prevents cancelled utterance callbacks from looping
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isSpeechInputRef = useRef(false);

  const {
    gates,
    qubitCount,
    simulationResult,
    addGate,
    clearCircuit,
    incrementQubits,
    decrementQubits,
    undo,
    redo,
    simulate,
    setGates,
    setQubitCount
  } = useQuantumCircuitStore();

  // Keep ref in sync
  useEffect(() => {
    isActiveRef.current = isAssistantActive;
  }, [isAssistantActive]);

  // ── Map assistantMode → AICharacterState ──
  const characterState: AICharacterState = (() => {
    if (isProcessing) return 'thinking';
    switch (assistantMode) {
      case 'listening':
        return 'listening';
      case 'speaking':
        return 'speaking';
      default:
        return 'idle';
    }
  })();

  // ── Speak a short phrase (utility) ──
  const speakPhrase = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
          resolve();
          return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      }),
    []
  );

  // ── Send to AI (calls HF or falls back to local parser) ──
  const sendToBackend = useCallback(
    async (text: string) => {
      setIsProcessing(true);
      setStatusText('🧠 Thinking...');

      // Append user message immediately if not already there
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'user' && last.content === text) return prev;
        return [...prev, { role: 'user', content: text }];
      });

      try {
        // Build compact context suffix to minimise input tokens
        let contextStr = '';
        if (window.assistantContext && window.assistantContext.currentPage) {
          contextStr += `\n[Page:${window.assistantContext.currentPage}`;
          const entries = Object.entries(window.assistantContext.pageData);
          if (entries.length > 0) {
            contextStr += ' | ' + entries.map(([k, v]) => `${k}=${v}`).join(', ');
          }
          contextStr += ']';
        } else if (gates.length > 0) {
          // Fallback context from circuit store
          contextStr = `\n[Page:quantum-builder | Qubits=${qubitCount}, Gates=${gates.map((g) => g.type).join(',')}]`;
        }

        conversationRef.current.push({ role: 'user', content: text });

        const finalMessage = `${text}${contextStr}`;

        // Call Hugging Face API directly
        const response = await callHuggingFace(
          finalMessage,
          conversationRef.current.slice(-6),
        );

        // Parse actions: [ACTION: NAME key=val key=val]
        const actionRegex = /\[ACTION:\s*([A-Z_]+)([^\]]*)\]/g;
        let match;
        const actionsToExecute: { action: string; params: Record<string, string> }[] = [];

        let cleanedResponse = response;
        while ((match = actionRegex.exec(response)) !== null) {
          const action = match[1];
          const paramStr = match[2];
          const params: Record<string, string> = {};
          
          const paramRegex = /(\w+)=([^\s]+)/g;
          let paramMatch;
          while ((paramMatch = paramRegex.exec(paramStr)) !== null) {
            params[paramMatch[1]] = paramMatch[2];
          }
          
          actionsToExecute.push({ action, params });
        }

        // Clean action tags out of speech audio response
        cleanedResponse = response.replace(actionRegex, '').trim();

        // Perform actions
        actionsToExecute.forEach(({ action, params }) => {
          try {
            switch (action) {
              case 'CLEAR_CIRCUIT':
                clearCircuit();
                break;
              case 'INCREMENT_QUBITS':
                incrementQubits();
                break;
              case 'DECREMENT_QUBITS':
                decrementQubits();
                break;
              case 'UNDO':
                undo();
                break;
              case 'REDO':
                redo();
                break;
              case 'SIMULATE':
                simulate();
                break;
              case 'ADD_GATE': {
                const gateType = params.type;
                if (!gateType) break;

                if (gateType === 'CNOT' || gateType === 'cx') {
                  const control = parseInt(params.control ?? params.qubit ?? '0');
                  const target = parseInt(params.target ?? '1');
                  const maxPos = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
                  addGate({
                    id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'CNOT',
                    qubit: control,
                    position: maxPos,
                    controlQubit: control,
                    targetQubit: target,
                  });
                } else {
                  const q = parseInt(params.qubit ?? '0');
                  const maxPos = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
                  addGate({
                    id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: gateType as any,
                    qubit: q,
                    position: maxPos,
                    ...(['Rx', 'Ry', 'Rz', 'P'].includes(gateType) ? { angle: Math.PI / 2 } : {}),
                  });
                }
                break;
              }
              default:
                console.warn('Unknown assistant action:', action);
            }
          } catch (e) {
            console.error('Error executing assistant action:', e);
          }
        });

        conversationRef.current.push({ role: 'assistant', content: cleanedResponse });
        setMessages(prev => [...prev, { role: 'assistant', content: cleanedResponse }]);

        return cleanedResponse;
      } catch (err) {
        console.warn('Hugging Face API failed, falling back to local compilation:', err);
        try {
          const norm = text.toLowerCase().trim();
          const localResult = localQuantumAgent(text);
          let reply = "";
          
          if (localResult.type === 'command' && localResult.commandData) {
            const action = localResult.commandData.action;
            const params = localResult.commandData.params;
            
            if (action === 'CLEAR_ALL' as any || action === 'CLEAR_CIRCUIT') {
              clearCircuit();
              reply = "I've cleared the circuit canvas for you.";
            } else if (action === 'INCREMENT_QUBITS') {
              incrementQubits();
              reply = "I've added a qubit wire to the circuit.";
            } else if (action === 'DECREMENT_QUBITS') {
              decrementQubits();
              reply = "I've removed a qubit wire from the circuit.";
            } else if (action === 'UNDO') {
              undo();
              reply = "Undone the last change.";
            } else if (action === 'REDO') {
              redo();
              reply = "Redone the change.";
            } else if (action === 'SIMULATE') {
              simulate();
              reply = "Running quantum simulation. The probabilities are updated.";
            } else if (action === 'ADD_GATE' && params) {
              const type = params.type || 'H';
              const q = parseInt(params.qubit || '0');
              const maxPos = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
              
              if (type === 'CNOT') {
                const target = parseInt(params.target || '1');
                addGate({
                  id: `gate-${Date.now()}`,
                  type: 'CNOT',
                  qubit: q,
                  position: maxPos,
                  controlQubit: q,
                  targetQubit: target
                });
                reply = `Added a CNOT gate with control on qubit ${q} and target on qubit ${target}.`;
              } else {
                addGate({
                  id: `gate-${Date.now()}`,
                  type: type as any,
                  qubit: q,
                  position: maxPos
                });
                reply = `Added a ${type} gate to qubit ${q}.`;
              }
            }
          } else if (localResult.type === 'circuit' && localResult.circuitData) {
            const cd = localResult.circuitData;
            const newGates = cd.gates.map((g, idx) => ({
              id: `gate-${Date.now()}-${idx}`,
              type: g.type,
              qubit: g.qubit,
              position: g.position,
              ...(g.targetQubit !== undefined ? { targetQubit: g.targetQubit } : {}),
            })) as any[];
            setQubitCount(cd.qubitCount);
            setGates(newGates);
            
            if (norm.includes('bell')) {
              reply = "I've generated a Bell state circuit with a Hadamard and CNOT gate.";
            } else if (norm.includes('ghz')) {
              reply = `I've generated a Greenberger-Horne-Zeilinger (GHZ) state circuit with ${cd.qubitCount} qubits.`;
            } else if (norm.includes('grover')) {
              reply = "I've generated a 4-qubit Grover's Search algorithm circuit showing the oracle and diffusion operators.";
            } else {
              reply = `I've compiled and generated the requested ${cd.qubitCount}-qubit circuit.`;
            }
          }
          
          if (!reply) {
            reply = "I've parsed that request but couldn't execute it. Try asking for a Bell state or adding specific gates.";
          }
          
          conversationRef.current.push({ role: 'assistant', content: reply });
          setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
          return reply;
        } catch (localErr: any) {
          console.error('Local fallback parsing failed:', localErr);
          const failMsg = localErr.message || "I couldn't understand that request. Try asking to 'Create a Bell state', 'clear the circuit', or 'simulate'.";
          conversationRef.current.push({ role: 'assistant', content: failMsg });
          setMessages(prev => [...prev, { role: 'assistant', content: failMsg }]);
          return failMsg;
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [gates, qubitCount, addGate, clearCircuit, incrementQubits, decrementQubits, undo, redo, simulate, setGates, setQubitCount]
  );


  // ── Interrupt speech: cancel synthesis → go to listening ──
  const interruptSpeech = useCallback(() => {
    // Set flag BEFORE cancelling — so utterance.onerror won't trigger continueLoop
    speechInterruptedRef.current = true;
    // Cancel any active speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Clear caption
    setSpokenCaption('');
    // Transition to listening
    setAssistantMode('idle');
    setStatusText('🎤 Listening...');
    setTranscript('');
    silentRetryCountRef.current = 0;
    startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Split text into sentences for subtitle-style captions ──
  const splitIntoSentences = useCallback((text: string): { text: string; start: number; end: number }[] => {
    const sentences: { text: string; start: number; end: number }[] = [];
    // Match sentences ending with . ! ? or the remaining tail
    const regex = /[^.!?]*[.!?]+\s*/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      sentences.push({
        text: match[0].trim(),
        start: match.index,
        end: match.index + match[0].length,
      });
      lastIndex = regex.lastIndex;
    }

    // Capture any remaining text that doesn't end with punctuation
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex).trim();
      if (remaining) {
        sentences.push({
          text: remaining,
          start: lastIndex,
          end: text.length,
        });
      }
    }

    return sentences.length > 0 ? sentences : [{ text: text.trim(), start: 0, end: text.length }];
  }, []);

  // ── Speak response aloud → "Any more questions?" → listen again ──
  const speakResponse = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window) || !isActiveRef.current) {
        // Fallback: just go back to listening
        setAssistantMode('idle');
        setStatusText('✨ Ready');
        setSpokenCaption('');
        startListening();
        return;
      }

      // RULE 1: Before assistant starts speaking response: Force stop recognition completely.
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      // Reset interrupt flag — fresh speech session
      speechInterruptedRef.current = false;

      window.speechSynthesis.cancel();
      setAssistantMode('speaking');
      setStatusText('🗣 Speaking...');
      setTranscript('');
      setSpokenCaption('');
      console.log('Assistant Speaking');

      // Pre-split into sentences for subtitle display
      const sentences = splitIntoSentences(text);
      let lastSentenceIdx = -1;

      const utterance = new SpeechSynthesisUtterance(text);

      // Subtitle-style caption: show only the current sentence
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === 'word') {
          const charPos = event.charIndex;
          // Find which sentence this word belongs to
          const idx = sentences.findIndex((s) => charPos >= s.start && charPos < s.end);
          if (idx !== -1 && idx !== lastSentenceIdx) {
            lastSentenceIdx = idx;
            setSpokenCaption(sentences[idx].text);
          }
        }
      };

      const continueLoop = () => {
        // CRITICAL: bail if speech was interrupted
        if (speechInterruptedRef.current) return;
        if (!isActiveRef.current) return;
        // Say "Any more questions?" then restart listening
        setStatusText('🗣 Speaking...');
        console.log('Assistant Speaking (Follow up)');
        const followUp = new SpeechSynthesisUtterance('Any more questions?');
        // Show follow-up as single caption
        followUp.onstart = () => {
          setSpokenCaption('Any more questions?');
        };
        followUp.onend = () => {
          console.log('Speech Finished (Follow up)');
          if (speechInterruptedRef.current) return;
          if (!isActiveRef.current) return;
          silentRetryCountRef.current = 0;
          setAssistantMode('idle');
          setStatusText('✨ Ready');
          setSpokenCaption('');
          startListening();
        };
        followUp.onerror = () => {
          console.log('Speech Error (Follow up)');
          if (speechInterruptedRef.current) return;
          if (!isActiveRef.current) return;
          silentRetryCountRef.current = 0;
          setAssistantMode('idle');
          setStatusText('✨ Ready');
          setSpokenCaption('');
          startListening();
        };
        window.speechSynthesis.speak(followUp);
      };

      utterance.onend = () => {
        console.log('Speech Finished');
        // CRITICAL: bail if speech was interrupted
        if (speechInterruptedRef.current) return;
        if (!isActiveRef.current) return;
        // Clear caption before follow-up
        setSpokenCaption('');
        continueLoop();
      };

      utterance.onerror = () => {
        console.log('Speech Error');
        setSpokenCaption('');
        // CRITICAL: bail if speech was interrupted
        if (speechInterruptedRef.current) return;
        if (!isActiveRef.current) return;
        continueLoop();
      };

      window.speechSynthesis.speak(utterance);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [splitIntoSentences]
  );

  // ── Handle completed speech ──
  const handleSpeechResult = useCallback(
    async (finalText: string) => {
      if (!finalText.trim() || !isActiveRef.current) return;

      // Check for dismissal
      if (isDismissal(finalText)) {
        // Say goodbye, then close
        setTranscript('');
        setAssistantMode('speaking');
        setStatusText('🗣 Speaking...');

        // Stop recognition immediately
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
          recognitionRef.current = null;
        }

        await speakPhrase('Okay, closing assistant. Have a great day.');
        deactivateAssistant();
        return;
      }

      setTranscript(finalText);
      setAssistantMode('idle');
      setStatusText('🧠 Thinking...');

      isSpeechInputRef.current = true;
      const response = await sendToBackend(finalText);

      if (isActiveRef.current && isSpeechInputRef.current) {
        speakResponse(response);
      }
    },
    [sendToBackend, speakResponse, speakPhrase]
  );

  // ── Handle text input submission ──
  const handleTextSubmit = async (text: string) => {
    if (!text.trim()) return;

    // Stop active speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    isSpeechInputRef.current = false;
    const response = await sendToBackend(text);

    if (speakResponses) {
      setAssistantMode('speaking');
      setSpokenCaption(response);
      await speakPhrase(response);
      setAssistantMode('idle');
      setSpokenCaption('');
    }
  };


  // ── Start speech recognition ──
  const silentRetryCountRef = useRef(0);
  const restartScheduledRef = useRef(false);

  const scheduleRestart = useCallback((delayMs: number = 800) => {
    // Prevent multiple restarts from both onerror + onend firing
    if (restartScheduledRef.current) return;
    restartScheduledRef.current = true;

    setTimeout(() => {
      restartScheduledRef.current = false;
      if (isActiveRef.current) {
        startListening();
      }
    }, delayMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    // RULE 6: Add safety check before starting recognition.
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      console.log('Speech synthesis is active. Aborting startListening().');
      return;
    }

    // Clean up any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // Guard: don't start if assistant is no longer active
    if (!isActiveRef.current) return;

    const recognition = createSpeechRecognition();
    if (!recognition) {
      setStatusText('Speech recognition not supported in this browser');
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let gotResult = false; // tracks if this session produced a result

    recognition.onstart = () => {
      console.log('Recognition Started');
      restartScheduledRef.current = false;
      setAssistantMode('listening');
      setStatusText('🎤 Listening...');
      setTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      gotResult = true;
      silentRetryCountRef.current = 0; // user spoke — reset counter

      let interim = '';
      let final_ = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final_ += t;
        } else {
          interim += t;
        }
      }
      setTranscript(final_ || interim);

      if (final_) {
        handleSpeechResult(final_);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'aborted') {
        // Intentional abort — do nothing
        return;
      }

      // Treat 'network' errors as transient — silently retry without showing error
      if (event.error === 'network' && isActiveRef.current) {
        console.log('Network error (transient) — retrying...');
        scheduleRestart(1200);
        return;
      }

      if ((event.error === 'no-speech' || event.error === 'audio-capture') && isActiveRef.current) {
        silentRetryCountRef.current += 1;
        if (silentRetryCountRef.current >= 5) {
          // Too many silent retries — prompt user with "Any more questions?"
          silentRetryCountRef.current = 0;
          if ('speechSynthesis' in window) {
            setAssistantMode('speaking');
            setStatusText('🗣 Speaking...');
            console.log('Assistant Speaking (Silent Retry Prompt)');

            // RULE 1: Before assistant starts speaking, force stop recognition completely.
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
                recognitionRef.current.abort();
              } catch {}
              recognitionRef.current = null;
            }

            const prompt = new SpeechSynthesisUtterance('Any more questions?');
            prompt.onend = () => {
              console.log('Speech Finished (Silent Retry Prompt)');
              if (!isActiveRef.current) return;
              setAssistantMode('idle');
              setStatusText('✨ Ready');
              startListening();
            };
            prompt.onerror = () => {
              console.log('Speech Error (Silent Retry Prompt)');
              if (!isActiveRef.current) return;
              setAssistantMode('idle');
              setStatusText('✨ Ready');
              startListening();
            };
            window.speechSynthesis.speak(prompt);
          } else {
            setAssistantMode('idle');
            setStatusText('✨ Ready');
            scheduleRestart();
          }
          return;
        }
        scheduleRestart();
      } else if (isActiveRef.current) {
        // Other errors — retry silently instead of showing error text
        console.warn('Recognition error (retrying):', event.error);
        scheduleRestart(1500);
      }
    };

    recognition.onend = () => {
      console.log('Recognition Stopped');
      // If we got a result, handleSpeechResult manages the next step
      if (gotResult) return;

      // If assistant is inactive or we're processing/speaking, don't restart
      if (!isActiveRef.current) return;

      // Always auto-restart if assistant is still active (handles network recovery)
      scheduleRestart();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSpeechResult, scheduleRestart]);

  // ── Wake word passive listener ──
  const stopWakeWordListening = useCallback(() => {
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.onresult = null;
        wakeWordRecognitionRef.current.onerror = null;
        wakeWordRecognitionRef.current.onend = null;
        wakeWordRecognitionRef.current.onstart = null;
        wakeWordRecognitionRef.current.stop();
        wakeWordRecognitionRef.current.abort();
      } catch {}
      wakeWordRecognitionRef.current = null;
    }
    wakeWordActiveRef.current = false;
    setIsWakeWordListening(false);
  }, []);

  const startWakeWordListening = useCallback(() => {
    // Never run while the active conversation is in progress
    if (isActiveRef.current) return;

    // Prevent duplicate passive listeners
    if (wakeWordActiveRef.current) return;

    // Clean up previous instance if any
    stopWakeWordListening();

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    recognition.continuous = true;
    recognition.interimResults = true; // Check interim results too for faster wake word detection
    recognition.lang = 'en-US';

    let wakeWordTriggered = false; // prevent double-trigger from interim + final

    recognition.onstart = () => {
      wakeWordActiveRef.current = true;
      setIsWakeWordListening(true);
      wakeWordTriggered = false;
      console.log('[WakeWord] Passive listening started');
    };

    const activateFromWakeWord = () => {
      if (wakeWordTriggered) return;
      wakeWordTriggered = true;
      console.log('[WakeWord] WAKE WORD DETECTED — activating assistant');
      // Stop passive listener before activating
      stopWakeWordListening();
      // Activate assistant
      setIsAssistantActive(true);
      // Greet user with SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const greeting = new SpeechSynthesisUtterance('Hello. How can I help you?');
        greeting.onend = () => {
          if (isActiveRef.current) {
            silentRetryCountRef.current = 0;
            startListening();
          }
        };
        greeting.onerror = () => {
          if (isActiveRef.current) {
            silentRetryCountRef.current = 0;
            startListening();
          }
        };
        setAssistantMode('speaking');
        setStatusText('🗣 Speaking...');
        window.speechSynthesis.speak(greeting);
      } else {
        // No synthesis — go straight to listening
        startListening();
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (wakeWordTriggered) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const heard = event.results[i][0].transcript;
        // Check both interim and final results for wake word
        if (containsWakeWord(heard)) {
          activateFromWakeWord();
          return;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Don't log aborted — that's intentional cleanup
      if (event.error === 'aborted') return;
      console.log('[WakeWord] Error (will retry):', event.error);
      wakeWordActiveRef.current = false;
      setIsWakeWordListening(false);
      // Use longer delay for network errors, short delay for others
      const delay = event.error === 'network' ? 2000 : 1000;
      if (!isActiveRef.current && !wakeWordTriggered) {
        setTimeout(() => {
          if (!isActiveRef.current && !wakeWordActiveRef.current) {
            startWakeWordListening();
          }
        }, delay);
      }
    };

    recognition.onend = () => {
      console.log('[WakeWord] Passive listening ended');
      wakeWordActiveRef.current = false;
      setIsWakeWordListening(false);
      // Auto-restart if assistant is still inactive and we didn't trigger
      if (!isActiveRef.current && !wakeWordTriggered) {
        setTimeout(() => {
          if (!isActiveRef.current && !wakeWordActiveRef.current) {
            startWakeWordListening();
          }
        }, 500);
      }
    };

    wakeWordRecognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.warn('[WakeWord] Failed to start:', err);
      wakeWordActiveRef.current = false;
      setIsWakeWordListening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopWakeWordListening]);

  // ── Deactivate everything ──
  const deactivateAssistant = useCallback(() => {
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // Stop wake word recognition
    stopWakeWordListening();

    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAssistantActive(false);
    setIsExpanded(false); // collapse back to single icon
    setAssistantMode('idle');
    setTranscript('');
    setStatusText('');
    setSpokenCaption('');
    setIsProcessing(false);
    conversationRef.current = [];
    silentRetryCountRef.current = 0;
    restartScheduledRef.current = false;
  }, [stopWakeWordListening]);

  // ── Activate / deactivate on toggle ──
  useEffect(() => {
    if (isAssistantActive) {
      // Stop wake word listener — never run both simultaneously
      stopWakeWordListening();

      // Reset retry state for fresh session
      silentRetryCountRef.current = 0;
      restartScheduledRef.current = false;
      
      // RULE 5: Check if accidentally starting while speaking
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) return;

      startListening();
    } else {
      // Cleanup handled by deactivateAssistant
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssistantActive]);

  // (No auto-start of wake word on mount — mic only turns on when user clicks capsule)

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      // Stop active conversation recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch {}
      }
      // Stop passive wake word recognition
      stopWakeWordListening();
      // Stop speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──
  const handleMainToggle = useCallback(() => {
    if (isAssistantActive) {
      deactivateAssistant();
    } else if (isExpanded) {
      // Collapse back — stop wake word mic if running
      stopWakeWordListening();
      setIsExpanded(false);
    } else {
      // Expand into capsule + circle
      setIsExpanded(true);
    }
  }, [isAssistantActive, isExpanded, deactivateAssistant, stopWakeWordListening]);

  // Voice activate: start wake word listening
  const handleVoiceActivate = useCallback(() => {
    if (wakeWordActiveRef.current) {
      // Already listening — stop it
      stopWakeWordListening();
      return;
    }
    startWakeWordListening();
  }, [startWakeWordListening, stopWakeWordListening]);

  // Direct activate: immediately open assistant
  const handleDirectActivate = useCallback(() => {
    stopWakeWordListening();
    setIsExpanded(false);
    setIsAssistantActive(true);
  }, [stopWakeWordListening]);

  return (
    <>
      {/* ── Control Area (bottom-right) ── */}
      <div className="fixed bottom-4 right-4 z-50" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AnimatePresence>
          {isExpanded && !isAssistantActive && (
            <>
              {/* ── Capsule: Voice Activate (mic icon + label) ── */}
              <motion.button
                id="ai-assistant-voice"
                key="capsule"
                initial={{ opacity: 0, x: 20, scale: 0.7 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.7 }}
                transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                onClick={handleVoiceActivate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 24,
                  border: isWakeWordListening
                    ? '1.5px solid rgba(0, 229, 255, 0.7)'
                    : '1.5px solid rgba(255, 255, 255, 0.15)',
                  background: isWakeWordListening
                    ? 'rgba(0, 229, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  boxShadow: isWakeWordListening
                    ? '0 0 16px rgba(0, 229, 255, 0.25)'
                    : '0 4px 12px rgba(0, 0, 0, 0.3)',
                  transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                aria-label="Voice activate assistant"
              >
                <Mic style={{ width: 14, height: 14, color: isWakeWordListening ? '#00e5ff' : 'rgba(255,255,255,0.7)' }} />
                <span>{isWakeWordListening ? 'Say "Hey Alpha"' : 'Voice'}</span>
              </motion.button>

              {/* ── Circle: Direct Activate ── */}
              <motion.button
                id="ai-assistant-direct"
                key="circle"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, delay: 0.05, ease: [0.34, 1.56, 0.64, 1] }}
                onClick={handleDirectActivate}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #7c3aed 100%)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 229, 255, 0.3)',
                  color: '#fff',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Open assistant directly"
              >
                <Bot style={{ width: 18, height: 18 }} />
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Toggle Button ── */}
        <motion.button
          id="ai-assistant-toggle"
          onClick={handleMainToggle}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
          style={{
            background: isAssistantActive
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : isExpanded
                ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                : 'linear-gradient(135deg, #00e5ff 0%, #0077ff 100%)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={
            isAssistantActive ? 'Close AI Assistant' : isExpanded ? 'Collapse' : 'Open AI Assistant'
          }
        >
          <AnimatePresence mode="wait">
            {isAssistantActive ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : isExpanded ? (
              <motion.div
                key="collapse"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Bot className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── AI Assistant Chat & Sandbox Containers ── */}
      <AnimatePresence>
        {isAssistantActive && (
          <div className="fixed bottom-6 right-6 z-50 flex items-end gap-4 pointer-events-none">
            
            {/* ── 1. Live Circuit Sandbox Preview (Only on Landing Page or if enabled) ── */}
            {showSandbox && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="w-[28rem] h-[26rem] rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden text-white"
              >
                {/* Header */}
                <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between text-xs font-bold tracking-wider text-cyan-400 uppercase">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Live Circuit Sandbox</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono font-medium lowercase">
                    {qubitCount} qubits, {gates.length} gates
                  </span>
                </div>

                {/* SVG Canvas Renderer */}
                <div className="flex-1 overflow-auto p-4 bg-black/40 flex items-center justify-center min-h-[140px]">
                  {gates.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs py-8">
                      <p>Workspace is empty</p>
                      <p className="text-[10px] opacity-70 mt-1">Ask Alpha to "create a Bell state"</p>
                    </div>
                  ) : (
                    <svg
                      width={Math.max(380, 40 * (gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0) + 80)}
                      height={35 * qubitCount + 30}
                      className="max-w-full"
                    >
                      {/* Render Qubit Wires */}
                      {Array.from({ length: qubitCount }).map((_, q) => {
                        const y = 25 + q * 35;
                        return (
                          <g key={q}>
                            <line
                              x1={20}
                              y1={y}
                              x2={Math.max(360, 40 * (gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0) + 60)}
                              y2={y}
                              stroke="rgba(255,255,255,0.15)"
                              strokeWidth={1.5}
                            />
                            <text
                              x={10}
                              y={y + 4}
                              fill="rgba(255,255,255,0.4)"
                              fontSize={9}
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              q{q}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render Gates */}
                      {[...gates].sort((a, b) => a.position - b.position).map((gate) => {
                        const x = 50 + gate.position * 40;
                        const y = 25 + gate.qubit * 35;

                        if (gate.type === 'CNOT') {
                          const targetY = 25 + (gate.targetQubit ?? (gate.qubit + 1) % qubitCount) * 35;
                          return (
                            <g key={gate.id}>
                              <line
                                x1={x}
                                y1={y}
                                x2={x}
                                y2={targetY}
                                stroke="#00e5ff"
                                strokeWidth={1.5}
                                strokeDasharray="3,3"
                              />
                              <circle cx={x} cy={y} r={3.5} fill="#00e5ff" />
                              <circle cx={x} cy={targetY} r={7} fill="none" stroke="#00e5ff" strokeWidth={1.5} />
                              <line x1={x - 7} y1={targetY} x2={x + 7} y2={targetY} stroke="#00e5ff" strokeWidth={1.2} />
                              <line x1={x} y1={targetY - 7} x2={x} y2={targetY + 7} stroke="#00e5ff" strokeWidth={1.2} />
                            </g>
                          );
                        }

                        if (gate.type === 'CZ') {
                          const targetY = 25 + (gate.targetQubit ?? (gate.qubit + 1) % qubitCount) * 35;
                          return (
                            <g key={gate.id}>
                              <line
                                x1={x}
                                y1={y}
                                x2={x}
                                y2={targetY}
                                stroke="#7c3aed"
                                strokeWidth={1.5}
                              />
                              <circle cx={x} cy={y} r={4} fill="#7c3aed" />
                              <circle cx={x} cy={targetY} r={4} fill="#7c3aed" />
                            </g>
                          );
                        }

                        if (gate.type === 'SWAP') {
                          const targetY = 25 + (gate.targetQubit ?? (gate.qubit + 1) % qubitCount) * 35;
                          return (
                            <g key={gate.id}>
                              <line
                                x1={x}
                                y1={y}
                                x2={x}
                                y2={targetY}
                                stroke="#ec4899"
                                strokeWidth={1.5}
                              />
                              <path d={`M ${x-3} ${y-3} L ${x+3} ${y+3} M ${x+3} ${y-3} L ${x-3} ${y+3}`} stroke="#ec4899" strokeWidth={1.2} />
                              <path d={`M ${x-3} ${targetY-3} L ${x+3} ${targetY+3} M ${x+3} ${targetY-3} L ${x-3} ${targetY+3}`} stroke="#ec4899" strokeWidth={1.2} />
                            </g>
                          );
                        }

                        // Single qubit gates
                        return (
                          <g key={gate.id}>
                            <rect
                              x={x - 12}
                              y={y - 12}
                              width={24}
                              height={24}
                              rx={3}
                              fill="rgba(15, 23, 42, 0.95)"
                              stroke={gate.type === 'H' ? '#00e5ff' : gate.type === 'M' ? '#10b981' : '#f59e0b'}
                              strokeWidth={1.5}
                            />
                            <text
                              x={x}
                              y={y + 3}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize={8}
                              fontWeight="bold"
                              fontFamily="sans-serif"
                            >
                              {gate.type}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>

                {/* Simulation Output Area */}
                <div className="p-3.5 border-t border-white/5 bg-white/[0.02] space-y-2">
                  {simulationResult ? (
                    <>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                        <span>Simulation Probabilities</span>
                        <span className="text-cyan-400">fidel={simulationResult.metadata?.isExact ? '100% exact' : 'approx'}</span>
                      </div>
                      <div className="space-y-1.5 max-h-[70px] overflow-y-auto pr-1">
                        {simulationResult.probabilities?.slice(0, 3).map((p, idx) => (
                          <div key={idx} className="flex items-center text-[10px]">
                            <span className="font-mono text-cyan-300 w-8">{p.state}</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden mx-2 border border-white/5">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                                style={{ width: `${p.probability * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-gray-400 w-8 text-right">{(p.probability * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-gray-400">Simulation outdated or unrun.</span>
                      <button
                        onClick={() => simulate()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-[10px] shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        Run Simulation
                      </button>
                    </div>
                  )}

                  {/* Redirection link */}
                  {window.location.pathname === '/' && (
                    <button
                      onClick={() => navigate('/builder')}
                      className="w-full mt-1.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-[10px] text-cyan-300 font-bold transition-all text-center cursor-pointer"
                    >
                      Open in Full Visual Builder Workspace
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── 2. AI Chat Panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-96 h-[26rem] rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden text-white"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase">Alpha Copilot</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Speaker Mute/Unmute */}
                  <button
                    onClick={() => setSpeakResponses(!speakResponses)}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title={speakResponses ? 'Mute AI speech responses' : 'Unmute AI speech responses'}
                  >
                    {speakResponses ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  {/* Sandbox Toggle */}
                  <button
                    onClick={() => setShowSandbox(!showSandbox)}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                      showSandbox
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                        : 'border-white/10 bg-white/5 text-gray-400'
                    }`}
                    title="Toggle Circuit Sandbox Panel"
                  >
                    Sandbox
                  </button>

                  {/* Close Assistant */}
                  <button
                    onClick={() => deactivateAssistant()}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Avatar State Container */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-black/30 border-b border-white/5 relative">
                <AICharacter2D state={characterState} size={90} />
                
                {/* Voice mode caption subtitles */}
                {assistantMode === 'speaking' && spokenCaption && (
                  <p className="text-[10px] text-cyan-300 italic text-center max-w-[90%] truncate mt-1">
                    "{spokenCaption}"
                  </p>
                )}
                {assistantMode !== 'speaking' && transcript && (
                  <p className="text-[10px] text-gray-400 italic text-center max-w-[90%] truncate mt-1">
                    "{transcript}"
                  </p>
                )}
              </div>

              {/* Messages History List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-md border ${
                        msg.role === 'user'
                          ? 'bg-cyan-500/10 text-cyan-200 border-cyan-500/20'
                          : 'bg-white/5 text-gray-200 border-white/5'
                      }`}
                    >
                      <p className="margin-0 leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {/* AI Thinking/Typing Indicator */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 text-gray-400 border border-white/5 rounded-2xl px-3.5 py-2 text-xs flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Footer Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inputText.trim()) return;
                  handleTextSubmit(inputText);
                  setInputText('');
                }}
                className="p-3 border-t border-white/5 bg-white/[0.02] flex items-center gap-2"
              >
                {/* Voice Mic Input */}
                <button
                  type="button"
                  onClick={() => {
                    if (assistantMode === 'listening') {
                      deactivateAssistant();
                    } else {
                      stopWakeWordListening();
                      setIsExpanded(false);
                      setIsAssistantActive(true);
                      startListening();
                    }
                  }}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    assistantMode === 'listening'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                  title={assistantMode === 'listening' ? 'Stop listening' : 'Start voice request'}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Input Text Box */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask Alpha to build a circuit..."
                  disabled={isProcessing}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs outline-none text-white placeholder-gray-400"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isProcessing || !inputText.trim()}
                  className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </>
  );
};

