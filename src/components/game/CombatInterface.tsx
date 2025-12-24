import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Swords, Shield, Heart, Zap, Target, SkullIcon, Trophy, ArrowRight } from "lucide-react";
import { useCombat } from "@/hooks/useCombat";
import { Combatant, Attack, ENEMY_TEMPLATES } from "@/lib/combat";

interface CombatInterfaceProps {
  character: {
    name: string;
    class: string;
    level: number;
    hp: { current: number; max: number };
    attributes: Record<string, number>;
  };
  enemies: string[]; // Array of enemy template IDs
  onCombatEnd: (victory: boolean, xpGained: number) => void;
  onPlayerHpChange: (newHp: number) => void;
}

const CombatInterface = ({ character, enemies, onCombatEnd, onPlayerHpChange }: CombatInterfaceProps) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedAttack, setSelectedAttack] = useState<Attack | null>(null);
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  
  const {
    combatState,
    isLoading,
    startCombat,
    getCurrentCombatant,
    isPlayerTurn,
    playerAttack,
    playerDefend,
    executeEnemyTurn,
    nextTurn,
    endCombat,
  } = useCombat({
    onCombatEnd: (victory) => {
      if (victory) {
        setShowVictory(true);
      } else {
        setShowDefeat(true);
      }
    },
    onPlayerDamaged: (damage, newHp) => {
      onPlayerHpChange(newHp);
    },
  });

  // Start combat on mount
  useEffect(() => {
    if (!combatState.isActive) {
      startCombat(character, enemies);
    }
  }, []);

  // Auto-execute enemy turns
  useEffect(() => {
    if (combatState.isActive && combatState.phase === "combat" && !isPlayerTurn() && !isLoading) {
      const timer = setTimeout(async () => {
        await executeEnemyTurn();
        setTimeout(() => nextTurn(), 800);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [combatState.currentTurnIndex, combatState.isActive, isLoading]);

  // Handle player attack
  const handleAttack = () => {
    if (!selectedTarget || !selectedAttack) return;
    
    playerAttack(selectedTarget, selectedAttack);
    setSelectedTarget(null);
    setSelectedAttack(null);
    
    setTimeout(() => nextTurn(), 500);
  };

  // Handle defend
  const handleDefend = () => {
    playerDefend();
    setTimeout(() => nextTurn(), 500);
  };

  // Calculate XP reward
  const calculateXP = () => {
    return enemies.reduce((total, enemyId) => {
      const template = ENEMY_TEMPLATES[enemyId];
      return total + (template?.maxHp || 10) * 5;
    }, 0);
  };

  const currentCombatant = getCurrentCombatant();
  const player = combatState.combatants.find(c => c.type === "player");
  const activeEnemies = combatState.combatants.filter(c => c.type === "enemy" && c.isActive);

  // Victory/Defeat screens
  if (showVictory) {
    const xpGained = calculateXP();
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-background/95 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8"
        >
          <Trophy className="w-24 h-24 mx-auto mb-6 text-primary" />
          <h2 className="text-4xl font-display font-bold text-primary text-glow-magic mb-4">
            Vitória!
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            Você derrotou todos os inimigos!
          </p>
          <div className="bg-card border border-primary/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
              <Zap className="w-6 h-6" />
              <span>+{xpGained} XP</span>
            </div>
          </div>
          <Button 
            variant="magic" 
            size="xl"
            onClick={() => {
              endCombat();
              onCombatEnd(true, xpGained);
            }}
          >
            Continuar Aventura
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  if (showDefeat) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-background/95 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8"
        >
          <SkullIcon className="w-24 h-24 mx-auto mb-6 text-combat" />
          <h2 className="text-4xl font-display font-bold text-combat text-glow-combat mb-4">
            Derrotado
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Você caiu em batalha...
          </p>
          <Button 
            variant="combat" 
            size="xl"
            onClick={() => {
              endCombat();
              onCombatEnd(false, 0);
            }}
          >
            Tentar Novamente
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-40 flex flex-col">
      {/* Combat Header */}
      <header className="bg-card border-b border-combat/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="w-6 h-6 text-combat" />
            <span className="font-display font-bold text-lg">COMBATE</span>
            <span className="text-sm text-muted-foreground">Rodada {combatState.round}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlayerTurn() ? "bg-explore" : "bg-combat animate-pulse"}`} />
            <span className="text-sm">
              {isPlayerTurn() ? "Seu turno" : `Turno: ${currentCombatant?.name || "..."}`}
            </span>
          </div>
        </div>
      </header>

      {/* Combat Arena */}
      <div className="flex-1 flex">
        {/* Left Panel - Player */}
        <div className="w-72 bg-card/50 border-r border-border/50 p-4 flex flex-col">
          {player && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-display font-bold text-primary-foreground">
                    {player.name[0]}
                  </span>
                </div>
                <div>
                  <div className="font-display font-semibold text-foreground">{player.name}</div>
                  <div className="text-sm text-muted-foreground">CA: {player.ac}</div>
                </div>
              </div>

              {/* Player HP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-combat">
                    <Heart className="w-4 h-4" /> HP
                  </span>
                  <span className="text-foreground font-bold">{player.hp}/{player.maxHp}</span>
                </div>
                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-combat to-orange-500"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Player Actions */}
          {isPlayerTurn() && player?.isActive && (
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Ataques</h3>
              {player.attacks.map((attack, i) => (
                <Button
                  key={i}
                  variant={selectedAttack?.name === attack.name ? "magic" : "outline"}
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedAttack(attack)}
                >
                  <Swords className="w-4 h-4 mr-2" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{attack.name}</div>
                    <div className="text-xs text-muted-foreground">
                      +{attack.attackBonus} | {attack.damageDice}{attack.damageBonus > 0 ? `+${attack.damageBonus}` : ""}
                    </div>
                  </div>
                </Button>
              ))}
              
              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDefend}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Defender (+2 CA)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Center - Battlefield */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Enemies */}
          <div className="flex-1 flex items-center justify-center gap-6">
            <AnimatePresence>
              {combatState.combatants.filter(c => c.type === "enemy").map((enemy) => (
                <motion.div
                  key={enemy.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: enemy.isActive ? 1 : 0.8, 
                    opacity: enemy.isActive ? 1 : 0.3 
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={enemy.isActive && isPlayerTurn() ? { scale: 1.05 } : {}}
                  onClick={() => {
                    if (enemy.isActive && isPlayerTurn()) {
                      setSelectedTarget(enemy.id);
                    }
                  }}
                  className={`relative cursor-pointer transition-all ${
                    selectedTarget === enemy.id 
                      ? "ring-4 ring-combat ring-offset-2 ring-offset-background" 
                      : ""
                  } ${!enemy.isActive ? "grayscale" : ""}`}
                >
                  <div className={`w-32 h-32 rounded-xl bg-gradient-to-br from-combat/20 to-combat/5 border-2 ${
                    selectedTarget === enemy.id ? "border-combat" : "border-border/50"
                  } flex items-center justify-center shadow-lg`}>
                    <SkullIcon className={`w-12 h-12 ${enemy.isActive ? "text-combat" : "text-muted-foreground"}`} />
                  </div>
                  
                  <div className="mt-2 text-center">
                    <div className="font-display font-semibold text-foreground">{enemy.name}</div>
                    <div className="text-xs text-muted-foreground">CA: {enemy.ac}</div>
                  </div>
                  
                  {/* Enemy HP Bar */}
                  <div className="mt-2 w-full">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-combat"
                        initial={{ width: "100%" }}
                        animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-muted-foreground">
                      {enemy.hp}/{enemy.maxHp}
                    </div>
                  </div>

                  {/* Current turn indicator */}
                  {currentCombatant?.id === enemy.id && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-combat rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Swords className="w-3 h-3 text-foreground" />
                    </motion.div>
                  )}

                  {/* Defeated overlay */}
                  {!enemy.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-combat">DERROTADO</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Attack Button */}
          {isPlayerTurn() && selectedTarget && selectedAttack && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-4"
            >
              <Button 
                variant="combat" 
                size="xl" 
                onClick={handleAttack}
                className="gap-2"
              >
                <Target className="w-5 h-5" />
                Atacar com {selectedAttack.name}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Right Panel - Combat Log */}
        <div className="w-80 bg-card/50 border-l border-border/50 flex flex-col">
          <div className="p-3 border-b border-border/50">
            <h3 className="font-display font-semibold text-sm">Log de Combate</h3>
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {combatState.log.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-sm p-2 rounded-lg ${
                    entry.type === "attack" 
                      ? "bg-combat/10 border border-combat/20"
                      : entry.type === "system"
                      ? "bg-secondary/50"
                      : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <span>R{entry.round}</span>
                    <span>•</span>
                    <span className="font-medium text-foreground">{entry.actorName}</span>
                  </div>
                  <div className="text-foreground">{entry.action}</div>
                  <div className={`text-xs mt-1 ${
                    entry.result.includes("CRÍTICO") ? "text-primary font-bold" :
                    entry.result.includes("Erro") ? "text-muted-foreground" :
                    entry.result.includes("Acerto") ? "text-explore" :
                    "text-muted-foreground"
                  }`}>
                    {entry.result}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default CombatInterface;
