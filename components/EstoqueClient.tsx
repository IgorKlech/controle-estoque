"use client";

import { useMemo, useState } from "react";
import type { EstoqueItem, TipoMovimentacao } from "@/lib/types";
import MovimentacaoModal from "./MovimentacaoModal";

type ModalState = { item: EstoqueItem; tipo: TipoMovimentacao } | null;

export default function EstoqueClient({ itens }: { itens: EstoqueItem[] }) {
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter(
      (i) =>
        i.produto.toLowerCase().includes(termo) ||
        i.embalagem.toLowerCase().includes(termo),
    );
  }, [itens, busca]);

  const grupos = useMemo(() => {
    const map = new Map<string, EstoqueItem[]>();
    for (const item of filtrados) {
      const lista = map.get(item.produto) ?? [];
      lista.push(item);
      map.set(item.produto, lista);
    }
    return Array.from(map.entries());
  }, [filtrados]);

  const totalUnidades = useMemo(
    () => itens.reduce((acc, i) => acc + i.quantidade, 0),
    [itens],
  );
  const totalProdutos = useMemo(
    () => new Set(itens.map((i) => i.produto)).size,
    [itens],
  );

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card titulo="Produtos" valor={totalProdutos} />
        <Card titulo="Embalagens (SKUs)" valor={itens.length} />
        <Card titulo="Unidades em estoque" valor={totalUnidades} />
      </div>

      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto ou embalagem..."
        className="mb-4 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:focus:border-neutral-400"
      />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
            <tr>
              <th className="px-4 py-3 font-medium">Produto / Embalagem</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Capacidade</th>
              <th className="px-4 py-3 text-right font-medium">Estoque</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {grupos.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  Nenhum item encontrado.
                </td>
              </tr>
            )}
            {grupos.map(([produto, lista]) => (
              <ProdutoBloco
                key={produto}
                produto={produto}
                lista={lista}
                onMovimentar={(item, tipo) => setModal({ item, tipo })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <MovimentacaoModal
          item={modal.item}
          tipo={modal.tipo}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function ProdutoBloco({
  produto,
  lista,
  onMovimentar,
}: {
  produto: string;
  lista: EstoqueItem[];
  onMovimentar: (item: EstoqueItem, tipo: TipoMovimentacao) => void;
}) {
  return (
    <>
      <tr className="border-b border-neutral-100 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-950/40">
        <td
          colSpan={5}
          className="px-4 py-2 font-semibold text-neutral-900 dark:text-neutral-100"
        >
          {produto}
        </td>
      </tr>
      {lista.map((item) => (
        <tr
          key={item.embalagem_id}
          className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
        >
          <td className="px-4 py-2 pl-8 text-neutral-700 dark:text-neutral-300">
            {item.embalagem}
          </td>
          <td className="px-4 py-2 text-neutral-500">{item.tipo}</td>
          <td className="px-4 py-2 text-right text-neutral-500">
            {item.capacidade ?? "—"}
          </td>
          <td className="px-4 py-2 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {item.quantidade}
          </td>
          <td className="px-4 py-2">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => onMovimentar(item, "entrada")}
                className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-green-700"
              >
                + Entrada
              </button>
              <button
                onClick={() => onMovimentar(item, "saida")}
                disabled={item.quantidade <= 0}
                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                − Saída
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {titulo}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
        {valor.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
