import { useState, useCallback } from 'react';
import { callQuantumAI, type AIRequest, type AIPrediction } from '@/lib/drugDiscovery/deepseekService';
import { toast } from 'sonner';

export type DrugAIAction = 'predict' | 'analyze' | 'optimize' | 'search_similar' | 'generate_candidates';

export interface MolecularProperties {
  molecularWeight?: number;
  logP?: number;
  hBondDonors?: number;
  hBondAcceptors?: number;
  polarSurfaceArea?: number;
  rotableBonds?: number;
}

export interface DrugAIPrediction extends AIPrediction {}

export interface DrugAIResponse {
  success: boolean;
  response: string;
  predictions?: DrugAIPrediction;
  model?: string;
  error?: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useDrugAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<DrugAIResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [modelName, setModelName] = useState<string>('Quantum-AI Engine v4.2');

  const predict = useCallback(async (
    action: DrugAIAction,
    options: {
      smiles?: string;
      targetId?: string;
      targetName?: string;
      drugName?: string;
      molecularProperties?: MolecularProperties;
      customQuery?: string;
    }
  ): Promise<DrugAIResponse> => {
    setIsLoading(true);
    
    try {
      const aiResult = await callQuantumAI({
        action,
        smiles: options.smiles,
        targetId: options.targetId,
        targetName: options.targetName,
        drugName: options.drugName,
        molecularProperties: options.molecularProperties,
        customQuery: options.customQuery,
        conversationHistory: conversationHistory.slice(-6),
      });

      const response: DrugAIResponse = {
        success: aiResult.success,
        response: aiResult.response,
        predictions: aiResult.predictions,
        model: aiResult.model,
      };

      setModelName(aiResult.model);
      setLastResponse(response);

      if (options.customQuery) {
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: options.customQuery! },
          { role: 'assistant', content: aiResult.response },
        ]);
      }

      toast.success(`Quantum AI ${action.replace('_', ' ').toUpperCase()} Completed`, {
        description: `Analyzed via ${aiResult.model}`,
      });

      return response;

    } catch (err) {
      console.error('Drug AI error:', err);
      const errorResponse: DrugAIResponse = {
        success: false,
        response: '',
        error: err instanceof Error ? err.message : 'Failed to execute AI analysis',
        model: 'Quantum-AI Engine v4.2',
      };
      
      toast.error('AI Analysis Error', {
        description: errorResponse.error,
      });
      
      setLastResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory]);

  const analyzeCompound = useCallback(async (
    smiles: string,
    molecularProperties?: MolecularProperties
  ) => {
    return predict('analyze', { smiles, molecularProperties });
  }, [predict]);

  const predictBinding = useCallback(async (
    smiles: string,
    targetId: string,
    molecularProperties?: MolecularProperties
  ) => {
    return predict('predict', { smiles, targetId, molecularProperties });
  }, [predict]);

  const optimizeCompound = useCallback(async (
    smiles: string,
    targetId?: string,
    molecularProperties?: MolecularProperties
  ) => {
    return predict('optimize', { smiles, targetId, molecularProperties });
  }, [predict]);

  const findSimilar = useCallback(async (
    smiles: string,
    molecularProperties?: MolecularProperties
  ) => {
    return predict('search_similar', { smiles, molecularProperties });
  }, [predict]);

  const generateCandidates = useCallback(async (
    targetId: string,
    molecularProperties?: MolecularProperties
  ) => {
    return predict('generate_candidates', { targetId, molecularProperties });
  }, [predict]);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse(null);
  }, []);

  return {
    isLoading,
    lastResponse,
    conversationHistory,
    modelName,
    predict,
    analyzeCompound,
    predictBinding,
    optimizeCompound,
    findSimilar,
    generateCandidates,
    clearHistory,
  };
}
