import type { Estado, Passagem } from "./types";

const CHAVE = "lampada:v1";
const CHAVE_PASSAGENS = "lampada:passagens:v1";

export const ESTADO_VAZIO: Estado = { consentimento: null, perfil: null, plano: null, chat: [] };

export function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return ESTADO_VAZIO;
    const e = JSON.parse(bruto) as Partial<Estado>;
    return {
      consentimento: e.consentimento ?? null,
      perfil: e.perfil ?? null,
      plano: e.plano ?? null,
      chat: Array.isArray(e.chat) ? e.chat : [],
    };
  } catch {
    return ESTADO_VAZIO;
  }
}

export function salvar(e: Estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...e, chat: e.chat.slice(-100) }));
  } catch {
    /* armazenamento cheio ou bloqueado: o app continua funcionando nesta sessão */
  }
}

export function apagarTudo() {
  try {
    localStorage.removeItem(CHAVE);
    localStorage.removeItem(CHAVE_PASSAGENS);
  } catch {
    /* ignorar */
  }
}

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
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
