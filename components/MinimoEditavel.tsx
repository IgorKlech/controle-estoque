"use client";

import { useState, useTransition } from "react";
import { atualizarEstoqueMinimo } from "@/app/actions";

/** Célula editável do estoque mínimo: salva ao sair do campo (onBlur). */
export default function MinimoEditavel({
  embalagemId,
  valor,
}: {
  embalagemId: string;
  valor: number;
}) {
  const [v, setV] = useState(String(valor));
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState(false);

  function salvar() {
    const n = Math.trunc(Number(v));
    if (!Number.isFinite(n) || n < 0) {
      setV(String(valor));
      return;
    }
    if (n === valor) return;
    startTransition(async () => {
      const r = await atualizarEstoqueMinimo(embalagemId, n);
      setErro(!r.ok);
    });
  }

  return (
    <input
      type="number"
      min={0}
      step={1}
      value={v}
      disabled={pending}
      onChange={(e) => setV(e.target.value)}
      onBlur={salvar}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      title="Estoque mínimo (edite e saia do campo para salvar)"
      className={`w-16 rounded-md border bg-transparent px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-neutral-900 disabled:opacity-50 dark:focus:border-neutral-400 ${
        erro
          ? "border-red-400"
          : "border-neutral-200 dark:border-neutral-700"
      }`}
    />
  );
}
