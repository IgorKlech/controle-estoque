-- =====================================================================
--  Controle de Estoque — Schema
--  Rode este arquivo no Supabase (SQL Editor) antes do seed.sql
-- =====================================================================

-- ---------------------------------------------------------------------
--  Tabelas
-- ---------------------------------------------------------------------

create table if not exists public.produtos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.embalagens (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references public.produtos (id) on delete cascade,
  descricao    text not null,                       -- ex: "Bombona 25"
  -- tipo e capacidade derivados automaticamente da descricao:
  tipo         text    generated always as (
                  trim(regexp_replace(descricao, '\s*[0-9.,]+\s*$', ''))
               ) stored,                            -- ex: "Bombona"
  capacidade   numeric generated always as (
                  nullif(replace(regexp_replace(descricao, '[^0-9,.]', '', 'g'), ',', '.'), '')::numeric
               ) stored,                            -- ex: 25
  quantidade   integer not null default 0 check (quantidade >= 0),  -- estoque atual
  created_at   timestamptz not null default now(),
  unique (produto_id, descricao)
);

create index if not exists idx_embalagens_produto on public.embalagens (produto_id);

create table if not exists public.movimentacoes (
  id            uuid primary key default gen_random_uuid(),
  embalagem_id  uuid not null references public.embalagens (id) on delete cascade,
  tipo          text not null check (tipo in ('entrada', 'saida')),
  quantidade    integer not null check (quantidade > 0),
  observacao    text,
  usuario_id    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_movimentacoes_embalagem on public.movimentacoes (embalagem_id);
create index if not exists idx_movimentacoes_created on public.movimentacoes (created_at desc);

-- ---------------------------------------------------------------------
--  Trigger: aplica a movimentacao no estoque da embalagem
-- ---------------------------------------------------------------------

create or replace function public.aplicar_movimentacao()
returns trigger
language plpgsql
as $$
begin
  if new.tipo = 'entrada' then
    update public.embalagens
       set quantidade = quantidade + new.quantidade
     where id = new.embalagem_id;
  elsif new.tipo = 'saida' then
    update public.embalagens
       set quantidade = quantidade - new.quantidade
     where id = new.embalagem_id;   -- o CHECK (quantidade >= 0) impede estoque negativo
  end if;
  return new;
end;
$$;

drop trigger if exists trg_aplicar_movimentacao on public.movimentacoes;
create trigger trg_aplicar_movimentacao
  after insert on public.movimentacoes
  for each row execute function public.aplicar_movimentacao();

-- ---------------------------------------------------------------------
--  View de estoque (produto + embalagem juntos, para listagem)
-- ---------------------------------------------------------------------

create or replace view public.vw_estoque as
  select
    e.id            as embalagem_id,
    p.id            as produto_id,
    p.nome          as produto,
    e.descricao     as embalagem,
    e.tipo,
    e.capacidade,
    e.quantidade
  from public.embalagens e
  join public.produtos  p on p.id = e.produto_id
  order by p.nome, e.capacidade;

-- ---------------------------------------------------------------------
--  RLS — qualquer usuario autenticado tem acesso total (v1)
-- ---------------------------------------------------------------------

alter table public.produtos      enable row level security;
alter table public.embalagens    enable row level security;
alter table public.movimentacoes enable row level security;

drop policy if exists "auth full access produtos"      on public.produtos;
drop policy if exists "auth full access embalagens"     on public.embalagens;
drop policy if exists "auth full access movimentacoes"  on public.movimentacoes;

create policy "auth full access produtos"
  on public.produtos      for all to authenticated using (true) with check (true);

create policy "auth full access embalagens"
  on public.embalagens    for all to authenticated using (true) with check (true);

create policy "auth full access movimentacoes"
  on public.movimentacoes for all to authenticated using (true) with check (true);
