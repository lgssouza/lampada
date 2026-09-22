import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { carregarEstado, garantirConsentimento } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  await garantirConsentimento(sessao.user.id);
  const estado = await carregarEstado(sessao.user.id);
  return NextResponse.json(estado);
}
