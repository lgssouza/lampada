"use client";
import { useState } from "react";
import { Chama } from "./Icones";

export function Consentimento({ onAceitar }: { onAceitar: () => void }) {
  const [maior, setMaior] = useState(false);
  const [lgpd, setLgpd] = useState(false);

  return (
    <main className="tela tela-boas-vindas">
      <div className="marca">
        <Chama />
        <span>Lâmpada</span>
      </div>

      {/* Texto do Salmo 119:105 conferido na fonte Almeida (domínio público) usada pelo app. */}
      <blockquote className="destaque">
        <p>Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.</p>
        <footer>Salmos 119:105</footer>
      </blockquote>

      <p className="lead">
        Uma companheira para ler a Bíblia, orar e crescer na fé, na tradição reformada presbiteriana.
      </p>

      <section className="aviso" aria-labelledby="dados-titulo">
        <h2 id="dados-titulo">Como cuidamos dos seus dados</h2>
        <ul>
          <li>Seu progresso, suas anotações e suas conversas ficam somente neste aparelho.</li>
          <li>
            Ao conversar, suas mensagens são enviadas ao nosso servidor e à Anthropic, que opera o modelo de IA,
            apenas para gerar a resposta. Não guardamos o histórico no servidor.
          </li>
          <li>Você pode baixar ou apagar tudo quando quiser, na aba Jornada.</li>
          <li>A Lâmpada é uma IA. Ela não substitui o seu pastor, a sua igreja nem ajuda profissional.</li>
        </ul>
      </section>

      <div className="checks">
        <label className="check">
          <input type="checkbox" checked={maior} onChange={(e) => setMaior(e.target.checked)} />
          <span>Tenho 18 anos ou mais.</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={lgpd} onChange={(e) => setLgpd(e.target.checked)} />
          <span>Li e concordo com o tratamento dos meus dados descrito acima, conforme a LGPD.</span>
        </label>
      </div>

      <button className="btn btn-primario btn-largo" disabled={!maior || !lgpd} onClick={onAceitar}>
        Começar
      </button>
    </main>
  );
}
