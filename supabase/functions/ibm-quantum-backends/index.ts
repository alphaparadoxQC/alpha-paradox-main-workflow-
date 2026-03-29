import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// NEW IBM Cloud Quantum API base URL
const IBM_CLOUD_API_BASE = "https://quantum.cloud.ibm.com/api/v1";

// Cache for IAM token
let cachedIamToken: { token: string; expiresAt: number } | null = null;

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

// Fallback backends when API is unreachable
const FALLBACK_BACKENDS: BackendInfo[] = [
  {
    name: "ibm_brisbane",
    numQubits: 127,
    status: "online",
    isSimulator: false,
    pendingJobs: 0,
    maxShots: 100000,
    basisGates: ["id", "rz", "sx", "x", "cx", "ecr"],
    description: "IBM Eagle r3 processor",
    processor: "Eagle",
  },
  {
    name: "ibm_kyiv",
    numQubits: 127,
    status: "online",
    isSimulator: false,
    pendingJobs: 0,
    maxShots: 100000,
    basisGates: ["id", "rz", "sx", "x", "cx", "ecr"],
    description: "IBM Eagle r3 processor",
    processor: "Eagle",
  },
  {
    name: "ibm_sherbrooke",
    numQubits: 127,
    status: "online",
    isSimulator: false,
    pendingJobs: 0,
    maxShots: 100000,
    basisGates: ["id", "rz", "sx", "x", "cx", "ecr"],
    description: "IBM Eagle r3 processor",
    processor: "Eagle",
  },
  {
    name: "ibmq_qasm_simulator",
    numQubits: 32,
    status: "online",
    isSimulator: true,
    pendingJobs: 0,
    maxShots: 100000,
    basisGates: ["id", "rz", "sx", "x", "cx"],
    description: "Cloud-based QASM simulator",
  },
];

// Exchange IBM API Key for IAM Bearer Token
async function getIamToken(apiKey: string): Promise<string> {
  // Check cache first
  if (cachedIamToken && Date.now() < cachedIamToken.expiresAt - 60000) {
    console.log("[IBM Backends] Using cached IAM token");
    return cachedIamToken.token;
  }

  console.log("[IBM Backends] Exchanging API key for IAM token...");
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ibm:params:oauth:grant-type:apikey",
        apikey: apiKey,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[IBM Backends] IAM token exchange failed:", errorText);
      throw new Error(`IAM token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    const token = data.access_token;
    const expiresIn = data.expires_in || 3600;
    
    cachedIamToken = {
      token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    
    console.log("[IBM Backends] IAM token obtained successfully");
    return token;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function getBackends(iamToken: string, serviceCrn?: string): Promise<{ backends: BackendInfo[]; fromCache: boolean }> {
  console.log("[IBM Backends] Fetching available backends from Cloud API...");
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const headers: Record<string, string> = {
      Authorization: `Bearer ${iamToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    
    // Add Service CRN if available
    if (serviceCrn) {
      headers["Service-CRN"] = serviceCrn;
    }
    
    const response = await fetch(`${IBM_CLOUD_API_BASE}/backends`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[IBM Backends] Failed to fetch backends:", response.status, errorText);
      throw new Error(`Failed to fetch backends: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawBackends = data.backends || data;
    console.log(`[IBM Backends] Found ${rawBackends.length} backends`);

    // Transform to our format
    const backends: BackendInfo[] = rawBackends.map((b: any) => {
      let status: BackendInfo["status"] = "offline";
      if (b.status === "online" || b.operational === true) {
        status = "online";
      } else if (b.status === "maintenance" || b.status_msg?.includes("maintenance")) {
        status = "maintenance";
      }

      return {
        name: b.name || b.backend_name,
        numQubits: b.num_qubits || b.n_qubits || b.numQubits || 0,
        status,
        isSimulator: b.is_simulator || b.simulator || b.name?.includes("simulator") || false,
        pendingJobs: b.pending_jobs || b.pendingJobs || 0,
        maxShots: b.max_shots || 100000,
        basisGates: b.basis_gates || ["id", "rz", "sx", "x", "cx"],
        description: b.description,
        version: b.version || b.backend_version,
        processor: b.processor_type?.family,
      };
    });

    return { backends, fromCache: false };
  } catch (err) {
    console.warn("[IBM Backends] API unreachable, using fallback backends:", err);
    return { backends: FALLBACK_BACKENDS, fromCache: true };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Accept GET and POST
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[IBM Backends] Auth failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IBM Quantum API key
    const ibmApiKey = Deno.env.get("IBM_QUANTUM_API_TOKEN");
    if (!ibmApiKey) {
      console.error("[IBM Backends] API key not configured");
      return new Response(
        JSON.stringify({ error: "IBM Quantum API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get optional Service CRN
    const serviceCrn = Deno.env.get("IBM_QUANTUM_SERVICE_CRN");

    // Exchange API key for IAM token
    let iamToken: string;
    try {
      iamToken = await getIamToken(ibmApiKey);
    } catch (iamError) {
      console.warn("[IBM Backends] IAM token exchange failed, using fallback:", iamError);
      // Return fallback backends if IAM fails
      return new Response(
        JSON.stringify({
          success: true,
          backends: FALLBACK_BACKENDS,
          summary: {
            total: FALLBACK_BACKENDS.length,
            online: FALLBACK_BACKENDS.filter(b => b.status === "online").length,
            simulators: FALLBACK_BACKENDS.filter(b => b.isSimulator).length,
            realDevices: FALLBACK_BACKENDS.filter(b => !b.isSimulator).length,
            leastBusy: FALLBACK_BACKENDS[0]?.name || null,
            maxQubits: Math.max(...FALLBACK_BACKENDS.map(b => b.numQubits), 0),
          },
          fromCache: true,
          fetchedAt: new Date().toISOString(),
          note: "Using fallback backends due to IAM authentication issue. Please verify your IBM API key."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query params for filtering
    const url = new URL(req.url);
    const minQubits = parseInt(url.searchParams.get("minQubits") || "0");
    const onlineOnly = url.searchParams.get("onlineOnly") === "true";
    const excludeSimulators = url.searchParams.get("excludeSimulators") === "true";

    // Get backends
    const result = await getBackends(iamToken, serviceCrn);
    let backendsList = result.backends;

    // Apply filters
    if (minQubits > 0) {
      backendsList = backendsList.filter(b => b.numQubits >= minQubits);
    }
    if (onlineOnly) {
      backendsList = backendsList.filter(b => b.status === "online");
    }
    if (excludeSimulators) {
      backendsList = backendsList.filter(b => !b.isSimulator);
    }

    // Sort by pending jobs (least busy first)
    backendsList.sort((a, b) => a.pendingJobs - b.pendingJobs);

    // Calculate summary stats
    const summary = {
      total: backendsList.length,
      online: backendsList.filter(b => b.status === "online").length,
      simulators: backendsList.filter(b => b.isSimulator).length,
      realDevices: backendsList.filter(b => !b.isSimulator).length,
      leastBusy: backendsList[0]?.name || null,
      maxQubits: Math.max(...backendsList.map(b => b.numQubits), 0),
    };

    return new Response(
      JSON.stringify({
        success: true,
        backends: backendsList,
        summary,
        fromCache: result.fromCache,
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
