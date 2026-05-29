import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { MovimentacaoItem } from "@/lib/types";
import AppHeader from "@/components/AppHeader";
import HistoricoClient from "@/components/HistoricoClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  if (!hasSupabaseEnv()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("vw_movimentacoes")
    .select("*")
    .limit(1000)
    .returns<MovimentacaoItem[]>();

  const itens = data ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <AppHeader email={user?.email} active="historico" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Erro ao carregar o histórico: {error.message}. Você já rodou a
            migração <code>migrations/001_fase1.sql</code> no Supabase?
          </p>
        ) : (
          <HistoricoClient itens={itens} />
        )}
      </main>
    </div>
  );
}
