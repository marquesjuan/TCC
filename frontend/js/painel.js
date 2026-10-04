const API = "http://localhost:3000";

async function carregarPainel() {
  try {
    const resposta = await fetch(`${API}/usuarios/1/painel`);
    const dados = await resposta.json();

    montarCardsGerais(dados.geral);
    montarGraficoCarga(dados.previsaoCarga);
    montarGraficoEvolucao(dados.evolucaoDesempenho);
    montarGraficoDificuldade(dados.distribuicaoDificuldade);
  } catch (erro) {
    console.error(erro);
    document.querySelector("main").innerHTML = "<p>Erro ao carregar o painel.</p>";
  }
}

// Números gerais (cards)
function montarCardsGerais(geral) {
  const el = document.getElementById("cards-gerais");
  el.innerHTML = `
    <div class="card-numero"><span class="numero">${geral.totalBaralhos}</span><span class="rotulo"> Baralhos</span></div>
    <div class="card-numero"><span class="numero">${geral.totalCartoes}</span><span class="rotulo"> Cartões</span></div>
    <div class="card-numero"><span class="numero">${geral.totalRevisoes}</span><span class="rotulo"> Revisões</span></div>
  `;
}

// Gráfico de barras: carga dos próximos dias
function montarGraficoCarga(previsao) {
  new Chart(document.getElementById("grafico-carga"), {
    type: "bar",
    data: {
      labels: previsao.map((p) => p.data.slice(5)), // mostra só MM-DD
      datasets: [{
        label: "Cartões a revisar",
        data: previsao.map((p) => p.quantidade),
        backgroundColor: "#4f46e5",
      }],
    },
    options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
  });
}

// Gráfico de linha: evolução das notas
function montarGraficoEvolucao(evolucao) {
  new Chart(document.getElementById("grafico-evolucao"), {
    type: "line",
    data: {
      labels: evolucao.map((_, i) => `Rev ${i + 1}`),
      datasets: [{
        label: "Nota (qualidade)",
        data: evolucao.map((e) => e.qualidade),
        borderColor: "#4f46e5",
        backgroundColor: "#eef0fe",
        tension: 0.2,
      }],
    },
    options: { scales: { y: { beginAtZero: true, max: 5, ticks: { precision: 0 } } } },
  });
}

// Gráfico de rosca: distribuição de dificuldade
function montarGraficoDificuldade(dist) {
  new Chart(document.getElementById("grafico-dificuldade"), {
    type: "doughnut",
    data: {
      labels: ["Difícil", "Médio", "Fácil"],
      datasets: [{
        data: [dist.dificil, dist.medio, dist.facil],
        backgroundColor: ["#c0392b", "#e0a92b", "#2f7d4f"],
      }],
    },
  });
}

carregarPainel();