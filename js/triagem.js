/* ==========================================================================
   Triagem da demanda (registrar-demanda.html)
   Funcionalidade ligada diretamente à solução: enquanto o produtor escreve,
   monta a ficha de triagem com categoria sugerida, suspeita mencionada e
   informações faltantes. Simula o apoio da IA usando regras de palavras-chave;
   quando a categoria é incerta, o caso fica "A classificar" (revisão humana).
   O rascunho é salvo no próprio navegador para não se perder se a conexão cair.
   ========================================================================== */

const CHAVE_RASCUNHO = "agro-citizentech-rascunho";
const MIN_CARACTERES_RELATO = 15;

// Regras de classificação: palavras-chave → área e tema
const REGRAS_CLASSIFICACAO = [
  { area: "Agricultura", tema: "Hortaliças → Alterações nas folhas", palavras: ["folha", "mancha", "amarel", "murch", "seca"] },
  { area: "Agricultura", tema: "Pragas e insetos", palavras: ["lagarta", "praga", "inseto", "pulgão", "pulgao", "formiga", "broca", "mosca"] },
  { area: "Agricultura", tema: "Solo e adubação", palavras: ["solo", "terra", "adubo", "adubação", "adubacao", "calcário", "calcario", "ph"] },
  { area: "Agricultura", tema: "Irrigação e água", palavras: ["irriga", "água", "agua", "chuva", "encharc", "poço", "poco"] },
  { area: "Agricultura", tema: "Frutos e colheita", palavras: ["fruto", "fruta", "colheita", "podre", "rachad", "flor"] },
  { area: "Pecuária", tema: "Saúde animal", palavras: ["vaca", "boi", "bezerro", "gado", "febre", "diarreia", "mancando", "tosse", "porco", "galinha", "frango"] },
  { area: "Pecuária", tema: "Nutrição e pastagem", palavras: ["pasto", "pastagem", "ração", "racao", "capim", "silagem", "leite"] },
];

// Termos que indicam uma suspeita do próprio produtor
const SUSPEITAS = ["fungo", "praga", "vírus", "virus", "bactéria", "bacteria", "lagarta", "verme", "carrapato", "falta de adubo", "geada"];

const ficha = {};

function normalizar(texto) {
  return texto.toLowerCase();
}

// Retorna a regra com mais palavras encontradas, respeitando a área escolhida
function classificarRelato(relato, areaInformada) {
  const texto = normalizar(relato);
  let melhor = null;
  let melhorPontuacao = 0;

  REGRAS_CLASSIFICACAO.forEach((regra) => {
    if (areaInformada !== "Outros" && regra.area !== areaInformada) return;
    const pontuacao = regra.palavras.filter((palavra) => texto.includes(palavra)).length;
    if (pontuacao > melhorPontuacao) {
      melhor = regra;
      melhorPontuacao = pontuacao;
    }
  });

  return melhor;
}

function encontrarSuspeita(relato) {
  const texto = normalizar(relato);
  const encontrada = SUSPEITAS.find((termo) => texto.includes(termo));
  return encontrada ? `${encontrada} (causa em aberto para avaliação profissional)` : "Nenhuma mencionada";
}

function listarFaltantes(dados) {
  const faltantes = [];
  if (!dados.cultura) faltantes.push("Qual cultura ou criação foi afetada");
  if (!dados.inicio) faltantes.push("Quando o problema começou");
  if (!dados.extensao) faltantes.push("Quantas plantas ou animais foram afetados");
  if (!dados.regiao) faltantes.push("Região aproximada da propriedade");
  if (dados.relato.length < 60) faltantes.push("Mais detalhes sobre o que foi observado");
  return faltantes;
}

function lerFormulario(form) {
  return {
    area: form.querySelector('input[name="area"]:checked').value,
    cultura: form.cultura.value.trim(),
    relato: form.relato.value.trim(),
    inicio: form.inicio.value,
    extensao: form.extensao.value,
    regiao: form.regiao.value.trim(),
  };
}

function atualizarFicha(dados) {
  const temRelato = dados.relato.length > 0;
  ficha.vazia.hidden = temRelato;
  ficha.conteudo.hidden = !temRelato;
  if (!temRelato) return;

  const regra = classificarRelato(`${dados.relato} ${dados.cultura}`, dados.area);
  const categoria = regra ? `${regra.area} → ${regra.tema}` : "A classificar";

  ficha.relato.textContent = `“${dados.relato}”`;
  ficha.categoria.textContent = categoria;
  ficha.suspeita.textContent = encontrarSuspeita(dados.relato);
  ficha.status.innerHTML = regra
    ? '<span class="badge badge--aguardando">Aguardando estudante</span>'
    : '<span class="badge badge--classificar">A classificar · revisão humana</span>';

  const faltantes = listarFaltantes(dados);
  ficha.faltantes.innerHTML = "";
  if (faltantes.length === 0) {
    ficha.faltantes.innerHTML = "<li>Relato completo. Obrigado!</li>";
  } else {
    faltantes.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ficha.faltantes.appendChild(li);
    });
  }
}

/* ---------- Rascunho no navegador ---------- */
function salvarRascunho(dados, status) {
  try {
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(dados));
    const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    status.textContent = `Rascunho salvo neste aparelho às ${hora}.`;
  } catch (erro) {
    status.textContent = "";
  }
}

function carregarRascunho(form) {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO));
    if (!dados) return false;
    form.cultura.value = dados.cultura || "";
    form.relato.value = dados.relato || "";
    form.inicio.value = dados.inicio || "";
    form.extensao.value = dados.extensao || "";
    form.regiao.value = dados.regiao || "";
    const radio = form.querySelector(`input[name="area"][value="${dados.area}"]`);
    if (radio) radio.checked = true;
    return true;
  } catch (erro) {
    return false;
  }
}

function apagarRascunho() {
  try {
    localStorage.removeItem(CHAVE_RASCUNHO);
  } catch (erro) {
    /* armazenamento indisponível: nada a apagar */
  }
}

/* ---------- Inicialização ---------- */
function iniciarTriagem() {
  const form = document.getElementById("form-demanda");
  if (!form) return;

  Object.assign(ficha, {
    vazia: document.getElementById("ficha-vazia"),
    conteudo: document.getElementById("ficha-conteudo"),
    relato: document.getElementById("ficha-relato"),
    categoria: document.getElementById("ficha-categoria"),
    suspeita: document.getElementById("ficha-suspeita"),
    status: document.getElementById("ficha-status"),
    faltantes: document.getElementById("ficha-faltantes"),
  });

  const contador = document.getElementById("relato-contador");
  const erroRelato = document.getElementById("relato-erro");
  const statusRascunho = document.getElementById("rascunho-status");
  const mensagem = document.getElementById("demanda-mensagem");
  const campoRelato = form.relato.closest(".campo");

  function aoAlterar() {
    const dados = lerFormulario(form);
    contador.textContent = `${form.relato.value.length} / ${form.relato.maxLength}`;
    atualizarFicha(dados);
    salvarRascunho(dados, statusRascunho);
    if (campoRelato.classList.contains("campo--erro") && dados.relato.length >= MIN_CARACTERES_RELATO) {
      campoRelato.classList.remove("campo--erro");
      erroRelato.textContent = "";
    }
  }

  form.addEventListener("input", aoAlterar);
  form.addEventListener("change", aoAlterar);

  if (carregarRascunho(form)) {
    aoAlterar();
    statusRascunho.textContent = "Recuperamos o rascunho que você deixou neste aparelho.";
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const dados = lerFormulario(form);

    if (dados.relato.length < MIN_CARACTERES_RELATO) {
      campoRelato.classList.add("campo--erro");
      form.relato.setAttribute("aria-invalid", "true");
      erroRelato.textContent = dados.relato
        ? `Descreva com um pouco mais de detalhe (mínimo de ${MIN_CARACTERES_RELATO} caracteres).`
        : "Conte o que você observou para registrar a demanda.";
      mensagem.hidden = true;
      form.relato.focus();
      return;
    }

    form.relato.removeAttribute("aria-invalid");
    const protocolo = `AGR-${Date.now().toString().slice(-5)}`;
    mensagem.className = "mensagem-formulario mensagem-formulario--sucesso";
    mensagem.textContent = `Ficha confirmada! Protocolo ${protocolo} (simulação). Uma pessoa da equipe vai revisar a classificação antes de atribuir o caso.`;
    mensagem.hidden = false;
    apagarRascunho();
    statusRascunho.textContent = "";
  });

  document.getElementById("limpar-demanda").addEventListener("click", () => {
    form.reset();
    apagarRascunho();
    campoRelato.classList.remove("campo--erro");
    erroRelato.textContent = "";
    mensagem.hidden = true;
    contador.textContent = `0 / ${form.relato.maxLength}`;
    statusRascunho.textContent = "Rascunho apagado.";
    atualizarFicha(lerFormulario(form));
  });
}

document.addEventListener("DOMContentLoaded", iniciarTriagem);
