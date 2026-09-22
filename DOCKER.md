# Lâmpada com Docker, 100% local

Este guia sobe o Supabase (banco, login) e o app Lâmpada inteiramente na sua
máquina ou servidor, sem depender de nuvem nenhuma para dados e login. A
IA continua chamando a API da Anthropic pela internet — isso é uma chamada de
rede simples, não um serviço para hospedar.

Pré-requisitos: Docker e Docker Compose instalados (`docker compose version`).

## 1. Baixe o Supabase self-hosted oficial

Sempre use o repositório oficial para a parte de banco/login — ela tem scripts de
inicialização do Postgres, gateway e geração de chaves que são delicados de montar
à mão. Baixe só a pasta `docker/`, sem o resto do repositório:

```bash
git clone --filter=blob:none --no-checkout --depth 1 https://github.com/supabase/supabase
cd supabase
git sparse-checkout set docker
git checkout
cd docker
cp .env.example .env
```

## 2. Gere as chaves e ajuste o `.env`

Siga o passo "Generate API Keys" da documentação oficial para preencher
`JWT_SECRET`, `ANON_KEY` e `SERVICE_ROLE_KEY` no `.env`
(https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys) —
são valores derivados uns dos outros, por isso é melhor usar o gerador deles
do que inventar valores.

Ainda no `.env`, ajuste também:

- `POSTGRES_PASSWORD`: troque o valor de exemplo por uma senha sua.
- `SITE_URL`: `http://localhost:3000` (ou o endereço onde o app vai rodar).
- `ADDITIONAL_REDIRECT_URLS`: `http://localhost:3000/auth/callback`
- Para testar localmente sem provedor de e-mail de verdade, aponte o SMTP do
  GoTrue para o Mailpit deste guia (serviço `mailpit`, adicionado no passo 4):
  ```
  SMTP_HOST=mailpit
  SMTP_PORT=1025
  SMTP_ADMIN_EMAIL=lampada@localhost
  SMTP_USER=lampada
  SMTP_PASS=lampada
  SMTP_SENDER_NAME=Lâmpada
  ```
  (o Mailpit aceita qualquer usuário/senha; ele só captura o e-mail, não envia de verdade)

## 3. Suba o Supabase e crie as tabelas do Lâmpada

```bash
docker compose up -d
```

Aguarde todos os serviços ficarem saudáveis (`docker compose ps`), abra
`http://localhost:8000` (usuário e senha são `DASHBOARD_USERNAME` e
`DASHBOARD_PASSWORD` do `.env`) e, no **SQL Editor**, cole e rode o conteúdo de
`lampada/supabase/schema.sql` — cria as tabelas e as regras de segurança
(cada pessoa só acessa os próprios dados).

## 4. Adicione o app Lâmpada ao stack

Dentro dessa mesma pasta `docker/`:

1. Copie a pasta `lampada` (o projeto descompactado) para dentro de `docker/`, como `docker/lampada`.
2. Copie `docker-compose.override.yml` (deste pacote) também para dentro de `docker/`.
3. No `.env`, acrescente:
   ```
   ANTHROPIC_API_KEY=sua-chave-da-anthropic
   LAMPADA_PORT=3000
   LAMPADA_URL_PUBLICA=http://localhost:8000
   ```
   Troque `LAMPADA_URL_PUBLICA` pelo endereço real se estiver rodando num servidor
   (ex.: `http://192.168.1.50:8000` na rede local, ou um domínio com HTTPS na internet).
4. Suba tudo:
   ```bash
   docker compose up -d --build
   ```

Abra `http://localhost:3000`. Ao pedir o link de login, abra
`http://localhost:8025` (Mailpit) para ver o e-mail e clicar no link.

## Publicar de verdade (fora do seu computador)

- Coloque um proxy reverso com HTTPS na frente (Caddy ou Nginx + Let's Encrypt,
  por exemplo) — nunca exponha o app ou o Supabase direto na internet sem TLS,
  já que o login por e-mail e os cookies de sessão dependem de HTTPS para
  segurança.
- Troque `LAMPADA_URL_PUBLICA` e `SITE_URL`/`ADDITIONAL_REDIRECT_URLS` no `.env`
  do Supabase para o domínio real, com `https://`.
- Troque o Mailpit por um provedor de e-mail de verdade nas variáveis `SMTP_*`
  do `.env` do Supabase — sem isso, ninguém recebe o link de login.
- Faça backup do volume `docker/volumes/db/data` (é ali que fica todo o banco).

## Por que não escrevi um docker-compose.yml único, do zero?

O stack de login e banco do Supabase (auth, banco, API, gateway) tem scripts de
inicialização do Postgres que criam papéis e permissões específicos, e uma
configuração de gateway que muda entre versões (hoje usa Envoy; antes usava
Kong). Reescrever isso à mão, sem poder testar aqui com Docker de verdade,
arriscava quebrar login de um jeito difícil de depurar. Por isso este guia usa
o compose oficial, mantido pela própria Supabase, e só acrescenta o nosso app a
ele — é o padrão que o próprio projeto usa internamente (veja o comentário
"Dev mode" no topo do `docker-compose.yml` oficial deles).

## O que eu NÃO consegui testar

Não há Docker disponível no ambiente onde montei este projeto, então validei
separadamente: o Dockerfile do app builda e roda (rodei o `server.js` gerado
fora do container, com as mesmas variáveis), e o login/banco/chat foram
testados contra um Supabase de mentira (só para checar a lógica do código).
O caminho completo — Supabase oficial real + este `docker-compose.override.yml`
juntos — ainda não foi executado de ponta a ponta. Rode `docker compose up -d`
e, se algo não subir, rode `docker compose logs -f lampada` (ou o nome do
serviço que falhar) para ver o erro exato.
