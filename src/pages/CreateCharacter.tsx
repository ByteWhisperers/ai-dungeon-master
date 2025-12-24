import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Sparkles, Sword, Wand2, Shield, Heart, Dices, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AttributeName = "FOR" | "DES" | "CON" | "INT" | "SAB" | "CAR";

interface Character {
  name: string;
  class: string;
  attributes: Record<AttributeName, number>;
  background: string;
}

const classes = [
  { id: "warrior", name: "Guerreiro", icon: Sword, description: "Mestre do combate corpo-a-corpo", primaryAttr: "FOR" },
  { id: "mage", name: "Mago", icon: Wand2, description: "Manipulador das artes arcanas", primaryAttr: "INT" },
  { id: "paladin", name: "Paladino", icon: Shield, description: "Guerreiro sagrado com poderes divinos", primaryAttr: "CAR" },
  { id: "rogue", name: "Ladino", icon: Heart, description: "Especialista em furtividade e precisão", primaryAttr: "DES" },
];

const attributeInfo: Record<AttributeName, { name: string; description: string; color: string }> = {
  FOR: { name: "Força", description: "Ataque corpo-a-corpo, carregar peso", color: "bg-combat" },
  DES: { name: "Destreza", description: "Ataque à distância, iniciativa", color: "bg-explore" },
  CON: { name: "Constituição", description: "Pontos de vida, resistência", color: "bg-orange-500" },
  INT: { name: "Inteligência", description: "Magias, conhecimento", color: "bg-narrative" },
  SAB: { name: "Sabedoria", description: "Percepção, intuição", color: "bg-blue-500" },
  CAR: { name: "Carisma", description: "Persuasão, liderança", color: "bg-magic" },
};

const CreateCharacter = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState<Character>({
    name: "",
    class: "",
    attributes: { FOR: 10, DES: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 },
    background: "",
  });
  const [pointsRemaining, setPointsRemaining] = useState(27);

  const rollAttributes = () => {
    const roll = () => {
      const rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      return rolls.slice(0, 3).reduce((a, b) => a + b, 0);
    };

    const newAttrs = {
      FOR: roll(),
      DES: roll(),
      CON: roll(),
      INT: roll(),
      SAB: roll(),
      CAR: roll(),
    };
    
    setCharacter(prev => ({ ...prev, attributes: newAttrs }));
    setPointsRemaining(0);
    toast({
      title: "Dados rolados!",
      description: "Seus atributos foram determinados pelo destino.",
    });
  };

  const adjustAttribute = (attr: AttributeName, delta: number) => {
    const current = character.attributes[attr];
    const newValue = current + delta;
    
    if (newValue < 8 || newValue > 15) return;
    
    const cost = delta > 0 ? (newValue > 13 ? 2 : 1) : (current > 13 ? -2 : -1);
    
    if (delta > 0 && pointsRemaining < cost) return;
    
    setCharacter(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: newValue }
    }));
    setPointsRemaining(prev => prev - cost);
  };

  const getModifier = (value: number) => {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

  const canProceed = () => {
    if (step === 1) return character.name.length >= 2;
    if (step === 2) return character.class !== "";
    if (step === 3) return true;
    return true;
  };

  const handleFinish = () => {
    toast({
      title: "Personagem criado!",
      description: `${character.name}, o ${classes.find(c => c.id === character.class)?.name}, está pronto para aventura!`,
    });
    navigate("/game");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 border-b border-border/50 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              RPG<span className="text-primary">Mestre</span>
            </span>
          </a>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s < step ? "bg-primary text-primary-foreground" :
                  s === step ? "bg-primary/20 border-2 border-primary text-primary" :
                  "bg-secondary text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Step 1: Name */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h1 className="text-4xl font-display font-bold mb-4">
              <span className="text-foreground">Como você se</span>{" "}
              <span className="text-primary text-glow-magic">chama?</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Todo herói precisa de um nome. O seu será lembrado pelas eras.
            </p>
            
            <div className="max-w-md mx-auto">
              <Input
                value={character.name}
                onChange={e => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome do personagem"
                className="text-center text-xl h-14 font-display"
              />
            </div>
          </motion.div>
        )}

        {/* Step 2: Class */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h1 className="text-4xl font-display font-bold mb-4 text-center">
              <span className="text-foreground">Escolha sua</span>{" "}
              <span className="text-primary text-glow-magic">Classe</span>
            </h1>
            <p className="text-muted-foreground mb-8 text-center">
              Cada classe define seu estilo de combate e habilidades únicas.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {classes.map(cls => (
                <motion.button
                  key={cls.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCharacter(prev => ({ ...prev, class: cls.id }))}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    character.class === cls.id 
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--magic)/0.2)]"
                      : "border-border/50 bg-card/50 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-magic/20 flex items-center justify-center ${
                      character.class === cls.id ? "text-primary" : "text-muted-foreground"
                    }`}>
                      <cls.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg text-foreground">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">{cls.description}</p>
                      <span className="text-xs text-primary mt-2 inline-block">
                        Atributo principal: {cls.primaryAttr}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Attributes */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h1 className="text-4xl font-display font-bold mb-4 text-center">
              <span className="text-foreground">Defina seus</span>{" "}
              <span className="text-primary text-glow-magic">Atributos</span>
            </h1>
            <p className="text-muted-foreground mb-4 text-center">
              Distribua pontos ou role os dados para determinar suas capacidades.
            </p>
            
            <div className="flex justify-center mb-8">
              <Button variant="outline" onClick={rollAttributes} className="gap-2">
                <Dices className="w-4 h-4" />
                Rolar Dados (4d6 drop lowest)
              </Button>
            </div>
            
            {pointsRemaining > 0 && (
              <div className="text-center mb-6">
                <span className="text-sm text-muted-foreground">Pontos restantes: </span>
                <span className="text-xl font-bold text-primary">{pointsRemaining}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {(Object.keys(attributeInfo) as AttributeName[]).map(attr => (
                <div key={attr} className="bg-card border border-border/50 rounded-xl p-4 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full ${attributeInfo[attr].color} flex items-center justify-center mb-2`}>
                    <span className="text-xs font-bold text-background">{attr}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <button
                      onClick={() => adjustAttribute(attr, -1)}
                      className="w-8 h-8 rounded bg-secondary hover:bg-secondary/80 text-foreground font-bold disabled:opacity-50"
                      disabled={character.attributes[attr] <= 8 || pointsRemaining === 0}
                    >
                      -
                    </button>
                    <span className="text-2xl font-display font-bold text-foreground w-10">
                      {character.attributes[attr]}
                    </span>
                    <button
                      onClick={() => adjustAttribute(attr, 1)}
                      className="w-8 h-8 rounded bg-secondary hover:bg-secondary/80 text-foreground font-bold disabled:opacity-50"
                      disabled={character.attributes[attr] >= 15 || pointsRemaining === 0}
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-sm text-primary font-semibold">
                    {getModifier(character.attributes[attr])}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {attributeInfo[attr].name}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h1 className="text-4xl font-display font-bold mb-4">
              <span className="text-foreground">Seu herói está</span>{" "}
              <span className="text-primary text-glow-magic">pronto!</span>
            </h1>
            
            <div className="max-w-md mx-auto bg-card border border-primary/30 rounded-2xl p-8 shadow-[0_0_40px_hsl(var(--magic)/0.15)]">
              <div className="text-3xl font-display font-bold text-foreground mb-2">
                {character.name}
              </div>
              <div className="text-primary mb-6">
                {classes.find(c => c.id === character.class)?.name} • Nível 1
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(attributeInfo) as AttributeName[]).map(attr => (
                  <div key={attr} className="bg-secondary/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">{attr}</div>
                    <div className="text-lg font-bold text-foreground">{character.attributes[attr]}</div>
                    <div className="text-xs text-primary">{getModifier(character.attributes[attr])}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? "Voltar" : "Cancelar"}
          </Button>
          
          {step < 4 ? (
            <Button
              variant="magic"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="magic" onClick={handleFinish} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Iniciar Aventura
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateCharacter;
