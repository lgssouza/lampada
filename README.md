# Lâmpada

Companheira de discipulado em formato de PWA para membros e simpatizantes de igrejas presbiterianas: avalia o ponto de partida na fé, propõe um plano de 7 dias (leitura, oração, desafio prático, Breve Catecismo) e aconselha a partir da Bíblia.

## Rodar localmente

```bash
npm install
cp .env.example .env.local     # preencha ANTHROPIC_API_KEY
npm run dev                    # http://localhost:3000
```

Produção: `npm run build && npm start`. Na Vercel, importe o repositório e defina as variáveis de `.env.example`.

## O que já funciona

- **Consentimento (LGPD)** com confirmação de maioridade.
- **Avaliação de maturidade**: 10 perguntas em 5 áreas (Bíblia, oração, igreja local, serviço, entendimento da fé) e 4 pontos de partida (Iniciando, Crescendo, Firmando, Multiplicando).
- **Plano de 7 dias** por ponto de partida: leitura (método observe, interprete, aplique), anotações, oração guiada, desafio prático e Breve Catecismo (P1 a P7).
- **Chat de aconselhamento** com o modelo da Anthropic:
  - o modelo **nunca escreve versículos**: ele chama a ferramenta `buscar_passagem`, e o app exibe o texto exato (Almeida, domínio público);
  - **protocolo de crise em duas camadas**: detecção por padrões antes de chamar o modelo (`lib/crisis.ts`) e marca `[[CRISE:tipo]]` emitida pelo modelo. A resposta é sempre o cartão fixo com CVV 188, SAMU 192, 190, 180 e 100.
- **PWA**: instalável, abre offline (a leitura do dia abre offline depois de vista uma vez; o chat exige internet).
- **Dados no aparelho** (localStorage), com botões para baixar e apagar tudo.
- Limite diário de mensagens por IP (`DAILY_LIMIT`).

## Estrutura

```
app/api/chat        aconselhamento (laço de ferramentas + crise + limite)
app/api/passagem    proxy do texto bíblico
lib/prompt.ts       prompt de sistema (base doutrinária e regras)
lib/crisis.ts       detecção de crise e conteúdo fixo de ajuda
lib/maturity.ts     perguntas, pontuação e pontos de partida
lib/plans.ts        os 4 planos de 7 dias
lib/catecismo.ts    Breve Catecismo P1 a P7
lib/bible.ts        única fonte do texto bíblico (troque aqui)
components/         telas
```

## Diferenças em relação ao desenho inicial

| Desenho | MVP | Por quê |
|---|---|---|
| Supabase (login, banco, pgvector) | Dados só no aparelho | Sem login e sem dado sensível no servidor, o que reduz risco de LGPD e acelera o teste |
| Tabela própria de versículos | API bible-api.com (Almeida) | Zero manutenção para validar; troque em `lib/bible.ts` |
| Tailwind | CSS puro | Menos dependências e controle total do visual |
| Resposta em streaming | Resposta completa | Mais simples de proteger contra a marca de crise |

## Antes de colocar na mão de outras pessoas

1. **Revisão pastoral**: um pastor ou teólogo da IPB deve ler `lib/prompt.ts`, `lib/catecismo.ts` (conferir a redação com o texto oficial adotado pela IPB), `lib/plans.ts` e o conteúdo de `lib/crisis.ts`, e testar respostas em casos difíceis (luto, divórcio, dúvida de fé, doutrinas em que há divergência).
2. **Profissional de saúde mental**: revisar o texto e os padrões de `lib/crisis.ts`. O detector prefere falso positivo, então perguntas como "o que a Bíblia diz sobre suicídio?" também acionam o cartão de ajuda.
3. **Nome e identidade**: a Lâmpada não é um produto oficial da IPB. Não use o nome nem o logotipo da denominação sem autorização.
4. **LGPD**: publique política de privacidade, defina quem é o controlador e revise o consentimento com um advogado.
5. **Bíblia**: bible-api.com é um serviço gratuito de terceiros, sem garantia de disponibilidade. Para produção, migre para uma base própria (licenças: Almeida Corrigida Fiel e outras edições em domínio público, ou licencie ARA, NAA, NVI).
6. **Limite de uso**: o contador em memória de `lib/ratelimit.ts` não é compartilhado entre instâncias serverless. Use Redis/Upstash ou autenticação antes de abrir ao público.
7. **Teste de estresse do modelo**: tente induzir versículos inventados, respostas fora de escopo e prompt injection.

## Próximos passos sugeridos

Login por link mágico + Supabase, histórico sincronizado, lembretes por e-mail e push, novos planos por área de foco, catecismo completo com busca (RAG) e diário criptografado.
