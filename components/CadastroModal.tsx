"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { criarProduto } from "@/app/actions";

type Linha = { descricao: string; minimo: string };

/** Modal para cadastrar um produto novo com suas embalagens. */
export default function CadastroModal({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useActionState(criarProduto, null);
  const [linhas, setLinhas] = useState<Linha[]>([
    { descricao: "", minimo: "0" },
  ]);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  // Serializa as embalagens em "descricao|minimo" por linha para o action.
  const embalagensSerial = linhas
    .filter((l) => l.descricao.trim())
    .map((l) => `${l.descricao.trim()}|${Number(l.minimo) || 0}`)
    .join("\n");

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
          Cadastrar produto
        </h2>

        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="embalagens" value={embalagensSerial} />

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Nome do produto
            <input
              type="text"
              name="nome"
              required
              autoFocus
              placeholder="Ex: NOVO PRODUTO X"
              className={campo}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Categoria (opcional)
            <input
              type="text"
              name="categoria"
              placeholder="Ex: Impermeabilizantes"
              className={campo}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Embalagens
            </span>
            <p className="text-xs text-neutral-500">
              Descrição com o tamanho no fim (ex: <em>Bombona 20</em>). O tipo e
              a capacidade são extraídos automaticamente.
            </p>

            {linhas.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={l.descricao}
                  onChange={(e) =>
                    setLinhas((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, descricao: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Bombona 20"
                  className={`${campo} flex-1`}
                />
                <input
                  type="number"
                  min={0}
                  value={l.minimo}
                  onChange={(e) =>
                    setLinhas((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, minimo: e.target.value } : x,
                      ),
                    )
                  }
                  title="Estoque mínimo"
                  className={`${campo} w-20`}
                />
                {linhas.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setLinhas((arr) => arr.filter((_, j) => j !== i))
                    }
                    className="rounded-lg border border-neutral-300 px-2 text-neutral-500 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setLinhas((arr) => [...arr, { descricao: "", minimo: "0" }])
              }
              className="self-start text-sm font-medium text-neutral-600 hover:underline dark:text-neutral-400"
            >
              + Adicionar embalagem
            </button>
          </div>

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
            <Submit />
          </div>
        </form>
      </div>
    </div>
  );
}

const campo =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-400";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
    >
      {pending ? "Salvando..." : "Cadastrar"}
    </button>
  );
}
