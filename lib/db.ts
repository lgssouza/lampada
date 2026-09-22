import { pool } from "./pg";
import type { Estado, Mensagem, Perfil, Plano } from "./types";

// Toda função aqui recebe o userId já verificado pela sessão no servidor (nunca vindo
// direto do cliente) e usa consultas parametrizadas — é isso que impede uma pessoa de
// ler ou alterar os dados de outra.

export async function garantirConsentimento(userId: string) {
  await pool.query(
    `insert into profiles (user_id, consentimento_em) values ($1, now())
     on conflict (user_id) do nothing`,
    [userId],
  );
}

export async function carregarEstado(userId: string): Promise<Estado> {
  const [perfilRes, planoRes, msgsRes] = await Promise.all([
    pool.query(`select * from perfil_atual where user_id = $1`, [userId]),
    pool.query(`select * from planos where user_id = $1`, [userId]),
    pool.query(`select * from mensagens where user_id = $1 order by criado_em asc limit 200`, [userId]),
  ]);

  const p = perfilRes.rows[0];
  const perfil: Perfil | null = p
    ? {
        respostas: p.respostas,
        pontos: p.pontos,
        total: p.total,
        nivel: p.nivel,
        foco: p.foco,
        data: p.atualizado_em,
      }
    : null;

  const pl = planoRes.rows[0];
  const plano: Plano | null = pl
    ? {
        nivel: pl.nivel,
        inicio: pl.inicio,
        concluidos: pl.concluidos ?? [],
        desafios: pl.desafios ?? [],
        notas: pl.notas ?? {},
      }
    : null;

  const chat: Mensagem[] = msgsRes.rows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    passagens: m.passagens ?? [],
    crise: m.crise ?? undefined,
  }));

  return { consentimento: { data: "" }, perfil, plano, chat };
}

export async function salvarPerfilEPlano(userId: string, perfil: Perfil, plano: Plano) {
  await pool.query(
    `insert into perfil_atual (user_id, respostas, pontos, total, nivel, foco, atualizado_em)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (user_id) do update set
       respostas = excluded.respostas, pontos = excluded.pontos, total = excluded.total,
       nivel = excluded.nivel, foco = excluded.foco, atualizado_em = excluded.atualizado_em`,
    [userId, JSON.stringify(perfil.respostas), JSON.stringify(perfil.pontos), perfil.total, perfil.nivel, perfil.foco, perfil.data],
  );
  await pool.query(
    `insert into planos (user_id, nivel, inicio, concluidos, desafios, notas, atualizado_em)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (user_id) do update set
       nivel = excluded.nivel, inicio = excluded.inicio, concluidos = excluded.concluidos,
       desafios = excluded.desafios, notas = excluded.notas, atualizado_em = now()`,
    [userId, plano.nivel, plano.inicio, plano.concluidos, plano.desafios, JSON.stringify(plano.notas)],
  );
}

export async function atualizarPlano(userId: string, plano: Pick<Plano, "concluidos" | "desafios" | "notas">) {
  await pool.query(
    `update planos set concluidos = $2, desafios = $3, notas = $4, atualizado_em = now()
     where user_id = $1`,
    [userId, plano.concluidos, plano.desafios, JSON.stringify(plano.notas)],
  );
}

export async function inserirMensagem(userId: string, m: Mensagem) {
  await pool.query(
    `insert into mensagens (id, user_id, role, content, passagens, crise) values ($1, $2, $3, $4, $5, $6)`,
    [m.id, userId, m.role, m.content, JSON.stringify(m.passagens ?? []), m.crise ?? null],
  );
}

export async function apagarChat(userId: string) {
  await pool.query(`delete from mensagens where user_id = $1`, [userId]);
}

export async function apagarConta(userId: string) {
  // A cascata do banco (on delete cascade) remove sessão, contas, profile, perfil, plano e mensagens.
  await pool.query(`delete from "user" where id = $1`, [userId]);
}
