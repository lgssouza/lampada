import type { Estado, Passagem } from "./types";

// A partir da versão com login, o progresso, as anotações e as conversas ficam no banco (Supabase),
// não mais neste aparelho. O que continua em localStorage é só o cache do texto bíblico (não é dado
// pessoal, é o mesmo texto para todo mundo) e o utilitário de baixar uma cópia dos dados.

const CHAVE_PASSAGENS = "lampada:passagens:v1";

export function lerCachePassagem(ref: string): Passagem | null {
  try {
    const todas = JSON.parse(localStorage.getItem(CHAVE_PASSAGENS) ?? "{}") as Record<string, Passagem>;
    return todas[ref.toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

export function guardarCachePassagem(ref: string, p: Passagem) {
  try {
    const todas = JSON.parse(localStorage.getItem(CHAVE_PASSAGENS) ?? "{}") as Record<string, Passagem>;
    todas[ref.toLowerCase()] = p;
    localStorage.setItem(CHAVE_PASSAGENS, JSON.stringify(todas));
  } catch {
    /* ignorar */
  }
}

export function baixarDados(e: Estado) {
  const blob = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lampada-meus-dados.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
