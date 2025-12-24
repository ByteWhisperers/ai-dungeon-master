import { motion } from "framer-motion";

const attributes = [
  {
    abbr: "FOR",
    name: "Força",
    description: "Ataque corpo-a-corpo, carregar peso",
    color: "bg-combat",
    value: 14,
  },
  {
    abbr: "DES",
    name: "Destreza",
    description: "Ataque à distância, armadilhas, iniciativa",
    color: "bg-explore",
    value: 16,
  },
  {
    abbr: "CON",
    name: "Constituição",
    description: "Pontos de vida, resistência",
    color: "bg-orange-500",
    value: 12,
  },
  {
    abbr: "INT",
    name: "Inteligência",
    description: "Magias, conhecimento, investigação",
    color: "bg-narrative",
    value: 18,
  },
  {
    abbr: "SAB",
    name: "Sabedoria",
    description: "Percepção, intuição, vontade",
    color: "bg-blue-500",
    value: 13,
  },
  {
    abbr: "CAR",
    name: "Carisma",
    description: "Persuasão, engano, liderança",
    color: "bg-magic",
    value: 15,
  },
];

const getModifier = (value: number) => {
  const mod = Math.floor((value - 10) / 2);
  return mod >= 0 ? `+${mod}` : mod.toString();
};

const AttributesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-card/30">
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
            <span className="text-foreground">Sistema de</span>{" "}
            <span className="text-primary text-glow-magic">Atributos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            6 atributos base que definem as capacidades do seu personagem.
            Regras clássicas de RPG com cálculos automáticos.
          </p>
        </motion.div>

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {attributes.map((attr, index) => (
            <motion.div
              key={attr.abbr}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative bg-card border border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--magic)/0.15)]">
                {/* Attribute Abbreviation */}
                <div className={`w-12 h-12 mx-auto rounded-full ${attr.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <span className="text-sm font-display font-bold text-background">
                    {attr.abbr}
                  </span>
                </div>
                
                {/* Value */}
                <div className="text-3xl font-display font-bold text-foreground mb-1">
                  {attr.value}
                </div>
                
                {/* Modifier */}
                <div className="text-sm text-primary font-semibold mb-2">
                  {getModifier(attr.value)}
                </div>
                
                {/* Name */}
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {attr.name}
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-popover border border-border rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-xl">
                  <div className="text-sm font-semibold text-foreground mb-1">{attr.name}</div>
                  <div className="text-xs text-muted-foreground">{attr.description}</div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-border" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Combat Formula */}
        <motion.div 
          className="mt-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-display font-semibold mb-4 text-foreground">
              Sistema de Combate
            </h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-secondary/50 rounded-lg px-4 py-2">
                <span className="text-muted-foreground">Ataque:</span>
                <span className="text-primary ml-2 font-mono">d20 + mod</span>
              </div>
              <div className="bg-secondary/50 rounded-lg px-4 py-2">
                <span className="text-muted-foreground">AC:</span>
                <span className="text-explore ml-2 font-mono">10 + DES + armadura</span>
              </div>
              <div className="bg-secondary/50 rounded-lg px-4 py-2">
                <span className="text-muted-foreground">Iniciativa:</span>
                <span className="text-magic ml-2 font-mono">d20 + DES</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AttributesSection;
