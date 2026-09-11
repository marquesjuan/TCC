const API = "http://localhost:3000";
const cadernosEl = document.getElementById("lista-cadernos");
const curadoriaEl = document.getElementById("secao-curadoria");

let cartoesGerados = []; // guarda os cartões propostos pela IA

// 1. Lista os cadernos do Notion
async function carregarCadernos() {
  cadernosEl.innerHTML = "<p>Carregando cadernos...</p>";
  try {
    const resposta = await fetch(`${API}/cadernos`);
    const cadernos = await resposta.json();

    if (cadernos.length === 0) {
      cadernosEl.innerHTML = "<p>Nenhum caderno encontrado no Notion.</p>";
      return;
    }

    cadernosEl.innerHTML = cadernos
      .map(
        (c) => `
          <div class="baralho">
            <strong>${c.titulo}</strong>
            <button class="botao btn-gerar" data-id="${c.id}">Gerar</button>
          </div>
        `
      )
      .join("");

    // Liga cada botão "Gerar"
    document.querySelectorAll(".btn-gerar").forEach((botao) => {
      botao.addEventListener("click", () => gerar(botao.dataset.id, botao));
    });
  } catch (erro) {
    console.error(erro);
    cadernosEl.innerHTML = "<p>Erro ao carregar os cadernos.</p>";
  }
}

// 2. Gera os cartões a partir do caderno escolhido
async function gerar(cadernoId, botao) {
  botao.disabled = true;
  botao.textContent = "Gerando...";
  curadoriaEl.innerHTML = "<p>A IA está gerando os cartões, aguarde...</p>";
  try {
    const resposta = await fetch(`${API}/cadernos/${cadernoId}/gerar`, {
      method: "POST",
    });
    const dados = await resposta.json();
    cartoesGerados = dados.cartoes || [];
    mostrarCuradoria();
  } catch (erro) {
    console.error(erro);
    curadoriaEl.innerHTML = "<p>Erro ao gerar os cartões.</p>";
  } finally {
    botao.disabled = false;
    botao.textContent = "Gerar";
  }
}

// 3. Mostra os cartões gerados para curadoria
async function mostrarCuradoria() {
  if (cartoesGerados.length === 0) {
    curadoriaEl.innerHTML = "<p>A IA não gerou nenhum cartão.</p>";
    return;
  }

  // Busca os baralhos do usuário para o seletor de destino
  const resposta = await fetch(`${API}/usuarios/1/baralhos`);
  const baralhos = await resposta.json();

  curadoriaEl.innerHTML = `
    <p class="subtitulo">2. Revise os cartões (edite ou descarte antes de salvar)</p>
    <div id="cartoes-curadoria">
      ${cartoesGerados
        .map(
          (cartao, i) => `
          <div class="cartao-curadoria" data-indice="${i}">
            <input class="edit-frente" value="${cartao.frente.replace(/"/g, "&quot;")}" />
            <input class="edit-verso" value="${cartao.verso.replace(/"/g, "&quot;")}" />
            <button class="btn-descartar" data-indice="${i}">Descartar</button>
          </div>
        `
        )
        .join("")}
    </div>

    <div class="salvar-area">
      <select id="baralho-destino">
        <option value="">Escolha um baralho...</option>
        ${baralhos.map((b) => `<option value="${b.id}">${b.nome}</option>`).join("")}
      </select>
      <button id="btn-salvar" class="botao">Salvar aceitos</button>
    </div>
    <p id="msg-salvar"></p>
  `;

  // Liga os botões de descartar
  document.querySelectorAll(".btn-descartar").forEach((botao) => {
    botao.addEventListener("click", () => {
      const indice = Number(botao.dataset.indice);
      cartoesGerados.splice(indice, 1); // remove da lista
      mostrarCuradoria();               // redesenha
    });
  });

  // Liga o botão de salvar
  document.getElementById("btn-salvar").addEventListener("click", salvarAceitos);
}

// 4. Salva no baralho escolhido os cartões (com edições aplicadas)
async function salvarAceitos() {
  const baralhoId = document.getElementById("baralho-destino").value;
  const msg = document.getElementById("msg-salvar");

  if (!baralhoId) {
    alert("Escolha um baralho de destino.");
    return;
  }

  // Lê os valores atuais dos inputs (com as edições do usuário)
  const linhas = document.querySelectorAll(".cartao-curadoria");
  const cartoes = Array.from(linhas).map((linha) => ({
    frente: linha.querySelector(".edit-frente").value.trim(),
    verso: linha.querySelector(".edit-verso").value.trim(),
  }));

  if (cartoes.length === 0) {
    alert("Não há cartões para salvar.");
    return;
  }

  try {
    const resposta = await fetch(`${API}/baralhos/${baralhoId}/cartoes-gerados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartoes }),
    });
    const dados = await resposta.json();
    msg.textContent = `${dados.criados} cartão(ões) salvo(s) com sucesso!`;
    curadoriaEl.querySelector("#cartoes-curadoria").innerHTML = "";
  } catch (erro) {
    console.error(erro);
    msg.textContent = "Erro ao salvar.";
  }
}

carregarCadernos();