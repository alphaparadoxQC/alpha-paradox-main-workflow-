import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface QuantumGate {
  id: string;
  type: string;
  qubit: number;
  position: number;
  controlQubit?: number;
  targetQubit?: number;
  angle?: number;
}

interface CircuitRequest {
  gates: QuantumGate[];
  qubitCount: number;
  shots?: number;
  backendName?: string;
}

// Convert circuit to OpenQASM 2.0
function circuitToOpenQASM(gates: QuantumGate[], qubitCount: number): string {
  const lines: string[] = [
    "OPENQASM 2.0;",
    "include \"qelib1.inc\";",
    "",
    `qreg q[${qubitCount}];`,
    `creg c[${qubitCount}];`,
    "",
  ];

  const sortedGates = [...gates].sort((a, b) => a.position - b.position);

  for (const gate of sortedGates) {
    switch (gate.type) {
      case "H": lines.push(`h q[${gate.qubit}];`); break;
      case "X": lines.push(`x q[${gate.qubit}];`); break;
      case "Y": lines.push(`y q[${gate.qubit}];`); break;
      case "Z": lines.push(`z q[${gate.qubit}];`); break;
      case "S": lines.push(`s q[${gate.qubit}];`); break;
      case "T": lines.push(`t q[${gate.qubit}];`); break;
      case "CNOT":
        if (gate.controlQubit !== undefined && gate.targetQubit !== undefined) {
          lines.push(`cx q[${gate.controlQubit}], q[${gate.targetQubit}];`);
        }
        break;
      case "CZ":
        if (gate.controlQubit !== undefined && gate.targetQubit !== undefined) {
          lines.push(`cz q[${gate.controlQubit}], q[${gate.targetQubit}];`);
        }
        break;
      case "SWAP":
        if (gate.targetQubit !== undefined) {
          lines.push(`swap q[${gate.qubit}], q[${gate.targetQubit}];`);
        }
        break;
      case "Rx":
        lines.push(`rx(${gate.angle ?? Math.PI / 2}) q[${gate.qubit}];`);
        break;
      case "Ry":
        lines.push(`ry(${gate.angle ?? Math.PI / 2}) q[${gate.qubit}];`);
        break;
      case "Rz":
        lines.push(`rz(${gate.angle ?? Math.PI / 2}) q[${gate.qubit}];`);
        break;
      case "M":
        lines.push(`measure q[${gate.qubit}] -> c[${gate.qubit}];`);
        break;
    }
  }

  // Add measurement if none explicit
  const hasMeasurement = gates.some((g) => g.type === "M");
  if (!hasMeasurement) {
    lines.push("");
    for (let i = 0; i < qubitCount; i++) {
      lines.push(`measure q[${i}] -> c[${i}];`);
    }
  }

  return lines.join("\n");
}

// Open Quantum API base
const OQ_API_BASE = "https://api.openquantum.com/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user via Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Open Quantum] Authenticated user: ${user.id}`);

    // Parse request
    const body: CircuitRequest = await req.json();
    const { gates, qubitCount, shots = 1024, backendName } = body;

    if (!gates || !Array.isArray(gates)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: gates array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Open Quantum API key
    const oqApiKey = Deno.env.get("OPEN_QUANTUM_API_KEY");
    if (!oqApiKey) {
      console.error("[Open Quantum] API key not configured");
      return new Response(
        JSON.stringify({ 
          error: "Open Quantum API key not configured. Sign up free at openquantum.com",
          setupUrl: "https://www.openquantum.com/"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate QASM
    const qasm = circuitToOpenQASM(gates, qubitCount);
    console.log("[Open Quantum] Generated OpenQASM:", qasm);

    // Submit job to Open Quantum API
    const selectedBackend = backendName || "rigetti:ankaa-3";
    console.log(`[Open Quantum] Submitting to ${selectedBackend} with ${shots} shots`);

    const response = await fetch(`${OQ_API_BASE}/jobs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${oqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        backend: selectedBackend,
        qasm: qasm,
        shots: shots,
        name: `Alpha-ParadoxQC-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Open Quantum] Job submission failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Open Quantum submission failed: ${response.status}`,
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log(`[Open Quantum] Job submitted: ${result.id || result.job_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: result.id || result.job_id || `oq-${Date.now()}`,
        status: result.status || "queued",
        backend: selectedBackend,
        qubitCount,
        shots,
        qasm,
        provider: "Open Quantum",
        submittedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Open Quantum] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
