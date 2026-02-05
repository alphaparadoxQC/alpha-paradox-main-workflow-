import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IBM_API_BASE = "https://api.quantum-computing.ibm.com/runtime";

interface BackendInfo {
  name: string;
  numQubits: number;
  status: "online" | "offline" | "maintenance";
  isSimulator: boolean;
  pendingJobs: number;
  maxShots: number;
  basisGates: string[];
  description?: string;
  version?: string;
  processor?: string;
}

async function getBackends(token: string): Promise<BackendInfo[]> {
  console.log("[IBM Backends] Fetching available backends...");
  
  const response = await fetch(`${IBM_API_BASE}/backends`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[IBM Backends] Failed to fetch backends:", errorText);
    throw new Error(`Failed to fetch backends: ${response.status} - ${errorText}`);
  }

  const rawBackends = await response.json();
  console.log(`[IBM Backends] Found ${rawBackends.length} backends`);

  // Transform to our format
  const backends: BackendInfo[] = rawBackends.map((b: any) => {
    // Determine status
    let status: BackendInfo["status"] = "offline";
    if (b.status === "online" || b.operational === true) {
      status = "online";
    } else if (b.status === "maintenance" || b.status_msg?.includes("maintenance")) {
      status = "maintenance";
    }

    return {
      name: b.name || b.backend_name,
      numQubits: b.num_qubits || b.n_qubits || 0,
      status,
      isSimulator: b.is_simulator || b.simulator || b.name?.includes("simulator") || false,
      pendingJobs: b.pending_jobs || 0,
      maxShots: b.max_shots || 100000,
      basisGates: b.basis_gates || ["id", "rz", "sx", "x", "cx"],
      description: b.description,
      version: b.version || b.backend_version,
      processor: b.processor_type?.family,
    };
  });

  return backends;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Accept GET only
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use GET." }),
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
      console.error("[IBM Backends] Auth failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IBM Quantum API token
    const ibmToken = Deno.env.get("IBM_QUANTUM_API_TOKEN");
    if (!ibmToken) {
      console.error("[IBM Backends] API token not configured");
      return new Response(
        JSON.stringify({ error: "IBM Quantum API token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query params for filtering
    const url = new URL(req.url);
    const minQubits = parseInt(url.searchParams.get("minQubits") || "0");
    const onlineOnly = url.searchParams.get("onlineOnly") === "true";
    const excludeSimulators = url.searchParams.get("excludeSimulators") === "true";

    // Get backends
    let backends = await getBackends(ibmToken);

    // Apply filters
    if (minQubits > 0) {
      backends = backends.filter(b => b.numQubits >= minQubits);
    }
    if (onlineOnly) {
      backends = backends.filter(b => b.status === "online");
    }
    if (excludeSimulators) {
      backends = backends.filter(b => !b.isSimulator);
    }

    // Sort by pending jobs (least busy first)
    backends.sort((a, b) => a.pendingJobs - b.pendingJobs);

    // Calculate summary stats
    const summary = {
      total: backends.length,
      online: backends.filter(b => b.status === "online").length,
      simulators: backends.filter(b => b.isSimulator).length,
      realDevices: backends.filter(b => !b.isSimulator).length,
      leastBusy: backends[0]?.name || null,
      maxQubits: Math.max(...backends.map(b => b.numQubits), 0),
    };

    return new Response(
      JSON.stringify({
        success: true,
        backends,
        summary,
        fetchedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[IBM Backends] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
