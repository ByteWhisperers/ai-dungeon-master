import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Swords, Github, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--magic)/0.1)_0%,_transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-explore animate-pulse" />
            <span className="text-sm text-primary font-medium">Projeto Open Source</span>
          </motion.div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            <span className="text-foreground">Pronto para</span>
            <br />
            <span className="text-primary text-glow-magic">Sua Aventura?</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Comece sua jornada agora. Crie seu personagem, escolha seu destino
            e deixe a IA guiar você por mundos inexplorados.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/create">
              <Button variant="magic" size="xl" className="group">
                <Swords className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Criar Personagem
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <Github className="w-5 h-5 mr-2" />
              Ver no GitHub
            </Button>
            <Button variant="ghost" size="lg">
              <BookOpen className="w-5 h-5 mr-2" />
              Documentação
            </Button>
          </div>

          {/* Footer Note */}
          <motion.p 
            className="mt-12 text-sm text-muted-foreground/60"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            100% gratuito usando modelos locais · Sem limites de uso · Código aberto
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
