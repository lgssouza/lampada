import type { SupabaseClient } from "@supabase/supabase-js";
import type { Estado, Mensagem, Perfil, Plano } from "./types";

// Toda leitura e escrita fica restrita ao próprio usuário pelas políticas de RLS do schema.sql:
// mesmo que o código tivesse um erro, o banco recusaria acesso aos dados de outra pessoa.

export async function garantirConsentimento(sb: SupabaseClient, userId: string) {
  await sb
    .from("profiles")
    .upsert({ id: userId, consentimento_em: new Date().toISOString() }, { onConflict: "id", ignoreDuplicates: true });
}

export async function carregarEstado(sb: SupabaseClient, userId: string): Promise<Estado> {
  const [perfilRes, planoRes, msgsRes] = await Promise.all([
    sb.from("perfil_atual").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("planos").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("mensagens").select("*").eq("user_id", userId).order("criado_em", { ascending: true }).limit(200),
  ]);

  const perfil: Perfil | null = perfilRes.data
    ? {
        respostas: perfilRes.data.respostas,
        pontos: perfilRes.data.pontos,
        total: perfilRes.data.total,
        nivel: perfilRes.data.nivel,
        foco: perfilRes.data.foco,
        data: perfilRes.data.atualizado_em,
      }
    : null;

  const plano: Plano | null = planoRes.data
    ? {
        nivel: planoRes.data.nivel,
        inicio: planoRes.data.inicio,
        concluidos: planoRes.data.concluidos ?? [],
        desafios: planoRes.data.desafios ?? [],
        notas: planoRes.data.notas ?? {},
      }
    : null;

  const chat: Mensagem[] = (msgsRes.data ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    passagens: m.passagens ?? [],
    crise: m.crise ?? undefined,
  }));

  return { consentimento: { data: "" }, perfil, plano, chat };
}

export async function salvarPerfilEPlano(sb: SupabaseClient, userId: string, perfil: Perfil, plano: Plano) {
  await Promise.all([
    sb.from("perfil_atual").upsert({
      user_id: userId,
      respostas: perfil.respostas,
      pontos: perfil.pontos,
      total: perfil.total,
      nivel: perfil.nivel,
      foco: perfil.foco,
      atualizado_em: perfil.data,
    }),
    sb.from("planos").upsert({
      user_id: userId,
      nivel: plano.nivel,
      inicio: plano.inicio,
      concluidos: plano.concluidos,
      desafios: plano.desafios,
      notas: plano.notas,
      atualizado_em: new Date().toISOString(),
    }),
  ]);
}

export async function atualizarPlano(sb: SupabaseClient, userId: string, plano: Plano) {
  await sb
    .from("planos")
    .update({
      concluidos: plano.concluidos,
      desafios: plano.desafios,
      notas: plano.notas,
      atualizado_em: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export async function inserirMensagem(sb: SupabaseClient, userId: string, m: Mensagem) {
  await sb.from("mensagens").insert({
    id: m.id,
    user_id: userId,
    role: m.role,
    content: m.content,
    passagens: m.passagens ?? [],
    crise: m.crise ?? null,
  });
}

export async function apagarChat(sb: SupabaseClient, userId: string) {
  await sb.from("mensagens").delete().eq("user_id", userId);
}
