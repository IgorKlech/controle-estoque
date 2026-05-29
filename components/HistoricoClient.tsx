"use client";

import { useMemo, useState } from "react";
import type { MovimentacaoItem } from "@/lib/types";

type FiltroTipo = "todos" | "entrada" | "saida";

export default function HistoricoClient({
  itens,
}: {
  itens: MovimentacaoItem[];
}) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((m) => {
      if (tipo !== "todos" && m.tipo !== tipo) return false;
      if (!termo) return true;
      return (
        m.produto.toLowerCase().includes(termo) ||
        m.embalagem.toLowerCase().includes(termo) ||
        (m.documento ?? "").toLowerCase().includes(termo) ||
        (m.motivo ?? "").toLowerCase().includes(termo)
      );
    });
  }, [itens, busca, tipo]);

  const totalEntradas = useMemo(
    () =>
      itens
        .filter((m) => m.tipo === "entrada")
        .reduce((a, m) => a + m.quantidade, 0),
    [itens],
  );
  const totalSaidas = useMemo(
    () =>
      itens
        .filter((m) => m.tipo === "saida")
        .reduce((a, m) => a + m.quantidade, 0),
    [itens],
  );

  function exportarCSV() {
    const cab = [
      "Data",
      "Produto",
      "Embalagem",
      "Tipo",
      "Quantidade",
      "Motivo",
      "Documento",
      "Observacao",
    ];
    const linhas = filtrados.map((m) => [
      formatarData(m.created_at),
      m.produto,
      m.embalagem,
      m.tipo,
      m.quantidade,
      m.motivo ?? "",
      m.documento ?? "",
      m.observacao ?? "",
    ]);
    baixarCSV("historico", [cab, ...linhas]);
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card titulo="Movimentações" valor={itens.length} />
        <Card titulo="Total entradas" valor={totalEntradas} cor="text-green-600 dark:text-green-400" />
        <Card titulo="Total saídas" valor={totalSaidas} cor="text-red-600 dark:text-red-400" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto, motivo ou documento..."
          className="min-w-50 flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:focus:border-neutral-400"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as FiltroTipo)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
        >
          <option value="todos">Todos os tipos</option>
          <option value="entrada">Só entradas</option>
          <option value="saida">Só saídas</option>
        </select>
        <button
          onClick={exportarCSV}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ↓ Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Produto / Embalagem</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Qtd.</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Documento</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Nenhuma movimentação encontrada.
                </td>
              </tr>
            )}
            {filtrados.map((m) => (
              <tr
                key={m.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
              >
                <td className="whitespace-nowrap px-4 py-2 text-neutral-500">
                  {formatarData(m.created_at)}
                </td>
                <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {m.produto}
                  </span>{" "}
                  <span className="text-neutral-500">— {m.embalagem}</span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.tipo === "entrada"
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {m.tipo === "entrada" ? "Entrada" : "Saída"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {m.tipo === "entrada" ? "+" : "−"}
                  {m.quantidade}
                </td>
                <td className="px-4 py-2 text-neutral-500">{m.motivo ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-500">
                  {m.documento ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{titulo}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          cor ?? "text-neutral-900 dark:text-neutral-50"
        }`}
      >
        {valor.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const data = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${nome}-${data}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
