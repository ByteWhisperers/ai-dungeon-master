
-- Create items table (base items catalog)
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('weapon', 'armor', 'potion', 'accessory', 'consumable')),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  -- Weapon stats
  damage_dice TEXT, -- e.g., '1d8', '2d6'
  damage_bonus INTEGER DEFAULT 0,
  -- Armor stats
  armor_bonus INTEGER DEFAULT 0,
  -- Potion/consumable effects
  hp_restore INTEGER DEFAULT 0,
  temp_strength INTEGER DEFAULT 0,
  temp_dexterity INTEGER DEFAULT 0,
  temp_constitution INTEGER DEFAULT 0,
  -- General
  value INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create character inventory table
CREATE TABLE public.character_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  slot TEXT CHECK (slot IN ('main_hand', 'off_hand', 'head', 'chest', 'legs', 'feet', 'accessory', NULL)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (character_id, item_id, slot)
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;

-- Items are readable by everyone (catalog)
CREATE POLICY "Anyone can view items" ON public.items FOR SELECT USING (true);

-- Inventory policies
CREATE POLICY "Users can view own inventory" ON public.character_inventory FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert to own inventory" ON public.character_inventory FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own inventory" ON public.character_inventory FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete from own inventory" ON public.character_inventory FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid()));

-- Insert starter items catalog
INSERT INTO public.items (name, description, item_type, rarity, damage_dice, damage_bonus, value, weight) VALUES
  ('Espada Curta', 'Uma espada leve e versátil.', 'weapon', 'common', '1d6', 0, 10, 2),
  ('Espada Longa', 'Uma espada bem balanceada.', 'weapon', 'common', '1d8', 0, 15, 3),
  ('Machado de Batalha', 'Um machado pesado e devastador.', 'weapon', 'uncommon', '1d10', 0, 25, 4),
  ('Adaga', 'Uma lâmina pequena e rápida.', 'weapon', 'common', '1d4', 0, 5, 1),
  ('Arco Longo', 'Um arco para ataques à distância.', 'weapon', 'common', '1d8', 0, 20, 2),
  ('Cajado Arcano', 'Um cajado que canaliza energia mágica.', 'weapon', 'uncommon', '1d6', 2, 30, 2),
  ('Espada Flamejante', 'Uma espada envolta em chamas eternas.', 'weapon', 'rare', '2d6', 3, 150, 3),
  ('Lâmina das Sombras', 'Uma adaga que absorve a luz.', 'weapon', 'epic', '1d8', 5, 500, 1);

INSERT INTO public.items (name, description, item_type, rarity, armor_bonus, value, weight) VALUES
  ('Armadura de Couro', 'Proteção básica e leve.', 'armor', 'common', 2, 10, 5),
  ('Cota de Malha', 'Anéis de metal entrelaçados.', 'armor', 'common', 4, 30, 15),
  ('Armadura de Placas', 'Proteção pesada de metal.', 'armor', 'uncommon', 6, 75, 30),
  ('Manto do Mago', 'Robes encantadas com proteção mágica.', 'armor', 'uncommon', 3, 50, 3),
  ('Armadura Dracônica', 'Forjada com escamas de dragão.', 'armor', 'rare', 8, 300, 25),
  ('Égide Celestial', 'Armadura abençoada pelos deuses.', 'armor', 'legendary', 10, 1000, 20);

INSERT INTO public.items (name, description, item_type, rarity, hp_restore, value, weight) VALUES
  ('Poção de Cura Menor', 'Restaura uma pequena quantidade de vida.', 'potion', 'common', 10, 5, 0.5),
  ('Poção de Cura', 'Restaura vida moderada.', 'potion', 'common', 25, 15, 0.5),
  ('Poção de Cura Maior', 'Restaura grande quantidade de vida.', 'potion', 'uncommon', 50, 50, 0.5),
  ('Elixir de Vida', 'Restaura vida completamente.', 'potion', 'rare', 100, 200, 0.5);

INSERT INTO public.items (name, description, item_type, rarity, temp_strength, value, weight) VALUES
  ('Poção de Força', 'Aumenta temporariamente a força.', 'potion', 'uncommon', 4, 30, 0.5),
  ('Poção de Força do Gigante', 'Força extraordinária temporária.', 'potion', 'rare', 8, 100, 0.5);

INSERT INTO public.items (name, description, item_type, rarity, temp_dexterity, value, weight) VALUES
  ('Poção de Agilidade', 'Aumenta temporariamente a destreza.', 'potion', 'uncommon', 4, 30, 0.5);
