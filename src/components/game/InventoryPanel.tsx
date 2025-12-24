import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sword, Shield, Sparkles, Coins, Package } from "lucide-react";
import { InventoryItem, RARITY_COLORS, RARITY_BG_COLORS, ITEM_TYPE_ICONS } from "@/lib/inventory";

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  gold: number;
  onEquip: (item: InventoryItem) => void;
  onUnequip: (item: InventoryItem) => void;
  onUseItem: (item: InventoryItem) => void;
}

const InventoryPanel = ({
  isOpen,
  onClose,
  inventory,
  gold,
  onEquip,
  onUnequip,
  onUseItem,
}: InventoryPanelProps) => {
  const weapons = inventory.filter(i => i.item.item_type === 'weapon');
  const armors = inventory.filter(i => i.item.item_type === 'armor');
  const potions = inventory.filter(i => i.item.item_type === 'potion' || i.item.item_type === 'consumable');
  const accessories = inventory.filter(i => i.item.item_type === 'accessory');

  const renderItem = (invItem: InventoryItem) => {
    const item = invItem.item;
    const isEquipped = invItem.is_equipped;
    const isConsumable = item.item_type === 'potion' || item.item_type === 'consumable';

    return (
      <motion.div
        key={invItem.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-lg border ${RARITY_BG_COLORS[item.rarity]} ${
          isEquipped ? 'ring-2 ring-primary' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{ITEM_TYPE_ICONS[item.item_type]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${RARITY_COLORS[item.rarity]}`}>
                {item.name}
              </span>
              {invItem.quantity > 1 && (
                <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                  x{invItem.quantity}
                </span>
              )}
              {isEquipped && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  Equipado
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              {item.damage_dice && (
                <span className="flex items-center gap-1 text-combat">
                  <Sword className="w-3 h-3" />
                  {item.damage_dice}{item.damage_bonus > 0 && `+${item.damage_bonus}`}
                </span>
              )}
              {item.armor_bonus > 0 && (
                <span className="flex items-center gap-1 text-explore">
                  <Shield className="w-3 h-3" />
                  +{item.armor_bonus} CA
                </span>
              )}
              {item.hp_restore > 0 && (
                <span className="flex items-center gap-1 text-healing">
                  ❤️ +{item.hp_restore} HP
                </span>
              )}
              {(item.temp_strength > 0 || item.temp_dexterity > 0) && (
                <span className="flex items-center gap-1 text-magic">
                  <Sparkles className="w-3 h-3" />
                  Buff
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            {isConsumable ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => onUseItem(invItem)}
              >
                Usar
              </Button>
            ) : isEquipped ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => onUnequip(invItem)}
              >
                Desequipar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="magic"
                className="text-xs h-7"
                onClick={() => onEquip(invItem)}
              >
                Equipar
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-display font-bold">Inventário</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gold/20 px-3 py-1.5 rounded-lg">
                  <Coins className="w-4 h-4 text-gold" />
                  <span className="font-bold text-gold">{gold}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Weapons */}
                {weapons.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sword className="w-4 h-4" /> Armas
                    </h3>
                    <div className="space-y-2">
                      {weapons.map(renderItem)}
                    </div>
                  </div>
                )}

                {/* Armor */}
                {armors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Armaduras
                    </h3>
                    <div className="space-y-2">
                      {armors.map(renderItem)}
                    </div>
                  </div>
                )}

                {/* Potions */}
                {potions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      🧪 Poções
                    </h3>
                    <div className="space-y-2">
                      {potions.map(renderItem)}
                    </div>
                  </div>
                )}

                {/* Accessories */}
                {accessories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      💍 Acessórios
                    </h3>
                    <div className="space-y-2">
                      {accessories.map(renderItem)}
                    </div>
                  </div>
                )}

                {inventory.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Seu inventário está vazio</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InventoryPanel;
