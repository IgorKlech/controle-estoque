# Controle de Estoque

Sistema simples de controle de estoque (produtos, embalagens e movimentações de
entrada/saída), feito com **Next.js + TypeScript + Tailwind**, banco no
**Supabase** (Postgres + Auth) e deploy na **Vercel**.

## Funcionalidades (v1)

- Login / criação de conta (Supabase Auth)
- Catálogo de produtos e embalagens (tipo + capacidade extraídos do nome)
- Estoque atual por embalagem
- Movimentações de **entrada** e **saída** (o estoque é atualizado por trigger no
  banco, que impede estoque negativo)
- Busca por produto/embalagem e resumo (totais)

## Estrutura

```
app/
  page.tsx              Painel de estoque (protegido)
  actions.ts            Server action: registrar movimentação
  login/                Tela e ações de login/cadastro/logout
components/
  EstoqueClient.tsx     Lista, busca e resumo (client)
  MovimentacaoModal.tsx Modal de entrada/saída (client)
lib/supabase/           Clientes Supabase (browser, server, middleware)
middleware.ts           Protege rotas (redireciona p/ /login sem sessão)
supabase/
  schema.sql            Tabelas, trigger, view e políticas RLS
  seed.sql              Produtos e embalagens iniciais (Lista 2)
```

## Como rodar localmente

### 1. Criar o projeto no Supabase

1. Crie um projeto em <https://supabase.com>.
2. No **SQL Editor**, rode **`supabase/schema.sql`** e depois **`supabase/seed.sql`**.
3. (Opcional) Em **Authentication > Providers > Email**, desative
   "Confirm email" se quiser testar login sem precisar confirmar o e-mail.

### 2. Variáveis de ambiente

Copie o exemplo e preencha com os dados do seu projeto
(**Project Settings > API**):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse <http://localhost:3000>. Você será redirecionado para `/login`. Crie uma
conta e entre.

## Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Em <https://vercel.com>, importe o repositório.
3. Adicione as duas variáveis de ambiente
   (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

> Em **Supabase > Authentication > URL Configuration**, adicione a URL da Vercel
> em *Site URL* / *Redirect URLs*.

## Modelo de dados

- **produtos** — `id`, `nome`
- **embalagens** — `id`, `produto_id`, `descricao` (ex: "Bombona 25"), `tipo` e
  `capacidade` (gerados a partir da descrição), `quantidade` (estoque atual)
- **movimentacoes** — `id`, `embalagem_id`, `tipo` (entrada/saida), `quantidade`,
  `observacao`, `usuario_id`, `created_at`
