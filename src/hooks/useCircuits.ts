 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { QuantumGate } from '@/types/quantum';
 import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
 
 export interface SavedCircuit {
   id: string;
   name: string;
   description: string | null;
  circuit_data: Json;
   qubit_count: number;
   is_public: boolean;
   created_at: string;
   updated_at: string;
   user_id: string;
 }

// Helper to safely extract gates from circuit_data
export function getGatesFromCircuit(circuit: SavedCircuit): QuantumGate[] {
  const data = circuit.circuit_data as Record<string, unknown>;
  if (data && typeof data === 'object' && 'gates' in data && Array.isArray(data.gates)) {
    return data.gates as QuantumGate[];
  }
  return [];
}
 
 export function useCircuits() {
   const { user } = useAuth();
   const [circuits, setCircuits] = useState<SavedCircuit[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
 
   const fetchCircuits = useCallback(async () => {
     if (!user) {
       setCircuits([]);
       return;
     }
 
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from('quantum_circuits')
         .select('*')
         .eq('user_id', user.id)
         .order('updated_at', { ascending: false });
 
       if (error) throw error;
      setCircuits(data || []);
     } catch (error) {
       console.error('Error fetching circuits:', error);
       toast.error('Failed to load circuits');
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchCircuits();
   }, [fetchCircuits]);
 
   const saveCircuit = async (
     name: string,
     description: string | null,
     gates: QuantumGate[],
     qubitCount: number,
     isPublic: boolean,
     existingId?: string
   ): Promise<SavedCircuit | null> => {
     if (!user) {
       toast.error('Please sign in to save circuits');
       return null;
     }
 
     setIsSaving(true);
     try {
      const circuitData = { gates } as unknown as Json;
 
       if (existingId) {
         // Update existing circuit
         const { data, error } = await supabase
           .from('quantum_circuits')
           .update({
             name,
             description,
             circuit_data: circuitData,
             qubit_count: qubitCount,
             is_public: isPublic,
           })
           .eq('id', existingId)
           .eq('user_id', user.id)
           .select()
           .single();
 
         if (error) throw error;
         await fetchCircuits();
        return data;
       } else {
         // Create new circuit
         const { data, error } = await supabase
           .from('quantum_circuits')
           .insert({
             name,
             description,
             circuit_data: circuitData,
             qubit_count: qubitCount,
             is_public: isPublic,
             user_id: user.id,
           })
           .select()
           .single();
 
         if (error) throw error;
         await fetchCircuits();
        return data;
       }
     } catch (error) {
       console.error('Error saving circuit:', error);
       toast.error('Failed to save circuit');
       return null;
     } finally {
       setIsSaving(false);
     }
   };
 
   const deleteCircuit = async (circuitId: string): Promise<boolean> => {
     if (!user) return false;
 
     try {
       const { error } = await supabase
         .from('quantum_circuits')
         .delete()
         .eq('id', circuitId)
         .eq('user_id', user.id);
 
       if (error) throw error;
       
       setCircuits(prev => prev.filter(c => c.id !== circuitId));
       toast.success('Circuit deleted');
       return true;
     } catch (error) {
       console.error('Error deleting circuit:', error);
       toast.error('Failed to delete circuit');
       return false;
     }
   };
 
   const loadCircuit = async (circuitId: string): Promise<SavedCircuit | null> => {
     try {
       const { data, error } = await supabase
         .from('quantum_circuits')
         .select('*')
         .eq('id', circuitId)
         .single();
 
       if (error) throw error;
      return data;
     } catch (error) {
       console.error('Error loading circuit:', error);
       toast.error('Failed to load circuit');
       return null;
     }
   };
 
   return {
     circuits,
     isLoading,
     isSaving,
     fetchCircuits,
     saveCircuit,
     deleteCircuit,
     loadCircuit,
   };
 }