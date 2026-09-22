import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Ver a explicação em lib/supabase/server.ts: dentro do container do app, "localhost" não chega
// ao gateway. SUPABASE_URL (sem NEXT_PUBLIC_) é a URL interna, só usada em self-host com Docker.
const URL_SERVIDOR = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Mantém a sessão do Supabase renovada a cada requisição (padrão recomendado com Next.js).
export async function middleware(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    URL_SERVIDOR,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(paraGravar) {
          paraGravar.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          paraGravar.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-|apple-touch-icon|sw\\.js|manifest\\.webmanifest).*)"],
};
