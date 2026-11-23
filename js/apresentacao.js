/* ==========================================================================
   Apresentação SEBM (apresentacao.html)
   - Escala o deck 1600×900 para caber no palco (inclusive em tela cheia)
   - Navegação por botões, teclado, toque e índice; endereço #n abre o slide n
   - Transição em "varredura de pixels" e mosaico nas bordas, no padrão do site
   - Respeita "Reduzir animações" (js/acessibilidade.js) e a preferência do sistema
   ========================================================================== */

function apresentacaoReduzirMovimento() {
  if (typeof animacoesReduzidas === "function" && animacoesReduzidas()) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function corDoTema(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--cor-${nome}`).trim();
}

// Mesmo gerador com semente do js/pixels.js: o desenho fica igual a cada visita
function aleatorioComSemente(semente) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Desenha uma faixa irregular de blocos de 32px na borda inferior e/ou direita
   do slide, como o mosaico das seções do site. */
function desenharPixels(slide, semente) {
  const lado = 32;
  const colunas = 1600 / lado;
  const linhas = 900 / lado;
  const aleatorio = aleatorioComSemente(semente);
  const claro = slide.classList.contains("slide--claro");
  const base = claro ? corDoTema("verde-escuro") : corDoTema("neon");
  const destaque = corDoTema("laranja");
  const camada = document.createElement("div");
  camada.className = "slide__pixels";
  camada.setAttribute("aria-hidden", "true");

  const blocos = [];
  // Canto inferior direito: escada irregular que "corrói" a borda
  let altura = 2;
  for (let c = colunas - 1; c >= colunas - 11; c--) {
    altura = Math.max(0, Math.min(3, altura + Math.floor(aleatorio() * 3) - 1));
    for (let l = 0; l < altura; l++) {
      if (aleatorio() < 0.12) continue;
      blocos.push([c, linhas - 1 - l, base]);
    }
    if (aleatorio() < 0.4) blocos.push([c, linhas - 2 - altura, aleatorio() < 0.3 ? destaque : base]);
  }

  blocos.forEach(([c, l, cor], i) => {
    const bloco = document.createElement("i");
    bloco.style.left = `${c * lado}px`;
    bloco.style.top = `${l * lado}px`;
    bloco.style.backgroundColor = cor;
    bloco.style.animationDelay = `${0.15 + (i % 12) * 0.03}s`;
    camada.appendChild(bloco);
  });
  slide.appendChild(camada);
}

function iniciarApresentacao() {
  const palco = document.getElementById("palco");
  if (!palco) return;

  const deck = palco.querySelector(".palco__deck");
  const slides = Array.from(deck.querySelectorAll(".slide"));
  const contador = document.getElementById("contador");
  const progresso = document.getElementById("progresso");
  const notas = document.getElementById("notas-texto");
  const painelNotas = document.getElementById("notas-painel");
  const botaoNotas = document.getElementById("botao-notas");
  const botaoTela = document.getElementById("botao-tela-cheia");
  const anuncio = document.getElementById("anuncio-slide");
  const indice = document.getElementById("indice");
  let atual = 0;
  let trocando = false;

  // Varredura: 16×9 blocos que cobrem o palco e se desfazem na troca
  const varredura = document.createElement("div");
  varredura.className = "varredura";
  varredura.setAttribute("aria-hidden", "true");
  const coresVarredura = [corDoTema("neon"), corDoTema("verde-escuro"), corDoTema("verde-medio"), corDoTema("preto")];
  const sorteio = aleatorioComSemente(7);
  for (let i = 0; i < 16 * 9; i++) {
    const bloco = document.createElement("i");
    const r = sorteio();
    bloco.style.backgroundColor = r < 0.06 ? corDoTema("laranja") : coresVarredura[Math.floor(r * coresVarredura.length)];
    bloco.style.animationDelay = `${Math.floor(sorteio() * 6) * 0.035}s`;
    varredura.appendChild(bloco);
  }
  palco.appendChild(varredura);

  slides.forEach((slide, i) => {
    desenharPixels(slide, 11 + i * 17);
    // Cascata: cada elemento marcado entra um pouco depois do anterior
    slide.querySelectorAll("[data-entra]").forEach((el, ordem) => {
      el.style.animationDelay = `${0.12 + ordem * 0.08}s`;
    });
  });

  // Índice de slides
  slides.forEach((slide, i) => {
    const item = document.createElement("li");
    const botao = document.createElement("button");
    botao.type = "button";
    botao.innerHTML = `<span class="indice__num">${String(i + 1).padStart(2, "0")}</span>`
      + `<span>${slide.getAttribute("aria-label")}</span>`
      + `<span class="indice__fala">${slide.dataset.fala}</span>`;
    botao.addEventListener("click", () => irPara(i));
    item.appendChild(botao);
    indice.appendChild(item);
  });
  const botoesIndice = Array.from(indice.querySelectorAll("button"));

  function ajustarEscala() {
    const escala = Math.min(palco.clientWidth / 1600, palco.clientHeight / 900);
    const sobraX = (palco.clientWidth - 1600 * escala) / 2;
    const sobraY = (palco.clientHeight - 900 * escala) / 2;
    deck.style.transform = `translate(${sobraX}px, ${sobraY}px) scale(${escala})`;
  }

  function mostrar(indiceNovo) {
    slides.forEach((slide, i) => {
      const ativo = i === indiceNovo;
      slide.classList.toggle("ativo", ativo);
      slide.setAttribute("aria-hidden", String(!ativo));
      // Links de slides escondidos não recebem foco do Tab
      slide.querySelectorAll("a, button").forEach((el) => { el.tabIndex = ativo ? 0 : -1; });
    });
    atual = indiceNovo;
    const total = slides.length;
    const slide = slides[atual];
    contador.textContent = `${atual + 1} / ${total}`;
    progresso.style.width = `${((atual + 1) / total) * 100}%`;
    const nota = slide.querySelector(".notas");
    notas.textContent = nota ? nota.textContent.trim() : "Sem notas para este slide.";
    anuncio.textContent = `Slide ${atual + 1} de ${total}: ${slide.getAttribute("aria-label")}`;
    botoesIndice.forEach((b, i) => b.setAttribute("aria-current", String(i === atual)));
    if (/^#?\d*$/.test(location.hash)) history.replaceState(null, "", `#${atual + 1}`);
  }

  function irPara(indiceNovo) {
    const destino = Math.max(0, Math.min(slides.length - 1, indiceNovo));
    if (destino === atual || trocando) return;

    if (apresentacaoReduzirMovimento()) {
      mostrar(destino);
      return;
    }

    // Cobre com pixels, troca o slide e revela
    trocando = true;
    varredura.classList.remove("revelando");
    varredura.classList.add("cobrindo");
    setTimeout(() => {
      mostrar(destino);
      varredura.classList.remove("cobrindo");
      varredura.classList.add("revelando");
      setTimeout(() => {
        varredura.classList.remove("revelando");
        trocando = false;
      }, 480);
    }, 460);
  }

  const proximo = () => irPara(atual + 1);
  const anterior = () => irPara(atual - 1);

  document.getElementById("botao-proximo").addEventListener("click", proximo);
  document.getElementById("botao-anterior").addEventListener("click", anterior);

  botaoNotas.addEventListener("click", () => {
    const aberto = painelNotas.hidden;
    painelNotas.hidden = !aberto;
    botaoNotas.setAttribute("aria-pressed", String(aberto));
  });

  async function alternarTelaCheia() {
    if (!document.fullscreenElement) {
      await palco.requestFullscreen?.();
      palco.focus();
    } else {
      await document.exitFullscreen?.();
    }
  }
  botaoTela.addEventListener("click", alternarTelaCheia);
  document.getElementById("botao-iniciar")?.addEventListener("click", (evento) => {
    evento.preventDefault();
    irPara(0);
    alternarTelaCheia();
  });

  document.addEventListener("fullscreenchange", () => {
    botaoTela.setAttribute("aria-pressed", String(document.fullscreenElement === palco));
    requestAnimationFrame(ajustarEscala);
  });

  // Setas valem em toda a página; Espaço e Enter só com o palco em foco ou em tela cheia
  document.addEventListener("keydown", (evento) => {
    const alvo = evento.target instanceof Element ? evento.target : document.body;
    if (alvo.closest("input, textarea, select, [contenteditable]")) return;
    const noPalco = palco.contains(alvo) || document.fullscreenElement === palco;
    const tecla = evento.key;

    if (["ArrowRight", "PageDown"].includes(tecla) || (noPalco && tecla === " ")) {
      evento.preventDefault();
      proximo();
    } else if (["ArrowLeft", "PageUp"].includes(tecla)) {
      evento.preventDefault();
      anterior();
    } else if (noPalco && tecla === "Home") {
      evento.preventDefault();
      irPara(0);
    } else if (noPalco && tecla === "End") {
      evento.preventDefault();
      irPara(slides.length - 1);
    } else if (tecla.toLowerCase() === "n" && !evento.ctrlKey && !evento.metaKey) {
      botaoNotas.click();
    } else if (tecla.toLowerCase() === "f" && !evento.ctrlKey && !evento.metaKey) {
      alternarTelaCheia();
    }
  });

  // Deslizar no celular
  let inicioToque = null;
  palco.addEventListener("touchstart", (e) => { inicioToque = e.changedTouches[0].clientX; }, { passive: true });
  palco.addEventListener("touchend", (e) => {
    if (inicioToque === null) return;
    const delta = e.changedTouches[0].clientX - inicioToque;
    if (Math.abs(delta) > 50) (delta < 0 ? proximo : anterior)();
    inicioToque = null;
  }, { passive: true });

  window.addEventListener("resize", ajustarEscala);
  // Só endereços numéricos (#3) mudam o slide; âncoras como #conteudo são ignoradas
  const slidePeloEndereco = () => (/^#\d+$/.test(location.hash) ? parseInt(location.hash.slice(1), 10) - 1 : null);

  window.addEventListener("hashchange", () => {
    const pedido = slidePeloEndereco();
    if (pedido !== null && pedido !== atual) irPara(pedido);
  });

  ajustarEscala();
  const pedido = slidePeloEndereco();
  mostrar(pedido === null ? 0 : Math.max(0, Math.min(slides.length - 1, pedido)));
}

document.addEventListener("DOMContentLoaded", iniciarApresentacao);
