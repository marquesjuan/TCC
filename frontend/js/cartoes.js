const API = "http://localhost:3000";
const listaEl = document.getElementById("lista-cartoes");

// Lê o id do baralho da URL
const params = new URLSearchParams(window.location.search);
const baralhoId = params.get("baralho");

// Carrega e desenha os cartões do baralho
async function carregarCartoes() {
  listaEl.innerHTML = "<p>Carregando...</p>";
  try {
    const resposta = await fetch(`${API}/baralhos/${baralhoId}/cartoes`);
    const cartoes = await resposta.json();

    if (cartoes.length === 0) {
      listaEl.innerHTML = "<p>Nenhum cartão neste baralho ainda.</p>";
      return;
    }

    listaEl.innerHTML = cartoes
      .map(
        (cartao) => `
          <div class="cartao-item">
            <div class="cartao-textos">
              <div class="cartao-frente">${cartao.frente}</div>
              <div class="cartao-verso">${cartao.verso}</div>
            </div>
            <span class="tag ${cartao.origem === "ia" ? "tag-ia" : "tag-manual"}">
              ${cartao.origem === "ia" ? "IA" : "manual"}
            </span>
          </div>
        `
      )
      .join("");
  } catch (erro) {
    console.error(erro);
    listaEl.innerHTML = "<p>Erro ao carregar os cartões.</p>";
  }
}

// Criar um cartão novo
const btnCriar = document.getElementById("btn-criar-cartao");
const inputFrente = document.getElementById("nova-frente");
const inputVerso = document.getElementById("novo-verso");

btnCriar.addEventListener("click", async () => {
  const frente = inputFrente.value.trim();
  const verso = inputVerso.value.trim();
  if (!frente || !verso) {
    alert("Preencha a frente e o verso.");
    return;
  }
  try {
    await fetch(`${API}/cartoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frente, verso, baralhoId: Number(baralhoId) }),
    });
    inputFrente.value = "";
    inputVerso.value = "";
    carregarCartoes();
  } catch (erro) {
    console.error(erro);
    alert("Erro ao criar o cartão.");
  }
});

carregarCartoes();