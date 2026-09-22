// Limite diário simples, em memória, por IP.
// Serve para proteger o custo no MVP. Em produção com várias instâncias (ex.: serverless),
// troque por Redis/Upstash ou por contagem por usuário autenticado.

const baldes = new Map<string, { dia: string; n: number }>();

export function ipDaRequisicao(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

export function consumir(chave: string, max: number): { ok: boolean; restante: number } {
  const hoje = new Date().toISOString().slice(0, 10);
  const atual = baldes.get(chave);
  if (!atual || atual.dia !== hoje) {
    baldes.set(chave, { dia: hoje, n: 1 });
    return { ok: true, restante: max - 1 };
  }
  if (atual.n >= max) return { ok: false, restante: 0 };
  atual.n += 1;
  return { ok: true, restante: max - atual.n };
}
