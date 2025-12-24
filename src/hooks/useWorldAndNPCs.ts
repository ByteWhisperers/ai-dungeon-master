import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { NPCInfo } from "./useRPGMaster"; // Reusing the NPCInfo interface

// Interface para a tabela 'npcs'
interface NPC {
  id: string;
  name: string;
  type: 'common' | 'important' | 'boss';
  attributes: any; // JSONB
  objectives: string[]; // JSONB
  relations: any; // JSONB
  state: 'alive' | 'dead' | 'ally' | 'hostile';
  current_location: string;
}

// Interface para a tabela 'mundo'
interface WorldState {
  regiao: string;
  estado_politico: string;
  clima: string;
  recursos: any; // JSONB
  eventos_ativos: string[]; // JSONB
  npcs_ativos: string[]; // JSONB (IDs)
}

export const useWorldAndNPCs = () => {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch World State
  const fetchWorldState = useCallback(async (regiao: string = "default") => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('mundo')
        .select('*')
        .eq('regiao', regiao)
        .single();

      if (error) throw error;
      
      setWorldState(data as WorldState);
      return data as WorldState;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar estado do mundo";
      setError(errorMessage);
      toast({
        title: "Erro de Mundo",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch NPCs in current location
  const fetchNPCsInLocation = useCallback(async (location: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('current_location', location);

      if (error) throw error;
      
      setNpcs(data as NPC[]);
      return data as NPC[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar NPCs";
      setError(errorMessage);
      toast({
        title: "Erro de NPC",
        description: errorMessage,
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Get NPC Info for AI Context
  const getNPCInfoForContext = useCallback((npcId: string): NPCInfo | null => {
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return null;

    return {
      name: npc.name,
      personality: npc.hidden_variables?.personality || "neutra", // Assuming personality is stored in hidden_variables
      objectives: npc.objectives || [],
    };
  }, [npcs]);

  // 4. Update World State (e.g., after a World Agent reaction)
  const updateWorldState = useCallback(async (regiao: string, changes: Partial<WorldState>) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('mundo')
        .update(changes)
        .eq('regiao', regiao)
        .select()
        .single();

      if (error) throw error;
      
      setWorldState(data as WorldState);
      return data as WorldState;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar estado do mundo";
      setError(errorMessage);
      toast({
        title: "Erro de Atualização",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    worldState,
    npcs,
    isLoading,
    error,
    fetchWorldState,
    fetchNPCsInLocation,
    getNPCInfoForContext,
    updateWorldState,
  };
};
