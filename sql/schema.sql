-- Schema do projeto: Agendamento ESF
-- Rode este script no SQL Editor do seu projeto Supabase.

-- Extensão necessária para gerar UUIDs
create extension if not exists "pgcrypto";

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
