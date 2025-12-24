-- Create npcs table
CREATE TABLE public.npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('common', 'important', 'boss')),
    attributes JSONB, -- JSON for D&D attributes (FOR, DES, CON, INT, SAB, CAR)
    objectives JSONB, -- JSON array of objectives
    relations JSONB, -- JSON {character_id: value}
    state TEXT NOT NULL DEFAULT 'alive' CHECK (state IN ('alive', 'dead', 'ally', 'hostile')),
    hidden_variables JSONB, -- JSON for DM-only info
    current_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mundo table
CREATE TABLE public.mundo (
    regiao TEXT PRIMARY KEY,
    estado_politico TEXT,
    clima TEXT,
    recursos JSONB, -- JSON for resources
    eventos_ativos JSONB, -- JSON array of active event IDs/descriptions
    npcs_ativos JSONB, -- JSON array of active NPC IDs
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create eventos table
CREATE TABLE public.eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'combat', 'dialogue', 'exploration', 'system'
    description TEXT NOT NULL,
    players JSONB, -- JSON array of player IDs
    npcs JSONB, -- JSON array of NPC IDs
    location TEXT,
    consequences JSONB, -- JSON array of consequences
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mundo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Policies for npcs (Read-only for players, write for system/DM)
CREATE POLICY "NPCs are readable by all authenticated users" ON public.npcs FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for mundo (Read-only for players, write for system/DM)
CREATE POLICY "World state is readable by all authenticated users" ON public.mundo FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for eventos (Read-only for players in the session, write for system/DM)
CREATE POLICY "Events are readable by session owner" ON public.eventos FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.game_sessions WHERE id = session_id AND user_id = auth.uid()));
CREATE POLICY "Events can be inserted by session owner" ON public.eventos FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.game_sessions WHERE id = session_id AND user_id = auth.uid()));

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON public.npcs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mundo_updated_at BEFORE UPDATE ON public.mundo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
