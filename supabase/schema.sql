-- Lâmpada: esquema do banco de dados
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase (Database > SQL Editor > New query).
-- Pode rodar de novo com segurança: os comandos usam "if not exists" e recriam as políticas.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  consentimento_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.perfil_atual (
  user_id uuid primary key references auth.users(id) on delete cascade,
  respostas jsonb not null,
  pontos jsonb not null,
  total int not null,
  nivel text not null,
  foco text not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.planos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nivel text not null,
  inicio timestamptz not null,
  concluidos int[] not null default '{}',
  desafios int[] not null default '{}',
  notas jsonb not null default '{}',
  atualizado_em timestamptz not null default now()
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  passagens jsonb not null default '[]',
  crise text,
  criado_em timestamptz not null default now()
);
create index if not exists mensagens_usuario_data on public.mensagens (user_id, criado_em);

-- Cada pessoa só acessa as próprias linhas.
alter table public.profiles enable row level security;
alter table public.perfil_atual enable row level security;
alter table public.planos enable row level security;
alter table public.mensagens enable row level security;

drop policy if exists "profiles select" on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles select" on public.profiles for select using (auth.uid() = id);
create policy "profiles insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "perfil_atual select" on public.perfil_atual;
drop policy if exists "perfil_atual insert" on public.perfil_atual;
drop policy if exists "perfil_atual update" on public.perfil_atual;
create policy "perfil_atual select" on public.perfil_atual for select using (auth.uid() = user_id);
create policy "perfil_atual insert" on public.perfil_atual for insert with check (auth.uid() = user_id);
create policy "perfil_atual update" on public.perfil_atual for update using (auth.uid() = user_id);

drop policy if exists "planos select" on public.planos;
drop policy if exists "planos insert" on public.planos;
drop policy if exists "planos update" on public.planos;
create policy "planos select" on public.planos for select using (auth.uid() = user_id);
create policy "planos insert" on public.planos for insert with check (auth.uid() = user_id);
create policy "planos update" on public.planos for update using (auth.uid() = user_id);

drop policy if exists "mensagens select" on public.mensagens;
drop policy if exists "mensagens insert" on public.mensagens;
drop policy if exists "mensagens delete" on public.mensagens;
create policy "mensagens select" on public.mensagens for select using (auth.uid() = user_id);
create policy "mensagens insert" on public.mensagens for insert with check (auth.uid() = user_id);
create policy "mensagens delete" on public.mensagens for delete using (auth.uid() = user_id);
