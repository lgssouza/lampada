-- Lâmpada: esquema do banco de dados (Postgres puro, sem Supabase).
-- Rode este arquivo inteiro contra o seu banco antes do primeiro uso:
--   psql "$DATABASE_URL" -f db/schema.sql
-- Pode rodar de novo com segurança: todos os comandos usam "if not exists".

-- ─── Tabelas do Better Auth ──────────────────────────────────────────────
-- Estrutura conferida rodando a migração de verdade do Better Auth contra um
-- Postgres 16 e inspecionando o resultado com \d — não são tabelas inventadas.
-- Se você já rodou `npx @better-auth/cli migrate` ou deixou o app criar essas
-- tabelas sozinho, pode pular esta seção.

create table if not exists "user" (
  id text primary key,
  name text not null,
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp
);

create table if not exists session (
  id text primary key,
  "expiresAt" timestamptz not null,
  token text not null unique,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp,
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user"(id) on delete cascade
);
create index if not exists session_userid_idx on session ("userId");

create table if not exists account (
  id text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user"(id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp
);
create index if not exists account_userid_idx on account ("userId");

create table if not exists verification (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp
);
create index if not exists verification_identifier_idx on verification (identifier);

-- ─── Tabelas do app Lâmpada ──────────────────────────────────────────────
-- Sem RLS: cada rota da API do Next.js é responsável por só ler e gravar as
-- linhas do usuário autenticado na sessão (ver lib/db.ts). Nunca aceite um
-- user_id vindo do cliente — ele sempre vem da sessão verificada no servidor.

create table if not exists profiles (
  user_id text primary key references "user"(id) on delete cascade,
  consentimento_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists perfil_atual (
  user_id text primary key references "user"(id) on delete cascade,
  respostas jsonb not null,
  pontos jsonb not null,
  total int not null,
  nivel text not null,
  foco text not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists planos (
  user_id text primary key references "user"(id) on delete cascade,
  nivel text not null,
  inicio timestamptz not null,
  concluidos int[] not null default '{}',
  desafios int[] not null default '{}',
  notas jsonb not null default '{}',
  atualizado_em timestamptz not null default now()
);

create table if not exists mensagens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  passagens jsonb not null default '[]',
  crise text,
  criado_em timestamptz not null default now()
);
create index if not exists mensagens_usuario_data on mensagens (user_id, criado_em);
