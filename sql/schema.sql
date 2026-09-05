-- Schema do projeto: Agendamento ESF
-- Rode este script no SQL Editor do seu projeto Supabase.

-- Extensão necessária para gerar UUIDs
create extension if not exists "pgcrypto";

-- Extensão necessária para a regra de espaçamento mínimo entre
-- agendamentos do mesmo tipo (constraint EXCLUDE abaixo).
create extension if not exists "btree_gist";

-- Tabela principal de registros
create table if not exists agendamentos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  email       text not null,
  tipo        text not null check (
                tipo in (
                  'consulta_medica',
                  'pre_natal',
                  'vacinacao',
                  'visita_domiciliar',
                  'puericultura'
                )
              ),
  data        date not null,
  horario     time not null,
  status      text not null default 'pendente' check (
                status in ('pendente', 'confirmado', 'cancelado')
              ),
  criado_em   timestamptz not null default now()
);

-- Índice para acelerar a ordenação do painel por data
create index if not exists agendamentos_data_idx on agendamentos (data, horario);

-- Impede dois agendamentos do MESMO TIPO com menos de 30 minutos de
-- diferença entre si na mesma data — um atendimento não é
-- instantâneo, então precisa desse intervalo mínimo de segurança.
-- Isso também cobre (e substitui) o caso mais simples de dois
-- agendamentos no horário exatamente igual. Tipos diferentes não
-- conflitam entre si, porque são atendidos por pessoas diferentes.
-- Cancelados não contam para essa regra: se um horário foi liberado
-- por cancelamento, outra pessoa pode ocupá-lo.
alter table agendamentos add constraint agendamentos_espacamento_minimo
  exclude using gist (
    tipo with =,
    tsrange(
      (data + horario)::timestamp,
      (data + horario)::timestamp + interval '30 minutes',
      '[)'
    ) with &&
  )
  where (status <> 'cancelado');

-- Habilita Row Level Security (obrigatório para controlar quem lê/escreve o quê)
alter table agendamentos enable row level security;

-- Visitantes (chave anônima) só podem INSERIR um novo agendamento.
-- Não conseguem ler, atualizar ou apagar nada — isso é o que impede
-- alguém de acessar a lista de registros sem estar logado, mesmo
-- direto pela API do Supabase.
create policy "Visitantes podem criar agendamentos"
  on agendamentos
  for insert
  to anon
  with check (true);

-- Administradores autenticados podem ler todos os registros.
create policy "Admins autenticados podem ler agendamentos"
  on agendamentos
  for select
  to authenticated
  using (true);

-- Administradores autenticados podem atualizar o status
-- (usado pelo painel para marcar confirmado/cancelado).
create policy "Admins autenticados podem atualizar agendamentos"
  on agendamentos
  for update
  to authenticated
  using (true)
  with check (true);