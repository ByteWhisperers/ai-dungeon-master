import { useState, useCallback } from "react";
import { 
  CombatState, 
  Combatant, 
  CombatLogEntry, 
  CombatAction,
  createEnemy,
  createPlayerCombatant,
  Attack
} from "@/lib/combat";
import { 
  rollInitiative, 
  makeAttackRoll, 
  getAttributeModifier,
  formatDiceRoll 
} from "@/lib/dice";
import { useRPGMaster } from "./useRPGMaster";

interface UseCombatOptions {
  onCombatEnd?: (victory: boolean) => void;
  onPlayerDamaged?: (damage: number, newHp: number) => void;
}

export const useCombat = (options?: UseCombatOptions) => {
  const { getCombatDecision, isLoading: aiLoading } = useRPGMaster();
  
  const [combatState, setCombatState] = useState<CombatState>({
    isActive: false,
    round: 0,
    currentTurnIndex: 0,
    combatants: [],
    turnOrder: [],
    log: [],
    phase: "initiative",
  });

  // Add log entry
  const addLogEntry = useCallback((
    entry: Omit<CombatLogEntry, "id" | "timestamp">
  ) => {
    const newEntry: CombatLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setCombatState(prev => ({
      ...prev,
      log: [...prev.log, newEntry],
    }));
    return newEntry;
  }, []);

  // Start combat with enemies
  const startCombat = useCallback((
    playerCharacter: Parameters<typeof createPlayerCombatant>[0],
    enemyTemplates: string[]
  ) => {
    const player = createPlayerCombatant(playerCharacter);
    const enemies = enemyTemplates.map(template => createEnemy(template));
    
    const allCombatants = [player, ...enemies];
    
    // Roll initiative for everyone
    allCombatants.forEach(combatant => {
      const dexMod = getAttributeModifier(combatant.attributes.DES);
      combatant.initiative = rollInitiative(dexMod);
    });
    
    // Sort by initiative (highest first)
    allCombatants.sort((a, b) => b.initiative - a.initiative);
    const turnOrder = allCombatants.map(c => c.id);
    
    setCombatState({
      isActive: true,
      round: 1,
      currentTurnIndex: 0,
      combatants: allCombatants,
      turnOrder,
      log: [],
      phase: "combat",
    });
    
    // Log combat start
    const initiativeLog = allCombatants
      .map(c => `${c.name}: ${c.initiative}`)
      .join(", ");
    
    addLogEntry({
      round: 1,
      actorId: "system",
      actorName: "Sistema",
      action: "Combate iniciado!",
      result: `Ordem de iniciativa: ${initiativeLog}`,
      type: "system",
    });
    
    return allCombatants;
  }, [addLogEntry]);

  // Get current combatant
  const getCurrentCombatant = useCallback((): Combatant | null => {
    if (!combatState.isActive || combatState.turnOrder.length === 0) return null;
    const currentId = combatState.turnOrder[combatState.currentTurnIndex];
    return combatState.combatants.find(c => c.id === currentId) || null;
  }, [combatState]);

  // Check if it's player's turn
  const isPlayerTurn = useCallback((): boolean => {
    const current = getCurrentCombatant();
    return current?.type === "player";
  }, [getCurrentCombatant]);

  // Apply damage to combatant
  const applyDamage = useCallback((targetId: string, damage: number) => {
    setCombatState(prev => {
      const newCombatants = prev.combatants.map(c => {
        if (c.id === targetId) {
          const newHp = Math.max(0, c.hp - damage);
          
          if (c.type === "player" && options?.onPlayerDamaged) {
            options.onPlayerDamaged(damage, newHp);
          }
          
          return { ...c, hp: newHp, isActive: newHp > 0 };
        }
        return c;
      });
      
      return { ...prev, combatants: newCombatants };
    });
  }, [options]);

  // Execute player attack
  const playerAttack = useCallback((targetId: string, attack: Attack) => {
    const player = combatState.combatants.find(c => c.type === "player");
    const target = combatState.combatants.find(c => c.id === targetId);
    
    if (!player || !target || !target.isActive) return null;
    
    const attackResult = makeAttackRoll(
      attack.attackBonus,
      target.ac,
      attack.damageDice,
      attack.damageBonus
    );
    
    let resultText = "";
    
    if (attackResult.fumble) {
      resultText = `Erro crítico! O ataque falha miseravelmente.`;
    } else if (attackResult.critical) {
      resultText = `CRÍTICO! ${formatDiceRoll(attackResult.attackRoll)} vs CA ${target.ac}. Causa ${attackResult.totalDamage} de dano!`;
      applyDamage(targetId, attackResult.totalDamage);
    } else if (attackResult.hit) {
      resultText = `Acerto! ${formatDiceRoll(attackResult.attackRoll)} vs CA ${target.ac}. Causa ${attackResult.totalDamage} de dano.`;
      applyDamage(targetId, attackResult.totalDamage);
    } else {
      resultText = `Erro! ${formatDiceRoll(attackResult.attackRoll)} vs CA ${target.ac}.`;
    }
    
    addLogEntry({
      round: combatState.round,
      actorId: player.id,
      actorName: player.name,
      action: `usa ${attack.name} contra ${target.name}`,
      result: resultText,
      type: "attack",
    });
    
    return attackResult;
  }, [combatState, applyDamage, addLogEntry]);

  // Execute enemy turn with AI
  const executeEnemyTurn = useCallback(async () => {
    const current = getCurrentCombatant();
    if (!current || current.type === "player") return;
    
    const player = combatState.combatants.find(c => c.type === "player");
    if (!player || !player.isActive) return;
    
    // Get AI decision for enemy action
    const combatInfo = {
      enemyName: current.name,
      enemyHP: current.hp,
      enemyMaxHP: current.maxHp,
      enemyPersonality: current.hp < current.maxHp * 0.3 ? "desesperado" : "agressivo",
      playerPositions: [`${player.name} (HP: ${player.hp}/${player.maxHp})`],
    };
    
    const history = combatState.log.slice(-5).map(entry => ({
      role: "assistant" as const,
      content: `${entry.actorName} ${entry.action}: ${entry.result}`,
    }));
    
    // Get AI decision
    let aiDecision = await getCombatDecision(combatInfo, history);
    
    // Default to attack if AI fails
    if (!aiDecision || typeof aiDecision === "string") {
      aiDecision = { acao: "atacar", alvo: player.name, descricao: "ataca ferozmente" };
    }
    
    const decision = aiDecision as { acao: string; alvo: string; descricao?: string };
    
    // Execute the action based on AI decision
    if (decision.acao === "fugir" && current.hp < current.maxHp * 0.2) {
      addLogEntry({
        round: combatState.round,
        actorId: current.id,
        actorName: current.name,
        action: "tenta fugir",
        result: decision.descricao || "O inimigo foge do combate!",
        type: "movement",
      });
      
      setCombatState(prev => ({
        ...prev,
        combatants: prev.combatants.map(c => 
          c.id === current.id ? { ...c, isActive: false } : c
        ),
      }));
    } else if (decision.acao === "defender") {
      addLogEntry({
        round: combatState.round,
        actorId: current.id,
        actorName: current.name,
        action: "se defende",
        result: decision.descricao || "Assume postura defensiva (+2 CA até próximo turno).",
        type: "ability",
      });
    } else {
      // Default: Attack
      const attack = current.attacks[0];
      if (attack && player.isActive) {
        const attackResult = makeAttackRoll(
          attack.attackBonus,
          player.ac,
          attack.damageDice,
          attack.damageBonus
        );
        
        let resultText = "";
        
        if (attackResult.fumble) {
          resultText = `Erro crítico! O ataque falha.`;
        } else if (attackResult.critical) {
          resultText = `CRÍTICO! ${formatDiceRoll(attackResult.attackRoll)} vs CA ${player.ac}. Causa ${attackResult.totalDamage} de dano!`;
          applyDamage(player.id, attackResult.totalDamage);
        } else if (attackResult.hit) {
          resultText = `Acerto! ${formatDiceRoll(attackResult.attackRoll)} vs CA ${player.ac}. Causa ${attackResult.totalDamage} de dano.`;
          applyDamage(player.id, attackResult.totalDamage);
        } else {
          resultText = `Erro! ${formatDiceRoll(attackResult.attackRoll)} vs CA ${player.ac}.`;
        }
        
        addLogEntry({
          round: combatState.round,
          actorId: current.id,
          actorName: current.name,
          action: `usa ${attack.name} contra ${player.name}`,
          result: resultText,
          type: "attack",
        });
      }
    }
  }, [combatState, getCurrentCombatant, getCombatDecision, applyDamage, addLogEntry]);

  // Advance to next turn
  const nextTurn = useCallback(() => {
    setCombatState(prev => {
      // Filter out defeated combatants
      const activeCombatants = prev.combatants.filter(c => c.isActive);
      const activeEnemies = activeCombatants.filter(c => c.type === "enemy");
      const activePlayer = activeCombatants.find(c => c.type === "player");
      
      // Check for combat end
      if (activeEnemies.length === 0) {
        return { ...prev, phase: "victory", isActive: false };
      }
      
      if (!activePlayer) {
        return { ...prev, phase: "defeat", isActive: false };
      }
      
      // Find next active combatant
      let nextIndex = (prev.currentTurnIndex + 1) % prev.turnOrder.length;
      let iterations = 0;
      
      while (iterations < prev.turnOrder.length) {
        const nextId = prev.turnOrder[nextIndex];
        const nextCombatant = prev.combatants.find(c => c.id === nextId);
        
        if (nextCombatant?.isActive) {
          break;
        }
        
        nextIndex = (nextIndex + 1) % prev.turnOrder.length;
        iterations++;
      }
      
      // Check if we completed a round
      const newRound = nextIndex <= prev.currentTurnIndex ? prev.round + 1 : prev.round;
      
      if (newRound > prev.round) {
        addLogEntry({
          round: newRound,
          actorId: "system",
          actorName: "Sistema",
          action: `Rodada ${newRound}`,
          result: "Nova rodada de combate!",
          type: "system",
        });
      }
      
      return {
        ...prev,
        currentTurnIndex: nextIndex,
        round: newRound,
      };
    });
  }, [addLogEntry]);

  // End combat
  const endCombat = useCallback(() => {
    const victory = combatState.phase === "victory";
    setCombatState({
      isActive: false,
      round: 0,
      currentTurnIndex: 0,
      combatants: [],
      turnOrder: [],
      log: [],
      phase: "initiative",
    });
    
    if (options?.onCombatEnd) {
      options.onCombatEnd(victory);
    }
  }, [combatState.phase, options]);

  // Player defends
  const playerDefend = useCallback(() => {
    const player = combatState.combatants.find(c => c.type === "player");
    if (!player) return;
    
    addLogEntry({
      round: combatState.round,
      actorId: player.id,
      actorName: player.name,
      action: "se defende",
      result: "Assume postura defensiva. +2 CA até o próximo turno.",
      type: "ability",
    });
  }, [combatState, addLogEntry]);

  return {
    combatState,
    isLoading: aiLoading,
    startCombat,
    getCurrentCombatant,
    isPlayerTurn,
    playerAttack,
    playerDefend,
    executeEnemyTurn,
    nextTurn,
    endCombat,
    addLogEntry,
  };
};
