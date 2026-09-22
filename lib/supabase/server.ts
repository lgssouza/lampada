import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Em produção normal (Supabase na nuvem), o navegador e o servidor usam a mesma URL pública.
// Rodando com Docker/self-host, o navegador precisa de uma URL alcançável de fora (ex.: http://localhost:8000),
// mas o servidor (dentro do container do app) precisa do nome do serviço na rede interna do Docker
// (ex.: http://kong:8000) — "localhost" ali dentro seria o próprio container do app, não o gateway.
// Defina SUPABASE_URL (sem NEXT_PUBLIC_) só nesse cenário; do contrário, cai na URL pública normal.
const URL_SERVIDOR = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Cliente para uso em rotas de servidor (Route Handlers). Lê e grava os cookies de sessão.
export async function supabaseServidor() {
  const cookieStore = await cookies();
  return createServerClient(
    URL_SERVIDOR,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(paraGravar) {
          try {
            paraGravar.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado a partir de um Server Component, que não pode gravar cookies.
            // Sem problema: o middleware.ts já cuida de renovar a sessão a cada requisição.
          }
        },
      },
    },
  );
}
