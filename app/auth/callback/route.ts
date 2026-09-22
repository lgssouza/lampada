import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Para onde o link mágico do e-mail leva. Troca o código pela sessão e manda para o app.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await supabaseServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", url.origin));
  }
  return NextResponse.redirect(new URL("/auth/erro", url.origin));
}
