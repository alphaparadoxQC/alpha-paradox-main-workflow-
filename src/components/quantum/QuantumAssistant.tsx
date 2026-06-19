import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Mic, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
// Conversation history for multi-turn
// ─────────────────────────────────────────────
interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export const QuantumAssistant = () => {
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

  // ── Refs ──
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wakeWordRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wakeWordActiveRef = useRef(false); // true when passive listener is running
  const conversationRef = useRef<ConversationEntry[]>([]);
  const isActiveRef = useRef(false); // mirrors isAssistantActive for async callbacks
  const speechInterruptedRef = useRef(false); // prevents cancelled utterance callbacks from looping

  const { session } = useAuth();
  const { gates, qubitCount, simulationResult } = useQuantumCircuitStore();

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

  // ── Send to backend (unchanged API) ──
  const sendToBackend = useCallback(
    async (text: string) => {
      setIsProcessing(true);
      setStatusText('🧠 Thinking...');

      try {
        // Build global context
        let contextStr = '';
        if (window.assistantContext && window.assistantContext.currentPage) {
          contextStr += `\n\nContext:\nCurrent page = ${window.assistantContext.currentPage}`;
          for (const [key, value] of Object.entries(window.assistantContext.pageData)) {
            contextStr += `\n${key} = ${value}`;
          }
        } else {
          // Fallback if no context
          contextStr = gates.length > 0
            ? `\n\nContext:\nCurrent page = quantum-builder\nQubits = ${qubitCount}\nGates = ${gates.map((g) => g.type).join(', ')}`
            : '';
        }

        conversationRef.current.push({ role: 'user', content: text });

        const finalMessage = `Question:\n${text}${contextStr}`;

        const { data, error } = await supabase.functions.invoke(
          'quantum-assistant',
          {
            body: {
              message: finalMessage,
              conversationHistory: conversationRef.current.slice(-6),
            },
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : undefined,
          }
        );

        if (error) throw error;

        const response =
          data.response ||
          "I apologize, but I couldn't process that request. Please try again.";

        conversationRef.current.push({ role: 'assistant', content: response });

        return response;
      } catch (err) {
        console.error('Assistant error:', err);
        return "I'm having trouble connecting right now. Please try again in a moment.";
      } finally {
        setIsProcessing(false);
      }
    },
    [gates, qubitCount, simulationResult, session]
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

      const response = await sendToBackend(finalText);

      if (isActiveRef.current) {
        speakResponse(response);
      }
    },
    [sendToBackend, speakResponse, speakPhrase]
  );

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

      {/* ── Floating Assistant Container ── */}
      <AnimatePresence>
        {isAssistantActive && (
          <motion.div
            id="ai-assistant-floating"
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.85 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed bottom-6 left-[40%] z-40"
            style={{
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pointerEvents: 'none',
            }}
          >
            {/* ── Character ── */}
            <div style={{ position: 'relative', pointerEvents: 'auto' }}>
              <AICharacter2D state={characterState} size={120} />
            </div>

            {/* ── Interrupt button (visible only while speaking) ── */}
            <AnimatePresence>
              {assistantMode === 'speaking' && (
                <motion.button
                  id="ai-assistant-interrupt"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={interruptSpeech}
                  style={{
                    pointerEvents: 'auto',
                    marginTop: 4,
                    padding: '4px 10px',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.8)',
                    background: 'rgba(255, 60, 60, 0.25)',
                    border: '1px solid rgba(255, 60, 60, 0.4)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    boxShadow: '0 2px 8px rgba(255, 60, 60, 0.15)',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 60, 60, 0.45)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 60, 60, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 60, 60, 0.25)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 60, 60, 0.4)';
                  }}
                  aria-label="Interrupt assistant speech"
                >
                  <Square style={{ width: 7, height: 7, fill: 'currentColor' }} />
                  Interrupt
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Status / transcript / caption below character ── */}
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                width: 320,
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* Live caption (assistant speaking — subtitle style) */}
              <AnimatePresence mode="wait">
                {assistantMode === 'speaking' && spokenCaption && (
                  <motion.div
                    key={spokenCaption}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: 10,
                      padding: '8px 16px',
                      maxWidth: 320,
                    }}
                  >
                    <p
                      style={{
                        color: 'rgba(255, 255, 255, 0.92)',
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: 1.5,
                        margin: 0,
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        wordWrap: 'break-word',
                      }}
                    >
                      {spokenCaption}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live transcript (user speaking) */}
              <AnimatePresence mode="wait">
                {assistantMode !== 'speaking' && transcript && (
                  <motion.p
                    key={transcript}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: 11,
                      fontWeight: 400,
                      lineHeight: 1.4,
                      textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    "{transcript}"
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Status indicator */}
              {statusText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {assistantMode === 'listening' && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <Mic
                        className="w-3 h-3"
                        style={{ color: '#00e5ff' }}
                      />
                    </motion.div>
                  )}
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.45)',
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    {statusText}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
