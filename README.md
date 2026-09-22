# Lâmpada

Companheira de discipulado em formato de PWA para membros e simpatizantes de igrejas presbiterianas: login por e-mail, avaliação do ponto de partida na fé, plano de 7 dias (leitura, oração, desafio prático, Breve Catecismo) e aconselhamento a partir da Bíblia. Cada pessoa só acessa os próprios dados.

## Configurar (uma vez)

### 1. Crie um projeto no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um novo projeto.
2. Em **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e rode. Isso cria as tabelas e as regras de segurança (cada pessoa só vê os próprios dados).
3. Em **Authentication → Sign In / Providers**, deixe **Email** habilitado. Em **Authentication → Email Templates**, o template "Magic Link" já funciona por padrão.
4. Em **Authentication → URL Configuration**, defina:
   - **Site URL**: a URL onde o app vai rodar (ex.: `https://lampada-seu-usuario.vercel.app`, ou `http://localhost:3000` enquanto testa localmente).
   - **Redirect URLs**: adicione `http://localhost:3000/auth/callback` (para testar localmente) e a URL de produção, ex. `https://lampada-seu-usuario.vercel.app/auth/callback`.
5. Em **Project Settings → API**, copie a **Project URL**, a chave **anon public** e a chave **service_role** (esta última é secreta).

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `ANTHROPIC_API_KEY`.

**A `SUPABASE_SERVICE_ROLE_KEY` é secreta** — ela só é usada em `app/api/conta/apagar/route.ts`, no servidor, para excluir a conta quando a pessoa pede. Nunca a exponha no navegador nem em variáveis que comecem com `NEXT_PUBLIC_`.

### 3. Rode

```bash
npm install
npm run dev     # http://localhost:3000
```

Produção: `npm run build && npm start`. Na Vercel, importe o repositório e defina as mesmas variáveis do `.env.local` em Settings → Environment Variables — e lembre de adicionar a URL de produção nas Redirect URLs do Supabase (passo 1.4), senão o link mágico do e-mail falha.

## O que já funciona

- **Login sem senha**: a pessoa informa o e-mail, recebe um link mágico e entra. Sessão mantida por cookies (`@supabase/ssr` + `middleware.ts`).
- **Dados por conta**: perfil de maturidade, plano de 7 dias e conversas ficam no Postgres do Supabase, protegidos por Row Level Security — cada usuário só lê e grava as próprias linhas (`supabase/schema.sql`).
- **Avaliação de maturidade**: 10 perguntas em 5 áreas (Bíblia, oração, igreja local, serviço, entendimento da fé) e 4 pontos de partida (Iniciando, Crescendo, Firmando, Multiplicando).
- **Plano de 7 dias** por ponto de partida: leitura (observe, interprete, aplique), anotações (gravadas com uma pequena espera após parar de digitar), oração guiada, desafio prático e Breve Catecismo (P1 a P7).
- **Chat de aconselhamento**, exige login (a rota `/api/chat` responde 401 sem sessão):
  - o modelo **nunca escreve versículos**: ele chama a ferramenta `buscar_passagem`, e o app exibe o texto exato (Almeida, domínio público);
  - **protocolo de crise em duas camadas**: detecção por padrões antes de chamar o modelo (`lib/crisis.ts`) e marca `[[CRISE:tipo]]` emitida pelo modelo. A resposta é sempre o cartão fixo com CVV 188, SAMU 192, 190, 180 e 100.
- **PWA** instalável, com modo escuro.
- **Conta**: baixar uma cópia dos dados, sair, ou apagar a conta inteira (exclusão em cascata no banco via `app/api/conta/apagar/route.ts`, usando a service role key).
- Limite diário de mensagens de chat por pessoa (`DAILY_LIMIT`, chave por `user.id`).

## Estrutura

```
middleware.ts             renova a sessão do Supabase a cada requisição
app/auth/callback         troca o código do link mágico pela sessão
app/api/chat               aconselhamento (exige login + laço de ferramentas + crise + limite)
app/api/conta/apagar       exclui a conta (e, em cascata, os dados) — usa a service role key
app/api/passagem            proxy do texto bíblico
lib/supabase/client.ts     cliente do navegador
lib/supabase/server.ts     cliente do servidor (rotas)
lib/db.ts                  leitura e escrita das tabelas do usuário logado
lib/prompt.ts               prompt de sistema (base doutrinária e regras)
lib/crisis.ts                detecção de crise e conteúdo fixo de ajuda
lib/maturity.ts              perguntas, pontuação e pontos de partida
lib/plans.ts                 os 4 planos de 7 dias
lib/catecismo.ts             Breve Catecismo P1 a P7
lib/bible.ts                  única fonte do texto bíblico (troque aqui)
supabase/schema.sql          tabelas e políticas de segurança (RLS)
components/                   telas
```

## Antes de colocar na mão de outras pessoas

1. **Revisão pastoral**: um pastor ou teólogo da IPB deve ler `lib/prompt.ts`, `lib/catecismo.ts` (conferir a redação com o texto oficial adotado pela IPB), `lib/plans.ts` e o conteúdo de `lib/crisis.ts`, e testar respostas em casos difíceis (luto, divórcio, dúvida de fé, doutrinas em que há divergência).
2. **Profissional de saúde mental**: revisar o texto e os padrões de `lib/crisis.ts`. O detector prefere falso positivo, então perguntas como "o que a Bíblia diz sobre suicídio?" também acionam o cartão de ajuda.
3. **Nome e identidade**: a Lâmpada não é um produto oficial da IPB. Não use o nome nem o logotipo da denominação sem autorização.
4. **LGPD**: publique política de privacidade e defina quem é o controlador dos dados. O app já dá à pessoa acesso, portabilidade (baixar dados) e exclusão (apagar conta), mas isso não substitui o aviso de privacidade formal.
5. **E-mail transacional**: o Supabase envia os links mágicos por um serviço próprio com limite baixo no plano gratuito. Para um número maior de pessoas, configure um provedor de e-mail (SMTP) em Authentication → Email Settings.
6. **Bíblia**: bible-api.com é um serviço gratuito de terceiros, sem garantia de disponibilidade. Para produção, migre para uma base própria (licenças: Almeida Corrigida Fiel e outras edições em domínio público, ou licencie ARA, NAA, NVI).
7. **Teste de estresse do modelo**: tente induzir versículos inventados, respostas fora de escopo e prompt injection.

## Rodar 100% local com Docker (sem depender de nuvem)

Se preferir hospedar o banco, o login e o app todos na sua própria máquina ou
servidor, veja `DOCKER.md` — usa o Supabase self-hosted oficial (via Docker
Compose) mais um `docker-compose.override.yml` e um `Dockerfile` que acrescentam
o Lâmpada a esse stack.

## Como testei o login (para quem for mexer no código)

Não há Docker neste ambiente para rodar o Supabase local oficial, então critiquei o fluxo com um mock próprio do Auth e do REST (script descartável, não faz parte do projeto) e o Playwright: login por link mágico, avaliação, gravação do plano, conclusão de um dia, reload da página (sessão e progresso persistem), chat autenticado gravando mensagens, chat sem login recusado com 401, e logout. Antes de publicar de verdade, vale repetir esse caminho contra um projeto Supabase real, inclusive clicando no link recebido por e-mail de fato.

## Próximos passos sugeridos

Lembretes por e-mail/push, novos planos por área de foco, catecismo completo com busca (RAG) e diário com criptografia adicional.
