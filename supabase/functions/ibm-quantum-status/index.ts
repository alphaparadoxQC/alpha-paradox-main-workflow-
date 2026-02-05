import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IBM_API_BASE = "https://api.quantum-computing.ibm.com/runtime";

interface JobStatus {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  backend: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  queuePosition?: number;
  errorMessage?: string;
}

interface ProbabilityResult {
  state: string;
  probability: number;
}

// Parse IBM Quantum results into our probability format
function parseResults(rawResults: any, qubitCount: number): ProbabilityResult[] {
  console.log("[IBM Status] Parsing results:", JSON.stringify(rawResults));
  
  const probabilities: ProbabilityResult[] = [];
  
  // IBM Quantum returns counts like {"00": 512, "11": 512}
  if (rawResults?.quasi_dists || rawResults?.results) {
    const counts = rawResults.quasi_dists?.[0] || rawResults.results?.[0]?.data?.counts || {};
    const totalShots = Object.values(counts).reduce((sum: number, count: any) => sum + (count as number), 0);
    
    if (totalShots > 0) {
      for (const [state, count] of Object.entries(counts)) {
        // Convert hex to binary if needed, or use as-is
        let binaryState = state;
        if (state.startsWith("0x")) {
          binaryState = parseInt(state, 16).toString(2).padStart(qubitCount, "0");
        } else if (!state.match(/^[01]+$/)) {
          // If it's a number key, convert to binary
          binaryState = parseInt(state).toString(2).padStart(qubitCount, "0");
        }
        
        probabilities.push({
          state: binaryState.padStart(qubitCount, "0"),
          probability: (count as number) / totalShots,
        });
      }
    }
  }
  
  // Sort by state for consistent display
  probabilities.sort((a, b) => a.state.localeCompare(b.state));
  
  return probabilities;
}

async function getJobStatus(token: string, jobId: string): Promise<JobStatus> {
  console.log(`[IBM Status] Fetching status for job: ${jobId}`);
  
  const response = await fetch(`${IBM_API_BASE}/jobs/${jobId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[IBM Status] Failed to fetch job status:", errorText);
    throw new Error(`Failed to fetch job status: ${response.status} - ${errorText}`);
  }

  const job = await response.json();
  console.log(`[IBM Status] Job status: ${job.status}`);
  
  // Map IBM status to our format
  let status: JobStatus["status"];
  switch (job.status?.toLowerCase()) {
    case "queued":
    case "pending":
      status = "queued";
      break;
    case "running":
    case "executing":
      status = "running";
      break;
    case "completed":
    case "done":
      status = "completed";
      break;
    case "failed":
    case "error":
      status = "failed";
      break;
    case "cancelled":
    case "canceled":
      status = "cancelled";
      break;
    default:
      status = "queued";
  }

  return {
    id: job.id,
    status,
    backend: job.backend || "unknown",
    createdAt: job.created || job.creation_date || new Date().toISOString(),
    startedAt: job.started || job.start_time,
    completedAt: job.ended || job.end_time,
    queuePosition: job.position_in_queue || job.queue_position,
    errorMessage: job.error?.message || job.error_message,
  };
}

async function getJobResults(token: string, jobId: string): Promise<any> {
  console.log(`[IBM Status] Fetching results for job: ${jobId}`);
  
  const response = await fetch(`${IBM_API_BASE}/jobs/${jobId}/results`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Results might not be available yet
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    console.error("[IBM Status] Failed to fetch results:", errorText);
    throw new Error(`Failed to fetch results: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Accept both GET and POST
    if (req.method !== "GET" && req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use GET or POST." }),
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
      console.error("[IBM Status] Auth failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get job ID from query params or body
    let jobId: string | null = null;
    let qubitCount = 2; // Default, used for result parsing

    const url = new URL(req.url);
    jobId = url.searchParams.get("jobId");

    if (req.method === "POST") {
      const body = await req.json();
      jobId = body.jobId || jobId;
      qubitCount = body.qubitCount || qubitCount;
    }

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: jobId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IBM Quantum API token
    const ibmToken = Deno.env.get("IBM_QUANTUM_API_TOKEN");
    if (!ibmToken) {
      console.error("[IBM Status] API token not configured");
      return new Response(
        JSON.stringify({ error: "IBM Quantum API token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get job status
    const status = await getJobStatus(ibmToken, jobId);

    // Get results if completed
    let probabilities: ProbabilityResult[] | null = null;
    let rawResults: any = null;

    if (status.status === "completed") {
      rawResults = await getJobResults(ibmToken, jobId);
      if (rawResults) {
        probabilities = parseResults(rawResults, qubitCount);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        ...status,
        probabilities,
        rawResults: status.status === "completed" ? rawResults : undefined,
        checkedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[IBM Status] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
