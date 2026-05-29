import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";
import type { EstoqueItem } from "@/lib/types";
import EstoqueClient from "@/components/EstoqueClient";

// Painel autenticado: renderiza a cada request (lê sessão/cookies e estoque atual).
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("vw_estoque")
    .select("*")
    .returns<EstoqueItem[]>();

  const itens = data ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
            Controle de Estoque
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-neutral-500 sm:inline">
              {user?.email}
            </span>
            <form action={logout}>
              <button className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Erro ao carregar o estoque: {error.message}. Você já rodou o{" "}
            <code>schema.sql</code> e o <code>seed.sql</code> no Supabase?
          </p>
        ) : (
          <EstoqueClient itens={itens} />
        )}
      </main>
    </div>
  );
}
