export default function ErroAutenticacao() {
  return (
    <main className="tela tela-boas-vindas">
      <h1 className="titulo-serif pequeno">O link não é mais válido</h1>
      <p className="lead">
        Ele pode ter expirado ou já ter sido usado. Volte à tela inicial e peça um novo link de acesso.
      </p>
      <a className="btn btn-primario btn-largo" href="/">
        Voltar
      </a>
    </main>
  );
}
