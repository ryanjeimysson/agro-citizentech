/* ==========================================================================
   Mosaico de pixels (identidade visual)
   Desenha, em um <canvas>, blocos quadrados que "corroem" as bordas de uma
   seção — como na identidade da Global Solution CitizenTech.
   Uso no HTML:
     <section class="tem-pixels" data-pixels="base"
              data-pixels-base="papel" data-pixels-destaque="neon">
   data-pixels: "topo", "base", "ambos" e/ou "direita" (separados por espaço)
   As cores são nomes das variáveis CSS --cor-<nome> definidas no :root.
   Também reage ao mouse destacando o bloco sob o cursor.
   ========================================================================== */

// Segue a opção "Reduzir animações" do menu de acessibilidade (js/acessibilidade.js);
// se ele não carregar, usa a preferência do sistema.
function pixelsReduzirMovimento() {
  if (typeof animacoesReduzidas === "function") return animacoesReduzidas();
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Gerador pseudoaleatório com semente: o desenho fica igual a cada visita
function criarAleatorio(semente) {
  let estado = semente >>> 0;
  return function aleatorio() {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerCor(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--cor-${nome}`).trim();
}

/* Gera uma faixa irregular de blocos a partir de uma borda.
   Retorna uma lista de { coluna, linha, cor }. */
function gerarFaixa(colunas, linhas, profundidadeMax, aPartirDoFim, corBase, corDestaque, aleatorio) {
  const blocos = [];
  let profundidade = Math.floor(aleatorio() * profundidadeMax);

  for (let coluna = 0; coluna < colunas; coluna++) {
    // Passeio aleatório: a borda sobe e desce um bloco por vez
    profundidade += Math.floor(aleatorio() * 3) - 1;
    profundidade = Math.max(0, Math.min(profundidadeMax, profundidade));

    const linhaReal = (linha) => (aPartirDoFim ? linhas - 1 - linha : linha);

    for (let linha = 0; linha < profundidade; linha++) {
      // pequenos "furos" dentro da faixa deixam o desenho mais orgânico
      if (linha > 0 && linha < profundidade - 1 && aleatorio() < 0.08) continue;
      blocos.push({ coluna, linha: linhaReal(linha), cor: corBase });
    }

    // blocos soltos logo depois da borda, alguns na cor de destaque
    if (aleatorio() < 0.35) {
      const cor = corDestaque && aleatorio() < 0.3 ? corDestaque : corBase;
      blocos.push({ coluna, linha: linhaReal(profundidade + 1), cor });
    }
    if (aleatorio() < 0.1) {
      const cor = corDestaque && aleatorio() < 0.5 ? corDestaque : corBase;
      blocos.push({ coluna, linha: linhaReal(profundidade + 2), cor });
    }
  }
  return blocos;
}

/* Escada de blocos na lateral direita (como no selo "Verify") */
function gerarLateralDireita(colunas, linhas, cor, aleatorio) {
  const blocos = [];
  let largura = 1;
  for (let linha = 0; linha < linhas; linha++) {
    largura += Math.floor(aleatorio() * 3) - 1;
    largura = Math.max(0, Math.min(3, largura));
    for (let i = 0; i < largura; i++) {
      blocos.push({ coluna: colunas - 1 - i, linha, cor });
    }
  }
  return blocos;
}

function iniciarMosaico(area) {
  const canvas = document.createElement("canvas");
  canvas.className = "pixels-canvas";
  canvas.setAttribute("aria-hidden", "true");
  area.prepend(canvas);
  const contexto = canvas.getContext("2d");

  const modos = (area.dataset.pixels || "base").split(" ");
  const semente = Number(area.dataset.pixelsSemente) || 7;
  let blocos = [];
  let tamanho = 32;
  let blocoSobCursor = null;

  function gerar() {
    const largura = area.clientWidth;
    const altura = area.clientHeight;
    const densidade = window.devicePixelRatio || 1;
    canvas.width = Math.round(largura * densidade);
    canvas.height = Math.round(altura * densidade);
    contexto.setTransform(densidade, 0, 0, densidade, 0, 0);

    tamanho = largura < 768 ? 16 : largura < 1280 ? 24 : 32;
    const colunas = Math.ceil(largura / tamanho);
    const linhas = Math.ceil(altura / tamanho);
    const aleatorio = criarAleatorio(semente);
    const destaque = area.dataset.pixelsDestaque ? lerCor(area.dataset.pixelsDestaque) : null;

    blocos = [];
    if (modos.includes("topo") || modos.includes("ambos")) {
      blocos.push(...gerarFaixa(colunas, linhas, 2, false, lerCor(area.dataset.pixelsTopo || "preto"), destaque, aleatorio));
    }
    if (modos.includes("base") || modos.includes("ambos")) {
      blocos.push(...gerarFaixa(colunas, linhas, 3, true, lerCor(area.dataset.pixelsBase || "papel"), destaque, aleatorio));
    }
    if (modos.includes("direita") && destaque && largura >= 768) {
      blocos.push(...gerarLateralDireita(colunas, Math.floor(linhas * 0.6), destaque, aleatorio));
    }
  }

  function desenhar(quantidade = blocos.length) {
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < quantidade; i++) {
      const bloco = blocos[i];
      contexto.fillStyle = bloco.cor;
      contexto.fillRect(bloco.coluna * tamanho, bloco.linha * tamanho, tamanho, tamanho);
    }
    // destaque do bloco sob o cursor (contorno + preenchimento translúcido)
    if (blocoSobCursor) {
      const x = blocoSobCursor.coluna * tamanho;
      const y = blocoSobCursor.linha * tamanho;
      contexto.fillStyle = "rgba(123, 227, 107, 0.35)";
      contexto.fillRect(x, y, tamanho, tamanho);
      contexto.strokeStyle = lerCor("neon");
      contexto.lineWidth = 2;
      contexto.strokeRect(x + 1, y + 1, tamanho - 2, tamanho - 2);
    }
  }

  // Animação de entrada: os blocos aparecem aos poucos, em ordem aleatória
  function animarEntrada() {
    const embaralhar = criarAleatorio(semente + 1);
    blocos.sort(() => embaralhar() - 0.5);
    const duracao = 900;
    const inicio = performance.now();
    function quadro(agora) {
      const progresso = Math.min(1, (agora - inicio) / duracao);
      desenhar(Math.floor(blocos.length * progresso));
      if (progresso < 1) requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }

  gerar();
  if (pixelsReduzirMovimento()) desenhar();
  else animarEntrada();

  // Interação com o mouse: destaca o bloco da grade sob o cursor
  // (verifica a cada movimento, pois a opção pode ser trocada com a página aberta)
  area.addEventListener("pointermove", (evento) => {
    if (evento.pointerType !== "mouse" || pixelsReduzirMovimento()) return;
    const limites = area.getBoundingClientRect();
    const coluna = Math.floor((evento.clientX - limites.left) / tamanho);
    const linha = Math.floor((evento.clientY - limites.top) / tamanho);
    if (blocoSobCursor && blocoSobCursor.coluna === coluna && blocoSobCursor.linha === linha) return;
    blocoSobCursor = { coluna, linha };
    desenhar();
  });
  area.addEventListener("pointerleave", () => {
    blocoSobCursor = null;
    desenhar();
  });

  // Redesenha ao redimensionar a tela (com pequeno atraso para não pesar)
  let temporizador;
  window.addEventListener("resize", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      gerar();
      desenhar();
    }, 150);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-pixels]").forEach(iniciarMosaico);
});
