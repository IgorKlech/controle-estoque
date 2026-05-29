"use client";

import { useMemo, useState } from "react";
import type { EstoqueItem, LoteItem, TipoMovimentacao } from "@/lib/types";
import MovimentacaoModal from "./MovimentacaoModal";
import CadastroModal from "./CadastroModal";
import LotesModal from "./LotesModal";
import MinimoEditavel from "./MinimoEditavel";
import { formatarValidade } from "@/lib/datas";

type ModalState = { item: EstoqueItem; tipo: TipoMovimentacao } | null;
type Filtro = "todos" | "alerta" | "vencimento";

export default function EstoqueClient({
  itens,
  lotes,
}: {
  itens: EstoqueItem[];
  lotes: LoteItem[];
}) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modal, setModal] = useState<ModalState>(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [lotesDe, setLotesDe] = useState<EstoqueItem | null>(null);

  const lotesPorEmbalagem = useMemo(() => {
    const map = new Map<string, LoteItem[]>();
    for (const l of lotes) {
      const arr = map.get(l.embalagem_id) ?? [];
      arr.push(l);
      map.set(l.embalagem_id, arr);
    }
    return map;
  }, [lotes]);

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(itens.map((i) => i.categoria).filter((c): c is string => !!c)),
      ).sort(),
    [itens],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((i) => {
      if (filtro === "alerta" && !i.abaixo_minimo) return false;
      if (filtro === "vencimento" && !i.tem_vencido && !i.vence_90) return false;
      if (categoria && i.categoria !== categoria) return false;
      if (
        termo &&
        !i.produto.toLowerCase().includes(termo) &&
        !i.embalagem.toLowerCase().includes(termo)
      ) {
        return false;
      }
      return true;
    });
  }, [itens, busca, categoria, filtro]);

  const grupos = useMemo(() => {
    const map = new Map<string, EstoqueItem[]>();
    for (const item of filtrados) {
      const lista = map.get(item.produto) ?? [];
      lista.push(item);
      map.set(item.produto, lista);
    }
    return Array.from(map.entries());
  }, [filtrados]);

  const totalProdutos = useMemo(
    () => new Set(itens.map((i) => i.produto)).size,
    [itens],
  );
  const totalUnidades = useMemo(
    () => itens.reduce((acc, i) => acc + i.quantidade, 0),
    [itens],
  );
  const totalAlerta = useMemo(
    () => itens.filter((i) => i.abaixo_minimo).length,
    [itens],
  );
  const totalVencimento = useMemo(
    () => itens.filter((i) => i.tem_vencido || i.vence_90).length,
    [itens],
  );

  function exportarCSV() {
    const cab = [
      "Produto",
      "Embalagem",
      "Tipo",
      "Capacidade",
      "Estoque",
      "Minimo",
      "Categoria",
      "Abaixo do minimo",
      "Proxima validade",
    ];
    const linhas = filtrados.map((i) => [
      i.produto,
      i.embalagem,
      i.tipo ?? "",
      i.capacidade ?? "",
      i.quantidade,
      i.estoque_minimo,
      i.categoria ?? "",
      i.abaixo_minimo ? "SIM" : "",
      i.proxima_validade ?? "",
    ]);
    baixarCSV("estoque", [cab, ...linhas]);
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card titulo="Produtos" valor={totalProdutos} />
        <Card titulo="Unidades" valor={totalUnidades} />
        <Card titulo="Abaixo do mínimo" valor={totalAlerta} alerta={totalAlerta > 0} />
        <Card titulo="Validade crítica" valor={totalVencimento} alerta={totalVencimento > 0} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto ou embalagem..."
          className="min-w-50 flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:focus:border-neutral-400"
        />
        {categorias.length > 0 && (
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <FiltroBtn ativo={filtro === "alerta"} onClick={() => setFiltro(filtro === "alerta" ? "todos" : "alerta")}>
          ⚠ Estoque baixo
        </FiltroBtn>
        <FiltroBtn ativo={filtro === "vencimento"} onClick={() => setFiltro(filtro === "vencimento" ? "todos" : "vencimento")}>
          ⏰ Validade
        </FiltroBtn>
        <button
          onClick={exportarCSV}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ↓ CSV
        </button>
        <button
          onClick={() => setCadastroAberto(true)}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          + Produto
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
            <tr>
              <th className="px-4 py-3 font-medium">Produto / Embalagem</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Estoque</th>
              <th className="px-4 py-3 text-right font-medium">Mínimo</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {grupos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Nenhum item encontrado.
                </td>
              </tr>
            )}
            {grupos.map(([produto, lista]) => (
              <ProdutoBloco
                key={produto}
                produto={produto}
                categoria={lista[0]?.categoria ?? null}
                lista={lista}
                onMovimentar={(item, tipo) => setModal({ item, tipo })}
                onVerLotes={(item) => setLotesDe(item)}
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
      {cadastroAberto && (
        <CadastroModal onClose={() => setCadastroAberto(false)} />
      )}
      {lotesDe && (
        <LotesModal
          item={lotesDe}
          lotes={lotesPorEmbalagem.get(lotesDe.embalagem_id) ?? []}
          onClose={() => setLotesDe(null)}
        />
      )}
    </div>
  );
}

function ProdutoBloco({
  produto,
  categoria,
  lista,
  onMovimentar,
  onVerLotes,
}: {
  produto: string;
  categoria: string | null;
  lista: EstoqueItem[];
  onMovimentar: (item: EstoqueItem, tipo: TipoMovimentacao) => void;
  onVerLotes: (item: EstoqueItem) => void;
}) {
  return (
    <>
      <tr className="border-b border-neutral-100 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-950/40">
        <td
          colSpan={6}
          className="px-4 py-2 font-semibold text-neutral-900 dark:text-neutral-100"
        >
          {produto}
          {categoria && (
            <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-normal text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {categoria}
            </span>
          )}
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
          <td className="px-4 py-2 text-right">
            <span
              className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                item.abaixo_minimo
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-neutral-900 dark:text-neutral-100"
              }`}
            >
              {item.abaixo_minimo && <span title="Abaixo do mínimo">⚠</span>}
              {item.quantidade}
            </span>
          </td>
          <td className="px-4 py-2 text-right">
            <MinimoEditavel
              embalagemId={item.embalagem_id}
              valor={item.estoque_minimo}
            />
          </td>
          <td className="px-4 py-2">
            <ValidadeBadge item={item} />
          </td>
          <td className="px-4 py-2">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => onVerLotes(item)}
                className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                title="Ver lotes"
              >
                Lotes
              </button>
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

function ValidadeBadge({ item }: { item: EstoqueItem }) {
  if (!item.proxima_validade) {
    return <span className="text-neutral-400">—</span>;
  }
  const cor = item.tem_vencido
    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
    : item.vence_90
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cor}`}>
      {item.tem_vencido && "Vencido • "}
      {formatarValidade(item.proxima_validade)}
    </span>
  );
}

function FiltroBtn({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
        ativo
          ? "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
          : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function Card({
  titulo,
  valor,
  alerta,
}: {
  titulo: string;
  valor: number;
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        alerta
          ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500">{titulo}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          alerta
            ? "text-amber-700 dark:text-amber-300"
            : "text-neutral-900 dark:text-neutral-50"
        }`}
      >
        {valor.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

/** Gera e baixa um arquivo CSV no navegador (sem dependências). */
function baixarCSV(nome: string, linhas: (string | number)[][]) {
  const csv = linhas
    .map((linha) =>
      linha
        .map((c) => {
          const s = String(c).replace(/"/g, '""');
          return /[",;\n]/.test(s) ? `"${s}"` : s;
        })
        .join(";"),
    )
    .join("\r\n");

  // BOM para o Excel reconhecer acentos em UTF-8.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const data = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${nome}-${data}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
