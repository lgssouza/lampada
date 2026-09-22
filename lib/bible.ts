import type { Passagem } from "./types";

// Fonte do texto bíblico: bible-api.com, tradução João Ferreira de Almeida (domínio público).
// O modelo de IA NUNCA escreve versículos: ele só escolhe referências, e o texto vem sempre daqui.
// Para trocar de fonte (banco próprio, outra versão licenciada), altere apenas esta função.

const API = "https://bible-api.com";
const TRADUCAO = "almeida";
const NOME_TRADUCAO = "Almeida (domínio público)";
const MAX_VERSICULOS = 40;

const memoria = new Map<string, Passagem>();

export function referenciaValida(ref: string): boolean {
  const r = ref.trim();
  if (r.length < 3 || r.length > 40) return false;
  return /^[1-3]?\s?\p{L}+(\s\p{L}+)*\s\d{1,3}(:\d{1,3}(-\d{1,3})?)?$/u.test(r);
}

export async function buscarPassagem(ref: string): Promise<Passagem | null> {
  const chave = ref.trim().toLowerCase();
  const guardada = memoria.get(chave);
  if (guardada) return guardada;
  if (!referenciaValida(ref)) return null;

  try {
    const res = await fetch(`${API}/${encodeURIComponent(ref.trim())}?translation=${TRADUCAO}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      reference?: string;
      verses?: { verse: number; text: string }[];
    };
    if (!json.verses?.length) return null;

    const passagem: Passagem = {
      referencia: json.reference ?? ref.trim(),
      versiculos: json.verses.slice(0, MAX_VERSICULOS).map((v) => ({
        n: v.verse,
        texto: String(v.text).replace(/\s+/g, " ").trim(),
      })),
      traducao: NOME_TRADUCAO,
    };
    memoria.set(chave, passagem);
    return passagem;
  } catch {
    return null;
  }
}
