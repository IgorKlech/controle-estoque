"use client";

import type { EstoqueItem, LoteItem } from "@/lib/types";
import { formatarValidade } from "@/lib/datas";

/** Mostra os lotes (código, validade, saldo) de uma embalagem. */
export default function LotesModal({
  item,
  lotes,
  onClose,
}: {
  item: EstoqueItem;
  lotes: LoteItem[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
          Lotes
        </h2>
        <p className="mt-1 mb-4 text-sm text-neutral-500">
          {item.produto} — {item.embalagem}
        </p>

        {lotes.length === 0 ? (
          <p className="rounded-lg bg-neutral-100 px-3 py-4 text-center text-sm text-neutral-500 dark:bg-neutral-800">
            Nenhum lote com saldo. Faça uma entrada informando lote e validade.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="py-2 font-medium">Lote</th>
                <th className="py-2 font-medium">Validade</th>
                <th className="py-2 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr
                  key={l.lote_id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                >
                  <td className="py-2 text-neutral-700 dark:text-neutral-300">
                    {l.codigo ?? "—"}
                  </td>
                  <td className="py-2">
                    <span
                      className={
                        l.vencido
                          ? "font-medium text-red-600 dark:text-red-400"
                          : l.vence_90
                            ? "font-medium text-amber-600 dark:text-amber-400"
                            : "text-neutral-600 dark:text-neutral-400"
                      }
                    >
                      {formatarValidade(l.validade)}
                      {l.vencido && " (vencido)"}
                      {!l.vencido &&
                        l.dias_para_vencer != null &&
                        l.vence_90 &&
                        ` (${l.dias_para_vencer}d)`}
                    </span>
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {l.quantidade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
