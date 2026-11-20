/* ==========================================================================
   Agro CitizenTech — scripts comuns a todas as páginas
   - Menu mobile (hambúrguer)
   - Acordeão (FAQ)
   - Abas (Como funciona)
   - Animação de entrada ao rolar a página
   Cada componente só é iniciado se existir na página atual.
   ========================================================================== */

const DESKTOP_MIN = 1024; // mesmo breakpoint usado no CSS para o menu horizontal

/* ---------- Menu mobile ---------- */
function iniciarMenuMobile() {
  const botao = document.querySelector(".menu-botao");
  const menu = document.getElementById("menu-principal");
  if (!botao || !menu) return;

  function definirMenu(aberto) {
    menu.classList.toggle("aberta", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
    botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("sem-rolagem", aberto);
  }

  botao.addEventListener("click", () => {
    const estaAberto = botao.getAttribute("aria-expanded") === "true";
    definirMenu(!estaAberto);
  });

  // Fecha ao escolher um link
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => definirMenu(false));
  });

  // Fecha com a tecla Esc e devolve o foco ao botão
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && menu.classList.contains("aberta")) {
      definirMenu(false);
      botao.focus();
    }
  });

  // Se a tela crescer para desktop com o menu aberto, volta ao estado normal
  window.addEventListener("resize", () => {
    if (window.innerWidth >= DESKTOP_MIN && menu.classList.contains("aberta")) {
      definirMenu(false);
    }
  });
}

/* ---------- Acordeão ---------- */
function iniciarAcordeoes() {
  document.querySelectorAll("[data-acordeao]").forEach((acordeao) => {
    const botoes = acordeao.querySelectorAll(".acordeao__botao");

    botoes.forEach((botao) => {
      botao.addEventListener("click", () => {
        const painel = document.getElementById(botao.getAttribute("aria-controls"));
        const vaiAbrir = botao.getAttribute("aria-expanded") !== "true";

        // Mantém apenas uma resposta aberta por grupo
        botoes.forEach((outro) => {
          outro.setAttribute("aria-expanded", "false");
          document.getElementById(outro.getAttribute("aria-controls")).hidden = true;
        });

        botao.setAttribute("aria-expanded", String(vaiAbrir));
        painel.hidden = !vaiAbrir;
      });
    });
  });
}

/* ---------- Abas ---------- */
function iniciarAbas() {
  document.querySelectorAll("[data-abas]").forEach((container) => {
    const abas = Array.from(container.querySelectorAll('[role="tab"]'));

    function selecionarAba(abaEscolhida) {
      abas.forEach((aba) => {
        const selecionada = aba === abaEscolhida;
        aba.setAttribute("aria-selected", String(selecionada));
        aba.tabIndex = selecionada ? 0 : -1;
        document.getElementById(aba.getAttribute("aria-controls")).hidden = !selecionada;
      });
    }

    abas.forEach((aba, indice) => {
      aba.addEventListener("click", () => selecionarAba(aba));

      // Navegação por setas, conforme o padrão de acessibilidade para abas
      aba.addEventListener("keydown", (evento) => {
        let proximo = null;
        if (evento.key === "ArrowRight") proximo = abas[(indice + 1) % abas.length];
        if (evento.key === "ArrowLeft") proximo = abas[(indice - 1 + abas.length) % abas.length];
        if (proximo) {
          evento.preventDefault();
          selecionarAba(proximo);
          proximo.focus();
        }
      });
    });
  });
}

/* ---------- Animação de entrada ao rolar ---------- */
// Blocos que aparecem subindo quando entram na tela
const SELETOR_ANIMADOS = [
  ".secao__cabecalho",
  ".grade > *",
  ".passo",
  ".numero",
  ".bloco-midia > *",
  ".chamada",
  ".aviso",
  ".acordeao__item",
  ".contato-layout > *",
  ".triagem > *",
].join(", ");

function iniciarAnimacoesScroll() {
  // Segue o menu de acessibilidade (js/acessibilidade.js); sem ele, a preferência do sistema
  const reduzirMovimento = typeof animacoesReduzidas === "function"
    ? animacoesReduzidas()
    : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzirMovimento || !("IntersectionObserver" in window)) return;

  // Só anima o que ainda está abaixo da tela. Ignora o conteúdo de abas
  // escondidas, que só ficaria visível ao trocar de aba.
  const elementos = Array.from(document.querySelectorAll(SELETOR_ANIMADOS))
    .filter((elemento) => !elemento.closest('[role="tabpanel"]'))
    .filter((elemento) => elemento.getBoundingClientRect().top > window.innerHeight);

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      const elemento = entrada.target;
      elemento.classList.add("visivel");
      observador.unobserve(elemento);

      // Ao terminar, remove as classes para não interferir no hover dos cards
      elemento.addEventListener("transitionend", () => {
        elemento.classList.remove("revelar", "visivel");
      }, { once: true });
    });
  }, { threshold: 0.15 });

  elementos.forEach((elemento) => {
    elemento.classList.add("revelar");
    observador.observe(elemento);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarMenuMobile();
  iniciarAcordeoes();
  iniciarAbas();
  iniciarAnimacoesScroll();
});
