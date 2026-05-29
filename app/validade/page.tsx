import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { LoteItem } from "@/lib/types";
import AppHeader from "@/components/AppHeader";
import VencimentoClient from "@/components/VencimentoClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ValidadePage() {
  if (!hasSupabaseEnv()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Só lotes com validade definida (a view já filtra saldo > 0).
  const { data, error } = await supabase
    .from("vw_lotes")
    .select("*")
    .not("validade", "is", null)
    .order("validade", { ascending: true })
    .returns<LoteItem[]>();

  const lotes = data ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <AppHeader email={user?.email} active="validade" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Erro ao carregar lotes: {error.message}. Você já rodou a migração{" "}
            <code>migrations/002_fase2_lotes.sql</code> no Supabase?
          </p>
        ) : (
          <VencimentoClient lotes={lotes} />
        )}
      </main>
    </div>
  );
}
