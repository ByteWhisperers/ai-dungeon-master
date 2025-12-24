export type ItemType = 'weapon' | 'armor' | 'potion' | 'accessory' | 'consumable';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EquipSlot = 'main_hand' | 'off_hand' | 'head' | 'chest' | 'legs' | 'feet' | 'accessory' | null;

export interface Item {
  id: string;
  name: string;
  description: string | null;
  item_type: ItemType;
  rarity: ItemRarity;
  damage_dice: string | null;
  damage_bonus: number;
  armor_bonus: number;
  hp_restore: number;
  temp_strength: number;
  temp_dexterity: number;
  temp_constitution: number;
  value: number;
  weight: number;
}

export interface InventoryItem {
  id: string;
  character_id: string;
  item_id: string;
  quantity: number;
  is_equipped: boolean;
  slot: EquipSlot;
  item: Item;
}

export interface EquippedGear {
  weapon: InventoryItem | null;
  armor: InventoryItem | null;
  accessory: InventoryItem | null;
}

export interface CombatBonuses {
  attackBonus: number;
  damageBonus: number;
  damageDice: string;
  armorBonus: number;
  tempStrength: number;
  tempDexterity: number;
  tempConstitution: number;
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-explore',
  rare: 'text-primary',
  epic: 'text-magic',
  legendary: 'text-gold',
};

export const RARITY_BG_COLORS: Record<ItemRarity, string> = {
  common: 'bg-muted/50',
  uncommon: 'bg-explore/20',
  rare: 'bg-primary/20',
  epic: 'bg-magic/20',
  legendary: 'bg-gold/20 border-gold/30',
};

export const ITEM_TYPE_ICONS: Record<ItemType, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  potion: '🧪',
  accessory: '💍',
  consumable: '📦',
};

// Calculate combat bonuses from equipped items
export const calculateCombatBonuses = (equipped: EquippedGear): CombatBonuses => {
  const bonuses: CombatBonuses = {
    attackBonus: 0,
    damageBonus: 0,
    damageDice: '1d4', // Default unarmed
    armorBonus: 0,
    tempStrength: 0,
    tempDexterity: 0,
    tempConstitution: 0,
  };

  if (equipped.weapon?.item) {
    bonuses.damageDice = equipped.weapon.item.damage_dice || '1d4';
    bonuses.damageBonus += equipped.weapon.item.damage_bonus;
  }

  if (equipped.armor?.item) {
    bonuses.armorBonus += equipped.armor.item.armor_bonus;
  }

  if (equipped.accessory?.item) {
    bonuses.armorBonus += equipped.accessory.item.armor_bonus;
    bonuses.damageBonus += equipped.accessory.item.damage_bonus;
  }

  return bonuses;
};

// Parse damage dice string (e.g., "2d6" -> { count: 2, sides: 6 })
export const parseDamageDice = (dice: string): { count: number; sides: number } => {
  const match = dice.match(/(\d+)d(\d+)/);
  if (match) {
    return { count: parseInt(match[1]), sides: parseInt(match[2]) };
  }
  return { count: 1, sides: 4 };
};
