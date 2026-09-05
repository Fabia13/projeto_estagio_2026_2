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

// Dias da semana no padrão do JavaScript: 0 = domingo, 1 = segunda, ...
// 6 = sábado. "janelas" são intervalos [início, fim) em que o horário
// escolhido precisa cair.
const REGRAS_ATENDIMENTO = {
  consulta_medica: {
    dias: [1, 2, 3],
    janelas: [["07:00", "11:00"], ["13:00", "17:00"]],
    descricao: "segunda a quarta, das 7h às 11h e das 13h às 17h",
  },
  pre_natal: {
    dias: [4],
    janelas: [["07:00", "11:00"], ["13:00", "17:00"]],
    descricao: "quinta-feira, das 7h às 11h e das 13h às 17h",
  },
  vacinacao: {
    dias: [1, 2, 3, 4, 5],
    janelas: [["07:00", "17:00"]],
    descricao: "segunda a sexta, das 7h às 17h",
  },
  puericultura: {
    dias: [2, 4],
    janelas: [["07:00", "11:00"], ["13:00", "17:00"]],
    descricao: "terça e quinta-feira, das 7h às 11h e das 13h às 17h",
  },
  visita_domiciliar: {
    dias: [5],
    janelas: [["08:00", "13:00"]],
    descricao: "sexta-feira, das 8h às 13h",
  },
};

// Constrói a data em horário local (evita o problema de "new Date('2026-09-09')"
// interpretar como UTC e voltar um dia em fusos como o do Brasil).
function diaDaSemana(dataIso) {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).getDay();
}

function horarioDentroDaJanela(horario, janelas) {
  return janelas.some(([inicio, fim]) => horario >= inicio && horario < fim);
}

function validarRegraAtendimento(tipo, dataIso, horario) {
  const regra = REGRAS_ATENDIMENTO[tipo];
  if (!regra) return { valido: true };

  const dia = diaDaSemana(dataIso);
  const diaValido = regra.dias.includes(dia);
  const horarioValido = horarioDentroDaJanela(horario, regra.janelas);

  if (!diaValido || !horarioValido) {
    return {
      valido: false,
      mensagem: `${TIPO_LABELS[tipo]} atende ${regra.descricao}. Escolha um dia e horário dentro desse período.`,
    };
  }

  return { valido: true };
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-agendamento");
  const feedback = document.getElementById("form-feedback");
  const confirmation = document.getElementById("confirmation");
  const confirmationDetails = document.getElementById("confirmation-details");
  const btnEnviar = document.getElementById("btn-enviar");
  const btnNovo = document.getElementById("btn-novo");
  const dataInput = document.getElementById("data");
  const tipoSelect = document.getElementById("tipo");
  const horarioInfo = document.getElementById("horario-info");

  // Não deixa escolher uma data no passado.
  const hoje = new Date().toISOString().split("T")[0];
  dataInput.setAttribute("min", hoje);

  // Mostra o horário de funcionamento assim que a pessoa escolhe o tipo.
  tipoSelect.addEventListener("change", () => {
    const regra = REGRAS_ATENDIMENTO[tipoSelect.value];
    horarioInfo.textContent = regra
      ? `Atendemos ${regra.descricao}.`
      : "";
  });

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

    const regraCheck = validarRegraAtendimento(dados.tipo, dados.data, dados.horario);
    if (!regraCheck.valido) {
      mostrarErro(regraCheck.mensagem);
      return;
    }

    definirCarregando(true);

    const { error } = await supabaseClient
      .from("agendamentos")
      .insert([dados]);

    definirCarregando(false);

    if (error) {
      console.error("Erro ao salvar agendamento:", error);

      // 23505 = restrição única violada / 23P01 = restrição de exclusão
      // violada (a regra de espaçamento mínimo de 30 minutos entre
      // agendamentos do mesmo tipo). Nos dois casos, o horário
      // escolhido conflita com outro já existente.
      if (error.code === "23505" || error.code === "23P01") {
        mostrarErro("Esse horário está muito próximo de outro agendamento já existente para esse tipo de atendimento (mínimo 30 minutos de intervalo). Escolha outro horário.");
      } else {
        mostrarErro("Não foi possível enviar sua solicitação agora. Tente novamente em instantes.");
      }
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