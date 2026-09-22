"use client";
import { useCallback, useEffect, useState } from "react";
import { carregar, ESTADO_VAZIO, salvar } from "@/lib/storage";
import type { Estado, Perfil } from "@/lib/types";
import { Avaliacao } from "./Avaliacao";
import { Consentimento } from "./Consentimento";
import { Conversa } from "./Conversa";
import { Hoje } from "./Hoje";
import { Chama, IconeCaminho, IconeConversa, IconeLivro } from "./Icones";
import { Jornada } from "./Jornada";

type Aba = "hoje" | "conversar" | "jornada";

export default function App() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [aba, setAba] = useState<Aba>("hoje");
  const [refazendo, setRefazendo] = useState(false);

  useEffect(() => {
    setEstado(carregar());
  }, []);

  useEffect(() => {
    if (estado) salvar(estado);
  }, [estado]);

  const atualizar = useCallback((fn: (e: Estado) => Estado) => {
    setEstado((prev) => (prev ? fn(prev) : prev));
  }, []);

  function concluirAvaliacao(perfil: Perfil) {
    atualizar((e) => ({
      ...e,
      perfil,
      plano: { nivel: perfil.nivel, inicio: new Date().toISOString(), concluidos: [], desafios: [], notas: {} },
    }));
    setRefazendo(false);
    setAba("hoje");
    window.scrollTo({ top: 0 });
  }

  function trocarAba(nova: Aba) {
    setAba(nova);
    window.scrollTo({ top: 0 });
  }

  if (!estado) {
    return (
      <div className="splash" aria-busy="true">
        <Chama tamanho={44} />
      </div>
    );
  }

  if (!estado.consentimento) {
    return (
      <Consentimento
        onAceitar={() => atualizar((e) => ({ ...e, consentimento: { data: new Date().toISOString() } }))}
      />
    );
  }

  if (!estado.perfil || !estado.plano || refazendo) {
    return <Avaliacao onConcluir={concluirAvaliacao} />;
  }

  return (
    <>
      {aba === "hoje" && <Hoje estado={estado} atualizar={atualizar} onRefazer={() => setRefazendo(true)} />}
      {aba === "conversar" && <Conversa estado={estado} atualizar={atualizar} />}
      {aba === "jornada" && (
        <Jornada
          estado={estado}
          onRefazer={() => setRefazendo(true)}
          onApagado={() => {
            setEstado(ESTADO_VAZIO);
            setAba("hoje");
          }}
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
