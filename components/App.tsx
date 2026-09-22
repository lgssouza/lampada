"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
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
  const { data: sessao, isPending } = authClient.useSession();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [aba, setAba] = useState<Aba>("hoje");
  const [refazendo, setRefazendo] = useState(false);
  const atrasoNota = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessao) {
      setEstado(null);
      return;
    }
    let vivo = true;
    fetch("/api/estado")
      .then((r) => (r.ok ? r.json() : null))
      .then((e) => {
        if (vivo && e) setEstado(e);
      });
    return () => {
      vivo = false;
    };
  }, [sessao]);

  const persistirPlano = useCallback((plano: Plano, atrasar: boolean) => {
    if (atrasoNota.current) clearTimeout(atrasoNota.current);
    const gravar = () =>
      fetch("/api/plano", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluidos: plano.concluidos, desafios: plano.desafios, notas: plano.notas }),
      });
    if (atrasar) atrasoNota.current = setTimeout(gravar, 800);
    else gravar();
  }, []);

  // atualizar() muda o estado local na hora (a tela responde de imediato) e, se o plano mudou,
  // grava a mudança no servidor em seguida. atrasarPersistencia adia a gravação (usado ao digitar
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

  async function concluirAvaliacao(respostas: number[]) {
    const res = await fetch("/api/avaliacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respostas }),
    });
    if (!res.ok) return null;
    const { perfil, plano } = (await res.json()) as { perfil: Perfil; plano: Plano };
    setEstado((e) => (e ? { ...e, perfil, plano } : e));
    setRefazendo(false);
    setAba("hoje");
    window.scrollTo({ top: 0 });
    return perfil;
  }

  function trocarAba(nova: Aba) {
    setAba(nova);
    window.scrollTo({ top: 0 });
  }

  if (isPending) return <Splash />;
  if (!sessao) return <Consentimento />;
  if (!estado) return <Splash />;

  if (!estado.perfil || !estado.plano || refazendo) {
    return <Avaliacao onConcluir={concluirAvaliacao} />;
  }

  return (
    <>
      {aba === "hoje" && <Hoje estado={estado} atualizar={atualizar} onRefazer={() => setRefazendo(true)} />}
      {aba === "conversar" && <Conversa estado={estado} atualizar={atualizar} />}
      {aba === "jornada" && (
        <Jornada estado={estado} onRefazer={() => setRefazendo(true)} onSaiu={() => setEstado(null)} />
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
