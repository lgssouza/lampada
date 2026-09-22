"use client";
import { useEffect, useState } from "react";
import { CATECISMO } from "@/lib/catecismo";
import { NIVEIS } from "@/lib/maturity";
import { INTERPRETE, ORACOES, PLANOS } from "@/lib/plans";
import type { Estado } from "@/lib/types";
import { IconeCheck } from "./Icones";
import { PassagemCard, PassagemCarregando } from "./PassagemCard";
import { usePassagem } from "./usePassagem";

type Props = {
  estado: Estado;
  atualizar: (fn: (e: Estado) => Estado) => void;
  onRefazer: () => void;
};

export function Hoje({ estado, atualizar, onRefazer }: Props) {
  const plano = estado.plano!;
  const dias = PLANOS[plano.nivel];
  const primeiroPendente = dias.find((d) => !plano.concluidos.includes(d.dia))?.dia ?? dias.length;
  const [diaSel, setDiaSel] = useState(primeiroPendente);
  const dia = dias.find((d) => d.dia === diaSel)!;
  const cat = CATECISMO[(dia.dia - 1) % CATECISMO.length];
  const oracao = ORACOES[dia.oracao.tipo];
  const { estado: leitura, tentarDeNovo } = usePassagem(dia.referencia);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [diaSel]);

  const concluido = plano.concluidos.includes(dia.dia);
  const semanaCompleta = plano.concluidos.length >= dias.length;

  function alternar(campo: "concluidos" | "desafios") {
    atualizar((e) => {
      if (!e.plano) return e;
      const lista = e.plano[campo];
      const nova = lista.includes(dia.dia) ? lista.filter((x) => x !== dia.dia) : [...lista, dia.dia];
      return { ...e, plano: { ...e.plano, [campo]: nova } };
    });
  }

  function escreverNota(texto: string) {
    atualizar((e) => (e.plano ? { ...e, plano: { ...e.plano, notas: { ...e.plano.notas, [dia.dia]: texto } } } : e));
  }

  return (
    <main className="tela">
      {semanaCompleta && (
        <section className="cartao destaque-suave">
          <h2 className="titulo-serif pequeno">Você concluiu a semana</h2>
          <p>
            Deus seja louvado pela sua constância. Refaça a avaliação para ver o seu novo ponto de partida e receber o
            plano da próxima semana.
          </p>
          <button className="btn btn-primario" onClick={onRefazer}>
            Refazer a avaliação
          </button>
        </section>
      )}

      <nav className="dias" aria-label="Dias do plano">
        {dias.map((d) => {
          const feito = plano.concluidos.includes(d.dia);
          return (
            <button
              key={d.dia}
              className={`dia ${d.dia === diaSel ? "atual" : ""} ${feito ? "feito" : ""}`}
              onClick={() => setDiaSel(d.dia)}
              aria-label={`Dia ${d.dia}${feito ? ", concluído" : ""}`}
              aria-current={d.dia === diaSel ? "step" : undefined}
            >
              {feito ? <IconeCheck /> : d.dia}
            </button>
          );
        })}
      </nav>

      <header>
        <p className="meta">
          Dia {dia.dia} de {dias.length}, {NIVEIS[plano.nivel].nome}
        </p>
        <h1 className="titulo-serif">{dia.titulo}</h1>
      </header>

      <section aria-labelledby="h-leitura">
        <h2 id="h-leitura">Leitura</h2>
        {leitura.status === "carregando" && <PassagemCarregando />}
        {leitura.status === "ok" && <PassagemCard passagem={leitura.passagem} />}
        {leitura.status === "erro" && (
          <div className="cartao">
            <p>Não foi possível carregar {dia.referencia} agora. Verifique a conexão.</p>
            <button className="btn btn-secundario" onClick={tentarDeNovo}>
              Tentar de novo
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="h-metodo">
        <h2 id="h-metodo">Observe, interprete, aplique</h2>
        <div className="metodo">
          <div>
            <h3>Observe</h3>
            <p>{dia.observe}</p>
          </div>
          <div>
            <h3>Interprete</h3>
            <p>{INTERPRETE}</p>
          </div>
          <div>
            <h3>Aplique</h3>
            <p>{dia.aplique}</p>
          </div>
        </div>
        <label className="campo">
          <span>Suas anotações do dia</span>
          <textarea
            rows={4}
            value={plano.notas[dia.dia] ?? ""}
            onChange={(e) => escreverNota(e.target.value)}
            placeholder="O que Deus está ensinando a você neste texto?"
          />
        </label>
      </section>

      <section aria-labelledby="h-oracao">
        <h2 id="h-oracao">Oração de {oracao.nome.toLowerCase()}</h2>
        <p>{dia.oracao.foco}</p>
        <ol className="passos">
          {oracao.passos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="h-desafio">
        <h2 id="h-desafio">Desafio do dia</h2>
        <label className="check">
          <input type="checkbox" checked={plano.desafios.includes(dia.dia)} onChange={() => alternar("desafios")} />
          <span>{dia.desafio}</span>
        </label>
      </section>

      <section aria-labelledby="h-cat">
        <h2 id="h-cat">Breve Catecismo, pergunta {cat.n}</h2>
        <div className="cartao catecismo">
          <p className="pergunta-cat">{cat.pergunta}</p>
          <p>{cat.resposta}</p>
        </div>
      </section>

      <button
        className={`btn btn-largo ${concluido ? "btn-secundario" : "btn-primario"}`}
        onClick={() => alternar("concluidos")}
      >
        {concluido ? "Desmarcar dia como concluído" : "Concluir o dia"}
      </button>
    </main>
  );
}
