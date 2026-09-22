import { NextResponse } from "next/server";
import { buscarPassagem, referenciaValida } from "@/lib/bible";
import { consumir, ipDaRequisicao } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref") ?? "";
  if (!referenciaValida(ref)) {
    return NextResponse.json({ erro: "Referência inválida." }, { status: 400 });
  }
  const limite = consumir(`passagem:${ipDaRequisicao(req)}`, 300);
  if (!limite.ok) {
    return NextResponse.json({ erro: "Limite diário de leituras atingido." }, { status: 429 });
  }
  const passagem = await buscarPassagem(ref);
  if (!passagem) {
    return NextResponse.json({ erro: "Não foi possível carregar a passagem agora." }, { status: 502 });
  }
  return NextResponse.json(passagem, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
