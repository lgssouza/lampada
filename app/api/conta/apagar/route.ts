import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Apaga a conta e, por cascata (on delete cascade no schema.sql), todos os dados do usuário.
// Precisa da service role key porque excluir uma conta de autenticação exige privilégio de administrador.
export async function POST() {
  const sb = await supabaseServidor();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chaveAdmin) {
    return NextResponse.json(
      { erro: "A exclusão de conta ainda não foi configurada no servidor (falta SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 },
    );
  }

  const admin = createClient(url, chaveAdmin, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ erro: "Não foi possível apagar a conta agora. Tente novamente em instantes." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
