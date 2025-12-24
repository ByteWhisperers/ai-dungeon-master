import { motion } from "framer-motion";
import { Database, Cpu, MessageSquare, Swords, Map, Users, Sparkles } from "lucide-react";

const agents = [
  { name: "Narrativa", icon: MessageSquare, model: "Zephyr 7B", color: "narrative" },
  { name: "Combate", icon: Swords, model: "Mistral 7B", color: "combat" },
  { name: "Mundo", icon: Map, model: "Zephyr 7B", color: "explore" },
  { name: "NPCs", icon: Users, model: "Phi-2", color: "magic" },
];

const ArchitectureSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="text-foreground">Arquitetura</span>{" "}
            <span className="text-primary text-glow-magic">Modular</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            IAs especializadas que colaboram através de um orquestrador central,
            otimizando custo e performance.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <div className="max-w-4xl mx-auto">
          {/* Interface Layer */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-card border border-border/50 rounded-xl px-8 py-4 text-center">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Interface</div>
              <div className="text-lg font-display font-semibold text-foreground">Jogador</div>
            </div>
          </motion.div>

          {/* Connection Line */}
          <div className="flex justify-center mb-4">
            <div className="w-px h-8 bg-gradient-to-b from-border to-primary/50" />
          </div>

          {/* Orchestrator */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative bg-gradient-to-br from-primary/20 to-magic/10 border-2 border-primary/50 rounded-2xl px-12 py-6 text-center shadow-[0_0_40px_hsl(var(--magic)/0.2)]">
              <Cpu className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-xl font-display font-bold text-primary">Orquestrador</div>
              <div className="text-sm text-muted-foreground mt-1">Classifica · Roteia · Integra</div>
              
              {/* Sparkle Effects */}
              <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-magic animate-pulse" />
              <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-gold animate-pulse" />
            </div>
          </motion.div>

          {/* Connection Lines to Agents */}
          <div className="flex justify-center mb-4">
            <div className="relative w-full max-w-2xl h-8">
              <div className="absolute left-1/2 top-0 w-px h-4 bg-primary/50" />
              <div className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-gradient-to-r from-narrative via-primary to-explore" />
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="absolute top-4 w-px h-4 bg-primary/50"
                  style={{ left: `${12.5 + i * 25}%` }}
                />
              ))}
            </div>
          </div>

          {/* Agents Grid */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {agents.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="group"
              >
                <div className={`bg-card border border-border/50 rounded-xl p-4 text-center hover:border-${agent.color}/30 transition-all duration-300`}>
                  <agent.icon className={`w-6 h-6 mx-auto mb-2 text-${agent.color}`} />
                  <div className="text-sm font-display font-semibold text-foreground">{agent.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">{agent.model}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Connection Line to Database */}
          <div className="flex justify-center mb-4">
            <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-explore/50" />
          </div>

          {/* Database */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-card border border-explore/30 rounded-xl px-10 py-5 text-center">
              <Database className="w-7 h-7 mx-auto mb-2 text-explore" />
              <div className="text-lg font-display font-semibold text-foreground">Banco Central</div>
              <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs">
                <span className="bg-secondary/50 text-muted-foreground px-2 py-1 rounded">Eventos</span>
                <span className="bg-secondary/50 text-muted-foreground px-2 py-1 rounded">Jogadores</span>
                <span className="bg-secondary/50 text-muted-foreground px-2 py-1 rounded">NPCs</span>
                <span className="bg-secondary/50 text-muted-foreground px-2 py-1 rounded">Mundo</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
