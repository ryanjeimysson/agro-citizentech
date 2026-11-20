/* ==========================================================================
   Fila de casos (casos.html)
   - Renderiza os casos fictícios em cards
   - Filtro por palavra-chave, área e status (eventos input/change)
   - Modal de detalhes com histórico e ação "Manifestar interesse"
   ========================================================================== */

const STATUS_CASO = {
  aguardando: { rotulo: "Aguardando estudante", classe: "badge--aguardando" },
  revisao: { rotulo: "Em revisão do supervisor", classe: "badge--revisao" },
  concluido: { rotulo: "Devolutiva enviada", classe: "badge--concluido" },
};

// Casos fictícios criados pela equipe para demonstração
const CASOS = [
  {
    codigo: "AGR-10231",
    titulo: "Manchas nas folhas do tomateiro",
    area: "Agricultura",
    tema: "Hortaliças → Alterações nas folhas",
    status: "aguardando",
    regiao: "Interior de SP",
    data: "08/11/2026",
    relato: "Acho que é fungo, as folhas do tomate estão manchadas desde a semana passada. Cerca de 30 plantas.",
    historico: [
      ["08/11/2026", "Relato registrado e ficha confirmada pelo produtor."],
      ["09/11/2026", "Classificação revisada pela coordenação."],
    ],
  },
  {
    codigo: "AGR-10228",
    titulo: "Bezerro com diarreia há três dias",
    area: "Pecuária",
    tema: "Saúde animal",
    status: "revisao",
    regiao: "Sul de MG",
    data: "06/11/2026",
    relato: "Um bezerro de 2 meses está com diarreia e comendo pouco. Os outros estão normais.",
    historico: [
      ["06/11/2026", "Relato registrado."],
      ["06/11/2026", "Estudante atribuído pela coordenação."],
      ["07/11/2026", "Devolutiva preliminar enviada para revisão do supervisor."],
    ],
  },
  {
    codigo: "AGR-10219",
    titulo: "Lagartas na plantação de milho",
    area: "Agricultura",
    tema: "Pragas e insetos",
    status: "concluido",
    regiao: "Oeste do PR",
    data: "01/11/2026",
    relato: "Apareceram lagartas no cartucho do milho em parte da roça.",
    historico: [
      ["01/11/2026", "Relato registrado."],
      ["02/11/2026", "Estudante atribuído."],
      ["04/11/2026", "Devolutiva revisada e aprovada pelo supervisor."],
      ["05/11/2026", "Produtor informou que acompanhará a evolução."],
    ],
  },
  {
    codigo: "AGR-10235",
    titulo: "Dúvida sobre irrigação da horta",
    area: "Agricultura",
    tema: "Irrigação e água",
    status: "aguardando",
    regiao: "Agreste de PE",
    data: "10/11/2026",
    relato: "Quero saber quanto tempo devo irrigar a horta no período de seca, a água do poço está pouca.",
    historico: [["10/11/2026", "Relato registrado e ficha confirmada."]],
  },
  {
    codigo: "AGR-10236",
    titulo: "Plantas com crescimento fraco",
    area: "A classificar",
    tema: "Categoria incerta",
    status: "aguardando",
    regiao: "Norte de GO",
    data: "11/11/2026",
    relato: "Minhas plantas não estão crescendo como antes e não sei o motivo.",
    historico: [["11/11/2026", "Relato registrado. Caso enviado para classificação humana."]],
  },
  {
    codigo: "AGR-10224",
    titulo: "Pastagem degradada e queda no leite",
    area: "Pecuária",
    tema: "Nutrição e pastagem",
    status: "concluido",
    regiao: "Triângulo Mineiro",
    data: "03/11/2026",
    relato: "O pasto está ralo e a produção de leite caiu nas últimas semanas.",
    historico: [
      ["03/11/2026", "Relato registrado."],
      ["04/11/2026", "Estudante atribuído."],
      ["07/11/2026", "Supervisor recomendou visita presencial (encaminhamento)."],
    ],
  },
];

const interessesRegistrados = new Set();

function criarCardCaso(caso) {
  const status = STATUS_CASO[caso.status];
  const card = document.createElement("article");
  card.className = "card caso";
  card.innerHTML = `
    <div class="caso__topo">
      <span class="caso__codigo">${caso.codigo}</span>
      <span class="badge ${status.classe}">${status.rotulo}</span>
    </div>
    <h3>${caso.titulo}</h3>
    <p class="caso__categoria">${caso.area} · ${caso.tema}</p>
    <div class="caso__rodape">
      <span>${caso.regiao} · ${caso.data}</span>
      <button class="botao botao--secundario botao--pequeno" type="button" data-codigo="${caso.codigo}">
        Ver detalhes<span class="visualmente-oculto"> do caso ${caso.codigo}</span>
      </button>
    </div>`;
  return card;
}

function filtrarCasos({ busca, area, status }) {
  const termo = busca.trim().toLowerCase();
  return CASOS.filter((caso) => {
    const textoCaso = `${caso.titulo} ${caso.relato} ${caso.tema} ${caso.regiao}`.toLowerCase();
    return (
      (!termo || textoCaso.includes(termo)) &&
      (area === "todas" || caso.area === area) &&
      (status === "todos" || caso.status === status)
    );
  });
}

function iniciarFilaCasos() {
  const lista = document.getElementById("lista-casos");
  if (!lista) return;

  const form = document.getElementById("filtros-casos");
  const resultado = document.getElementById("resultado-casos");
  const semResultados = document.getElementById("sem-casos");

  function renderizar() {
    const filtrados = filtrarCasos({
      busca: form.busca.value,
      area: form.area.value,
      status: form.status.value,
    });
    lista.innerHTML = "";
    filtrados.forEach((caso) => lista.appendChild(criarCardCaso(caso)));
    resultado.textContent = `${filtrados.length} de ${CASOS.length} casos exibidos`;
    semResultados.hidden = filtrados.length > 0;
  }

  form.addEventListener("input", renderizar);
  form.addEventListener("change", renderizar);
  form.addEventListener("submit", (evento) => evento.preventDefault());

  // Delegação de evento: um único listener para todos os botões "Ver detalhes"
  lista.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-codigo]");
    if (botao) abrirModalCaso(botao.dataset.codigo, botao);
  });

  iniciarModal();
  renderizar();
}

/* ---------- Modal ---------- */
let elementoQueAbriuModal = null;

function abrirModalCaso(codigo, origem) {
  const caso = CASOS.find((item) => item.codigo === codigo);
  if (!caso) return;

  const modal = document.getElementById("modal-caso");
  document.getElementById("modal-codigo").textContent = `${caso.codigo} · ${caso.regiao}`;
  document.getElementById("modal-titulo").textContent = caso.titulo;
  document.getElementById("modal-categoria").textContent = `${caso.area} · ${caso.tema}`;
  document.getElementById("modal-relato").textContent = `Relato: “${caso.relato}”`;

  const historico = document.getElementById("modal-historico");
  historico.innerHTML = "";
  caso.historico.forEach(([data, descricao]) => {
    const item = document.createElement("li");
    item.innerHTML = `<time>${data}</time>${descricao}`;
    historico.appendChild(item);
  });

  // Só é possível manifestar interesse em casos aguardando estudante
  const botaoInteresse = document.getElementById("botao-interesse");
  const mensagem = document.getElementById("modal-mensagem");
  const podeManifestar = caso.status === "aguardando" && caso.area !== "A classificar";
  botaoInteresse.hidden = !podeManifestar;
  botaoInteresse.dataset.codigo = caso.codigo;
  mensagem.hidden = !interessesRegistrados.has(caso.codigo);
  mensagem.textContent = "Interesse registrado. A coordenação confirmará a atribuição conforme sua formação e a supervisão disponível.";
  botaoInteresse.disabled = interessesRegistrados.has(caso.codigo);

  elementoQueAbriuModal = origem;
  modal.hidden = false;
  document.body.classList.add("sem-rolagem");
  modal.querySelector(".modal__fechar").focus();
}

function fecharModal() {
  const modal = document.getElementById("modal-caso");
  modal.hidden = true;
  document.body.classList.remove("sem-rolagem");
  if (elementoQueAbriuModal) elementoQueAbriuModal.focus();
}

function iniciarModal() {
  const modal = document.getElementById("modal-caso");

  modal.querySelectorAll("[data-fechar-modal]").forEach((elemento) => {
    elemento.addEventListener("click", fecharModal);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) fecharModal();
  });

  document.getElementById("botao-interesse").addEventListener("click", (evento) => {
    interessesRegistrados.add(evento.currentTarget.dataset.codigo);
    evento.currentTarget.disabled = true;
    document.getElementById("modal-mensagem").hidden = false;
  });
}

document.addEventListener("DOMContentLoaded", iniciarFilaCasos);
