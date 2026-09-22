"use client";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { atualizarPlano, carregarEstado, garantirConsentimento, salvarPerfilEPlano } from "@/lib/db";
import { supabaseNavegador } from "@/lib/supabase/client";
import type { Estado, Perfil, Plano } from "@/lib/types";
import { Avaliacao } from "./Avaliacao";
import { Consentimento } from "./Consentimento";
import { Conversa } from "./Conversa";
import { Hoje } from "./Hoje";
import { Chama, IconeCaminho, IconeConversa, IconeLivro } from "./Icones";
import { Jornada } from "./Jornada";

type Aba = "hoje" | "conversar" | "jornada";

function Splash() {
  return (
    <div className="splash" aria-busy="true">
      <Chama tamanho={44} />
    </div>
  );
}

export default function App() {
  const sb = useMemo(() => supabaseNavegador(), []);
  // undefined = ainda não sabemos se há sessão; null = não há sessão (mostra login)
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [aba, setAba] = useState<Aba>("hoje");
  const [refazendo, setRefazendo] = useState(false);
  const atrasoNota = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: assinatura } = sb.auth.onAuthStateChange((_evento, nova) => setSessao(nova));
    return () => assinatura.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!sessao) {
      setEstado(null);
      return;
    }
    let vivo = true;
    (async () => {
      await garantirConsentimento(sb, sessao.user.id);
      const e = await carregarEstado(sb, sessao.user.id);
      if (vivo) setEstado(e);
    })();
    return () => {
      vivo = false;
    };
  }, [sessao, sb]);

  const persistirPlano = useCallback(
    (plano: Plano, atrasar: boolean) => {
      if (!sessao) return;
      if (atrasoNota.current) clearTimeout(atrasoNota.current);
      const gravar = () => atualizarPlano(sb, sessao.user.id, plano);
      if (atrasar) atrasoNota.current = setTimeout(gravar, 800);
      else gravar();
    },
    [sb, sessao],
  );

  // atualizar() muda o estado local na hora (a tela responde de imediato) e, se o plano mudou,
  // grava a mudança no Supabase em seguida. atrasarPersistencia adia a gravação (usado ao digitar
  // uma anotação) para não mandar uma requisição a cada tecla.
  const atualizar = useCallback(
    (fn: (e: Estado) => Estado, opcoes?: { atrasarPersistencia?: boolean }) => {
      setEstado((prev) => {
        if (!prev) return prev;
        const novo = fn(prev);
        if (novo.plano && novo.plano !== prev.plano) {
          persistirPlano(novo.plano, opcoes?.atrasarPersistencia ?? false);
        }
        return novo;
      });
    },
    [persistirPlano],
  );

  async function concluirAvaliacao(perfil: Perfil) {
    if (!sessao) return;
    const plano: Plano = { nivel: perfil.nivel, inicio: new Date().toISOString(), concluidos: [], desafios: [], notas: {} };
    await salvarPerfilEPlano(sb, sessao.user.id, perfil, plano);
    setEstado((e) => (e ? { ...e, perfil, plano } : e));
    setRefazendo(false);
    setAba("hoje");
    window.scrollTo({ top: 0 });
  }

  function trocarAba(nova: Aba) {
    setAba(nova);
    window.scrollTo({ top: 0 });
  }

  if (sessao === undefined) return <Splash />;
  if (!sessao) return <Consentimento />;
  if (!estado) return <Splash />;

  if (!estado.perfil || !estado.plano || refazendo) {
    return <Avaliacao onConcluir={concluirAvaliacao} />;
  }

  return (
    <>
      {aba === "hoje" && <Hoje estado={estado} atualizar={atualizar} onRefazer={() => setRefazendo(true)} />}
      {aba === "conversar" && (
        <Conversa estado={estado} atualizar={atualizar} sb={sb as SupabaseClient} userId={sessao.user.id} />
      )}
      {aba === "jornada" && (
        <Jornada
          estado={estado}
          sb={sb as SupabaseClient}
          onRefazer={() => setRefazendo(true)}
          onSaiu={() => setEstado(null)}
        />
      )}

      <nav className="abas" aria-label="Navegação principal">
        {(
          [
            ["hoje", "Hoje", <IconeLivro key="l" />],
            ["conversar", "Conversar", <IconeConversa key="c" />],
            ["jornada", "Jornada", <IconeCaminho key="j" />],
          ] as const
        ).map(([id, rotulo, icone]) => (
          <button
            key={id}
            className={`aba ${aba === id ? "ativa" : ""}`}
            onClick={() => trocarAba(id)}
            aria-current={aba === id ? "page" : undefined}
          >
            {icone}
            <span>{rotulo}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
