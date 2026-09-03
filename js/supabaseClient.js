// ============================================
// Configuração do Supabase
// ============================================
//
// Preencha os dois valores abaixo com os dados do SEU projeto Supabase:
// 1. Acesse https://supabase.com e crie um projeto gratuito
// 2. No painel do projeto, vá em Project Settings > API
// 3. Copie "Project URL" e cole em SUPABASE_URL
// 4. Copie a chave "anon public" e cole em SUPABASE_ANON_KEY
//
// A chave "anon" é pública por design do Supabase — ela não dá acesso
// a nada sozinha. Quem protege os dados de verdade são as políticas de
// RLS definidas em sql/schema.sql. Por isso não há problema em ela
// aparecer no código do front-end.

const SUPABASE_URL = "https://edzedbexbflzlpxybixe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkemVkYmV4YmZsemxweHliaXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzODYyMzgsImV4cCI6MjEwMzk2MjIzOH0.jodQaQNW17cJSm9McXIDVnSD2oAt-k20kObmvDupQfc";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
