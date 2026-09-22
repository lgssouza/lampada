"use client";
import { useCallback, useEffect, useState } from "react";
import { guardarCachePassagem, lerCachePassagem } from "@/lib/storage";
import type { Passagem } from "@/lib/types";

type Estado = { status: "carregando" } | { status: "ok"; passagem: Passagem } | { status: "erro" };

export function usePassagem(ref: string) {
  const [estado, setEstado] = useState<Estado>({ status: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    const guardada = lerCachePassagem(ref);
    if (guardada) {
      setEstado({ status: "ok", passagem: guardada });
      return;
    }
    setEstado({ status: "carregando" });
    fetch(`/api/passagem?ref=${encodeURIComponent(ref)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("falha");
        const p = (await r.json()) as Passagem;
        guardarCachePassagem(ref, p);
        if (vivo) setEstado({ status: "ok", passagem: p });
      })
      .catch(() => {
        if (vivo) setEstado({ status: "erro" });
      });
    return () => {
      vivo = false;
    };
  }, [ref, tentativa]);

  const tentarDeNovo = useCallback(() => setTentativa((t) => t + 1), []);
  return { estado, tentarDeNovo };
}
