

// Endereço do backend
const API = "http://localhost:3000";

// Referência ao contêiner onde os baralhos vão aparecer
const listaBaralho = document.getElementById("lista-baralhos");

// Busca os baralhos do usuário 1 e desenha na tela
// Criar um novo baralho
const btnCriar = document.getElementById("btn-criar-baralho");
const inputNome = document.getElementById("novo-baralho-nome");

btnCriar.addEventListener("click", async () => {
  const nome = inputNome.value.trim();
  if (!nome) {
    alert("Digite um nome para o baralho.");
    return;
  }
  try {
    await fetch(`${API}/baralhos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, usuarioId: 1 }),
    });
    inputNome.value = "";      // limpa o campo
    carregarBaralhos();        // recarrega a lista pra mostrar o novo
  } catch (erro) {
    console.error(erro);
    alert("Erro ao criar o baralho.");
  }
});

async function carregarBaralhos() {
  listaBaralho.innerHTML = "<p>Carregando...</p>";


  try {
    const resposta = await fetch(`${API}/usuarios/1/baralhos`);
    const baralhos = await resposta.json();

    if (baralhos.length === 0) {
      listaBaralho.innerHTML = "<p>Nenhum baralho ainda.</p>";
      return;
    }

    console.log('Baralhos ->', JSON.stringify(baralhos));
    const searchTerm = ''

    listaBaralho.innerHTML = baralhos
      .map(
        (baralho) => `
          <div class="baralho">
            <strong>${baralho.nome}</strong>
            <div class="acoes">
              <a class="botao secundario" href="cartoes.html?baralho=${baralho.id}">Cartões</a>
              <a class="botao" href="revisao.html?baralho=${baralho.id}">Revisar</a>
            </div>
          </div>
        `
      )
      .join("");
  } catch (erro) {
    console.error("Erro ao buscar baralhos:", erro);
    listaBaralho.innerHTML = "<p>Erro ao carregar. O backend está rodando?</p>";
  }
}

function testando(elemento){
    const searchTerm = elemento.dataset.id;

    console.log('peguei o id ->', JSON.stringify(searchTerm));
    window.location.href = `revisao.html?baralho=${encodeURIComponent(searchTerm)}`;
}
// Como app.js é carregado como <script type="module">, suas funções não
// ficam no escopo global — precisam ser expostas em window para que
// o onclick="" inline (que roda no escopo global) consiga encontrá-las.
window.testando = testando;
// Dispara ao carregar a página
carregarBaralhos();
