// Dice rolling utilities for the RPG combat system

export interface DiceRoll {
  dice: string; // e.g., "1d20", "2d6+3"
  rolls: number[];
  modifier: number;
  total: number;
}

export interface AttackRoll {
  attackRoll: DiceRoll;
  hit: boolean;
  critical: boolean;
  fumble: boolean;
  damageRoll?: DiceRoll;
  totalDamage: number;
}

// Parse dice notation like "2d6+3" or "1d20"
export const parseDiceNotation = (notation: string): { count: number; sides: number; modifier: number } => {
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
};

// Roll a single die
export const rollDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1;
};

// Roll dice with notation like "2d6+3"
export const rollDice = (notation: string): DiceRoll => {
  const { count, sides, modifier } = parseDiceNotation(notation);
  const rolls: number[] = [];
  
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides));
  }
  
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  
  return {
    dice: notation,
    rolls,
    modifier,
    total,
  };
};

// Roll d20 with modifier
export const rollD20 = (modifier: number = 0): DiceRoll => {
  const roll = rollDie(20);
  return {
    dice: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
    rolls: [roll],
    modifier,
    total: roll + modifier,
  };
};

// Calculate attribute modifier (D&D style)
export const getAttributeModifier = (value: number): number => {
  return Math.floor((value - 10) / 2);
};

// Make an attack roll
export const makeAttackRoll = (
  attackBonus: number,
  targetAC: number,
  damageDice: string = "1d6",
  damageBonus: number = 0
): AttackRoll => {
  const attackRoll = rollD20(attackBonus);
  const naturalRoll = attackRoll.rolls[0];
  
  const critical = naturalRoll === 20;
  const fumble = naturalRoll === 1;
  const hit = critical || (!fumble && attackRoll.total >= targetAC);
  
  let damageRoll: DiceRoll | undefined;
  let totalDamage = 0;
  
  if (hit) {
    damageRoll = rollDice(damageDice);
    totalDamage = damageRoll.total + damageBonus;
    
    // Double damage on critical
    if (critical) {
      const critDamage = rollDice(damageDice);
      totalDamage += critDamage.total;
      damageRoll.rolls.push(...critDamage.rolls);
    }
    
    // Minimum 1 damage on hit
    totalDamage = Math.max(1, totalDamage);
  }
  
  return {
    attackRoll,
    hit,
    critical,
    fumble,
    damageRoll,
    totalDamage,
  };
};

// Roll initiative
export const rollInitiative = (dexterityModifier: number): number => {
  return rollD20(dexterityModifier).total;
};

// Format dice roll for display
export const formatDiceRoll = (roll: DiceRoll): string => {
  const rollsStr = roll.rolls.join(' + ');
  const modStr = roll.modifier !== 0 
    ? ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}` 
    : '';
  return `[${rollsStr}]${modStr} = ${roll.total}`;
};
