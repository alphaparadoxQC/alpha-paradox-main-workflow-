import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Open Quantum API endpoints ──
const KEYCLOAK_BASE = "https://id.openquantum.com";
const KEYCLOAK_REALM = "platform";
const MANAGEMENT_API = "https://management.openquantum.com";
const SCHEDULER_API = "https://scheduler.openquantum.com";

// ── Types ──
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

interface StatusRequest {
  action: "status";
  jobId: string;
  qubitCount: number;
}

// ── Convert circuit to OpenQASM 2.0 ──
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

  const hasMeasurement = gates.some((g) => g.type === "M");
  if (!hasMeasurement) {
    lines.push("");
    for (let i = 0; i < qubitCount; i++) {
      lines.push(`measure q[${i}] -> c[${i}];`);
    }
  }

  return lines.join("\n");
}

// ── Map backend names to Open Quantum short codes ──
function mapBackendToShortCode(backendName?: string): string {
  const mapping: Record<string, string> = {
    "ionq:aria": "ionq:aria-1",
    "ionq:forte": "ionq:forte-1",
    "rigetti:ankaa-3": "rigetti:ankaa-3",
    "iqm:emerald": "iqm:emerald",
    "iqm:garnet": "iqm:garnet",
  };
  if (backendName && mapping[backendName]) return mapping[backendName];
  return "rigetti:ankaa-3";
}

// ── Keycloak OAuth2 client credentials ──
async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = `${KEYCLOAK_BASE}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Keycloak auth failed (${resp.status}): ${text}`);
  }

  const data = JSON.parse(text);
  if (!data.access_token) {
    throw new Error("Keycloak response missing access_token");
  }

  return data.access_token;
}

// ── Helper: authenticated request ──
async function apiRequest(
  baseUrl: string,
  endpoint: string,
  token: string,
  options: { method?: string; body?: unknown; params?: Record<string, string> } = {}
): Promise<Record<string, unknown>> {
  const { method = "GET", body, params } = options;
  let url = `${baseUrl}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`API ${method} ${endpoint} failed (${resp.status}): ${text}`);
  }

  return resp.status === 204 ? {} : JSON.parse(text);
}

// ── Map Open Quantum status to our status ──
function mapStatus(oqStatus: string): string {
  const statusMap: Record<string, string> = {
    "Pending": "queued",
    "Queued": "queued",
    "Running": "running",
    "Completed": "completed",
    "Failed": "failed",
    "Cancelled": "cancelled",
  };
  return statusMap[oqStatus] || "queued";
}

// ── Parse measurement results into probabilities ──
function parseResults(
  resultsData: Record<string, unknown> | null,
  qubitCount: number
): { state: string; probability: number }[] | null {
  if (!resultsData) return null;

  // Open Quantum returns measurement counts like {"00": 512, "11": 512}
  const counts = (resultsData.measurement_counts || resultsData.counts || resultsData) as Record<string, number>;
  if (!counts || typeof counts !== "object") return null;

  const totalShots = Object.values(counts).reduce((sum: number, c: number) => sum + c, 0);
  if (totalShots === 0) return null;

  const probabilities: { state: string; probability: number }[] = [];
  for (const [state, count] of Object.entries(counts)) {
    probabilities.push({
      state: state.padStart(qubitCount, "0"),
      probability: (count as number) / totalShots,
    });
  }

  return probabilities.sort((a, b) => b.probability - a.probability);
}

// ── Handle status check ──
async function handleStatusCheck(
  jobId: string,
  qubitCount: number,
  accessToken: string
): Promise<Response> {
  console.log(`[Open Quantum] Checking status for job: ${jobId}`);

  const jobData = await apiRequest(SCHEDULER_API, `/v1/jobs/${jobId}`, accessToken);
  const oqStatus = jobData.status as string;
  const mappedStatus = mapStatus(oqStatus);

  console.log(`[Open Quantum] Job ${jobId} status: ${oqStatus} -> ${mappedStatus}`);

  const response: Record<string, unknown> = {
    status: mappedStatus,
    queuePosition: jobData.queue_position ?? null,
    startedAt: jobData.started_at ?? null,
    completedAt: jobData.completed_at ?? null,
    errorMessage: jobData.error_message ?? null,
  };

  // If completed, try to get results
  if (mappedStatus === "completed") {
    // Try to fetch results
    try {
      const resultsData = await apiRequest(SCHEDULER_API, `/v1/jobs/${jobId}/results`, accessToken);
      const probabilities = parseResults(resultsData, qubitCount);
      if (probabilities) {
        response.probabilities = probabilities;
      }
    } catch (err) {
      console.warn(`[Open Quantum] Could not fetch results for ${jobId}:`, err);
      // Results may be embedded in the job data
      if (jobData.results) {
        const probabilities = parseResults(jobData.results as Record<string, unknown>, qubitCount);
        if (probabilities) {
          response.probabilities = probabilities;
        }
      }
    }
  }

  return new Response(
    JSON.stringify(response),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
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

    // ── Authenticate user via Supabase ──
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

    // ── Get Open Quantum credentials ──
    const clientId = Deno.env.get("OPENQUANTUM_CLIENT_ID");
    const clientSecret = Deno.env.get("OPENQUANTUM_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          error: "Open Quantum credentials not configured.",
          setupUrl: "https://www.openquantum.com/keys",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Authenticate with Keycloak ──
    const accessToken = await getAccessToken(clientId, clientSecret);

    // ── Parse request ──
    const body = await req.json();

    // ── Route: status check ──
    if (body.action === "status") {
      return await handleStatusCheck(body.jobId, body.qubitCount || 5, accessToken);
    }

    // ── Route: submit job ──
    console.log(`[Open Quantum] Authenticated user: ${user.id}`);

    const { gates, qubitCount, shots = 100, backendName } = body as CircuitRequest;

    if (!gates || !Array.isArray(gates)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: gates array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Get organization ──
    const orgsData = await apiRequest(MANAGEMENT_API, "/v1/users/organizations", accessToken);
    const organizations = orgsData.organizations as Array<{ id: string; name: string }>;
    if (!organizations || organizations.length === 0) {
      throw new Error("No organizations found for this account");
    }
    const orgId = organizations[0].id;
    console.log(`[Open Quantum] Using org: ${organizations[0].name} (${orgId})`);

    // ── Step 2: Generate QASM ──
    const qasm = circuitToOpenQASM(gates, qubitCount);
    console.log("[Open Quantum] Generated OpenQASM:\n", qasm);

    // ── Step 3: Upload QASM ──
    const uploadData = await apiRequest(SCHEDULER_API, "/v1/jobs/upload", accessToken, {
      method: "POST",
    });
    const uploadId = (uploadData as { id: string; url: string }).id;
    const uploadUrl = (uploadData as { id: string; url: string }).url;

    const uploadResp = await fetch(uploadUrl, {
      method: "PUT",
      body: new TextEncoder().encode(qasm),
    });
    if (!uploadResp.ok) {
      const uploadErr = await uploadResp.text();
      throw new Error(`QASM upload failed (${uploadResp.status}): ${uploadErr}`);
    }
    console.log("[Open Quantum] QASM uploaded successfully");

    // ── Step 4: Prepare job ──
    const backendShortCode = mapBackendToShortCode(backendName);
    console.log(`[Open Quantum] Preparing job on backend: ${backendShortCode}, shots: ${shots}`);

    const prepData = await apiRequest(SCHEDULER_API, "/v1/jobs/prepare", accessToken, {
      method: "POST",
      body: {
        organization_id: orgId,
        backend_class_id: backendShortCode,
        name: `ParadoxQC Circuit - ${new Date().toISOString()}`,
        upload_endpoint_id: uploadId,
        job_subcategory_id: "oth:oth",
        shots,
        configuration_data: {},
      },
    });
    const preparationId = (prepData as { id: string }).id;
    console.log(`[Open Quantum] Job preparation created: ${preparationId}`);

    // ── Step 5: Poll preparation until quote is ready ──
    let prepResult: Record<string, unknown> | null = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const result = await apiRequest(
        SCHEDULER_API,
        `/v1/jobs/prepare/${preparationId}`,
        accessToken
      );
      const status = result.status as string;
      console.log(`[Open Quantum] Preparation status: ${status}`);

      if (status === "Completed") {
        prepResult = result;
        break;
      }
      if (status === "Failed") {
        throw new Error(`Job preparation failed: ${result.message || "Unknown error"}`);
      }
    }

    if (!prepResult) {
      throw new Error("Job preparation timed out after 60 seconds");
    }

    // ── Step 6: Select cheapest execution plan ──
    const quote = prepResult.quote as Array<{
      name: string;
      price: number;
      execution_plan_id: string;
      queue_priorities: Array<{
        name: string;
        price_increase: number;
        queue_priority_id: string;
      }>;
    }>;

    if (!quote || quote.length === 0) {
      throw new Error("No execution plans available in quote");
    }

    const cheapestPlan = quote.reduce((min, p) => (p.price < min.price ? p : min), quote[0]);
    const cheapestPriority = cheapestPlan.queue_priorities.reduce(
      (min, q) => (q.price_increase < min.price_increase ? q : min),
      cheapestPlan.queue_priorities[0]
    );

    console.log(
      `[Open Quantum] Selected plan: ${cheapestPlan.name} (${cheapestPlan.price} credits), priority: ${cheapestPriority.name}`
    );

    // ── Step 7: Create the job ──
    const jobData = await apiRequest(SCHEDULER_API, "/v1/jobs", accessToken, {
      method: "POST",
      body: {
        organization_id: orgId,
        job_preparation_id: preparationId,
        execution_plan_id: cheapestPlan.execution_plan_id,
        queue_priority_id: cheapestPriority.queue_priority_id,
      },
    });

    const jobId = (jobData as { id: string }).id;
    const jobStatus = (jobData as { status: string }).status;
    console.log(`[Open Quantum] Job created: ${jobId}, status: ${jobStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status: jobStatus || "submitted",
        backend: backendShortCode,
        qubitCount,
        shots,
        qasm,
        provider: "Open Quantum (openquantum.com)",
        organizationId: orgId,
        executionPlan: cheapestPlan.name,
        creditsUsed: cheapestPlan.price + cheapestPriority.price_increase,
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
