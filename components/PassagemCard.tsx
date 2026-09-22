import type { Passagem } from "@/lib/types";

export function PassagemCard({ passagem }: { passagem: Passagem }) {
  return (
    <figure className="passagem">
      <figcaption className="passagem-ref">{passagem.referencia}</figcaption>
      <div className="passagem-texto">
        {passagem.versiculos.map((v) => (
          <span key={v.n}>
            <sup className="vnum">{v.n}</sup>
            {v.texto}{" "}
          </span>
        ))}
      </div>
      <p className="passagem-fonte">{passagem.traducao}</p>
    </figure>
  );
}

export function PassagemCarregando() {
  return (
    <div className="passagem" aria-busy="true" aria-live="polite">
      <div className="esqueleto" style={{ width: "40%", height: 18 }} />
      <div className="esqueleto" style={{ width: "100%" }} />
      <div className="esqueleto" style={{ width: "94%" }} />
      <div className="esqueleto" style={{ width: "97%" }} />
      <div className="esqueleto" style={{ width: "62%" }} />
      <span className="sr-only">Carregando a passagem</span>
    </div>
  );
}
