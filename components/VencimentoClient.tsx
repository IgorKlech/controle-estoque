"use client";

import { useMemo, useState } from "react";
import type { LoteItem } from "@/lib/types";
import { formatarValidade } from "@/lib/datas";

type Janela = 30 | 60 | 90 | 180 | 0; // 0 = todos

export default function VencimentoClient({ lotes }: { lotes: LoteItem[] }) {
  const [busca, setBusca] = useState("");
  const [janela, setJanela] = useState<Janela>(90);

  const vencidos = useMemo(() => lotes.filter((l) => l.vencido), [lotes]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lotes.filter((l) => {
      if (l.vencido) return false; // vencidos têm bloco próprio
      if (janela !== 0) {
        if (l.dias_para_vencer == null || l.dias_para_vencer > janela) {
          return false;
        }
      }
      if (!termo) return true;
      return (
        l.produto.toLowerCase().includes(termo) ||
        l.embalagem.toLowerCase().includes(termo) ||
        (l.codigo ?? "").toLowerCase().includes(termo)
      );
    });
  }, [lotes, busca, janela]);

  function exportarCSV() {
    const cab = [
      "Produto",
      "Embalagem",
      "Lote",
      "Validade",
      "Dias para vencer",
      "Saldo",
      "Situacao",
    ];
    const linhas = [...vencidos, ...filtrados].map((l) => [
      l.produto,
      l.embalagem,
      l.codigo ?? "",
      l.validade ?? "",
      l.dias_para_vencer ?? "",
      l.quantidade,
      l.vencido ? "VENCIDO" : "A vencer",
    ]);
    baixarCSV("vencimento", [cab, ...linhas]);
  }

  const qtdVencida = vencidos.reduce((a, l) => a + l.quantidade, 0);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card titulo="Lotes vencidos" valor={vencidos.length} alerta={vencidos.length > 0} />
        <Card titulo="Unidades vencidas" valor={qtdVencida} alerta={qtdVencida > 0} />
        <Card titulo={`A vencer (${janela || "todos"}${janela ? "d" : ""})`} valor={filtrados.length} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto ou lote..."
          className="min-w-50 flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:focus:border-neutral-400"
        />
        <select
          value={janela}
          onChange={(e) => setJanela(Number(e.target.value) as Janela)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
        >
          <option value={30}>Vence em 30 dias</option>
          <option value={60}>Vence em 60 dias</option>
          <option value={90}>Vence em 90 dias</option>
          <option value={180}>Vence em 180 dias</option>
          <option value={0}>Todos a vencer</option>
        </select>
        <button
          onClick={exportarCSV}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ↓ CSV
        </button>
      </div>

      {vencidos.length > 0 && (
        <Secao titulo="Vencidos" cor="text-red-600 dark:text-red-400">
          <Tabela lotes={vencidos} />
        </Secao>
      )}

      <Secao titulo="A vencer">
        {filtrados.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
            Nenhum lote a vencer nessa janela.
          </p>
        ) : (
          <Tabela lotes={filtrados} />
        )}
      </Secao>
    </div>
  );
}

function Tabela({ lotes }: { lotes: LoteItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
          <tr>
            <th className="px-4 py-3 font-medium">Produto / Embalagem</th>
            <th className="px-4 py-3 font-medium">Lote</th>
            <th className="px-4 py-3 font-medium">Validade</th>
            <th className="px-4 py-3 text-right font-medium">Dias</th>
            <th className="px-4 py-3 text-right font-medium">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {lotes.map((l) => (
            <tr
              key={l.lote_id}
              className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
            >
              <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {l.produto}
                </span>{" "}
                <span className="text-neutral-500">— {l.embalagem}</span>
              </td>
              <td className="px-4 py-2 text-neutral-500">{l.codigo ?? "—"}</td>
              <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">
                {formatarValidade(l.validade)}
              </td>
              <td
                className={`px-4 py-2 text-right tabular-nums ${
                  l.vencido
                    ? "text-red-600 dark:text-red-400"
                    : l.vence_90
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-neutral-500"
                }`}
              >
                {l.dias_para_vencer != null ? `${l.dias_para_vencer}d` : "—"}
              </td>
              <td className="px-4 py-2 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                {l.quantidade}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Secao({
  titulo,
  cor,
  children,
}: {
  titulo: string;
  cor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className={`mb-2 text-sm font-bold uppercase tracking-wide ${cor ?? "text-neutral-500"}`}>
        {titulo}
      </h2>
      {children}
    </div>
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
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500">{titulo}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          alerta ? "text-red-700 dark:text-red-300" : "text-neutral-900 dark:text-neutral-50"
        }`}
      >
        {valor.toLocaleString("pt-BR")}
      </p>
    </div>
  );
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
