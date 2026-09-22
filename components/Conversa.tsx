"use client";
import { useEffect, useRef, useState } from "react";
import { CONTEUDO_CRISE } from "@/lib/crisis";
import { novoId } from "@/lib/storage";
import type { Estado, Mensagem } from "@/lib/types";
import { IconeEnviar, IconeTelefone } from "./Icones";
import { PassagemCard } from "./PassagemCard";

const SUGESTOES = [
  "Estou ansioso(a) e não consigo descansar",
  "Como perdoar quem me magoou?",
  "Não sinto vontade de orar",
  "O que a Bíblia diz sobre trabalho e dinheiro?",
];

type Props = { estado: Estado; atualizar: (fn: (e: Estado) => Estado) => void };

function CartaoCrise({ tipo }: { tipo: NonNullable<Mensagem["crise"]> }) {
  const c = CONTEUDO_CRISE[tipo];
  return (
    <div className="crise" role="alert">
      <h3>{c.titulo}</h3>
      <p>{c.mensagem}</p>
      <ul className="contatos">
        {c.contatos.map((ct) => (
          <li key={ct.tel}>
            <a className="btn btn-crise" href={`tel:${ct.tel}`}>
              <IconeTelefone />
              <span>
                <strong>Ligar {ct.tel}</strong>
                <small>
                  {ct.nome}. {ct.nota}
                </small>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <ul className="passos-crise">
        {c.passos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

export function Conversa({ estado, atualizar }: Props) {
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const chat = estado.chat;

  useEffect(() => {
    // Em crise, a pessoa precisa ver o título e os telefones primeiro: rola até o topo do cartão.
    const ultima = chat[chat.length - 1];
    if (ultima?.crise) {
      document.querySelector(".msg:last-of-type .crise")?.scrollIntoView({ block: "start" });
    } else {
      fimRef.current?.scrollIntoView({ block: "end" });
    }
  }, [chat, carregando]);

  async function enviar(conteudo: string) {
    const limpo = conteudo.trim();
    if (!limpo || carregando) return;
    setErro(null);
    setTexto("");
    if (areaRef.current) areaRef.current.style.height = "auto";

    const usuario: Mensagem = { id: novoId(), role: "user", content: limpo };
    const historico = [...chat, usuario];
    atualizar((e) => ({ ...e, chat: historico }));
    setCarregando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagens: historico.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          perfil: { nivel: estado.perfil?.nivel, foco: estado.perfil?.foco },
        }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro ?? "Algo deu errado.");
      const resposta: Mensagem = {
        id: novoId(),
        role: "assistant",
        content: dados.texto,
        passagens: dados.passagens ?? [],
        crise: dados.crise,
      };
      atualizar((e) => ({ ...e, chat: [...e.chat, resposta] }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function aoDigitar(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const teclado = window.matchMedia("(pointer: fine)").matches;
    if (teclado && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar(texto);
    }
  }

  return (
    <main className="tela conversa">
      <header className="conversa-topo">
        <h1 className="titulo-serif pequeno">Conversar</h1>
        {chat.length > 0 && (
          <button
            className="btn-texto"
            onClick={() => {
              if (window.confirm("Apagar esta conversa deste aparelho?")) atualizar((e) => ({ ...e, chat: [] }));
            }}
          >
            Nova conversa
          </button>
        )}
      </header>

      <p className="aviso-ia">
        A Lâmpada é uma IA e pode errar. Ela não substitui o seu pastor. Em assuntos sérios, converse com ele ou com
        um presbítero.
      </p>

      {chat.length === 0 && (
        <div className="vazio">
          <p>Conte o que está em seu coração ou escolha um assunto para começar.</p>
          <div className="sugestoes">
            {SUGESTOES.map((s) => (
              <button key={s} className="chip" onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <ol className="mensagens" aria-live="polite">
        {chat.map((m) => (
          <li key={m.id} className={`msg ${m.role === "user" ? "msg-eu" : "msg-ia"}`}>
            {m.crise ? (
              <CartaoCrise tipo={m.crise} />
            ) : (
              <>
                <p className="msg-texto">{m.content}</p>
                {m.passagens?.map((p) => (
                  <PassagemCard key={p.referencia} passagem={p} />
                ))}
              </>
            )}
          </li>
        ))}
        {carregando && (
          <li className="msg msg-ia" aria-busy="true">
            <p className="msg-texto digitando">
              <span className="sr-only">A Lâmpada está preparando a resposta</span>
              <i />
              <i />
              <i />
            </p>
          </li>
        )}
      </ol>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
      <div ref={fimRef} />

      <div className="composer">
        <textarea
          ref={areaRef}
          rows={1}
          value={texto}
          maxLength={2000}
          placeholder="Escreva aqui"
          aria-label="Sua mensagem"
          onChange={(e) => setTexto(e.target.value)}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 160) + "px";
          }}
          onKeyDown={aoDigitar}
        />
        <button className="enviar" onClick={() => enviar(texto)} disabled={!texto.trim() || carregando} aria-label="Enviar">
          <IconeEnviar />
        </button>
      </div>
    </main>
  );
}
