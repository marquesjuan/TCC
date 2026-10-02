import express from "express";
import prisma from "./prisma.js";
import { calcularSM2 } from "./sm2.js";
import { listarCadernos, lerConteudoCaderno, gerarCartoes } from "./geracao.js";
import cors from "cors";
import { time } from "node:console";

const app = express();
app.use(cors());

// Permite que o servidor entenda corpos de requisição em JSON
app.use(express.json());

// Endpoint de teste, só pra confirmar que o servidor está no ar
app.get("/", (req, res) => {
  res.json({ status: "ok", mensagem: "Servidor no ar" });
});

app.get("/usuarios", async (req, res) => {
  const usuarios = await prisma.usuario.findMany();
  res.json(usuarios);
});

app.post("/usuarios", async (req, res) => {
  const { nome, email, senhaHash } = req.body;
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash },
  });
  res.status(201).json(usuario);
});

// ===== BARALHOS =====

// CREATE — cria um baralho para um usuário
app.post("/baralhos", async (req, res) => {
  const { nome, usuarioId } = req.body;
  const baralho = await prisma.baralho.create({
    data: { nome, usuarioId },
  });
  res.status(201).json(baralho);
});

// READ (lista) — todos os baralhos de um usuário
app.get("/usuarios/:usuarioId/baralhos", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  const baralhos = await prisma.baralho.findMany({
    where: { usuarioId },
  });
  res.json(baralhos);
});

// READ (um) — um baralho específico
app.get("/baralhos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const baralho = await prisma.baralho.findUnique({
    where: { id },
  });
  if (!baralho) {
    return res.status(404).json({ erro: "Baralho não encontrado" });
  }
  res.json(baralho);
});

// UPDATE — altera o nome de um baralho
app.put("/baralhos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome } = req.body;
  const baralho = await prisma.baralho.update({
    where: { id },
    data: { nome },
  });
  res.json(baralho);
});

// DELETE — remove um baralho
app.delete("/baralhos/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.baralho.delete({
    where: { id },
  });
  res.status(204).send();
});

// ===== CARTÕES =====

// CREATE — cria um cartão em um baralho
app.post("/cartoes", async (req, res) => {
  const { frente, verso, baralhoId } = req.body;
  const proximaRevisao  = dataFormatadaHoje();
  const cartao = await prisma.cartao.create({
    data: { frente, verso, baralhoId, proximaRevisao },
  });
  res.status(201).json(cartao);
});

// READ (lista) — todos os cartões de um baralho
app.get("/baralhos/:baralhoId/cartoes", async (req, res) => {
  const baralhoId = Number(req.params.baralhoId);
  const cartoes = await prisma.cartao.findMany({
    where: { baralhoId },
  });
  res.json(cartoes);
});

// READ (um) — um cartão específico
app.get("/cartoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const cartao = await prisma.cartao.findUnique({
    where: { id },
  });
  if (!cartao) {
    return res.status(404).json({ erro: "Cartão não encontrado" });
  }
  res.json(cartao);
});

// UPDATE — altera frente e/ou verso
app.put("/cartoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { frente, verso } = req.body;
  const cartao = await prisma.cartao.update({
    where: { id },
    data: { frente, verso },
  });
  res.json(cartao);
});

// DELETE — remove um cartão
app.delete("/cartoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.cartao.delete({
    where: { id },
  });
  res.status(204).send();
});

// ===== REVISÃO (fluxo SM-2) =====

// Busca os cartões devidos de um baralho (proximaRevisao <= agora)
app.get("/baralhos/:baralhoId/revisao", async (req, res) => {
  const baralhoId = Number(req.params.baralhoId);
  if (!Number.isInteger(baralhoId)) {
    return res.status(400).json({ erro: "baralhoId inválido" });
  }
  const agora = new Date();
  const cartoesDevidos = await prisma.cartao.findMany({
    where: {
      baralhoId,
      proximaRevisao: { lte: agora }, // lte = "less than or equal" (menor ou igual)
    },
  });
  res.json(cartoesDevidos);
});

// Recebe a avaliação de um cartão e aplica o SM-2
app.post("/cartoes/:id/revisar", async (req, res) => {
  const id = Number(req.params.id);
  const { qualidade } = req.body;

  // 1. Busca o cartão atual
  const cartao = await prisma.cartao.findUnique({ where: { id } });
  if (!cartao) {
    return res.status(404).json({ erro: "Cartão não encontrado" });
  }

  // 2. Calcula o novo estado com o SM-2
  const novoEstado = calcularSM2(
    {
      fatorFacilidade: cartao.fatorFacilidade,
      intervalo: cartao.intervalo,
      repeticoes: cartao.repeticoes,
    },
    qualidade
  );

  // 3. Calcula a nova data de próxima revisão (hoje + intervalo em dias)
  const proximaRevisao = new Date();
  proximaRevisao.setHours(0,0,0,0);
  proximaRevisao.setDate(proximaRevisao.getDate() + novoEstado.intervalo);

  // 4. Atualiza o cartão com o novo estado
  const cartaoAtualizado = await prisma.cartao.update({
    where: { id },
    data: {
      fatorFacilidade: novoEstado.fatorFacilidade,
      intervalo: novoEstado.intervalo,
      repeticoes: novoEstado.repeticoes,
      proximaRevisao,
    },
  });

  // 5. Registra a revisão no histórico
  await prisma.revisao.create({
    data: {
      cartaoId: id,
      qualidade,
      fatorApos: novoEstado.fatorFacilidade,
      intervaloApos: novoEstado.intervalo,
    },
  });

  res.json(cartaoAtualizado);
});

// ===== GERAÇÃO ASSISTIDA (Notion + Gemini) =====

// 1. Lista os cadernos (páginas) do Notion do usuário
app.get("/cadernos", async (req, res) => {
  try {
    const cadernos = await listarCadernos();
    res.json(cadernos);
  } catch (erro: any) {
    res.status(502).json({ erro: "Falha ao listar cadernos do Notion", detalhe: erro.message });
  }
});

// 2. Gera cartões a partir de um caderno (não salva ainda — vai para curadoria)
app.post("/cadernos/:id/gerar", async (req, res) => {
  try {
    console.log("[DEBUG] lendo conteúdo do caderno", req.params.id);
    const conteudo = await lerConteudoCaderno(req.params.id);
    console.log("[DEBUG] conteúdo lido, tamanho:", conteudo?.length);
    if (!conteudo) {
      return res.status(400).json({ erro: "Caderno vazio ou sem texto" });
    }
    const cartoes = await gerarCartoes(conteudo);
    res.json({ cartoes });
  } catch (erro: any) {
    console.error("[DEBUG] erro completo na rota /gerar:", erro); // DEBUG temporário
    res.status(502).json({ erro: "Falha na geração de cartões", detalhe: erro.message });
  }
});

// 3. Salva os cartões curados (aceitos pelo usuário) em um baralho
app.post("/baralhos/:baralhoId/cartoes-gerados", async (req, res) => {
  const baralhoId = Number(req.params.baralhoId);
  const { cartoes } = req.body; // lista de { frente, verso } já curada

  const criados = await prisma.cartao.createMany({
    data: cartoes.map((c: { frente: string; verso: string }) => ({
      frente: c.frente,
      verso: c.verso,
      baralhoId,
      origem: "ia", // marca a procedência (o campo que a gente criou no schema)
    })),
  });

  res.status(201).json({ criados: criados.count });
});


app.get("/usuarios/:usuarioId/painel", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);

  try{

    const todosCartoes = await prisma.cartao.findMany({
      where: {baralho: {usuarioId}},
      select: {proximaRevisao: true}
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const previsaoCarga = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() + i);

      const proximoDia = new Date(dia);
      proximoDia.setDate(dia.getDate() + 1);

      // Conta os cartões cuja proximaRevisao cai nesse dia
      const quantidade = todosCartoes.filter((c) => {
        const revisao = new Date(c.proximaRevisao);
        return revisao >= dia && revisao < proximoDia;
      }).length;

      previsaoCarga.push({
        data: dia.toISOString().split("T")[0], // formato AAAA-MM-DD
        quantidade,
      });
    }

    const totalBaralhos = await prisma.baralho.count({
      where: {usuarioId}
    });

    const totalRevisoes = await prisma.revisao.count({
      where: { cartao: {
        baralho: {
          usuarioId
        }
      }}
    });

    const totalCartoes = await prisma.cartao.count({
      where: {
        baralho: {
          usuarioId
        }
      }
    })

        // Evolução do desempenho: as notas (qualidade) ao longo do tempo
    const revisoes = await prisma.revisao.findMany({
      where: { cartao: { baralho: { usuarioId } } },
      select: { qualidade: true, data: true },
      orderBy: { data: "asc" },
    });

    const evolucaoDesempenho = revisoes.map((r) => ({
      data: r.data,
      qualidade: r.qualidade,
    }));

    // Distribuição de dificuldade: quantos cartões em cada faixa de fator de facilidade
    const cartoesFator = await prisma.cartao.findMany({
      where: { baralho: { usuarioId } },
      select: { fatorFacilidade: true },
    });

    const distribuicaoDificuldade = {
      dificil: cartoesFator.filter((c) => c.fatorFacilidade < 2.0).length,
      medio: cartoesFator.filter(
        (c) => c.fatorFacilidade >= 2.0 && c.fatorFacilidade < 2.5
      ).length,
      facil: cartoesFator.filter((c) => c.fatorFacilidade >= 2.5).length,
    };

    res.json({
      geral: {
        totalBaralhos,
        totalCartoes,
        totalRevisoes
      },
      previsaoCarga,
      evolucaoDesempenho,
      distribuicaoDificuldade
    })
  } catch (erro){
    console.log("Erro no painel: ", erro);
    res.status(500).json({erro: "Erro ao montar o painel"});
  }
})




//Formtar date
const dataFormatadaHoje = (timeZone = "America/Sao_Paulo") => {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  return new Date(`${ymd}T00:00:00.000Z`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

