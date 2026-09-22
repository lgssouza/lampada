import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { atualizarPlano } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  let corpo: { concluidos?: unknown; desafios?: unknown; notas?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const soInteiros = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => Number.isInteger(x));
  if (!soInteiros(corpo.concluidos) || !soInteiros(corpo.desafios) || typeof corpo.notas !== "object" || corpo.notas === null) {
    return NextResponse.json({ erro: "Dados de plano inválidos." }, { status: 400 });
  }

  await atualizarPlano(sessao.user.id, {
    concluidos: corpo.concluidos,
    desafios: corpo.desafios,
    notas: corpo.notas as Record<number, string>,
  });
  return NextResponse.json({ ok: true });
}
