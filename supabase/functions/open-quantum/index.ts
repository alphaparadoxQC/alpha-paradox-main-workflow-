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
    'include "qelib1.inc";',
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

// qBraid REST API - free quantum computing access
const QBRAID_API_BASE = "https://api.qbraid.com/api";

// Map our backend names to qBraid device IDs
function mapBackendToQbraidDevice(backendName?: string): string {
  const mapping: Record<string, string> = {
    "ionq:harmony": "ionq_harmony",
    "ionq:aria": "ionq_aria_1",
    "rigetti:ankaa-3": "rigetti_ankaa_3",
    "ibm:brisbane": "ibm_brisbane",
    "qbraid-simulator": "qbraid_qir_simulator",
  };
  if (backendName && mapping[backendName]) return mapping[backendName];
  // Default to qBraid's free QIR simulator for reliable execution
  return "qbraid_qir_simulator";
}

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

    // Get API key (stored as OPEN_QUANTUM_API_KEY but used for qBraid)
    const apiKey = Deno.env.get("OPEN_QUANTUM_API_KEY");
    if (!apiKey) {
      console.error("[Open Quantum] API key not configured");
      return new Response(
        JSON.stringify({
          error: "Open Quantum API key not configured. Sign up free at qbraid.com",
          setupUrl: "https://account.qbraid.com/",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate QASM
    const qasm = circuitToOpenQASM(gates, qubitCount);
    console.log("[Open Quantum] Generated OpenQASM:\n", qasm);

    // Map backend
    const deviceId = mapBackendToQbraidDevice(backendName);
    console.log(`[Open Quantum] Submitting to qBraid device: ${deviceId} with ${shots} shots`);

    // Submit job via qBraid REST API
    const response = await fetch(`${QBRAID_API_BASE}/quantum-jobs`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qbraidDeviceId: deviceId,
        openQasm: qasm,
        circuitNumQubits: qubitCount,
        shots: shots,
        tags: { source: "alpha-paradoxqc" },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("[Open Quantum] qBraid job submission failed:", response.status, responseText);
      return new Response(
        JSON.stringify({
          error: `Submission failed (${response.status})`,
          details: responseText,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { rawResponse: responseText };
    }

    const jobId = (result.qbraidJobId || result.jobId || result.id || `oq-${Date.now()}`) as string;
    console.log(`[Open Quantum] Job submitted successfully: ${jobId}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status: (result.status as string) || "queued",
        backend: deviceId,
        qubitCount,
        shots,
        qasm,
        provider: "qBraid (Open Quantum)",
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
