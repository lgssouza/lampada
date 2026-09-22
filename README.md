# Lâmpada

Companheira de discipulado em formato de PWA para membros e simpatizantes de igrejas presbiterianas: login por e-mail (sem senha), avaliação do ponto de partida na fé, plano de 7 dias (leitura, oração, desafio prático, Breve Catecismo) e aconselhamento a partir da Bíblia. Cada pessoa só acessa os próprios dados — sem depender de nenhum serviço de nuvem: é Next.js, Postgres e a API da Anthropic.

## Rodar localmente (sem Docker)

Precisa de um Postgres rodando (local, ou qualquer provedor gerenciado).

```bash
npm install
cp .env.example .env.local     # preencha DATABASE_URL, AUTH_SECRET e ANTHROPIC_API_KEY
psql "$DATABASE_URL" -f db/schema.sql   # cria as tabelas, uma vez só
npm run dev                     # http://localhost:3000
```

Gere o `AUTH_SECRET` com `openssl rand -base64 32`.

Sem `EMAIL_SERVER` configurado, o link de login mágico não é enviado por e-mail — ele aparece no **log do terminal** onde o `npm run dev` está rodando. Ótimo para testar sozinho sem configurar SMTP nenhum. Para receber de verdade por e-mail, preencha `EMAIL_SERVER` no formato `smtp://usuario:senha@host:porta` (qualquer provedor SMTP serve: Gmail, SendGrid, Postmark, Resend, etc.).

Produção sem Docker: `npm run build && npm start`.

## Rodar 100% local com Docker

```bash
cp .env.example .env.docker
```

Preencha `.env.docker`:
- `POSTGRES_PASSWORD`: uma senha seu para o banco.
- `AUTH_SECRET`: gere com `openssl rand -base64 32`.
- `AUTH_URL`: `http://localhost:3000` (ou o endereço real, se for um servidor).
- `ANTHROPIC_API_KEY`: sua chave da Anthropic.
- `EMAIL_SERVER` (opcional): deixe em branco para testar sozinho (o link aparece em `docker compose logs -f app`), ou aponte para o Mailpit incluso — `EMAIL_SERVER=smtp://mailpit:1025` — e abra `http://localhost:8025` para ver e clicar no e-mail recebido.

```bash
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker exec db psql -U lampada -d lampada -f /schema.sql   # só na primeira vez
```

Abra `http://localhost:3000`.

### Publicar de verdade (fora do seu computador)

- Coloque um proxy reverso com HTTPS na frente (Caddy ou Nginx + Let's Encrypt) — o login por e-mail e os cookies de sessão dependem de HTTPS.
- Troque `AUTH_URL` no `.env.docker` para o domínio real, com `https://`.
- Troque o Mailpit por um provedor de e-mail de verdade em `EMAIL_SERVER`.
- Faça backup do volume `lampada-db-data` (é ali que fica todo o banco — usuários, planos, conversas).

## O que já funciona

- **Login sem senha** por link mágico de e-mail (Better Auth), com sessão em cookie.
- **Dados por conta**: perfil de maturidade, plano de 7 dias e conversas ficam no Postgres, isolados por usuário — toda rota da API verifica a sessão no servidor antes de ler ou gravar qualquer coisa (nunca confia num id vindo do cliente).
- **Avaliação de maturidade**: 10 perguntas em 5 áreas (Bíblia, oração, igreja local, serviço, entendimento da fé) e 4 pontos de partida (Iniciando, Crescendo, Firmando, Multiplicando). O servidor recalcula a pontuação a partir das respostas — nunca aceita um nível pronto vindo do cliente.
- **Plano de 7 dias** por ponto de partida: leitura (observe, interprete, aplique), anotações (gravadas com uma pequena espera após parar de digitar), oração guiada, desafio prático e Breve Catecismo (P1 a P7).
- **Chat de aconselhamento**, exige login (a rota `/api/chat` responde 401 sem sessão), com as mensagens gravadas pelo próprio servidor:
  - o modelo **nunca escreve versículos**: ele chama a ferramenta `buscar_passagem`, e o app exibe o texto exato (Almeida, domínio público);
  - **protocolo de crise em duas camadas**: detecção por padrões antes de chamar o modelo (`lib/crisis.ts`) e marca `[[CRISE:tipo]]` emitida pelo modelo. A resposta é sempre o cartão fixo com CVV 188, SAMU 192, 190, 180 e 100.
- **PWA** instalável, com modo escuro.
- **Conta**: baixar uma cópia dos dados, sair, ou apagar a conta inteira (exclusão em cascata no banco).
- Limite diário de mensagens de chat por pessoa (`DAILY_LIMIT`, chave por id do usuário).

## Estrutura

```
db/schema.sql               tabelas do Better Auth + tabelas do app (sem RLS: a segurança é no código)
lib/auth.ts                  configuração do Better Auth (login por link mágico)
lib/auth-client.ts           cliente do navegador (usado em Consentimento.tsx e Jornada.tsx)
lib/pg.ts                    pool de conexão com o Postgres, compartilhado
lib/mailer.ts                envio do e-mail do link mágico (com fallback para log, sem SMTP)
lib/db.ts                    leitura e escrita das tabelas do app — sempre filtrado pelo userId da sessão
app/api/auth/[...all]        rota única do Better Auth (login, sessão, logout)
app/api/estado               carrega perfil, plano e conversas do usuário logado
app/api/avaliacao            recebe as respostas, calcula o perfil no servidor e salva
app/api/plano                atualiza dias concluídos, desafios e anotações
app/api/chat                 aconselhamento (exige login + laço de ferramentas + crise + limite + grava as mensagens)
app/api/mensagens            apaga o histórico da conversa
app/api/conta/apagar         apaga a conta (cascata no banco remove todos os dados)
app/api/passagem              proxy do texto bíblico
lib/prompt.ts                 prompt de sistema (base doutrinária e regras)
lib/crisis.ts                  detecção de crise e conteúdo fixo de ajuda
lib/maturity.ts                perguntas, pontuação e pontos de partida
lib/plans.ts                   os 4 planos de 7 dias
lib/catecismo.ts               Breve Catecismo P1 a P7
lib/bible.ts                    única fonte do texto bíblico (troque aqui)
components/                     telas
Dockerfile, docker-compose.yml  self-host completo (app + Postgres + Mailpit opcional)
```

## Antes de colocar na mão de outras pessoas

1. **Revisão pastoral**: um pastor ou teólogo da IPB deve ler `lib/prompt.ts`, `lib/catecismo.ts` (conferir a redação com o texto oficial adotado pela IPB), `lib/plans.ts` e o conteúdo de `lib/crisis.ts`, e testar respostas em casos difíceis (luto, divórcio, dúvida de fé, doutrinas em que há divergência).
2. **Profissional de saúde mental**: revisar o texto e os padrões de `lib/crisis.ts`. O detector prefere falso positivo, então perguntas como "o que a Bíblia diz sobre suicídio?" também acionam o cartão de ajuda.
3. **Nome e identidade**: a Lâmpada não é um produto oficial da IPB. Não use o nome nem o logotipo da denominação sem autorização.
4. **LGPD**: publique política de privacidade e defina quem é o controlador dos dados. O app já dá à pessoa acesso, portabilidade (baixar dados) e exclusão (apagar conta), mas isso não substitui o aviso de privacidade formal.
5. **E-mail transacional**: sem um provedor de e-mail de verdade configurado em `EMAIL_SERVER`, ninguém recebe o link de login fora do seu próprio log.
6. **Bíblia**: bible-api.com é um serviço gratuito de terceiros, sem garantia de disponibilidade. Para produção, migre para uma base própria (licenças: Almeida Corrigida Fiel e outras edições em domínio público, ou licencie ARA, NAA, NVI).
7. **Backup do banco**: sem backup do volume do Postgres, perder o servidor é perder todos os dados de todas as pessoas.
8. **Teste de estresse do modelo**: tente induzir versículos inventados, respostas fora de escopo e prompt injection.

## Como testei o login e o isolamento entre contas

Diferente da primeira versão (que usava Supabase e um mock), esta roda sobre uma biblioteca de autenticação (Better Auth) e um Postgres que testei **de verdade** neste ambiente: instalei um Postgres 16 real, apliquei o `db/schema.sql`, rodei o app compilado (o mesmo `server.js` que roda dentro do Docker) e usei um navegador automatizado para: pedir o link de login, "clicar" nele, responder a avaliação, concluir um dia do plano, escrever uma anotação, conversar no chat — tudo verificado como persistido no banco após recarregar a página — e confirmei o ponto mais importante, o **isolamento entre contas**: criei uma segunda pessoa e confirmei, direto no banco de dados, que ela não tinha acesso a nenhum dado da primeira. O único ponto que não usei de verdade foi a chamada à API da Anthropic (usei um substituto local, já que não tenho sua chave), e o `docker compose up` em si, porque não há Docker disponível neste ambiente — mas o Dockerfile foi validado rodando exatamente o mesmo `server.js` que ele gera.
