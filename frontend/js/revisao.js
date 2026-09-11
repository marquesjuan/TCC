const API = "http://localhost:3000";
const areaEl = document.getElementById("area-revisao");

// Lê o id do baralho da URL (?baralho=2)
const params = new URLSearchParams(window.location.search);
const baralhoId = params.get("baralho");

// Estado da sessão
let cartoes = [];      // cartões devidos
let indiceAtual = 0;   // qual cartão está sendo revisado

// Busca os cartões devidos e inicia a sessão
async function iniciarSessao() {
  // Só segue se ?baralho=<numero> realmente veio na URL.
  if (!baralhoId || Number.isNaN(Number(baralhoId))) {
    areaEl.innerHTML = `
      <p>Nenhum baralho selecionado.</p>
      <a href="index.html" class="botao">Voltar aos baralhos</a>
    `;
    return;
  }

  areaEl.innerHTML = "<p>Carregando...</p>";
  try {
    const resposta = await fetch(`${API}/baralhos/${baralhoId}/revisao`);
    cartoes = await resposta.json();
    indiceAtual = 0;
    mostrarCartao();
  } catch (erro) {
    console.error(erro);
    areaEl.innerHTML = "<p>Erro ao carregar a revisão.</p>";
  }
}

// Mostra o cartão atual (só a frente)
function mostrarCartao() {
  // Acabaram os cartões?
  if (indiceAtual >= cartoes.length) {
    areaEl.innerHTML = `
      <div class="cartao-revisao">
        <p class="fim">Sessão concluída! 🎉</p>
        <a href="index.html" class="botao">Voltar aos baralhos</a>
      </div>
    `;
    return;
  }

  const cartao = cartoes[indiceAtual];
  areaEl.innerHTML = `
    <p class="progresso">Cartão ${indiceAtual + 1} de ${cartoes.length}</p>
    <div class="cartao-revisao">
      <div class="frente">${cartao.frente}</div>
      <button id="btn-mostrar" class="botao">Mostrar resposta</button>
    </div>
  `;

  // Ao clicar em "Mostrar resposta", revela o verso e as notas
  document.getElementById("btn-mostrar").addEventListener("click", revelarVerso);
}

// Revela o verso e mostra os botões de nota
function revelarVerso() {
  const cartao = cartoes[indiceAtual];
  areaEl.innerHTML = `
    <p class="progresso">Cartão ${indiceAtual + 1} de ${cartoes.length}</p>
    <div class="cartao-revisao">
      <div class="frente">${cartao.frente}</div>
      <hr />
      <div class="verso">${cartao.verso}</div>
      <p class="pergunta-nota">Como foi sua lembrança?</p>
      <div class="notas">
        ${[0, 1, 2, 3, 4, 5]
          .map((n) => `<button class="nota" data-nota="${n}">${n}</button>`)
          .join("")}
      </div>
    </div>
  `;

  // Liga cada botão de nota
  document.querySelectorAll(".nota").forEach((botao) => {
    botao.addEventListener("click", () => avaliar(Number(botao.dataset.nota)));
  });
}

// Envia a avaliação ao backend e passa pro próximo cartão
async function avaliar(qualidade) {
  const cartao = cartoes[indiceAtual];
  try {
    await fetch(`${API}/cartoes/${cartao.id}/revisar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualidade }),
    });
    indiceAtual++;
    mostrarCartao();
  } catch (erro) {
    console.error(erro);
    alert("Erro ao salvar a avaliação.");
  }
}

iniciarSessao();