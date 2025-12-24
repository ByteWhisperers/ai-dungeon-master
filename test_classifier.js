
// Script de teste para simular a chamada ao Classificador de Intenções
// Nota: Este script não executa a Edge Function real, mas simula a lógica de chamada
// e o prompt para validação conceitual.

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

const testCases = [
    "Eu ataco o orc com minha espada longa.",
    "Bom dia, senhor. Você viu alguém suspeito por aqui?",
    "Eu tento usar minha perícia de Furtividade para me esconder atrás do barril.",
    "Eu procuro por qualquer pista de que a porta está trancada.",
    "Eu lanço uma Bola de Fogo no centro do grupo de goblins."
];

console.log("--- Teste do Classificador de Intenções ---");

testCases.forEach((input, index) => {
    const messages = [
        { role: "user", content: input }
    ];
    
    const apiMessages = [
        { role: "system", content: CLASSIFY_PROMPT },
        ...messages
    ];

    console.log(`\n[Caso ${index + 1}] Entrada do Jogador: "${input}"`);
    console.log("Mensagens enviadas para a IA (simulação):");
    console.log(JSON.stringify(apiMessages, null, 2));
    
    // Aqui, em um ambiente real, faríamos a chamada à API.
    // Como estamos simulando, vamos apenas pedir à IA para classificar.
});

// Exemplo de como a IA deve responder para o primeiro caso:
/*
{
  "intent": "combat",
  "reason": "A frase contém uma ação de ataque ('Eu ataco') e um alvo ('o orc') com uma arma ('minha espada longa'), indicando uma ação de combate."
}
*/
