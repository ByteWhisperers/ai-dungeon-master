import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_hsl(var(--magic)/0.4)] transition-shadow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              RPG<span className="text-primary">Mestre</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#system" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sistema
            </a>
            <a href="#architecture" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Arquitetura
            </a>
            <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link to="/create">
              <Button variant="default" size="sm">
                Jogar Agora
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div 
            className="md:hidden py-4 border-t border-border/50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#system" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sistema
              </a>
              <a href="#architecture" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Arquitetura
              </a>
              <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </a>
              <Button variant="default" size="sm" className="w-fit">
                Jogar Agora
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
