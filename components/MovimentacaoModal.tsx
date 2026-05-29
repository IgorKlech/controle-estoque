"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { registrarMovimentacao } from "@/app/actions";
import {
  MOTIVOS_ENTRADA,
  MOTIVOS_SAIDA,
  type EstoqueItem,
  type TipoMovimentacao,
} from "@/lib/types";

export default function MovimentacaoModal({
  item,
  tipo,
  onClose,
}: {
  item: EstoqueItem;
  tipo: TipoMovimentacao;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(registrarMovimentacao, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  const ehEntrada = tipo === "entrada";
  const motivos = ehEntrada ? MOTIVOS_ENTRADA : MOTIVOS_SAIDA;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
          {ehEntrada ? "Entrada" : "Saída"} de estoque
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {item.produto} — {item.embalagem}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Estoque atual:{" "}
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {item.quantidade}
          </span>
        </p>

        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="embalagem_id" value={item.embalagem_id} />
          <input type="hidden" name="tipo" value={tipo} />

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Quantidade
            <input
              type="number"
              name="quantidade"
              min={1}
              max={ehEntrada ? undefined : item.quantidade}
              step={1}
              defaultValue={1}
              required
              autoFocus
              className={campo}
            />
          </label>

          {ehEntrada ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Lote (opcional)
                <input
                  type="text"
                  name="codigo"
                  maxLength={60}
                  placeholder="Ex: L2026-04"
                  className={campo}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Validade (opcional)
                <input type="date" name="validade" className={campo} />
              </label>
            </div>
          ) : (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              A baixa é automática por <strong>FEFO</strong>: sai primeiro o lote
              que vence antes.
            </p>
          )}

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Motivo
            <select name="motivo" defaultValue={motivos[0]} className={campo}>
              {motivos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Documento (NF, ordem, cliente…)
            <input type="text" name="documento" maxLength={80} className={campo} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Observação (opcional)
            <input type="text" name="observacao" maxLength={200} className={campo} />
          </label>

          {state && !state.ok && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <Submit ehEntrada={ehEntrada} />
          </div>
        </form>
      </div>
    </div>
  );
}

const campo =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-400";

function Submit({ ehEntrada }: { ehEntrada: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
        ehEntrada
          ? "bg-green-600 hover:bg-green-700"
          : "bg-red-600 hover:bg-red-700"
      }`}
    >
      {pending ? "Salvando..." : "Confirmar"}
    </button>
  );
}
