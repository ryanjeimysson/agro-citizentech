/* ==========================================================================
   Menu de acessibilidade
   Aba fixa na borda direita da tela. Ao rolar, encolhe para só o ícone;
   no computador abre ao passar o mouse, e em qualquer aparelho com clique,
   Enter ou Espaço. A escolha fica salva no navegador; sem escolha salva,
   segue as preferências do sistema (movimento reduzido e alto contraste).

   Este arquivo é carregado no <head> para aplicar as classes antes de a
   página aparecer, evitando que as animações "pisquem" no carregamento.
   ========================================================================== */

const CHAVE_A11Y = "agro-citizentech-a11y";

const OPCOES_A11Y = [
  { chave: "calmo", rotulo: "Reduzir animações", dica: "Sem blocos animados, sem efeitos ao rolar e sem transições." },
  { chave: "texto", rotulo: "Aumentar texto", dica: "Deixa todos os textos do site maiores." },
  { chave: "contraste", rotulo: "Alto contraste", dica: "Textos mais escuros, bordas fortes e links sublinhados." },
];

// Classe aplicada no <html> para cada opção ligada
const CLASSES_A11Y = { calmo: "a11y-calmo", texto: "a11y-texto", contraste: "a11y-contraste" };

const combina = (consulta) => window.matchMedia && window.matchMedia(consulta).matches;

function lerPreferenciasSalvas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_A11Y)) || {};
  } catch (erro) {
    return {};
  }
}

function salvarPreferencias(valor) {
  try {
    localStorage.setItem(CHAVE_A11Y, JSON.stringify(valor));
  } catch (erro) {
    /* navegador sem armazenamento: a escolha vale só nesta visita */
  }
}

let preferenciasSalvas = lerPreferenciasSalvas();

// O que foi escolhido no menu tem prioridade sobre o sistema
function calcularPreferencias() {
  return {
    calmo: combina("(prefers-reduced-motion: reduce)"),
    texto: false,
    contraste: combina("(prefers-contrast: more)"),
    ...preferenciasSalvas,
  };
}

let preferencias = calcularPreferencias();

function aplicarClasses() {
  const html = document.documentElement;
  Object.entries(CLASSES_A11Y).forEach(([chave, classe]) => html.classList.toggle(classe, preferencias[chave]));
  // Libera as animações mesmo com "reduzir movimento" no sistema, se o visitante escolheu ligá-las
  html.classList.toggle("a11y-movimento-ok", !preferencias.calmo);
}

// Aplica já ao carregar, antes de a página ser desenhada
aplicarClasses();

// Usada pelos outros scripts (pixels e animação ao rolar)
function animacoesReduzidas() {
  return document.documentElement.classList.contains("a11y-calmo");
}

function definirPreferencia(chave, valor) {
  preferenciasSalvas = { ...preferenciasSalvas, [chave]: valor };
  salvarPreferencias(preferenciasSalvas);
  preferencias = calcularPreferencias();
  aplicarClasses();
  atualizarInterruptores();
}

function restaurarPadrao() {
  preferenciasSalvas = {};
  try {
    localStorage.removeItem(CHAVE_A11Y);
  } catch (erro) {
    /* nada salvo */
  }
  preferencias = calcularPreferencias();
  aplicarClasses();
  atualizarInterruptores();
}

function atualizarInterruptores() {
  document.querySelectorAll(".a11y__opcao").forEach((botao) => {
    botao.setAttribute("aria-checked", String(preferencias[botao.dataset.chave]));
  });
}

// Ícone em pixel art (pessoa de braços abertos dentro de um círculo)
const ICONE_A11Y = `
  <svg class="a11y__icone" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M5 0h6v1H5zM3 1h2v1H3zM11 1h2v1h-2zM2 2h1v1H2zM13 2h1v1h-1zM1 3h1v2H1zM14 3h1v2h-1zM0 5h1v6H0zM15 5h1v6h-1zM1 11h1v2H1zM14 11h1v2h-1zM2 13h1v1H2zM13 13h1v1h-1zM3 14h2v1H3zM11 14h2v1h-2zM5 15h6v1H5z"/>
    <path fill="currentColor" d="M7 3h2v2H7zM4 6h8v1H4zM7 7h2v3H7zM6 10h1v3H6zM9 10h1v3H9z"/>
  </svg>`;

function criarMenuAcessibilidade() {
  const raiz = document.createElement("div");
  raiz.className = "a11y";
  raiz.innerHTML = `
    <button class="a11y__botao" type="button" aria-expanded="false" aria-controls="a11y-painel">
      ${ICONE_A11Y}<span class="a11y__rotulo">Acessibilidade</span>
    </button>
    <div class="a11y__painel" id="a11y-painel" role="group" aria-label="Opções de acessibilidade" hidden>
      <p class="a11y__titulo">Acessibilidade</p>
      ${OPCOES_A11Y.map((opcao) => `
        <button class="a11y__opcao" type="button" role="switch" aria-checked="false" data-chave="${opcao.chave}">
          <span class="a11y__texto"><strong>${opcao.rotulo}</strong><small>${opcao.dica}</small></span>
          <span class="a11y__interruptor" aria-hidden="true"></span>
        </button>`).join("")}
      <button class="a11y__restaurar" type="button">Restaurar padrão</button>
    </div>`;

  // Logo depois do link "Pular para o conteúdo": é o 2º item ao navegar com Tab
  const pularConteudo = document.querySelector(".pular-conteudo");
  if (pularConteudo) pularConteudo.after(raiz);
  else document.body.prepend(raiz);

  const botao = raiz.querySelector(".a11y__botao");
  const painel = raiz.querySelector(".a11y__painel");
  let temporizadorFechar;

  function definirAberto(aberto) {
    painel.hidden = !aberto;
    botao.setAttribute("aria-expanded", String(aberto));
    raiz.classList.toggle("a11y--aberto", aberto);
  }

  // Computador com mouse: abre ao passar o mouse. A folga ao sair cobre o vão entre a aba e o painel.
  const temMouse = () => combina("(hover: hover) and (pointer: fine) and (min-width: 1025px)");

  raiz.addEventListener("mouseenter", () => {
    if (!temMouse()) return;
    clearTimeout(temporizadorFechar);
    definirAberto(true);
  });

  raiz.addEventListener("mouseleave", () => {
    if (!temMouse()) return;
    temporizadorFechar = setTimeout(() => {
      // Não fecha se quem está usando o painel é o teclado
      if (!raiz.querySelector(":focus-visible")) definirAberto(false);
    }, 250);
  });

  // Clique do mouse com o painel já aberto pelo hover mantém aberto; Enter e Espaço alternam
  botao.addEventListener("click", (evento) => {
    if (evento.detail > 0 && temMouse()) definirAberto(true);
    else definirAberto(painel.hidden);
  });

  raiz.querySelectorAll(".a11y__opcao").forEach((opcao) => {
    opcao.addEventListener("click", () => {
      const chave = opcao.dataset.chave;
      definirPreferencia(chave, !preferencias[chave]);
    });
  });

  raiz.querySelector(".a11y__restaurar").addEventListener("click", restaurarPadrao);

  // Fecha com Esc (devolvendo o foco ao botão) e ao clicar fora
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !painel.hidden) {
      definirAberto(false);
      botao.focus();
    }
  });

  document.addEventListener("pointerdown", (evento) => {
    if (!painel.hidden && !raiz.contains(evento.target)) definirAberto(false);
  });

  // Ao rolar, a aba encolhe para só o ícone; volta inteira no topo da página
  function aoRolar() {
    raiz.classList.toggle("a11y--recolhido", window.scrollY > 40);
  }
  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  atualizarInterruptores();
}

// Se o visitante mudar a preferência no sistema com o site aberto, aplica na hora
["(prefers-reduced-motion: reduce)", "(prefers-contrast: more)"].forEach((consulta) => {
  if (!window.matchMedia) return;
  window.matchMedia(consulta).addEventListener("change", () => {
    preferencias = calcularPreferencias();
    aplicarClasses();
    atualizarInterruptores();
  });
});

document.addEventListener("DOMContentLoaded", criarMenuAcessibilidade);
