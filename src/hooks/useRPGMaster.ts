import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface NPCInfo {
  name: string;
  personality: string;
  objectives: string[];
}

interface CombatInfo {
  enemyName: string;
  enemyHP: number;
  enemyMaxHP: number;
  enemyPersonality: string;
  playerPositions: string[];
}

interface RPGContext {
  location?: string;
  characters?: string[];
  recentEvents?: string[];
  npcInfo?: NPCInfo;
  combatInfo?: CombatInfo;
}

type RequestType = "narrative" | "combat" | "npc" | "world";

export const useRPGMaster = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendToMaster = useCallback(async (
    type: RequestType,
    messages: ChatMessage[],
    context?: RPGContext
  ): Promise<string | object | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('rpg-master', {
        body: { type, messages, context }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        if (data.code === "RATE_LIMIT") {
          toast({
            title: "Aguarde um momento",
            description: "O Mestre IA está ocupado. Tente novamente em alguns segundos.",
            variant: "destructive"
          });
        } else if (data.code === "NO_CREDITS") {
          toast({
            title: "Créditos esgotados",
            description: "Adicione créditos para continuar usando o Mestre IA.",
            variant: "destructive"
          });
        }
        throw new Error(data.error);
      }

      return data.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("RPG Master error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convenience methods for different agent types
  const narrate = useCallback(async (
    playerAction: string,
    history: ChatMessage[],
    context?: RPGContext
  ) => {
    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: playerAction }
    ];
    return sendToMaster("narrative", messages, context);
  }, [sendToMaster]);

  const getCombatDecision = useCallback(async (
    combatInfo: CombatInfo,
    history: ChatMessage[]
  ) => {
    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: `Qual a próxima ação do ${combatInfo.enemyName}?` }
    ];
    return sendToMaster("combat", messages, { combatInfo });
  }, [sendToMaster]);

  const talkToNPC = useCallback(async (
    playerSpeech: string,
    npcInfo: NPCInfo,
    history: ChatMessage[],
    context?: RPGContext
  ) => {
    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: playerSpeech }
    ];
    return sendToMaster("npc", messages, { ...context, npcInfo });
  }, [sendToMaster]);

  const getWorldReaction = useCallback(async (
    playerAction: string,
    context: RPGContext
  ) => {
    const messages: ChatMessage[] = [
      { role: "user", content: `O jogador fez: ${playerAction}. Quais são as consequências?` }
    ];
    return sendToMaster("world", messages, context);
  }, [sendToMaster]);

  return {
    isLoading,
    error,
    narrate,
    getCombatDecision,
    talkToNPC,
    getWorldReaction,
    sendToMaster
  };
};
