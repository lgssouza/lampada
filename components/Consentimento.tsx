"use client";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { Chama } from "./Icones";

type Etapa = "formulario" | "enviado";

export function Consentimento() {
  const [maior, setMaior] = useState(false);
  const [lgpd, setLgpd] = useState(false);
  const [email, setEmail] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("formulario");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    if (!maior || !lgpd || !email.trim() || enviando) return;
    setEnviando(true);
    setErro(null);
    const sb = supabaseNavegador();
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setEnviando(false);
    if (error) {
      setErro("Não foi possível enviar o link agora. Confira o e-mail digitado e tente de novo.");
      return;
    }
    setEtapa("enviado");
  }

  if (etapa === "enviado") {
    return (
      <main className="tela tela-boas-vindas">
        <div className="marca">
          <Chama />
          <span>Lâmpada</span>
        </div>
        <h1 className="titulo-serif pequeno">Verifique seu e-mail</h1>
        <p className="lead">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra-o neste mesmo aparelho para entrar.
        </p>
        <p className="muted">Não recebeu? Olhe também a caixa de spam, ou peça um novo link.</p>
        <button className="btn btn-secundario" onClick={() => setEtapa("formulario")}>
          Usar outro e-mail
        </button>
      </main>
    );
  }

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
          <li>Seu progresso, suas anotações e suas conversas ficam associados à sua conta, protegidos por login.</li>
          <li>
            Ao conversar, suas mensagens são enviadas ao nosso servidor e à Anthropic, que opera o modelo de IA,
            apenas para gerar a resposta.
          </li>
          <li>Você pode baixar ou apagar todos os seus dados quando quiser, na aba Jornada.</li>
          <li>A Lâmpada é uma IA. Ela não substitui o seu pastor, a sua igreja nem ajuda profissional.</li>
        </ul>
      </section>

      <form className="form-login" onSubmit={enviarLink}>
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

        <label className="campo">
          <span>Seu e-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <button className="btn btn-primario btn-largo" type="submit" disabled={!maior || !lgpd || !email.trim() || enviando}>
          {enviando ? "Enviando..." : "Entrar com link por e-mail"}
        </button>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Não pedimos senha. Você recebe um link de acesso válido por tempo limitado.
        </p>
      </form>
    </main>
  );
}
