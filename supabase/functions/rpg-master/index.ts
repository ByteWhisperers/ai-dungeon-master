import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Simple in-memory cache for the function's lifetime
const CACHE = new Map<string, { content: any, expiry: number }>();
const CACHE_TTL_SECONDS = 3600; // 1 hour

const getCacheKey = (type: string, messages: any[], context: any): string => {
  // Only cache non-combat, non-NPC responses for now, as they are more context-dependent
  if (type === "combat" || type === "npc") {
    return ""; // Do not cache
  }
  
  // Use a simple hash of the request body for the key
  const relevantData = { type, messages, context };
  return JSON.stringify(relevantData);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompts for different AI agents
const CLASSIFY_PROMPT = `Você é um Classificador de Intenções de RPG. Sua única função é analisar a última mensagem do jogador e determinar a intenção principal.

INTENÇÕES POSSÍVEIS:
- narrative: O jogador está descrevendo uma ação de exploração, movimento, ou uma ação que requer narração do Mestre (ex: "Eu entro na taverna", "Eu tento escalar a parede").
- combat: O jogador está realizando uma ação tática ou de ataque durante um combate (ex: "Eu ataco o goblin com minha espada", "Eu lanço Mísseis Mágicos").
- npc: O jogador está falando diretamente com um NPC (ex: "Bom dia, mercador. Quanto custa esta poção?").
- world: O jogador está tentando interagir com o ambiente ou obter informações sobre o mundo (ex: "Eu procuro por armadilhas", "Eu tento arrombar a porta").

FORMATO DE RESPOSTA (JSON):
{
  "intent": "narrative|combat|npc|world",
  "reason": "Breve justificativa para a escolha"
}`;
const SYSTEM_PROMPTS = {
  classify: CLASSIFY_PROMPT,
  narrative: `Você é um Mestre de RPG experiente e criativo. Sua função é narrar a história de forma imersiva e envolvente.

REGRAS DE NARRAÇÃO:
- Narre em segunda pessoa ("Você entra...", "Você vê...")
- Use 2-4 frases curtas e impactantes
- Inclua detalhes sensoriais (som, cheiro, visão)
- Use **negrito** para destacar elementos importantes (nomes, locais, objetos)
- NUNCA assuma ações do jogador
- Reaja logicamente às ações do jogador
- Mantenha consistência com eventos anteriores
- Crie tensão e mistério quando apropriado

FORMATO DE RESPOSTA:
Responda APENAS com a narração, sem prefixos ou explicações.`,

  combat: `Você é o sistema de combate de um RPG. Analise a situação e determine a melhor ação para o inimigo.

REGRAS DE COMBATE:
- Considere a personalidade e inteligência do inimigo
- Se HP < 30%, priorize sobrevivência (fugir, defender, curar)
- Inimigos inteligentes focam alvos fracos
- Inimigos bestiais atacam o mais próximo
- Considere posicionamento tático

FORMATO DE RESPOSTA (JSON):
{
  "acao": "atacar|defender|habilidade|mover|fugir",
  "alvo": "nome_do_alvo",
  "habilidade": "nome_se_aplicavel",
  "descricao": "breve descrição narrativa da ação"
}`,

  npc: `Você é um NPC em um RPG de fantasia medieval. Responda como o personagem, mantendo sua personalidade única.

REGRAS DE DIÁLOGO:
- Fale em primeira pessoa como o NPC
- Mantenha a personalidade e motivações do personagem
- Use vocabulário apropriado ao personagem
- Revele informações gradualmente
- Reaja às ações e palavras do jogador
- Pode ter segredos, medos, desejos
- Use **negrito** para ênfase dramática

FORMATO DE RESPOSTA:
Responda APENAS com a fala do NPC, entre aspas se necessário.`,

  world: `Você gerencia as reações do mundo em um RPG. Determine consequências de ações e eventos ambientais.

REGRAS DO MUNDO:
- Consequências lógicas para ações
- Clima e ambiente afetam situações
- NPCs reagem a reputação do jogador
- Eventos em cadeia são possíveis
- Mantenha consistência temporal

FORMATO DE RESPOSTA (JSON):
{
  "consequencias_imediatas": ["lista de efeitos"],
  "consequencias_futuras": ["eventos que podem ocorrer depois"],
  "mudancas_mundo": {"local": "mudança"},
  "reacoes_npcs": {"npc": "reação"}
}`
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  type: "classify" | "narrative" | "combat" | "npc" | "world";
  messages: ChatMessage[];
  context?: {
    location?: string;
    characters?: string[];
    recentEvents?: string[];
    npcInfo?: {
      name: string;
      personality: string;
      objectives: string[];
    };
    combatInfo?: {
      enemyName: string;
      enemyHP: number;
      enemyMaxHP: number;
      enemyPersonality: string;
      playerPositions: string[];
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body: RequestBody = await req.json();
    const { type, messages, context } = body;
    
    console.log(`Processing ${type} request with ${messages.length} messages`);

    // --- CACHE CHECK ---
    const cacheKey = getCacheKey(type, messages, context);
    if (cacheKey) {
      const cached = CACHE.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        console.log(`Cache hit for ${type} request.`);
        return new Response(JSON.stringify({ 
          response: cached.content,
          type,
          source: "cache"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (cached) {
        // Cache expired
        CACHE.delete(cacheKey);
      }
    }
    // --- END CACHE CHECK ---

    // Build system prompt with context
    let systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.narrative;
    
    // For classification, we want a low temperature and a specific model if possible
    let model = "google/gemini-2.5-flash";
    let temperature = 0.8;
    let isJsonOutput = (type === "combat" || type === "world" || type === "classify");

    if (type === "classify") {
      // Use a more deterministic model/settings for classification
      model = "google/gemini-2.5-flash"; // Keeping the same model for simplicity, but setting low temp
      temperature = 0.1;
    }
    
    // Add context to system prompt if provided
    if (context) {
      let contextStr = "\n\nCONTEXTO ATUAL:";
      if (context.location) contextStr += `\nLocal: ${context.location}`;
      if (context.characters?.length) contextStr += `\nPersonagens presentes: ${context.characters.join(", ")}`;
      if (context.recentEvents?.length) contextStr += `\nEventos recentes: ${context.recentEvents.join("; ")}`;
      
      if (context.npcInfo && type === "npc") {
        contextStr += `\n\nVocê é ${context.npcInfo.name}.`;
        contextStr += `\nPersonalidade: ${context.npcInfo.personality}`;
        contextStr += `\nObjetivos: ${context.npcInfo.objectives.join(", ")}`;
      }
      
      if (context.combatInfo && type === "combat") {
        contextStr += `\n\nInimigo: ${context.combatInfo.enemyName}`;
        contextStr += `\nHP: ${context.combatInfo.enemyHP}/${context.combatInfo.enemyMaxHP}`;
        contextStr += `\nPersonalidade: ${context.combatInfo.enemyPersonality}`;
        contextStr += `\nPosições dos jogadores: ${context.combatInfo.playerPositions.join(", ")}`;
      }
      
      systemPrompt += contextStr;
    }

    // Build messages array
    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        max_tokens: 500,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please wait a moment and try again.",
          code: "RATE_LIMIT"
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI credits exhausted. Please add credits to continue.",
          code: "NO_CREDITS"
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "";
    
    console.log(`Generated ${type} response: ${generatedContent.substring(0, 100)}...`);

    // --- CACHE SET ---
    if (cacheKey) {
      CACHE.set(cacheKey, {
        content: generatedContent,
        expiry: Date.now() + CACHE_TTL_SECONDS * 1000
      });
      console.log(`Cache set for ${type} request.`);
    }
    // --- END CACHE SET ---

    // Parse JSON responses for combat, world, and classify types
    let parsedResponse = generatedContent;
    if (isJsonOutput) {
      try {
        // Extract JSON from response if wrapped in markdown
        const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                          generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }
      } catch (e) {
        console.log("Could not parse JSON, returning raw response");
        parsedResponse = generatedContent;
      }
    }

    return new Response(JSON.stringify({ 
      response: parsedResponse,
      type,
      source: "ai"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in rpg-master function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
