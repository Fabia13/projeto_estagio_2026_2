# Agendamento ESF Saúde é o que Interessa



## Visão geral

Este é um sistema de agendamento para uma Unidade de Saúde da Família (ESF) fictícia, chamada **ESF Saúde é o que Interessa **. Ele tem duas frentes:

- **Uma página pública**, onde qualquer visitante pode conhecer a unidade e solicitar um agendamento (consulta médica, pré-natal, vacinação, puericultura ou visita domiciliar).
- **Um painel administrativo**, protegido por login, onde a equipe da unidade visualiza e gerencia as solicitações que chegam.

Toda solicitação enviada pelo formulário público nasce com status **pendente**. É a equipe, dentro do painel, que confirma ou cancela cada uma.

### Por que esse tema

Escolhi o contexto de uma ESF porque é uma realidade que conheço de perto,tenho experiência como agente comunitária de saúde, o que me deu uma noção concreta de como esse fluxo de agendamento funciona na prática: os tipos de atendimento mais comuns, os campos que realmente importam num registro, e as situações do dia a dia que um sistema desse tipo precisa suportar.

## Funcionalidades

### Página pública (`index.html`)

- Apresentação da unidade (endereço, horário de funcionamento, telefone) e dos serviços oferecidos
- Formulário de agendamento com nome, email, tipo de atendimento, data e horário
- Validação dos campos antes do envio
- Confirmação visual na própria página após o envio (o formulário é substituído por uma mensagem de confirmação, sem usar `alert()`)
- Layout responsivo, testado em telas de celular e desktop

### Autenticação (`login.html`)

- Login de administrador via email e senha, usando a autenticação pronta do Supabase (Supabase Auth)
- Se a pessoa já estiver logada e tentar acessar a tela de login, é redirecionada direto para o painel
- Mensagem de erro clara quando as credenciais estão erradas, sem travar a tela

### Painel administrativo (`painel.html`)

- **Protegido de verdade**: ao carregar, a página verifica se existe uma sessão válida antes de buscar qualquer dado. Sem sessão, a pessoa é redirecionada para o login,inclusive quando tenta acessar a URL do painel diretamente, sem passar pelo login
- Lista todos os agendamentos, ordenados por data e horário
- Status de cada agendamento em destaque, com cores diferentes (badge) para pendente, confirmado e cancelado
- Três estados tratados na tela: carregando, lista vazia ("nenhum agendamento ainda") e erro de conexão
- **Funcionalidade extra**: o admin consegue mudar o status de um agendamento (pendente → confirmado ou cancelado) direto na lista, sem precisar de outra tela
- **Funcionalidade extra**: filtro por tipo de atendimento, para facilitar quando a lista crescer
- Logout funcional, e a sessão é monitorada em tempo real: se expirar ou for encerrada em outra aba, a pessoa é levada de volta ao login automaticamente

## Modelo de dados

A tabela `agendamentos` guarda cada solicitação com os seguintes campos:

| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid | Gerado automaticamente |
| `nome` | text | Nome de quem solicitou |
| `email` | text | Email de quem solicitou |
| `tipo` | text | Um dos 5 valores fixos: `consulta_medica`, `pre_natal`, `vacinacao`, `puericultura`, `visita_domiciliar` |
| `data` | date | Data desejada para o atendimento |
| `horario` | time | Horário desejado |
| `status` | text | `pendente` (padrão ao criar), `confirmado` ou `cancelado` |
| `criado_em` | timestamptz | Preenchido automaticamente na criação |

O detalhamento completo (constraints, índices, políticas) está em [`sql/schema.sql`](./sql/schema.sql).

## Como o sistema protege os dados

Duas camadas trabalham juntas:

1. **No front-end**: o `painel.js` verifica se existe uma sessão antes de mostrar qualquer coisa, e redireciona para o login se não houver.
2. **No banco de dados (a proteção que realmente importa)**: o Supabase usa Row Level Security (RLS). As políticas definidas em `sql/schema.sql` garantem que:
   - Visitantes anônimos só conseguem **inserir** um novo agendamento — não conseguem ler nem alterar nada, mesmo tentando acessar a API do Supabase diretamente, sem passar pelo site.
   - Apenas administradores autenticados conseguem **ler** e **atualizar** os registros.

Ou seja, mesmo que alguém tentasse burlar a tela do painel, o próprio banco de dados barra o acesso.

## Stack utilizada

- **Front-end:** HTML, CSS e JavaScript puro — sem framework, sem processo de build
- **Back-end, banco de dados e autenticação:** [Supabase](https://supabase.com) (Postgres + Auth + API REST autogerada)

O raciocínio completo por trás dessa escolha está em [`DECISOES.md`](./DECISOES.md).

## Estrutura do projeto

```
├── index.html              # Página pública: apresentação da ESF + formulário
├── login.html                # Tela de login do admin
├── painel.html                 # Painel de gestão (rota protegida)
├── css/
│   ├── style.css                 # Estilos da página pública
│   └── painel.css                  # Estilos do login e do painel
├── js/
│   ├── supabaseClient.js             # Conexão com o projeto Supabase
│   ├── app.js                          # Envio do formulário público
│   ├── auth.js                           # Lógica do login
│   └── painel.js                           # Listagem, filtro, status e logout do painel
└── sql/
    └── schema.sql                          # Criação da tabela e das políticas de RLS
```

## Como rodar o projeto localmente

### Pré-requisitos

- Um navegador atualizado (Chrome, Edge, Firefox...)
- [VS Code](https://code.visualstudio.com/) com a extensão **Live Server** (ou qualquer outro servidor estático — o projeto não usa Node.js nem build)
- Uma conta gratuita no [Supabase](https://supabase.com)

### 1. Clone o repositório

```bash
git clone https://github.com/Fabia13/projeto_estagio_2026_2.git
cd projeto_estagio_2026_2
```

### 2. Crie um projeto no Supabase

Acesse [supabase.com](https://supabase.com), crie uma conta gratuita e um novo projeto. Espere de 1 a 2 minutos até ele terminar de ser provisionado.

### 3. Rode o schema do banco

No painel do Supabase, abra o **SQL Editor**, cole todo o conteúdo de [`sql/schema.sql`](./sql/schema.sql) e clique em **Run**. Isso cria a tabela `agendamentos` já com as políticas de segurança descritas acima.

### 4. Crie o usuário administrador

Em **Authentication > Users > Add user > Create new user**, defina um email e senha — essas serão as credenciais para entrar no painel pelo `login.html`. Marque **Auto Confirm User**, se essa opção aparecer.

### 5. Configure as credenciais do projeto

Em **Project Settings > API**, copie a **Project URL** e a chave **anon public** (nunca a `service_role`, que é secreta). Abra `js/supabaseClient.js` e preencha:

```js
const SUPABASE_URL = "sua-project-url-aqui";
const SUPABASE_ANON_KEY = "sua-anon-key-aqui";
```

> A chave `anon` é pública por natureza do Supabase — quem protege os dados de verdade são as políticas de RLS do passo 3, não o sigilo dessa chave.

### 6. Rode o projeto

Abra `index.html` com o Live Server do VS Code (clique direito no arquivo → "Open with Live Server"). As três páginas ficam acessíveis em:

- Página pública: `index.html`
- Login do admin: `login.html`
- Painel (exige login): `painel.html`

## Problemas comuns

**Erro `PGRST125: Invalid path specified in request URL`** ao enviar o formulário ou carregar o painel: normalmente significa que a `SUPABASE_URL` em `js/supabaseClient.js` foi copiada errada — por exemplo, com `/rest/v1/` no final (essa parte a biblioteca já adiciona sozinha) ou com uma barra `/` sobrando. A URL deve ser só o domínio base, algo como `https://xxxxx.supabase.co`, sem nada depois.

**O painel não mostra nada e fica preso em "Carregando":** confira se o `schema.sql` foi executado com sucesso no SQL Editor e se o usuário admin foi criado em Authentication.

## Decisões técnicas

O raciocínio por trás do tema, da stack, das ambiguidades da especificação e do uso de IA no desenvolvimento está documentado em [`DECISOES.md`](./DECISOES.md).