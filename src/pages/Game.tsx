import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Swords, Map, Users, Menu, Heart, Shield, Zap, Settings, LogOut } from "lucide-react";
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

const Game = () => {
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
      content: "🎮 Bem-vindo! Digite suas ações ou use os botões rápidos.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [character] = useState<CharacterStats>({
    name: "Aldric",
    class: "Guerreiro",
    level: 1,
    hp: { current: 12, max: 12 },
    xp: { current: 0, next: 300 },
    attributes: { FOR: 16, DES: 14, CON: 14, INT: 10, SAB: 12, CAR: 13 },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    const playerMessage: Message = {
      id: Date.now().toString(),
      type: "player",
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, playerMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in production, this would call the backend)
    setTimeout(() => {
      const responses = [
        "O taverneiro, Boris, levanta os olhos e lhe dá um aceno cansado. \"Bem-vindo, forasteiro. O que posso servir? Temos cerveja, hidromel, e se tiver moedas suficientes... informações.\"\n\nEle limpa o balcão enquanto espera sua resposta, mas você nota que seus olhos se desviam brevemente para o estranho encapuzado no canto.",
        "Você se aproxima do forasteiro misterioso. Quando chega mais perto, ele levanta o rosto, revelando olhos que brilham com um leve tom âmbar. \"Então, você é o tipo que não tem medo do desconhecido,\" ele diz com uma voz rouca. \"Tenho uma proposta que pode interessá-lo. Pessoas têm desaparecido na floresta ao norte. A recompensa é generosa para quem descobrir a verdade.\"",
        "Você examina os arredores com cuidado. [Teste de Percepção: 14 + 1 = 15 - Sucesso!]\n\nVocê nota algumas coisas interessantes: há marcas de garras na base de uma das mesas. O piso perto da lareira parece ter sido substituído recentemente. E o estranho no canto... ele tem uma adaga peculiar na cintura, com runas que brilham sutilmente.",
      ];
      
      const narrativeMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "narrative",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, narrativeMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const quickActions = [
    { label: "Falar com Taverneiro", action: "Aproximo-me do taverneiro e pergunto sobre as novidades locais" },
    { label: "Examinar Arredores", action: "Observo cuidadosamente a taverna em busca de detalhes interessantes" },
    { label: "Abordar Estranho", action: "Caminho até o estranho encapuzado e pergunto quem ele é" },
  ];

  const getModifier = (value: number) => {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

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
                  <div 
                    className="h-full bg-gradient-to-r from-combat to-orange-500 transition-all"
                    style={{ width: `${(character.hp.current / character.hp.max) * 100}%` }}
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
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-gold transition-all"
                    style={{ width: `${(character.xp.current / character.xp.next) * 100}%` }}
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
                <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                  <Swords className="w-4 h-4 text-combat" />
                  <span>Inventário</span>
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
              <span className="font-display font-semibold">Taverna do Porco Embriagado</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-explore animate-pulse" />
            <span className="text-sm text-muted-foreground">IA Mestre Ativo</span>
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
                variant="outline"
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
    </div>
  );
};

export default Game;
