// ============================================
// Lógica da tela de login
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  // Se já existe uma sessão válida, não faz sentido ficar na tela de
  // login — manda direto para o painel.
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = "painel.html";
    return;
  }

  const form = document.getElementById("form-login");
  const feedback = document.getElementById("login-feedback");
  const btnLogin = document.getElementById("btn-login");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    limparFeedback();
    definirCarregando(true);

    const email = form.email.value.trim();
    const senha = form.senha.value;

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: senha,
    });

    definirCarregando(false);

    if (error) {
      mostrarErro("Email ou senha incorretos.");
      return;
    }

    window.location.href = "painel.html";
  });

  function definirCarregando(carregando) {
    btnLogin.disabled = carregando;
    btnLogin.querySelector(".btn-label").textContent = carregando
      ? "Entrando..."
      : "Entrar";
  }

  function mostrarErro(mensagem) {
    feedback.textContent = mensagem;
    feedback.dataset.state = "error";
  }

  function limparFeedback() {
    feedback.textContent = "";
    delete feedback.dataset.state;
  }
});
