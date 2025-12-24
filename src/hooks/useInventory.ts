import { useState, useCallback } from 'react';
import { Item, InventoryItem, EquippedGear, EquipSlot, calculateCombatBonuses, CombatBonuses } from '@/lib/inventory';

// Starter items for new characters
const STARTER_ITEMS: Partial<Item>[] = [
  {
    id: 'starter-sword',
    name: 'Espada Curta',
    description: 'Uma espada leve e versátil.',
    item_type: 'weapon',
    rarity: 'common',
    damage_dice: '1d6',
    damage_bonus: 0,
    armor_bonus: 0,
    hp_restore: 0,
    temp_strength: 0,
    temp_dexterity: 0,
    temp_constitution: 0,
    value: 10,
    weight: 2,
  },
  {
    id: 'starter-armor',
    name: 'Armadura de Couro',
    description: 'Proteção básica e leve.',
    item_type: 'armor',
    rarity: 'common',
    damage_dice: null,
    damage_bonus: 0,
    armor_bonus: 2,
    hp_restore: 0,
    temp_strength: 0,
    temp_dexterity: 0,
    temp_constitution: 0,
    value: 10,
    weight: 5,
  },
  {
    id: 'starter-potion-1',
    name: 'Poção de Cura Menor',
    description: 'Restaura uma pequena quantidade de vida.',
    item_type: 'potion',
    rarity: 'common',
    damage_dice: null,
    damage_bonus: 0,
    armor_bonus: 0,
    hp_restore: 10,
    temp_strength: 0,
    temp_dexterity: 0,
    temp_constitution: 0,
    value: 5,
    weight: 0.5,
  },
  {
    id: 'starter-potion-2',
    name: 'Poção de Cura Menor',
    description: 'Restaura uma pequena quantidade de vida.',
    item_type: 'potion',
    rarity: 'common',
    damage_dice: null,
    damage_bonus: 0,
    armor_bonus: 0,
    hp_restore: 10,
    temp_strength: 0,
    temp_dexterity: 0,
    temp_constitution: 0,
    value: 5,
    weight: 0.5,
  },
];

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equippedGear, setEquippedGear] = useState<EquippedGear>({
    weapon: null,
    armor: null,
    accessory: null,
  });
  const [gold, setGold] = useState(50);
  const [activeBuffs, setActiveBuffs] = useState<{
    tempStrength: number;
    tempDexterity: number;
    tempConstitution: number;
    turnsRemaining: number;
  }>({
    tempStrength: 0,
    tempDexterity: 0,
    tempConstitution: 0,
    turnsRemaining: 0,
  });

  // Initialize with starter items
  const initializeInventory = useCallback(() => {
    const starterInventory: InventoryItem[] = STARTER_ITEMS.map((item, index) => ({
      id: `inv-${index}`,
      character_id: 'local',
      item_id: item.id!,
      quantity: 1,
      is_equipped: index < 2, // Equip weapon and armor by default
      slot: index === 0 ? 'main_hand' : index === 1 ? 'chest' : null,
      item: item as Item,
    }));

    setInventory(starterInventory);
    setEquippedGear({
      weapon: starterInventory[0],
      armor: starterInventory[1],
      accessory: null,
    });
  }, []);

  // Equip an item
  const equipItem = useCallback((inventoryItem: InventoryItem) => {
    const itemType = inventoryItem.item.item_type;
    let slot: EquipSlot = null;

    if (itemType === 'weapon') slot = 'main_hand';
    else if (itemType === 'armor') slot = 'chest';
    else if (itemType === 'accessory') slot = 'accessory';
    else return; // Can't equip potions/consumables

    setInventory(prev => prev.map(inv => {
      if (inv.id === inventoryItem.id) {
        return { ...inv, is_equipped: true, slot };
      }
      // Unequip other items in same slot
      if (inv.slot === slot && inv.is_equipped) {
        return { ...inv, is_equipped: false, slot: null };
      }
      return inv;
    }));

    setEquippedGear(prev => {
      const updated = { ...prev };
      if (itemType === 'weapon') updated.weapon = { ...inventoryItem, is_equipped: true, slot };
      else if (itemType === 'armor') updated.armor = { ...inventoryItem, is_equipped: true, slot };
      else if (itemType === 'accessory') updated.accessory = { ...inventoryItem, is_equipped: true, slot };
      return updated;
    });
  }, []);

  // Unequip an item
  const unequipItem = useCallback((inventoryItem: InventoryItem) => {
    setInventory(prev => prev.map(inv => {
      if (inv.id === inventoryItem.id) {
        return { ...inv, is_equipped: false, slot: null };
      }
      return inv;
    }));

    setEquippedGear(prev => {
      const updated = { ...prev };
      if (updated.weapon?.id === inventoryItem.id) updated.weapon = null;
      if (updated.armor?.id === inventoryItem.id) updated.armor = null;
      if (updated.accessory?.id === inventoryItem.id) updated.accessory = null;
      return updated;
    });
  }, []);

  // Use a consumable (potion)
  const useConsumable = useCallback((inventoryItem: InventoryItem): {
    hpRestored: number;
    buffsApplied: { str: number; dex: number; con: number };
  } | null => {
    const item = inventoryItem.item;
    if (item.item_type !== 'potion' && item.item_type !== 'consumable') return null;

    // Remove or decrease quantity
    setInventory(prev => {
      const updated = prev.map(inv => {
        if (inv.id === inventoryItem.id) {
          if (inv.quantity <= 1) return null;
          return { ...inv, quantity: inv.quantity - 1 };
        }
        return inv;
      }).filter(Boolean) as InventoryItem[];
      return updated;
    });

    // Apply buffs if any
    if (item.temp_strength || item.temp_dexterity || item.temp_constitution) {
      setActiveBuffs({
        tempStrength: item.temp_strength,
        tempDexterity: item.temp_dexterity,
        tempConstitution: item.temp_constitution,
        turnsRemaining: 3, // Buffs last 3 turns
      });
    }

    return {
      hpRestored: item.hp_restore,
      buffsApplied: {
        str: item.temp_strength,
        dex: item.temp_dexterity,
        con: item.temp_constitution,
      },
    };
  }, []);

  // Add item to inventory
  const addItem = useCallback((item: Item, quantity: number = 1) => {
    setInventory(prev => {
      // Check if item already exists
      const existing = prev.find(inv => inv.item.id === item.id && !inv.is_equipped);
      if (existing) {
        return prev.map(inv => 
          inv.id === existing.id 
            ? { ...inv, quantity: inv.quantity + quantity }
            : inv
        );
      }
      
      // Add new item
      return [...prev, {
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        character_id: 'local',
        item_id: item.id,
        quantity,
        is_equipped: false,
        slot: null,
        item,
      }];
    });
  }, []);

  // Remove item from inventory
  const removeItem = useCallback((inventoryItemId: string, quantity: number = 1) => {
    setInventory(prev => {
      return prev.map(inv => {
        if (inv.id === inventoryItemId) {
          if (inv.quantity <= quantity) return null;
          return { ...inv, quantity: inv.quantity - quantity };
        }
        return inv;
      }).filter(Boolean) as InventoryItem[];
    });
  }, []);

  // Decrement buff turns
  const decrementBuffTurns = useCallback(() => {
    setActiveBuffs(prev => {
      if (prev.turnsRemaining <= 1) {
        return { tempStrength: 0, tempDexterity: 0, tempConstitution: 0, turnsRemaining: 0 };
      }
      return { ...prev, turnsRemaining: prev.turnsRemaining - 1 };
    });
  }, []);

  // Get total combat bonuses
  const getCombatBonuses = useCallback((): CombatBonuses => {
    const gearBonuses = calculateCombatBonuses(equippedGear);
    return {
      ...gearBonuses,
      tempStrength: activeBuffs.tempStrength,
      tempDexterity: activeBuffs.tempDexterity,
      tempConstitution: activeBuffs.tempConstitution,
    };
  }, [equippedGear, activeBuffs]);

  // Add gold
  const addGold = useCallback((amount: number) => {
    setGold(prev => prev + amount);
  }, []);

  // Spend gold
  const spendGold = useCallback((amount: number): boolean => {
    if (gold < amount) return false;
    setGold(prev => prev - amount);
    return true;
  }, [gold]);

  // Get potions only
  const getPotions = useCallback(() => {
    return inventory.filter(inv => inv.item.item_type === 'potion' || inv.item.item_type === 'consumable');
  }, [inventory]);

  return {
    inventory,
    equippedGear,
    gold,
    activeBuffs,
    initializeInventory,
    equipItem,
    unequipItem,
    useConsumable,
    addItem,
    removeItem,
    getCombatBonuses,
    decrementBuffTurns,
    addGold,
    spendGold,
    getPotions,
  };
};
