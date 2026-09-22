"use client";
import { DIMENSOES, NIVEIS } from "@/lib/maturity";
import { PLANOS } from "@/lib/plans";
import { apagarTudo, baixarDados } from "@/lib/storage";
import type { Estado } from "@/lib/types";

type Props = { estado: Estado; onRefazer: () => void; onApagado: () => void };

export function Jornada({ estado, onRefazer, onApagado }: Props) {
  const perfil = estado.perfil!;
  const plano = estado.plano!;
  const nivel = NIVEIS[perfil.nivel];
  const total = PLANOS[plano.nivel].length;
  const feitos = plano.concluidos.length;
  const desafios = plano.desafios.length;

  return (
    <main className="tela">
      <header>
        <p className="meta">Sua jornada</p>
        <h1 className="titulo-serif">{nivel.nome}</h1>
      </header>

      <section className="cartao" aria-label="Progresso da semana">
        <div className="barra">
          <div className="barra-topo">
            <span>Plano da semana</span>
            <span className="muted">
              {feitos} de {total} dias
            </span>
          </div>
          <div className="barra-trilho" role="presentation">
            <div className="barra-preenchimento ouro" style={{ width: `${(feitos / total) * 100}%` }} />
          </div>
        </div>
        <p className="muted">
          {desafios === 0
            ? "Nenhum desafio prático concluído ainda."
            : `${desafios} ${desafios === 1 ? "desafio prático concluído" : "desafios práticos concluídos"}.`}
        </p>
      </section>

      <section aria-labelledby="h-areas">
        <h2 id="h-areas">Suas áreas</h2>
        <div className="cartao">
          {DIMENSOES.map((d) => (
            <div className="barra" key={d.id}>
              <div className="barra-topo">
                <span>
                  {d.nome}
                  {perfil.foco === d.id ? " (foco atual)" : ""}
                </span>
                <span className="muted">{perfil.pontos[d.id]} de 6</span>
              </div>
              <div className="barra-trilho" role="presentation">
                <div className="barra-preenchimento" style={{ width: `${(perfil.pontos[d.id] / 6) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="muted">Isto é um ponto de partida, e não um julgamento. Só Deus conhece o coração.</p>
        <button className="btn btn-secundario" onClick={onRefazer}>
          Refazer a avaliação
        </button>
      </section>

      <section aria-labelledby="h-limites">
        <h2 id="h-limites">Sobre a Lâmpada</h2>
        <p>
          A Lâmpada é uma IA de apoio ao discipulado. Ela segue a tradição reformada presbiteriana, mas não é uma
          voz oficial da igreja e não substitui o pastor, o presbítero, o médico ou o psicólogo.
        </p>
        <p>
          Os versículos são exibidos exatamente como estão na tradução Almeida (domínio público) e nunca são escritos
          pela IA.
        </p>
      </section>

      <section aria-labelledby="h-dados">
        <h2 id="h-dados">Seus dados</h2>
        <p>Tudo fica neste aparelho. Você pode levar uma cópia ou apagar tudo.</p>
        <div className="acoes">
          <button className="btn btn-secundario" onClick={() => baixarDados(estado)}>
            Baixar meus dados
          </button>
          <button
            className="btn btn-perigo"
            onClick={() => {
              if (window.confirm("Apagar todos os seus dados deste aparelho? Isso não pode ser desfeito.")) {
                apagarTudo();
                onApagado();
              }
            }}
          >
            Apagar tudo
          </button>
        </div>
      </section>
    </main>
  );
}
