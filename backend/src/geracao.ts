import { Client } from "@notionhq/client";
import { GoogleGenAI } from "@google/genai";

// Clientes das APIs externas (chaves vêm do .env, só no servidor — RNF10)
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  notionVersion: "2026-03-11",
});
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// DEBUG temporário — remover depois de diagnosticar
console.log("[DEBUG geracao.ts] GEMINI_API_KEY presente?", !!process.env.GEMINI_API_KEY, "| início:", process.env.GEMINI_API_KEY?.slice(0, 6));
console.log("[DEBUG geracao.ts] NOTION_TOKEN presente?", !!process.env.NOTION_TOKEN, "| início:", process.env.NOTION_TOKEN?.slice(0, 6));

// Princípios de formulação de cartões (Woźniak) — instrução de sistema
const PRINCIPIOS_FORMULACAO = `Você é um especialista em formular flashcards para repetição espaçada, seguindo os princípios de Piotr Woźniak.
Regras:
1. Princípio da informação mínima: cada cartão cobre UM único fato simples.
2. Nunca peça para listar ou enumerar; decomponha em cartões atômicos.
3. Cada pergunta leva a UMA resposta única e inequívoca.
4. Frente e verso o mais curtos possível.
5. Sempre formule como pergunta e resposta diretas. NÃO use marcação de lacuna, chaves ou a sintaxe {{c1::}} do Anki.
6. Use SOMENTE informação presente no conteúdo, não invente.
7. Nada de cartões triviais ou redundantes.
Responda apenas com o JSON pedido, em português do Brasil.`;

// Lista as páginas ("cadernos") acessíveis pela integração
export async function listarCadernos() {
  const resposta = await notion.search({
    filter: { property: "object", value: "page" },
    page_size: 50,
  });

  return resposta.results.map((pagina: any) => {
    // Extrai o título da página (procura a propriedade do tipo "title")
    let titulo = "Sem título";
    const props = pagina.properties || {};
    for (const chave of Object.keys(props)) {
      if (props[chave]?.type === "title") {
        titulo = props[chave].title.map((t: any) => t.plain_text).join("") || titulo;
      }
    }
    return { id: pagina.id, titulo };
  });
}

// Lê o conteúdo textual de uma página do Notion
export async function lerConteudoCaderno(paginaId: string) {
  let blocos: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const resposta = await notion.blocks.children.list({
      block_id: paginaId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocos = blocos.concat(resposta.results);
    cursor = resposta.has_more ? (resposta.next_cursor ?? undefined) : undefined;
  } while (cursor);

  // Extrai o texto de cada bloco
  const texto = blocos
    .map((bloco: any) => {
      const tipo = bloco.type;
      const dados = bloco[tipo];
      if (!dados?.rich_text) return "";
      return dados.rich_text.map((t: any) => t.plain_text).join("");
    })
    .filter(Boolean)
    .join("\n");

  return texto;
}

// Gera cartões a partir de um texto, usando o Gemini com saída estruturada
export async function gerarCartoes(conteudo: string, quantidade = 8) {
  console.log("[DEBUG gerarCartoes] chamando Gemini... tamanho do conteúdo:", conteudo.length);

  let resposta;
  try {
    resposta = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Gere até ${quantidade} flashcards com base no conteúdo abaixo.\n\nCONTEÚDO:\n"""\n${conteudo.slice(0, 20000)}\n"""`,
      config: {
        systemInstruction: PRINCIPIOS_FORMULACAO,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            cartoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  frente: { type: "string" },
                  verso: { type: "string" },
                },
                required: ["frente", "verso"],
              },
            },
          },
          required: ["cartoes"],
        },
      },
    });
  } catch (erro: any) {
    // DEBUG temporário — mostra o erro cru que o SDK do Google devolveu
    console.error("[DEBUG gerarCartoes] ERRO na chamada ao Gemini:");
    console.error("  name:", erro?.name);
    console.error("  message:", erro?.message);
    console.error("  status:", erro?.status ?? erro?.response?.status);
    console.error("  cause:", erro?.cause);
    throw erro;
  }

  console.log("[DEBUG gerarCartoes] resposta bruta do Gemini:", resposta.text?.slice(0, 300));

  // Validação de formato (RNF13): tenta parsear, e se falhar, avisa
  try {
    const dados = JSON.parse(resposta.text ?? "");
    return Array.isArray(dados.cartoes) ? dados.cartoes : [];
  } catch {
    throw new Error("A IA retornou um formato inválido.");
  }
}
