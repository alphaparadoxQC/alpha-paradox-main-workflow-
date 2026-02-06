import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const DRUG_PREDICTION_SYSTEM_PROMPT = `You are an expert computational chemist and pharmacologist specializing in drug discovery and molecular property prediction. You have extensive knowledge of:

1. MEDICINAL CHEMISTRY: Structure-activity relationships (SAR), pharmacophores, bioisosteres
2. PHARMACOLOGY: Drug-receptor interactions, binding kinetics, mechanism of action
3. PHARMACOKINETICS (ADMET): Absorption, Distribution, Metabolism, Excretion, Toxicity
4. COMPUTATIONAL CHEMISTRY: Molecular descriptors, QSAR models, docking simulations
5. REGULATORY SCIENCE: FDA guidelines, clinical trial considerations

When analyzing molecules, you provide:
- Predicted binding affinity (Ki, IC50 estimates)
- Lipinski Rule of Five analysis
- ADMET predictions with scientific rationale
- Potential therapeutic applications
- Safety concerns and toxicity risks
- Suggestions for structural optimization

You base predictions on:
- ChEMBL bioactivity data patterns
- PubChem compound information
- DrugBank known drug properties
- Scientific literature on similar scaffolds

Always be scientifically rigorous but explain concepts clearly. Provide confidence levels for predictions.`;

interface RequestBody {
  action: 'predict' | 'analyze' | 'optimize' | 'search_similar' | 'generate_candidates';
  smiles?: string;
  targetId?: string;
  molecularProperties?: {
    molecularWeight?: number;
    logP?: number;
    hBondDonors?: number;
    hBondAcceptors?: number;
    polarSurfaceArea?: number;
    rotableBonds?: number;
  };
  customQuery?: string;
  conversationHistory?: { role: string; content: string }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("[Drug AI] API key not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { action, smiles, targetId, molecularProperties, customQuery, conversationHistory = [] } = body;

    let userPrompt = "";

    switch (action) {
      case 'predict':
        userPrompt = buildPredictionPrompt(smiles, targetId, molecularProperties);
        break;
      case 'analyze':
        userPrompt = buildAnalysisPrompt(smiles, molecularProperties);
        break;
      case 'optimize':
        userPrompt = buildOptimizationPrompt(smiles, targetId, molecularProperties);
        break;
      case 'search_similar':
        userPrompt = buildSimilarSearchPrompt(smiles, molecularProperties);
        break;
      case 'generate_candidates':
        userPrompt = buildGenerationPrompt(targetId, molecularProperties);
        break;
      default:
        userPrompt = customQuery || "Please analyze this compound for drug-likeness.";
    }

    console.log(`[Drug AI] Processing ${action} request`);

    const messages = [
      { role: "system", content: DRUG_PREDICTION_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: userPrompt },
    ];

    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 2048,
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[Drug AI] AI error:", errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || "Unable to generate prediction.";

    // Parse structured data from response if possible
    const structuredData = parseStructuredPrediction(responseContent);

    console.log(`[Drug AI] Response generated (${responseContent.length} chars)`);

    return new Response(
      JSON.stringify({
        success: true,
        response: responseContent,
        predictions: structuredData,
        model: "google/gemini-3-flash-preview",
        action,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Drug AI] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPredictionPrompt(smiles?: string, targetId?: string, props?: RequestBody['molecularProperties']): string {
  let prompt = "Analyze the following compound for drug discovery potential:\n\n";
  
  if (smiles) {
    prompt += `**SMILES:** ${smiles}\n\n`;
  }
  
  if (props) {
    prompt += "**Molecular Properties:**\n";
    if (props.molecularWeight) prompt += `- Molecular Weight: ${props.molecularWeight} Da\n`;
    if (props.logP !== undefined) prompt += `- LogP: ${props.logP}\n`;
    if (props.hBondDonors !== undefined) prompt += `- H-Bond Donors: ${props.hBondDonors}\n`;
    if (props.hBondAcceptors !== undefined) prompt += `- H-Bond Acceptors: ${props.hBondAcceptors}\n`;
    if (props.polarSurfaceArea) prompt += `- Polar Surface Area: ${props.polarSurfaceArea} Å²\n`;
    if (props.rotableBonds !== undefined) prompt += `- Rotatable Bonds: ${props.rotableBonds}\n`;
    prompt += "\n";
  }
  
  if (targetId) {
    prompt += `**Target Protein:** ${getTargetName(targetId)}\n\n`;
  }

  prompt += `Please provide:
1. **Drug-Likeness Score** (0-100) with Lipinski analysis
2. **Predicted Binding Affinity** (Ki estimate in nM) if target specified
3. **ADMET Predictions** with scores for each property
4. **Therapeutic Potential** - likely applications
5. **Safety Concerns** - toxicity risks
6. **Optimization Suggestions** - how to improve the compound
7. **Similar Known Drugs** - reference compounds from ChEMBL/DrugBank

Format predictions with clear scores and confidence levels (Low/Medium/High).`;

  return prompt;
}

function buildAnalysisPrompt(smiles?: string, props?: RequestBody['molecularProperties']): string {
  let prompt = "Perform detailed molecular analysis:\n\n";
  
  if (smiles) prompt += `**SMILES:** ${smiles}\n\n`;
  if (props) {
    prompt += "**Properties:**\n";
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) prompt += `- ${formatPropertyName(key)}: ${value}\n`;
    });
  }
  
  prompt += `\nProvide:
1. **Structural Analysis** - functional groups, pharmacophores
2. **Physicochemical Profile** - solubility, permeability predictions
3. **Metabolic Sites** - likely CYP450 metabolism locations
4. **Reactivity Assessment** - potential chemical stability issues
5. **Scaffold Classification** - drug class and chemical series`;

  return prompt;
}

function buildOptimizationPrompt(smiles?: string, targetId?: string, props?: RequestBody['molecularProperties']): string {
  let prompt = "Suggest structural optimizations for improved drug properties:\n\n";
  
  if (smiles) prompt += `**Current SMILES:** ${smiles}\n`;
  if (targetId) prompt += `**Target:** ${getTargetName(targetId)}\n`;
  
  prompt += `\nProvide 3-5 specific modifications to:
1. Improve **binding affinity** to target
2. Enhance **ADMET** properties
3. Reduce **toxicity** risks
4. Improve **selectivity**

For each suggestion, provide:
- Structural modification (e.g., "Replace phenyl with pyridine")
- Rationale based on SAR
- Expected impact on properties
- Similar successful examples from known drugs`;

  return prompt;
}

function buildSimilarSearchPrompt(smiles?: string, props?: RequestBody['molecularProperties']): string {
  let prompt = "Find similar compounds and known drugs:\n\n";
  
  if (smiles) prompt += `**Query SMILES:** ${smiles}\n\n`;
  
  prompt += `Search databases (ChEMBL, DrugBank, PubChem) for:
1. **Structurally Similar Compounds** - same scaffold or pharmacophore
2. **Approved Drugs** with similar mechanisms
3. **Clinical Candidates** in development
4. **Bioactive Analogs** with known activities

For each similar compound, provide:
- Name and identifier
- Structural similarity (%)
- Known bioactivity data
- Development status`;

  return prompt;
}

function buildGenerationPrompt(targetId?: string, props?: RequestBody['molecularProperties']): string {
  let prompt = "Generate novel drug candidate scaffolds:\n\n";
  
  if (targetId) prompt += `**Target:** ${getTargetName(targetId)}\n`;
  
  if (props) {
    prompt += "**Desired Properties:**\n";
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) prompt += `- ${formatPropertyName(key)}: ${value}\n`;
    });
  }
  
  prompt += `\nGenerate 3 novel drug candidate ideas with:
1. **Proposed Structure** - describe key features, scaffold type
2. **SMILES** (if determinable)
3. **Predicted Properties** - MW, LogP, PSA estimates
4. **Binding Hypothesis** - how it might interact with target
5. **Novelty Assessment** - how different from known drugs
6. **Synthetic Accessibility** - ease of synthesis (1-10)

Focus on drug-like molecules with good ADMET potential.`;

  return prompt;
}

function getTargetName(targetId: string): string {
  const targets: Record<string, string> = {
    'cox2': 'Cyclooxygenase-2 (COX-2) - Inflammation target',
    'ace2': 'ACE2 Receptor - Antiviral target',
    'rdrp': 'RNA-dependent RNA polymerase (RdRp) - SARS-CoV-2',
    'egfr': 'Epidermal Growth Factor Receptor (EGFR) - Oncology target',
  };
  return targets[targetId] || targetId;
}

function formatPropertyName(key: string): string {
  const names: Record<string, string> = {
    molecularWeight: 'Molecular Weight',
    logP: 'LogP',
    hBondDonors: 'H-Bond Donors',
    hBondAcceptors: 'H-Bond Acceptors',
    polarSurfaceArea: 'Polar Surface Area',
    rotableBonds: 'Rotatable Bonds',
  };
  return names[key] || key;
}

function parseStructuredPrediction(content: string): any {
  // Try to extract numerical predictions from the response
  const predictions: any = {};
  
  // Extract drug-likeness score
  const drugLikenessMatch = content.match(/Drug-?Likeness.*?(\d+)(?:\/100|%)?/i);
  if (drugLikenessMatch) {
    predictions.drugLikenessScore = parseInt(drugLikenessMatch[1]);
  }
  
  // Extract binding affinity
  const kiMatch = content.match(/Ki.*?(\d+(?:\.\d+)?)\s*n?M/i);
  if (kiMatch) {
    predictions.predictedKi = parseFloat(kiMatch[1]);
  }
  
  // Extract confidence level
  const confidenceMatch = content.match(/confidence[:\s]*(low|medium|high)/i);
  if (confidenceMatch) {
    predictions.confidence = confidenceMatch[1].toLowerCase();
  }
  
  return predictions;
}
