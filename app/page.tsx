import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { EstoqueItem, LoteItem } from "@/lib/types";
import AppHeader from "@/components/AppHeader";
import EstoqueClient from "@/components/EstoqueClient";

// Painel autenticado: renderiza a cada request (lê sessão/cookies e estoque atual).
export const dynamic = "force-dynamic";

export default async function Home() {
  // Sem env vars não dá para falar com o Supabase: mostra instrução em vez
  // de estourar um erro de servidor.
  if (!hasSupabaseEnv()) {
    return <EnvFaltando />;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("vw_estoque")
    .select("*")
    .returns<EstoqueItem[]>();

  // Lotes (para o detalhe por embalagem). Pode não existir se a migração 002
  // ainda não foi aplicada — nesse caso seguimos sem lotes.
  const { data: lotesData } = await supabase
    .from("vw_lotes")
    .select("*")
    .returns<LoteItem[]>();

  const itens = data ?? [];
  const lotes = lotesData ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <AppHeader email={user?.email} active="estoque" />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Erro ao carregar o estoque: {error.message}. Você já rodou o{" "}
            <code>setup.sql</code> e as migrações em{" "}
            <code>supabase/migrations/</code> no Supabase?
          </p>
        ) : (
          <EstoqueClient itens={itens} lotes={lotes} />
        )}
      </main>
    </div>
  );
}

function EnvFaltando() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <h1 className="text-lg font-bold">Configuração pendente</h1>
        <p className="mt-2 text-sm">
          As variáveis de ambiente do Supabase não foram encontradas. Na Vercel,
          em <strong>Settings → Environment Variables</strong>, adicione (nos
          ambientes Production, Preview e Development):
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>
            <code>NEXT_PUBLIC_SUPABASE_URL</code>
          </li>
          <li>
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </li>
        </ul>
        <p className="mt-3 text-sm">
          Depois faça <strong>Redeploy</strong> (sem cache).
        </p>
      </div>
    </main>
  );
}
