import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { salvarPerfilEPlano } from "@/lib/db";
import { DIMENSOES, PERGUNTAS, calcularPerfil } from "@/lib/maturity";
import type { Dimensao, Nivel, Plano } from "@/lib/types";

export const runtime = "nodejs";

const NIVEIS: Nivel[] = ["iniciando", "crescendo", "firmando", "multiplicando"];
const IDS_DIMENSAO: Dimensao[] = DIMENSOES.map((d) => d.id);

export async function POST(req: Request) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  let corpo: { respostas?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  // O servidor recalcula a pontuação a partir das respostas — nunca confia num nível
  // ou pontuação prontos vindos do cliente.
  if (!Array.isArray(corpo.respostas) || corpo.respostas.length !== PERGUNTAS.length) {
    return NextResponse.json({ erro: "Respostas inválidas." }, { status: 400 });
  }
  const respostas = corpo.respostas.map((r) => {
    const n = Number(r);
    return Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0;
  });

  const perfil = calcularPerfil(respostas);
  if (!NIVEIS.includes(perfil.nivel) || !IDS_DIMENSAO.includes(perfil.foco)) {
    return NextResponse.json({ erro: "Não foi possível calcular o perfil." }, { status: 400 });
  }

  const plano: Plano = { nivel: perfil.nivel, inicio: new Date().toISOString(), concluidos: [], desafios: [], notas: {} };
  await salvarPerfilEPlano(sessao.user.id, perfil, plano);
  return NextResponse.json({ perfil, plano });
}
