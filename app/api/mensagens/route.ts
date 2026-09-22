import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apagarChat } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  await apagarChat(sessao.user.id);
  return NextResponse.json({ ok: true });
}
