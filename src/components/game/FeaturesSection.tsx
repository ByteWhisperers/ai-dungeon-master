import { motion } from "framer-motion";
import { Swords, Map, Users, Brain, Sparkles, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "IA Mestre Inteligente",
    description: "Narrativas dinâmicas que se adaptam às suas escolhas. Cada decisão importa.",
    color: "magic",
  },
  {
    icon: Swords,
    title: "Combate Tático",
    description: "Sistema de combate híbrido com regras fixas e decisões de IA para inimigos.",
    color: "combat",
  },
  {
    icon: Map,
    title: "Mundo Vivo",
    description: "Eventos em cadeia, consequências reais e um mundo que evolui com você.",
    color: "explore",
  },
  {
    icon: Users,
    title: "NPCs Complexos",
    description: "Personagens com personalidades únicas, objetivos e relacionamentos.",
    color: "narrative",
  },
  {
    icon: Sparkles,
    title: "Zero Custo",
    description: "Modelos de IA locais e gratuitos. Aventure-se sem limites de tokens.",
    color: "magic",
  },
  {
    icon: Shield,
    title: "Sistema Completo",
    description: "6 atributos, classes, níveis, magias e equipamentos como num RPG de mesa.",
    color: "explore",
  },
];

const colorClasses = {
  magic: "from-magic to-gold-light text-magic",
  combat: "from-combat to-orange-500 text-combat",
  explore: "from-explore to-emerald-400 text-explore",
  narrative: "from-narrative to-purple-400 text-narrative",
};

const FeaturesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="text-foreground">O Futuro do</span>{" "}
            <span className="text-primary text-glow-magic">RPG</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma experiência tão rica quanto uma mesa humana, com liberdade total 
            e consequências reais para cada ação.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="group relative h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--magic)/0.1)]">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} bg-opacity-10 mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-display font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
