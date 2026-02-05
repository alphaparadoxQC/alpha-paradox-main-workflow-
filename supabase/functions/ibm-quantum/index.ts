import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Gate type definitions
interface QuantumGate {
  id: string;
  type: string;
  qubit: number;
  position: number;
  controlQubit?: number;
  targetQubit?: number;
  controlQubit2?: number;
  angle?: number;
}

interface CircuitRequest {
  gates: QuantumGate[];
  qubitCount: number;
  shots?: number;
  backendName?: string;
}

// Convert circuit to OpenQASM 2.0 format
function circuitToOpenQASM(gates: QuantumGate[], qubitCount: number): string {
  const lines: string[] = [
    "OPENQASM 2.0;",
    'include "qelib1.inc";',
    "",
    `qreg q[${qubitCount}];`,
    `creg c[${qubitCount}];`,
    "",
  ];

  // Sort gates by position to maintain order
  const sortedGates = [...gates].sort((a, b) => a.position - b.position);

  for (const gate of sortedGates) {
    switch (gate.type) {
      case "H":
        lines.push(`h q[${gate.qubit}];`);
        break;
      case "X":
        lines.push(`x q[${gate.qubit}];`);
        break;
      case "Y":
        lines.push(`y q[${gate.qubit}];`);
        break;
      case "Z":
        lines.push(`z q[${gate.qubit}];`);
        break;
      case "S":
        lines.push(`s q[${gate.qubit}];`);
        break;
      case "T":
        lines.push(`t q[${gate.qubit}];`);
        break;
      case "CNOT":
        if (gate.controlQubit !== undefined) {
          lines.push(`cx q[${gate.controlQubit}], q[${gate.qubit}];`);
        }
        break;
      case "CZ":
        if (gate.controlQubit !== undefined) {
          lines.push(`cz q[${gate.controlQubit}], q[${gate.qubit}];`);
        }
        break;
      case "SWAP":
        if (gate.targetQubit !== undefined) {
          lines.push(`swap q[${gate.qubit}], q[${gate.targetQubit}];`);
        }
        break;
      case "CCX":
        if (gate.controlQubit !== undefined && gate.controlQubit2 !== undefined) {
          lines.push(`ccx q[${gate.controlQubit}], q[${gate.controlQubit2}], q[${gate.qubit}];`);
        }
        break;
      case "Rx":
        const rxAngle = gate.angle ?? Math.PI / 2;
        lines.push(`rx(${rxAngle}) q[${gate.qubit}];`);
        break;
      case "Ry":
        const ryAngle = gate.angle ?? Math.PI / 2;
        lines.push(`ry(${ryAngle}) q[${gate.qubit}];`);
        break;
      case "Rz":
        const rzAngle = gate.angle ?? Math.PI / 2;
        lines.push(`rz(${rzAngle}) q[${gate.qubit}];`);
        break;
      case "M":
        lines.push(`measure q[${gate.qubit}] -> c[${gate.qubit}];`);
        break;
    }
  }

  // Add final measurement for all qubits if no explicit measurements
  const hasMeasurement = gates.some((g) => g.type === "M");
  if (!hasMeasurement) {
    lines.push("");
    for (let i = 0; i < qubitCount; i++) {
      lines.push(`measure q[${i}] -> c[${i}];`);
    }
  }

  return lines.join("\n");
}

// IBM Quantum API helpers
const IBM_API_BASE = "https://api.quantum-computing.ibm.com/runtime";

async function getAvailableBackends(token: string): Promise<any[]> {
  console.log("[IBM Quantum] Fetching available backends...");
  
  const response = await fetch(`${IBM_API_BASE}/backends`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[IBM Quantum] Failed to fetch backends:", errorText);
    throw new Error(`Failed to fetch backends: ${response.status} - ${errorText}`);
  }

  const backends = await response.json();
  console.log(`[IBM Quantum] Found ${backends.length} backends`);
  return backends;
}

function selectLeastBusyBackend(backends: any[], qubitCount: number): any {
  // Filter backends that:
  // 1. Are operational
  // 2. Have enough qubits
  // 3. Are simulators or real devices (prefer real for small circuits)
  const suitableBackends = backends.filter((b: any) => {
    const isOperational = b.status === "online" || b.is_simulator;
    const hasEnoughQubits = (b.num_qubits || b.n_qubits || 127) >= qubitCount;
    return isOperational && hasEnoughQubits;
  });

  if (suitableBackends.length === 0) {
    throw new Error(`No suitable backend found for ${qubitCount} qubits`);
  }

  // Sort by pending jobs (least busy first)
  suitableBackends.sort((a: any, b: any) => {
    const aJobs = a.pending_jobs || 0;
    const bJobs = b.pending_jobs || 0;
    return aJobs - bJobs;
  });

  const selected = suitableBackends[0];
  console.log(`[IBM Quantum] Selected backend: ${selected.name} (pending jobs: ${selected.pending_jobs || 0})`);
  return selected;
}

async function submitJob(
  token: string,
  backendName: string,
  qasm: string,
  shots: number
): Promise<{ jobId: string; status: string }> {
  console.log(`[IBM Quantum] Submitting job to ${backendName} with ${shots} shots`);

  // IBM Quantum Runtime API job submission
  const response = await fetch(`${IBM_API_BASE}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      program_id: "sampler",
      backend: backendName,
      params: {
        circuits: [qasm],
        shots: shots,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[IBM Quantum] Job submission failed:", errorText);
    throw new Error(`Job submission failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`[IBM Quantum] Job submitted successfully: ${result.id}`);
  
  return {
    jobId: result.id,
    status: result.status || "queued",
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("[IBM Quantum] Auth failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`[IBM Quantum] Authenticated user: ${userId}`);

    // Parse request body
    const body: CircuitRequest = await req.json();
    const { gates, qubitCount, shots = 1024, backendName } = body;

    if (!gates || !Array.isArray(gates)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: gates array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!qubitCount || qubitCount < 1 || qubitCount > 127) {
      return new Response(
        JSON.stringify({ error: "Invalid request: qubitCount must be between 1 and 127" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IBM Quantum API token
    const ibmToken = Deno.env.get("IBM_QUANTUM_API_TOKEN");
    if (!ibmToken) {
      console.error("[IBM Quantum] API token not configured");
      return new Response(
        JSON.stringify({ error: "IBM Quantum API token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert circuit to OpenQASM
    const qasm = circuitToOpenQASM(gates, qubitCount);
    console.log("[IBM Quantum] Generated OpenQASM:", qasm);

    // Get available backends
    const backends = await getAvailableBackends(ibmToken);

    // Select backend (user-specified or least busy)
    let selectedBackend: any;
    if (backendName) {
      selectedBackend = backends.find((b: any) => b.name === backendName);
      if (!selectedBackend) {
        return new Response(
          JSON.stringify({ 
            error: `Backend "${backendName}" not found`,
            availableBackends: backends.map((b: any) => b.name)
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      selectedBackend = selectLeastBusyBackend(backends, qubitCount);
    }

    // Submit job
    const jobResult = await submitJob(ibmToken, selectedBackend.name, qasm, shots);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobResult.jobId,
        status: jobResult.status,
        backend: selectedBackend.name,
        qubitCount,
        shots,
        qasm,
        submittedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[IBM Quantum] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
