/* ==========================================================================
   Validação do formulário de contato (contato.html)
   - Campos obrigatórios, formato de e-mail e tamanho mínimo
   - Feedback visual por campo (borda + mensagem) e mensagem geral
   - Envio apenas simulado: nenhum dado sai do navegador
   ========================================================================== */

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Regras de cada campo: retornam a mensagem de erro ou "" quando válido
const regrasContato = {
  nome(valor) {
    if (!valor) return "Informe seu nome.";
    if (valor.length < 3) return "O nome deve ter pelo menos 3 caracteres.";
    return "";
  },
  email(valor) {
    if (!valor) return "Informe seu e-mail.";
    if (!REGEX_EMAIL.test(valor)) return "E-mail inválido. Use o formato nome@exemplo.com.";
    return "";
  },
  assunto(valor) {
    return valor ? "" : "Selecione um assunto.";
  },
  mensagem(valor) {
    if (!valor) return "Escreva sua mensagem.";
    if (valor.length < 10) return "A mensagem deve ter pelo menos 10 caracteres.";
    return "";
  },
};

function validarCampo(campo) {
  const erro = regrasContato[campo.name](campo.value.trim());
  const container = campo.closest(".campo");
  const spanErro = document.getElementById(`${campo.id}-erro`);

  container.classList.toggle("campo--erro", Boolean(erro));
  container.classList.toggle("campo--valido", !erro);
  campo.setAttribute("aria-invalid", String(Boolean(erro)));
  spanErro.textContent = erro;
  return !erro;
}

function mostrarMensagemGeral(elemento, tipo, texto) {
  elemento.className = `mensagem-formulario mensagem-formulario--${tipo}`;
  elemento.textContent = texto;
  elemento.hidden = false;
}

function iniciarFormularioContato() {
  const form = document.getElementById("form-contato");
  if (!form) return;

  const campos = Array.from(form.querySelectorAll("input, select, textarea"));
  const mensagemGeral = document.getElementById("contato-mensagem");

  campos.forEach((campo) => {
    // Valida ao sair do campo e, depois do primeiro erro, a cada digitação
    campo.addEventListener("blur", () => validarCampo(campo));
    campo.addEventListener("input", () => {
      if (campo.closest(".campo").classList.contains("campo--erro")) validarCampo(campo);
    });
    campo.addEventListener("change", () => validarCampo(campo));
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault(); // impede o envio enquanto não validar

    const resultados = campos.map(validarCampo);
    const primeiroInvalido = campos[resultados.indexOf(false)];

    if (primeiroInvalido) {
      const qtdErros = resultados.filter((ok) => !ok).length;
      mostrarMensagemGeral(
        mensagemGeral,
        "erro",
        `Não foi possível enviar: ${qtdErros} campo(s) precisam de correção.`
      );
      primeiroInvalido.focus();
      return;
    }

    const nome = form.nome.value.trim().split(" ")[0];
    mostrarMensagemGeral(
      mensagemGeral,
      "sucesso",
      `Obrigado, ${nome}! Sua mensagem foi registrada (envio simulado). Nenhuma mensagem foi enviada à equipe.`
    );
    form.reset();
    campos.forEach((campo) => {
      campo.closest(".campo").classList.remove("campo--valido", "campo--erro");
      campo.removeAttribute("aria-invalid");
    });
  });
}

document.addEventListener("DOMContentLoaded", iniciarFormularioContato);
