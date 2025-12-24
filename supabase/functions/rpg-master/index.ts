import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompts for different AI agents
const SYSTEM_PROMPTS = {
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
  type: "narrative" | "combat" | "npc" | "world";
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

    // Build system prompt with context
    let systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.narrative;
    
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
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        max_tokens: 500,
        temperature: 0.8,
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

    // Parse JSON responses for combat and world types
    let parsedResponse = generatedContent;
    if (type === "combat" || type === "world") {
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
      type 
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
