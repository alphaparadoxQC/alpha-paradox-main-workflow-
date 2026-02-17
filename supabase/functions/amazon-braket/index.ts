import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  SignatureV4,
} from "https://esm.sh/@smithy/signature-v4@4.2.4";
import { Sha256 } from "https://esm.sh/@aws-crypto/sha256-js@5.2.0";

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
  deviceArn?: string;
}

// Convert circuit to Amazon Braket IR (Intermediate Representation) format
function circuitToBraketIR(gates: QuantumGate[], qubitCount: number): object {
  const instructions: object[] = [];

  // Sort gates by position to maintain order
  const sortedGates = [...gates].sort((a, b) => a.position - b.position);

  for (const gate of sortedGates) {
    switch (gate.type) {
      case "H":
        instructions.push({
          type: "h",
          target: gate.qubit,
        });
        break;
      case "X":
        instructions.push({
          type: "x",
          target: gate.qubit,
        });
        break;
      case "Y":
        instructions.push({
          type: "y",
          target: gate.qubit,
        });
        break;
      case "Z":
        instructions.push({
          type: "z",
          target: gate.qubit,
        });
        break;
      case "S":
        instructions.push({
          type: "s",
          target: gate.qubit,
        });
        break;
      case "T":
        instructions.push({
          type: "t",
          target: gate.qubit,
        });
        break;
      case "CNOT":
        if (gate.controlQubit !== undefined) {
          instructions.push({
            type: "cnot",
            control: gate.controlQubit,
            target: gate.qubit,
          });
        }
        break;
      case "CZ":
        if (gate.controlQubit !== undefined) {
          instructions.push({
            type: "cz",
            control: gate.controlQubit,
            target: gate.qubit,
          });
        }
        break;
      case "SWAP":
        if (gate.targetQubit !== undefined) {
          instructions.push({
            type: "swap",
            targets: [gate.qubit, gate.targetQubit],
          });
        }
        break;
      case "CCX":
        if (gate.controlQubit !== undefined && gate.controlQubit2 !== undefined) {
          instructions.push({
            type: "ccnot",
            controls: [gate.controlQubit, gate.controlQubit2],
            target: gate.qubit,
          });
        }
        break;
      case "Rx":
        instructions.push({
          type: "rx",
          target: gate.qubit,
          angle: gate.angle ?? Math.PI / 2,
        });
        break;
      case "Ry":
        instructions.push({
          type: "ry",
          target: gate.qubit,
          angle: gate.angle ?? Math.PI / 2,
        });
        break;
      case "Rz":
        instructions.push({
          type: "rz",
          target: gate.qubit,
          angle: gate.angle ?? Math.PI / 2,
        });
        break;
      // Measurement is implicit in Braket - all qubits are measured
    }
  }

  // Create the OpenQASM Program format that Braket accepts
  const braketProgram = {
    braketSchemaHeader: {
      name: "braket.ir.openqasm.program",
      version: "1",
    },
    source: generateOpenQASM3(gates, qubitCount),
  };

  return braketProgram;
}

// Generate OpenQASM 3.0 for Braket
function generateOpenQASM3(gates: QuantumGate[], qubitCount: number): string {
  const lines: string[] = [
    "OPENQASM 3.0;",
    `qubit[${qubitCount}] q;`,
    `bit[${qubitCount}] c;`,
    "",
  ];

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
          lines.push(`cnot q[${gate.controlQubit}], q[${gate.qubit}];`);
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
          lines.push(`ccnot q[${gate.controlQubit}], q[${gate.controlQubit2}], q[${gate.qubit}];`);
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
    }
  }

  // Add measurements
  lines.push("");
  lines.push(`c = measure q;`);

  return lines.join("\n");
}

// AWS Signature V4 signing
async function signRequest(
  method: string,
  url: string,
  body: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<Headers> {
  const signer = new SignatureV4({
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region,
    service: "braket",
    sha256: Sha256,
  });

  const urlObj = new URL(url);
  
  const httpRequest = {
    method,
    protocol: "https:",
    hostname: urlObj.hostname,
    port: 443,
    path: urlObj.pathname,
    headers: {
      host: urlObj.host,
      "content-type": "application/json",
    },
    body,
  };
  
  const signedRequest = await signer.sign(httpRequest);

  return new Headers(signedRequest.headers as Record<string, string>);
}

// Submit quantum task to Amazon Braket
async function submitBraketTask(
  program: object,
  deviceArn: string,
  shots: number,
  region: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<{ taskArn: string; status: string }> {
  console.log(`[Amazon Braket] Submitting task to ${deviceArn} with ${shots} shots`);

  const endpoint = `https://braket.${region}.amazonaws.com/quantum-task`;
  
  const requestBody = JSON.stringify({
    action: JSON.stringify(program),
    deviceArn,
    outputS3Bucket: `amazon-braket-${region}-output`,
    outputS3KeyPrefix: "quantum-tasks",
    shots,
  });

  const headers = await signRequest(
    "POST",
    endpoint,
    requestBody,
    region,
    accessKeyId,
    secretAccessKey
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Amazon Braket] Task submission failed:", errorText);
    throw new Error(`Task submission failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`[Amazon Braket] Task submitted successfully: ${result.quantumTaskArn}`);

  return {
    taskArn: result.quantumTaskArn,
    status: result.status || "CREATED",
  };
}

// Available Braket devices
const BRAKET_DEVICES = {
  // Simulators
  SV1: "arn:aws:braket:::device/quantum-simulator/amazon/sv1",
  DM1: "arn:aws:braket:::device/quantum-simulator/amazon/dm1",
  TN1: "arn:aws:braket:::device/quantum-simulator/amazon/tn1",
  // Hardware (examples - availability varies)
  IONQ_HARMONY: "arn:aws:braket:us-east-1::device/qpu/ionq/Harmony",
  IONQ_ARIA: "arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1",
  RIGETTI_ASPEN: "arn:aws:braket:us-west-1::device/qpu/rigetti/Aspen-M-3",
  OQC_LUCY: "arn:aws:braket:eu-west-2::device/qpu/oqc/Lucy",
};

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
      console.error("[Amazon Braket] Auth failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`[Amazon Braket] Authenticated user: ${userId}`);

    // Parse request body
    const body: CircuitRequest = await req.json();
    const { gates, qubitCount, shots = 1000, deviceArn } = body;

    if (!gates || !Array.isArray(gates)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: gates array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!qubitCount || qubitCount < 1 || qubitCount > 34) {
      return new Response(
        JSON.stringify({ error: "Invalid request: qubitCount must be between 1 and 34 for SV1" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AWS credentials
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const region = Deno.env.get("AWS_REGION") || "us-east-1";

    if (!accessKeyId || !secretAccessKey) {
      console.error("[Amazon Braket] AWS credentials not configured");
      return new Response(
        JSON.stringify({ error: "AWS credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert circuit to Braket format
    const program = circuitToBraketIR(gates, qubitCount);
    const qasm = generateOpenQASM3(gates, qubitCount);
    console.log("[Amazon Braket] Generated OpenQASM 3.0:", qasm);

    // Select device (default to SV1 simulator)
    const selectedDevice = deviceArn || BRAKET_DEVICES.SV1;
    console.log(`[Amazon Braket] Using device: ${selectedDevice}`);

    // Submit task
    const taskResult = await submitBraketTask(
      program,
      selectedDevice,
      shots,
      region,
      accessKeyId,
      secretAccessKey
    );

    return new Response(
      JSON.stringify({
        success: true,
        taskArn: taskResult.taskArn,
        status: taskResult.status,
        device: selectedDevice,
        qubitCount,
        shots,
        qasm,
        submittedAt: new Date().toISOString(),
        availableDevices: BRAKET_DEVICES,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Amazon Braket] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
