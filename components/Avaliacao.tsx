"use client";
import { useState } from "react";
import { calcularPerfil, DIMENSOES, NIVEIS, PERGUNTAS } from "@/lib/maturity";
import type { Perfil } from "@/lib/types";

export function Avaliacao({ onConcluir }: { onConcluir: (p: Perfil) => void }) {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<(number | null)[]>(() => PERGUNTAS.map(() => null));
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  if (perfil) {
    const nivel = NIVEIS[perfil.nivel];
    const foco = DIMENSOES.find((d) => d.id === perfil.foco)!;
    return (
      <main className="tela">
        <p className="meta">Seu ponto de partida</p>
        <h1 className="titulo-serif">{nivel.nome}</h1>
        <p className="lead">{nivel.resumo}</p>

        <section className="cartao" aria-label="Resultado por área">
          {DIMENSOES.map((d) => (
            <div className="barra" key={d.id}>
              <div className="barra-topo">
                <span>{d.nome}</span>
                <span className="muted">{perfil.pontos[d.id]} de 6</span>
              </div>
              <div className="barra-trilho" role="presentation">
                <div className="barra-preenchimento" style={{ width: `${(perfil.pontos[d.id] / 6) * 100}%` }} />
              </div>
            </div>
          ))}
        </section>

        <p>
          A área com mais espaço para crescer agora é <strong>{foco.nome.toLowerCase()}</strong>. A Lâmpada vai levar
          isso em conta quando você conversar com ela.
        </p>
        <p className="muted">
          Isto é um ponto de partida, e não um julgamento. Só Deus conhece o coração. Você pode refazer a avaliação
          quando quiser.
        </p>

        <button className="btn btn-primario btn-largo" onClick={() => onConcluir(perfil)}>
          Começar meu plano de 7 dias
        </button>
      </main>
    );
  }

  const pergunta = PERGUNTAS[passo];
  const marcada = respostas[passo];
  const ultima = passo === PERGUNTAS.length - 1;

  function avancar() {
    if (marcada === null) return;
    if (ultima) {
      setPerfil(calcularPerfil(respostas.map((r) => r ?? 0)));
    } else {
      setPasso(passo + 1);
    }
  }

  return (
    <main className="tela">
      <div className="progresso" role="progressbar" aria-valuemin={1} aria-valuemax={PERGUNTAS.length} aria-valuenow={passo + 1}>
        <div className="progresso-barra" style={{ width: `${((passo + 1) / PERGUNTAS.length) * 100}%` }} />
      </div>
      <p className="meta">
        Pergunta {passo + 1} de {PERGUNTAS.length}
      </p>

      {passo === 0 && (
        <p className="muted">
          Não existe resposta certa. Estas perguntas só servem para escolher o plano de leitura mais adequado a você.
        </p>
      )}

      <fieldset className="pergunta">
        <legend className="titulo-serif pequeno">{pergunta.texto}</legend>
        <div className="opcoes">
          {pergunta.opcoes.map((op, i) => (
            <label key={i} className={`opcao ${marcada === i ? "marcada" : ""}`}>
              <input
                type="radio"
                name={`p${passo}`}
                checked={marcada === i}
                onChange={() => setRespostas((r) => r.map((v, k) => (k === passo ? i : v)))}
              />
              <span>{op}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="acoes">
        {passo > 0 && (
          <button className="btn btn-secundario" onClick={() => setPasso(passo - 1)}>
            Voltar
          </button>
        )}
        <button className="btn btn-primario" disabled={marcada === null} onClick={avancar}>
          {ultima ? "Ver resultado" : "Próxima"}
        </button>
      </div>
    </main>
  );
}
