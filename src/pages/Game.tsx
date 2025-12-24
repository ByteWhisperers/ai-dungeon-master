import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Swords, Map, Users, Menu, Heart, Shield, Zap, Settings, LogOut, Package, Coins } from "lucide-react";
import { useRPGMaster } from "@/hooks/useRPGMaster";
import { useInventory } from "@/hooks/useInventory";
import CombatInterface from "@/components/game/CombatInterface";
import InventoryPanel from "@/components/game/InventoryPanel";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: "narrative" | "player" | "combat" | "system";
  content: string;
  timestamp: Date;
}

interface CharacterStats {
  name: string;
  class: string;
  level: number;
  hp: { current: number; max: number };
  xp: { current: number; next: number };
  attributes: Record<string, number>;
}

const INITIAL_CONTEXT = {
  location: "Taverna do Porco Embriagado",
  characters: ["Boris (taverneiro)", "Forasteiro misterioso"],
  recentEvents: ["Jogador acabou de entrar na taverna"]
};

// Demo combat scenarios
const COMBAT_SCENARIOS: Record<string, { enemies: string[]; trigger: string }> = {
  wolves: { enemies: ["wolf", "wolf"], trigger: "floresta" },
  bandits: { enemies: ["bandit", "bandit"], trigger: "bandido" },
  goblins: { enemies: ["goblin", "goblin", "goblin"], trigger: "goblin" },
  skeleton: { enemies: ["skeleton"], trigger: "esqueleto" },
};

const Game = () => {
  const { narrate, isLoading, error } = useRPGMaster();
  const inventoryHook = useInventory();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "narrative",
      content: "Você empurra a pesada porta de carvalho e entra na **Taverna do Porco Embriagado**. O ar está denso com fumaça de cachimbo e o aroma de cerveja forte. Tochas bruxuleantes projetam sombras dançantes nas paredes de pedra decoradas com runas antigas.\n\nNo balcão, um homem corpulento limpa canecas com um pano surrado. Nos cantos, figuras encapuzadas conversam em sussurros. Um estranho no canto mais escuro parece observá-lo com interesse.",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "system",
      content: "🎮 Bem-vindo! Digite suas ações ou use os botões rápidos. O Mestre IA está pronto!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [context, setContext] = useState(INITIAL_CONTEXT);
  const [inCombat, setInCombat] = useState(false);
  const [combatEnemies, setCombatEnemies] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [character, setCharacter] = useState<CharacterStats>({
    name: "Aldric",
    class: "Guerreiro",
    level: 1,
    hp: { current: 12, max: 12 },
    xp: { current: 0, next: 300 },
    attributes: { FOR: 16, DES: 14, CON: 14, INT: 10, SAB: 12, CAR: 13 },
  });

  // Initialize inventory on mount
  useEffect(() => {
    inventoryHook.initializeInventory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check for combat triggers
  const checkCombatTrigger = (text: string): string[] | null => {
    const lowerText = text.toLowerCase();
    for (const [key, scenario] of Object.entries(COMBAT_SCENARIOS)) {
      if (lowerText.includes(scenario.trigger)) {
        return scenario.enemies;
      }
    }
    // Random combat chance (10%) when exploring
    if (lowerText.includes("explor") || lowerText.includes("caminho") || lowerText.includes("floresta")) {
      if (Math.random() < 0.15) {
        const scenarios = Object.values(COMBAT_SCENARIOS);
        return scenarios[Math.floor(Math.random() * scenarios.length)].enemies;
      }
    }
    return null;
  };

  // Convert messages to chat history format for AI
  const getChatHistory = () => {
    return messages
      .filter(m => m.type === "narrative" || m.type === "player")
      .map(m => ({
        role: m.type === "player" ? "user" as const : "assistant" as const,
        content: m.content
      }));
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    const playerMessage: Message = {
      id: Date.now().toString(),
      type: "player",
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, playerMessage]);
    setInput("");

    // Check for combat trigger
    const enemies = checkCombatTrigger(content);
    if (enemies) {
      // Start combat
      const combatMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "combat",
        content: `⚔️ **COMBATE INICIADO!** Você encontra inimigos hostis!`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, combatMessage]);
      
      setTimeout(() => {
        setCombatEnemies(enemies);
        setInCombat(true);
      }, 1000);
      return;
    }

    // Get AI response
    const history = getChatHistory();
    const response = await narrate(content, history, context);
    
    if (response && typeof response === "string") {
      const narrativeMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "narrative",
        content: response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, narrativeMessage]);
      
      // Update context with recent event
      setContext(prev => ({
        ...prev,
        recentEvents: [
          content,
          ...(prev.recentEvents || []).slice(0, 4)
        ]
      }));
    } else if (!response) {
      // AI failed, add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content: "⚠️ O Mestre IA encontrou um problema. Tente novamente.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle combat end
  const handleCombatEnd = (victory: boolean, xpGained: number) => {
    setInCombat(false);
    setCombatEnemies([]);
    
    if (victory) {
      // Add XP
      const newXp = character.xp.current + xpGained;
      let newLevel = character.level;
      let newMaxHp = character.hp.max;
      let nextLevelXp = character.xp.next;
      
      // Check for level up
      if (newXp >= character.xp.next) {
        newLevel = character.level + 1;
        newMaxHp = character.hp.max + 5;
        nextLevelXp = Math.floor(character.xp.next * 1.5);
        
        toast({
          title: "LEVEL UP!",
          description: `${character.name} alcançou o nível ${newLevel}!`,
        });
      }
      
      setCharacter(prev => ({
        ...prev,
        xp: { current: newXp, next: nextLevelXp },
        level: newLevel,
        hp: { current: prev.hp.current, max: newMaxHp },
      }));
      
      // Add victory message
      const victoryMessage: Message = {
        id: Date.now().toString(),
        type: "system",
        content: `🏆 Vitória! Você ganhou ${xpGained} XP. Continue sua aventura!`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, victoryMessage]);
    } else {
      // Restore HP on defeat (for demo)
      setCharacter(prev => ({
        ...prev,
        hp: { ...prev.hp, current: Math.floor(prev.hp.max / 2) },
      }));
      
      const defeatMessage: Message = {
        id: Date.now().toString(),
        type: "system",
        content: "💀 Você foi derrotado, mas acorda horas depois com ferimentos leves...",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, defeatMessage]);
    }
  };

  const quickActions = [
    { label: "Falar com Taverneiro", action: "Aproximo-me do taverneiro Boris e pergunto sobre as novidades da região" },
    { label: "Examinar Arredores", action: "Observo cuidadosamente a taverna, procurando por detalhes interessantes ou suspeitos" },
    { label: "Abordar Estranho", action: "Caminho até o estranho encapuzado no canto e pergunto quem ele é e o que faz aqui" },
    { label: "⚔️ Testar Combate", action: "Saio da taverna e exploro a floresta ao norte, onde dizem que lobos atacam viajantes" },
  ];

  const getModifier = (value: number) => {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

  // Handle using item outside combat
  const handleUseItem = (item: typeof inventoryHook.inventory[0]) => {
    const result = inventoryHook.useConsumable(item);
    if (result) {
      if (result.hpRestored > 0) {
        const newHp = Math.min(character.hp.current + result.hpRestored, character.hp.max);
        setCharacter(prev => ({ ...prev, hp: { ...prev.hp, current: newHp } }));
        toast({
          title: "Poção usada!",
          description: `Você recuperou ${result.hpRestored} HP.`,
        });
      }
      if (result.buffsApplied.str || result.buffsApplied.dex || result.buffsApplied.con) {
        toast({
          title: "Buff aplicado!",
          description: `Bônus temporário ativo por 3 turnos.`,
        });
      }
    }
  };

  // Combat overlay
  if (inCombat) {
    return (
      <CombatInterface
        character={character}
        enemies={combatEnemies}
        onCombatEnd={handleCombatEnd}
        onPlayerHpChange={(newHp) => setCharacter(prev => ({ ...prev, hp: { ...prev.hp, current: newHp } }))}
        inventory={inventoryHook}
      />
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="w-72 bg-card border-r border-border/50 flex flex-col"
          >
            {/* Character Card */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-lg">
                  <span className="text-xl font-display font-bold text-primary-foreground">
                    {character.name[0]}
                  </span>
                </div>
                <div>
                  <div className="font-display font-semibold text-foreground">{character.name}</div>
                  <div className="text-sm text-muted-foreground">{character.class} • Nível {character.level}</div>
                </div>
              </div>

              {/* HP Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-combat">
                    <Heart className="w-4 h-4" /> HP
                  </span>
                  <span className="text-foreground">{character.hp.current}/{character.hp.max}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-combat to-orange-500 transition-all"
                    animate={{ width: `${(character.hp.current / character.hp.max) * 100}%` }}
                  />
                </div>
              </div>

              {/* XP Bar */}
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-primary">
                    <Zap className="w-4 h-4" /> XP
                  </span>
                  <span className="text-foreground">{character.xp.current}/{character.xp.next}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-gold transition-all"
                    animate={{ width: `${(character.xp.current / character.xp.next) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="p-4 border-b border-border/50">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Atributos</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(character.attributes).map(([key, value]) => (
                  <div key={key} className="bg-secondary/50 rounded-lg p-2 text-center">
                    <div className="text-xs text-muted-foreground">{key}</div>
                    <div className="text-lg font-bold text-foreground">{value}</div>
                    <div className="text-xs text-primary">{getModifier(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Location */}
            <div className="p-4 border-b border-border/50">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Local Atual</h3>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Map className="w-4 h-4 text-explore" />
                <span>{context.location}</span>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="p-4 flex-1">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Navegação</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                  <Map className="w-4 h-4 text-explore" />
                  <span>Mapa</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                  <Users className="w-4 h-4 text-narrative" />
                  <span>NPCs Conhecidos</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 text-left"
                  onClick={() => setInventoryOpen(true)}
                >
                  <Package className="w-4 h-4 text-primary" />
                  <span>Inventário</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-gold">
                    <Coins className="w-3 h-3" />
                    {inventoryHook.gold}
                  </span>
                </Button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="flex-1">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="flex-1" onClick={() => window.location.href = "/"}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-card/50 border-b border-border/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold">{context.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-magic animate-pulse" : "bg-explore"}`} />
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Mestre narrando..." : "IA Mestre Ativo"}
            </span>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 ${
                  message.type === "narrative" 
                    ? "bg-card border border-border/50" 
                    : message.type === "player"
                    ? "bg-primary/10 border border-primary/30 ml-12"
                    : message.type === "combat"
                    ? "bg-combat/10 border border-combat/30"
                    : "bg-secondary/50 text-center text-sm text-muted-foreground"
                }`}
              >
                {message.type === "narrative" && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Mestre IA</span>
                  </div>
                )}
                {message.type === "player" && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 text-primary" />
                    <span>{character.name}</span>
                  </div>
                )}
                {message.type === "combat" && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-combat">
                    <Swords className="w-3 h-3" />
                    <span>Combate</span>
                  </div>
                )}
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {message.content.split("**").map((part, i) => 
                    i % 2 === 0 ? part : <strong key={i} className="text-primary">{part}</strong>
                  )}
                </p>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm">O Mestre está narrando...</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-border/30">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {quickActions.map((qa, i) => (
              <Button
                key={i}
                variant={qa.label.includes("⚔️") ? "combat" : "outline"}
                size="sm"
                onClick={() => sendMessage(qa.action)}
                disabled={isLoading}
                className="text-xs"
              >
                {qa.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card/50 border-t border-border/50">
          <form 
            className="max-w-3xl mx-auto flex gap-2"
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Descreva sua ação..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} variant="magic">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Inventory Panel */}
      <InventoryPanel
        isOpen={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        inventory={inventoryHook.inventory}
        gold={inventoryHook.gold}
        onEquip={inventoryHook.equipItem}
        onUnequip={inventoryHook.unequipItem}
        onUseItem={handleUseItem}
      />
    </div>
  );
};

export default Game;
