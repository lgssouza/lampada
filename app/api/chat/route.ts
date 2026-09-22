import Anthropic from "@anthropic-ai/sdk";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buscarPassagem } from "@/lib/bible";
import { CONTEUDO_CRISE, detectarCrise } from "@/lib/crisis";
import { inserirMensagem } from "@/lib/db";
import { pool } from "@/lib/pg";
import { montarPrompt } from "@/lib/prompt";
import { consumir } from "@/lib/ratelimit";
import type { Dimensao, Mensagem, Nivel, Passagem, TipoCrise } from "@/lib/types";
import { novoId } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const LIMITE_DIARIO = Number(process.env.DAILY_LIMIT || 40);
const NIVEIS: Nivel[] = ["iniciando", "crescendo", "firmando", "multiplicando"];
const DIMENSOES: Dimensao[] = ["biblia", "oracao", "igreja", "servico", "doutrina"];

const ferramentas: Anthropic.Tool[] = [
  {
    name: "buscar_passagem",
    description:
      "Busca o texto bíblico exato (Almeida) para exibir à pessoa. Use sempre que for aconselhar ou explicar a partir da Bíblia. Retorna o texto para você entender a passagem; não o reproduza na resposta.",
    input_schema: {
      type: "object",
      properties: {
        referencias: {
          type: "array",
          items: { type: "string" },
          description: 'De 1 a 3 referências em português, por exemplo "Filipenses 4:6-7" ou "Salmos 23".',
        },
      },
      required: ["referencias"],
    },
  },
];

function respostaCrise(tipo: TipoCrise) {
  const c = CONTEUDO_CRISE[tipo];
  return NextResponse.json({ texto: c.mensagem, crise: tipo, passagens: [] });
}

export async function POST(req: Request) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) {
    return NextResponse.json({ erro: "Faça login para conversar com a Lâmpada." }, { status: 401 });
  }
  const userId = sessao.user.id;

  let corpo: { mensagem?: unknown; perfil?: { nivel?: string; foco?: string } };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }
  const texto0 = typeof corpo.mensagem === "string" ? corpo.mensagem.trim().slice(0, 2000) : "";
  if (!texto0) return NextResponse.json({ erro: "Mensagem inválida." }, { status: 400 });

  // Camada 1 do protocolo de crise: antes de gastar qualquer chamada ao modelo, ao banco, ou ao limite diário.
  const crise = detectarCrise(texto0);
  if (crise) return respostaCrise(crise);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ erro: "O servidor ainda não foi configurado (falta ANTHROPIC_API_KEY)." }, { status: 500 });
  }

  const limite = consumir(`chat:${userId}`, LIMITE_DIARIO);
  if (!limite.ok) {
    return NextResponse.json(
      { erro: "Você atingiu o limite de mensagens de hoje. Volte amanhã, e enquanto isso continue com a leitura do dia." },
      { status: 429 },
    );
  }

  // Persiste a mensagem da pessoa já aqui, antes de chamar o modelo: se a chamada falhar,
  // a mensagem dela não se perde.
  const mensagemUsuario: Mensagem = { id: novoId(), role: "user", content: texto0 };
  await inserirMensagem(userId, mensagemUsuario);

  const historicoRes = await pool.query(
    `select role, content from mensagens where user_id = $1 order by criado_em asc limit 12`,
    [userId],
  );

  const nivel = NIVEIS.find((n) => n === corpo.perfil?.nivel);
  const foco = DIMENSOES.find((d) => d === corpo.perfil?.foco);
  const sistema = montarPrompt(nivel, foco);

  const client = new Anthropic();
  const mensagens: Anthropic.MessageParam[] = historicoRes.rows.map((m) => ({ role: m.role, content: m.content }));
  const passagens: Passagem[] = [];
  let texto = "";

  try {
    for (let volta = 0; volta < 4; volta++) {
      const resp = await client.messages.create({
        model: MODELO,
        max_tokens: 1200,
        system: sistema,
        tools: ferramentas,
        messages: mensagens,
      });

      if (resp.stop_reason === "tool_use") {
        mensagens.push({ role: "assistant", content: resp.content });
        const resultados: Anthropic.ToolResultBlockParam[] = [];
        for (const bloco of resp.content) {
          if (bloco.type !== "tool_use") continue;
          const refs = (bloco.input as { referencias?: unknown }).referencias;
          const lista = Array.isArray(refs) ? refs.filter((r): r is string => typeof r === "string").slice(0, 3) : [];
          const partes: string[] = [];
          for (const ref of lista) {
            const p = await buscarPassagem(ref);
            if (p) {
              if (!passagens.some((x) => x.referencia === p.referencia)) passagens.push(p);
              partes.push(`${p.referencia}\n${p.versiculos.map((v) => `${v.n} ${v.texto}`).join("\n")}`);
            } else {
              partes.push(`${ref}: passagem não encontrada. Não a cite de memória.`);
            }
          }
          resultados.push({
            type: "tool_result",
            tool_use_id: bloco.id,
            content: partes.join("\n\n") || "Nenhuma referência válida foi enviada.",
          });
        }
        mensagens.push({ role: "user", content: resultados });
        continue;
      }

      texto = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }
  } catch (e) {
    console.error("Erro na chamada ao modelo:", e);
    return NextResponse.json({ erro: "Não consegui responder agora. Tente novamente em instantes." }, { status: 502 });
  }

  // Camada 2 do protocolo de crise: o modelo percebeu risco que os padrões não pegaram.
  const marca = texto.match(/\[\[CRISE:(suicidio|violencia)\]\]/);
  if (marca) {
    const tipo = marca[1] as TipoCrise;
    const c = CONTEUDO_CRISE[tipo];
    const resposta: Mensagem = { id: novoId(), role: "assistant", content: c.mensagem, crise: tipo };
    await inserirMensagem(userId, resposta);
    return NextResponse.json({ texto: c.mensagem, crise: tipo, passagens: [] });
  }

  if (!texto) {
    return NextResponse.json({ erro: "Não consegui formular uma resposta. Tente reformular a pergunta." }, { status: 502 });
  }

  const resposta: Mensagem = { id: novoId(), role: "assistant", content: texto, passagens };
  await inserirMensagem(userId, resposta);
  return NextResponse.json({ texto, passagens });
}
