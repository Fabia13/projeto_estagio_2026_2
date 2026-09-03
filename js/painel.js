// ============================================
// Lógica do painel administrativo
// ============================================

const TIPO_LABELS = {
  consulta_medica: "Consulta médica",
  pre_natal: "Pré-natal",
  vacinacao: "Vacinação",
  puericultura: "Puericultura",
  visita_domiciliar: "Visita domiciliar",
};

const STATUS_LABELS = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};

let todosOsRegistros = [];

document.addEventListener("DOMContentLoaded", async () => {
  // ---- Proteção de rota ----
  // Sem sessão válida, nem chega a tentar carregar o painel: vai
  // direto para o login. Isso cobre também quem digita a URL do
  // painel direto na barra do navegador sem estar logado.
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("usuario-email").textContent = session.user.email;

  // Se a sessão expirar/for encerrada em outra aba, manda para o login.
  supabaseClient.auth.onAuthStateChange((_event, novaSessao) => {
    if (!novaSessao) {
      window.location.href = "login.html";
    }
  });

  document.getElementById("btn-sair").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });

  document.getElementById("filtro-tipo").addEventListener("change", (event) => {
    renderizarTabela(filtrarPorTipo(todosOsRegistros, event.target.value));
  });

  await carregarRegistros();
});

async function carregarRegistros() {
  mostrarEstado("carregando");

  const { data, error } = await supabaseClient
    .from("agendamentos")
    .select("*")
    .order("data", { ascending: true })
    .order("horario", { ascending: true });

  if (error) {
    console.error("Erro ao carregar agendamentos:", error);
    document.getElementById("estado-erro-mensagem").textContent =
      "Tente recarregar a página em instantes.";
    mostrarEstado("erro");
    return;
  }

  todosOsRegistros = data;

  const filtroAtual = document.getElementById("filtro-tipo").value;
  renderizarTabela(filtrarPorTipo(todosOsRegistros, filtroAtual));
}

function filtrarPorTipo(registros, tipo) {
  if (!tipo) return registros;
  return registros.filter((registro) => registro.tipo === tipo);
}

function renderizarTabela(registros) {
  if (registros.length === 0) {
    mostrarEstado("vazio");
    return;
  }

  const corpo = document.getElementById("tabela-corpo");
  corpo.innerHTML = "";

  registros.forEach((registro) => {
    corpo.appendChild(criarLinha(registro));
  });

  mostrarEstado("tabela");
}

function criarLinha(registro) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${escapeHtml(registro.nome)}</td>
    <td>${escapeHtml(registro.email)}</td>
    <td>${TIPO_LABELS[registro.tipo] || escapeHtml(registro.tipo)}</td>
    <td>${formatarData(registro.data)}</td>
    <td>${registro.horario.slice(0, 5)}</td>
    <td>
      <span class="badge badge-${registro.status}" id="badge-${registro.id}">
        ${STATUS_LABELS[registro.status] || registro.status}
      </span>
    </td>
  `;

  const celulaStatus = tr.querySelector(`#badge-${registro.id}`).closest("td");
  const select = criarSeletorStatus(registro);
  celulaStatus.appendChild(select);

  return tr;
}

function criarSeletorStatus(registro) {
  const select = document.createElement("select");
  select.className = "status-select";
  select.setAttribute("aria-label", `Alterar status de ${registro.nome}`);

  Object.entries(STATUS_LABELS).forEach(([valor, rotulo]) => {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = rotulo;
    option.selected = valor === registro.status;
    select.appendChild(option);
  });

  select.addEventListener("change", async () => {
    const novoStatus = select.value;
    select.disabled = true;

    const { error } = await supabaseClient
      .from("agendamentos")
      .update({ status: novoStatus })
      .eq("id", registro.id);

    select.disabled = false;

    if (error) {
      console.error("Erro ao atualizar status:", error);
      select.value = registro.status;
      alert("Não foi possível atualizar o status. Tente novamente.");
      return;
    }

    registro.status = novoStatus;
    const badge = document.getElementById(`badge-${registro.id}`);
    badge.textContent = STATUS_LABELS[novoStatus];
    badge.className = `badge badge-${novoStatus}`;
  });

  return select;
}

function mostrarEstado(estado) {
  const estados = {
    carregando: "estado-carregando",
    vazio: "estado-vazio",
    erro: "estado-erro",
    tabela: "tabela-wrap",
  };

  Object.values(estados).forEach((id) => {
    document.getElementById(id).hidden = true;
  });

  document.getElementById(estados[estado]).hidden = false;
}

function formatarData(isoDate) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
