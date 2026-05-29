import Link from "next/link";
import { logout } from "@/app/login/actions";

/** Cabeçalho compartilhado com navegação entre as telas. */
export default function AppHeader({
  email,
  active,
}: {
  email?: string;
  active: "estoque" | "historico" | "validade";
}) {
  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
            Controle de Estoque
          </span>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/" label="Estoque" active={active === "estoque"} />
            <NavLink
              href="/historico"
              label="Histórico"
              active={active === "historico"}
            />
            <NavLink
              href="/validade"
              label="Validade"
              active={active === "validade"}
            />
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-neutral-500 sm:inline">{email}</span>
          <form action={logout}>
            <button className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 font-medium transition ${
        active
          ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      }`}
    >
      {label}
    </Link>
  );
}
