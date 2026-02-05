import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are a quantum computing expert assistant integrated into Quantum Workload, a quantum circuit builder application. Your role is to:

1. EXPLAIN quantum computing concepts in clear, accessible language
2. GUIDE users on how to build quantum circuits
3. TEACH about quantum gates and their effects
4. HELP debug circuit issues and interpret simulation results
5. PROVIDE examples of quantum algorithms

Key quantum gates you should know:
- H (Hadamard): Creates superposition
- X (Pauli-X): Bit flip (NOT)
- Y (Pauli-Y): Bit + phase flip
- Z (Pauli-Z): Phase flip
- CNOT: Controlled-NOT, creates entanglement
- SWAP: Swaps two qubits
- CZ: Controlled-Z
- CCX (Toffoli): Double-controlled NOT
- Rx, Ry, Rz: Parametric rotation gates
- S, T: Phase gates
- M: Measurement

When explaining circuits:
- Reference the user's current circuit context if provided
- Suggest specific gates to add or modify
- Explain the expected outcomes

Be concise but thorough. Use quantum notation like |0⟩, |1⟩, |+⟩, |-⟩ when appropriate.
Use markdown formatting for code blocks and emphasis.`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  message: string;
  conversationHistory?: Message[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Accept both GET and POST
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Lovable API key
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("[Quantum Assistant] API key not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    let body: RequestBody;
    if (req.method === "POST") {
      body = await req.json();
    } else {
      return new Response(
        JSON.stringify({ error: "Please use POST with a message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Quantum Assistant] Processing message: ${message.substring(0, 100)}...`);

    // Build messages array
    const messages: Message[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    // Call Lovable AI
    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[Quantum Assistant] AI error:", errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || "I couldn't generate a response.";

    console.log(`[Quantum Assistant] Response generated (${responseContent.length} chars)`);

    return new Response(
      JSON.stringify({ 
        response: responseContent,
        model: "google/gemini-3-flash-preview",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Quantum Assistant] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
