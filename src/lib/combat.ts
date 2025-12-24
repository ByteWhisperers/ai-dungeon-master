import { getAttributeModifier, getProficiencyBonus } from "./dice";

export interface Combatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
  attributes: {
    FOR: number;
    DES: number;
    CON: number;
    INT: number;
    SAB: number;
    CAR: number;
  };
  attacks: Attack[];
  abilities: Ability[];
  conditions: Condition[];
  position?: { x: number; y: number };
  isActive: boolean;
  imageUrl?: string;
}

export interface Attack {
  name: string;
  attackBonus: number;
  damageDice: string;
  damageBonus: number;
  damageType: "slashing" | "piercing" | "bludgeoning" | "fire" | "cold" | "lightning" | "poison" | "magic";
  range: "melee" | "ranged";
  description?: string;
}

export interface Ability {
  name: string;
  description: string;
  uses: number;
  maxUses: number;
  rechargeOn?: "short_rest" | "long_rest" | "round";
  effect: AbilityEffect;
}

export interface AbilityEffect {
  type: "damage" | "heal" | "buff" | "debuff" | "special";
  value?: string; // Dice notation or fixed value
  condition?: Condition;
  duration?: number; // In rounds
}

export interface Condition {
  name: string;
  duration: number; // Rounds remaining, -1 for permanent
  effect: string;
}

export interface CombatAction {
  type: "attack" | "ability" | "move" | "defend" | "flee" | "item";
  actor: string; // Combatant ID
  target?: string; // Target combatant ID
  attackName?: string;
  abilityName?: string;
  result?: CombatActionResult;
}

export interface CombatActionResult {
  success: boolean;
  description: string;
  damage?: number;
  healing?: number;
  conditionApplied?: Condition;
  critical?: boolean;
  fumble?: boolean;
  rolls?: string;
}

export interface CombatState {
  isActive: boolean;
  round: number;
  currentTurnIndex: number;
  combatants: Combatant[];
  turnOrder: string[]; // Array of combatant IDs
  log: CombatLogEntry[];
  phase: "initiative" | "combat" | "victory" | "defeat";
}

export interface CombatLogEntry {
  id: string;
  round: number;
  actorId: string;
  actorName: string;
  action: string;
  result: string;
  timestamp: Date;
  type: "attack" | "ability" | "movement" | "condition" | "system";
}

// Enemy templates
export const ENEMY_TEMPLATES: Record<string, Omit<Combatant, "id" | "initiative" | "isActive">> = {
  goblin: {
    name: "Goblin",
    type: "enemy",
    hp: 7,
    maxHp: 7,
    ac: 13,
    attributes: { FOR: 8, DES: 14, CON: 10, INT: 10, SAB: 8, CAR: 8 },
    attacks: [
      {
        name: "Cimitarra",
        attackBonus: 4,
        damageDice: "1d6",
        damageBonus: 2,
        damageType: "slashing",
        range: "melee",
      },
      {
        name: "Arco Curto",
        attackBonus: 4,
        damageDice: "1d6",
        damageBonus: 2,
        damageType: "piercing",
        range: "ranged",
      },
    ],
    abilities: [],
    conditions: [],
  },
  wolf: {
    name: "Lobo",
    type: "enemy",
    hp: 11,
    maxHp: 11,
    ac: 13,
    attributes: { FOR: 12, DES: 15, CON: 12, INT: 3, SAB: 12, CAR: 6 },
    attacks: [
      {
        name: "Mordida",
        attackBonus: 4,
        damageDice: "2d4",
        damageBonus: 2,
        damageType: "piercing",
        range: "melee",
        description: "Se acertar, o alvo deve passar em um teste de Força CD 11 ou cai no chão.",
      },
    ],
    abilities: [
      {
        name: "Táticas de Matilha",
        description: "Vantagem em ataques se aliado adjacente ao alvo.",
        uses: -1,
        maxUses: -1,
        effect: { type: "buff" },
      },
    ],
    conditions: [],
  },
  bandit: {
    name: "Bandido",
    type: "enemy",
    hp: 11,
    maxHp: 11,
    ac: 12,
    attributes: { FOR: 11, DES: 12, CON: 12, INT: 10, SAB: 10, CAR: 10 },
    attacks: [
      {
        name: "Espada Curta",
        attackBonus: 3,
        damageDice: "1d6",
        damageBonus: 1,
        damageType: "piercing",
        range: "melee",
      },
      {
        name: "Besta Leve",
        attackBonus: 3,
        damageDice: "1d8",
        damageBonus: 1,
        damageType: "piercing",
        range: "ranged",
      },
    ],
    abilities: [],
    conditions: [],
  },
  skeleton: {
    name: "Esqueleto",
    type: "enemy",
    hp: 13,
    maxHp: 13,
    ac: 13,
    attributes: { FOR: 10, DES: 14, CON: 15, INT: 6, SAB: 8, CAR: 5 },
    attacks: [
      {
        name: "Espada Curta",
        attackBonus: 4,
        damageDice: "1d6",
        damageBonus: 2,
        damageType: "piercing",
        range: "melee",
      },
      {
        name: "Arco Curto",
        attackBonus: 4,
        damageDice: "1d6",
        damageBonus: 2,
        damageType: "piercing",
        range: "ranged",
      },
    ],
    abilities: [],
    conditions: [],
  },
  orc: {
    name: "Orc",
    type: "enemy",
    hp: 15,
    maxHp: 15,
    ac: 13,
    attributes: { FOR: 16, DES: 12, CON: 16, INT: 7, SAB: 11, CAR: 10 },
    attacks: [
      {
        name: "Machado Grande",
        attackBonus: 5,
        damageDice: "1d12",
        damageBonus: 3,
        damageType: "slashing",
        range: "melee",
      },
      {
        name: "Javelin",
        attackBonus: 5,
        damageDice: "1d6",
        damageBonus: 3,
        damageType: "piercing",
        range: "ranged",
      },
    ],
    abilities: [
      {
        name: "Fúria Agressiva",
        description: "Pode se mover até sua velocidade em direção a um inimigo hostil como ação bônus.",
        uses: -1,
        maxUses: -1,
        effect: { type: "special" },
      },
    ],
    conditions: [],
  },
};

// Create a combatant from template
export const createEnemy = (templateId: string, customName?: string): Combatant => {
  const template = ENEMY_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Enemy template not found: ${templateId}`);
  }
  
  return {
    ...template,
    id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: customName || template.name,
    initiative: 0,
    isActive: true,
  };
};

// Create player combatant from character stats
export const createPlayerCombatant = (character: {
  name: string;
  class: string;
  level: number;
  hp: { current: number; max: number };
  attributes: Record<string, number>;
}): Combatant => {
  const pb = getProficiencyBonus(character.level);
  const forMod = getAttributeModifier(character.attributes.FOR);
  const desMod = getAttributeModifier(character.attributes.DES);
  const intMod = getAttributeModifier(character.attributes.INT);
  
  // Determine weapon based on class and use PB
  const attacks: Attack[] = [];
  
  if (character.class === "Guerreiro" || character.class === "Paladino") {
    // Exemplo: Proficiência em armas marciais
    attacks.push({
      name: "Espada Longa",
      attackBonus: forMod + pb,
      damageDice: "1d8",
      damageBonus: forMod,
      damageType: "slashing",
      range: "melee",
    });
  } else if (character.class === "Ladino") {
    // Exemplo: Proficiência em armas leves (usa DES)
    attacks.push({
      name: "Adaga",
      attackBonus: desMod + pb,
      damageDice: "1d4",
      damageBonus: desMod,
      damageType: "piercing",
      range: "melee",
    });
    attacks.push({
      name: "Arco Curto",
      attackBonus: desMod + pb,
      damageDice: "1d6",
      damageBonus: desMod,
      damageType: "piercing",
      range: "ranged",
    });
  } else if (character.class === "Mago") {
    // Exemplo: Ataque mágico (usa INT + PB)
    attacks.push({
      name: "Raio de Fogo",
      attackBonus: intMod + pb,
      damageDice: "1d10",
      damageBonus: 0, // Dano de magia geralmente não adiciona modificador de atributo
      damageType: "fire",
      range: "ranged",
    });
  }
  
  // Default attack if none
  if (attacks.length === 0) {
    attacks.push({
      name: "Ataque Desarmado",
      attackBonus: forMod + pb,
      damageDice: "1d4",
      damageBonus: forMod,
      damageType: "bludgeoning",
      range: "melee",
    });
  }
  
  // AC: 10 + DEX Mod + Armor Bonus (simplificado para 10 + DEX Mod)
  // O armor bonus virá do inventário, mas por enquanto, simplificamos
  const ac = 10 + desMod; 
  
  return {
    id: "player",
    name: character.name,
    type: "player",
    hp: character.hp.current,
    maxHp: character.hp.max,
    ac: ac,
    initiative: 0,
    attributes: character.attributes as Combatant["attributes"],
    attacks,
    abilities: [],
    conditions: [],
    isActive: true,
  };
};
};
