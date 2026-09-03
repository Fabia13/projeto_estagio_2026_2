// ============================================
// Lógica da página pública: formulário de agendamento
// ============================================

const TIPO_LABELS = {
  consulta_medica: "Consulta médica",
  pre_natal: "Pré-natal",
  vacinacao: "Vacinação",
  puericultura: "Puericultura",
  visita_domiciliar: "Visita domiciliar",
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-agendamento");
  const feedback = document.getElementById("form-feedback");
  const confirmation = document.getElementById("confirmation");
  const confirmationDetails = document.getElementById("confirmation-details");
  const btnEnviar = document.getElementById("btn-enviar");
  const btnNovo = document.getElementById("btn-novo");
  const dataInput = document.getElementById("data");

  // Não deixa escolher uma data no passado.
  const hoje = new Date().toISOString().split("T")[0];
  dataInput.setAttribute("min", hoje);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    limparFeedback();

    const dados = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      tipo: form.tipo.value,
      data: form.data.value,
      horario: form.horario.value,
    };

    if (!dados.nome || !dados.email || !dados.tipo || !dados.data || !dados.horario) {
      mostrarErro("Preencha todos os campos antes de enviar.");
      return;
    }

    definirCarregando(true);

    const { error } = await supabaseClient
      .from("agendamentos")
      .insert([dados]);

    definirCarregando(false);

    if (error) {
      console.error("Erro ao salvar agendamento:", error);
      mostrarErro("Não foi possível enviar sua solicitação agora. Tente novamente em instantes.");
      return;
    }

    mostrarConfirmacao(dados);
  });

  btnNovo.addEventListener("click", () => {
    form.reset();
    confirmation.hidden = true;
    form.hidden = false;
    limparFeedback();
  });

  function definirCarregando(carregando) {
    btnEnviar.disabled = carregando;
    btnEnviar.querySelector(".btn-label").textContent = carregando
      ? "Enviando..."
      : "Enviar solicitação";
  }

  function mostrarErro(mensagem) {
    feedback.textContent = mensagem;
    feedback.dataset.state = "error";
  }

  function limparFeedback() {
    feedback.textContent = "";
    delete feedback.dataset.state;
  }

  function mostrarConfirmacao(dados) {
    const dataFormatada = formatarData(dados.data);
    const tipoLabel = TIPO_LABELS[dados.tipo] || dados.tipo;

    confirmationDetails.textContent =
      `${tipoLabel} solicitado para ${dataFormatada} às ${dados.horario}, em nome de ${dados.nome}.`;

    form.hidden = true;
    confirmation.hidden = false;
    confirmation.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatarData(isoDate) {
    const [ano, mes, dia] = isoDate.split("-");
    return `${dia}/${mes}/${ano}`;
  }
});
