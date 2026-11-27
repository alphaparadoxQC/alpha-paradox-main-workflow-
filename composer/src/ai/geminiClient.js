/**
 * Gemini API Client
 * =================
 * Lightweight wrapper for Google's Gemini Flash API.
 * Uses the REST endpoint directly — no SDK dependency needed.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Send a message to the Gemini API and get a response.
 * @param {string} apiKey - The Gemini API key
 * @param {Array} conversationHistory - Array of { role: 'user'|'model', parts: [{ text }] }
 * @param {string} systemPrompt - The system instruction
 * @returns {Promise<string>} The AI's response text
 */
export async function sendToGemini(apiKey, conversationHistory, systemPrompt) {
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || response.statusText;
    throw new Error(`Gemini API error: ${errorMessage}`);
  }

  const data = await response.json();
  
  // Extract the text from the response
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }
  
  return text;
}

/**
 * Stream a response from the Gemini API (for typing effect).
 * Falls back to non-streaming if streaming fails.
 * @param {string} apiKey 
 * @param {Array} conversationHistory 
 * @param {string} systemPrompt 
 * @param {function} onChunk - Callback called with each text chunk
 * @returns {Promise<string>} The full response text
 */
export async function streamFromGemini(apiKey, conversationHistory, systemPrompt, onChunk) {
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const STREAM_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent';

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  };

  try {
    const response = await fetch(`${STREAM_URL}?key=${apiKey}&alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Fall back to non-streaming
      return await sendToGemini(apiKey, conversationHistory, systemPrompt);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunk) {
              fullText += chunk;
              onChunk(chunk);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    }

    return fullText || 'I received your message but could not generate a response. Please try again.';
  } catch (err) {
    // Fall back to non-streaming on any error
    console.warn('Streaming failed, falling back to standard request:', err);
    const text = await sendToGemini(apiKey, conversationHistory, systemPrompt);
    onChunk(text);
    return text;
  }
}
