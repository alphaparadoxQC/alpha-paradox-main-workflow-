import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export interface DrugAIPrediction {
  drugLikenessScore?: number;
  predictedKi?: number;
  confidence?: 'low' | 'medium' | 'high';
  bindingEnergy?: number;
  admetScores?: {
    absorption: number;
    distribution: number;
    metabolism: number;
    excretion: number;
    toxicity: number;
  };
}

export interface DrugAIResponse {
  success: boolean;
  response: string;
  predictions?: DrugAIPrediction;
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

  const predict = useCallback(async (
    action: DrugAIAction,
    options: {
      smiles?: string;
      targetId?: string;
      molecularProperties?: MolecularProperties;
      customQuery?: string;
    }
  ): Promise<DrugAIResponse> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('drug-ai-predict', {
        body: {
          action,
          ...options,
          conversationHistory: conversationHistory.slice(-6), // Keep last 6 messages for context
        },
      });

      if (error) throw error;

      const response: DrugAIResponse = {
        success: data.success,
        response: data.response,
        predictions: data.predictions,
      };

      setLastResponse(response);

      // Update conversation history
      if (options.customQuery) {
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: options.customQuery! },
          { role: 'assistant', content: data.response },
        ]);
      }

      return response;

    } catch (err) {
      console.error('Drug AI error:', err);
      const errorResponse: DrugAIResponse = {
        success: false,
        response: '',
        error: err instanceof Error ? err.message : 'Failed to get AI prediction',
      };
      
      toast.error('AI Prediction Failed', {
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

  const askQuestion = useCallback(async (question: string) => {
    return predict('predict', { customQuery: question });
  }, [predict]);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse(null);
  }, []);

  return {
    isLoading,
    lastResponse,
    conversationHistory,
    predict,
    analyzeCompound,
    predictBinding,
    optimizeCompound,
    findSimilar,
    generateCandidates,
    askQuestion,
    clearHistory,
  };
}
