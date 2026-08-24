# Inventory Control

Inventory management system for products, packaging units and stock movements
(inbound/outbound). Built with **Next.js + TypeScript + Tailwind**, backed by
**Supabase** (Postgres + Auth) and deployed on **Vercel**.

## Why it exists

Stock movements needed to be traceable: not just knowing what left the warehouse,
but which order or production run it left for. Every movement is tied to an order
number or a production order, so any change in stock can be traced back to a real
operation.

## Features (v1)

- Login / sign-up (Supabase Auth)
- Catalogue of products and packaging units (type and capacity derived from the name)
- Current stock per packaging unit
- **Inbound** and **outbound** movements — stock is updated by a database trigger
  that prevents negative balances
- Movements linked to an order number or production order for traceability
- Search by product/packaging and summary totals

## Access control

- User login required
- Admin role with full edit permissions directly in the system
- Row Level Security (RLS) policies enforced at the database level

## Project structure

```
app/
  page.tsx              Stock dashboard (protected route)
  actions.ts            Server action: record a movement
  login/                Login / sign-up / logout screens and actions
components/
  EstoqueClient.tsx     List, search and summary (client)
  MovimentacaoModal.tsx Inbound/outbound modal (client)
lib/supabase/           Supabase clients (browser, server, middleware)
middleware.ts           Route protection (redirects to /login without a session)
supabase/
  schema.sql            Tables, trigger, view and RLS policies
  seed.sql              Initial products and packaging units
```

## Running locally

### 1. Create the Supabase project

1. Create a project at <https://supabase.com>.
2. In the **SQL Editor**, run **`supabase/schema.sql`**, then **`supabase/seed.sql`**.
3. (Optional) Under **Authentication > Providers > Email**, disable
   "Confirm email" to test sign-in without email confirmation.

### 2. Environment variables

Copy the example file and fill it in with your project credentials
(**Project Settings > API**):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login` — create an
account and sign in.

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the repository at <https://vercel.com>.
3. Add both environment variables
   (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

> In **Supabase > Authentication > URL Configuration**, add your Vercel URL
> to *Site URL* / *Redirect URLs*.

## Data model

- **produtos** — `id`, `nome`
- **embalagens** — `id`, `produto_id`, `descricao` (e.g. "Bombona 25"), `tipo` and
  `capacidade` (derived from the description), `quantidade` (current stock)
- **movimentacoes** — `id`, `embalagem_id`, `tipo` (inbound/outbound), `quantidade`,
  `observacao`, `usuario_id`, `created_at`

## Status

In production, used daily.
