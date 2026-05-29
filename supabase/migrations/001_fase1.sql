-- =====================================================================
--  Controle de Estoque — Migração 001 (Fase 1: Fundação + Organização)
--
--  ADITIVA e segura: não apaga dados. Pode rodar mais de uma vez.
--  Rode no Supabase > SQL Editor DEPOIS do setup.sql inicial.
-- =====================================================================

-- ---------------------------------------------------------------------
--  Novos campos de organização
-- ---------------------------------------------------------------------

-- Produto: categoria/família e status ativo
alter table public.produtos
  add column if not exists categoria text,
  add column if not exists ativo     boolean not null default true;

-- Embalagem (SKU): estoque mínimo para alerta de reposição
alter table public.embalagens
  add column if not exists estoque_minimo integer not null default 0
    check (estoque_minimo >= 0);

-- Movimentação: motivo e documento de referência (NF, ordem, cliente...)
alter table public.movimentacoes
  add column if not exists motivo    text,
  add column if not exists documento text;

-- ---------------------------------------------------------------------
--  View de estoque (recriada com mínimo, categoria e flag de alerta)
-- ---------------------------------------------------------------------

create or replace view public.vw_estoque
with (security_invoker = true) as
  select
    e.id                                  as embalagem_id,
    p.id                                  as produto_id,
    p.nome                                as produto,
    e.descricao                           as embalagem,
    e.tipo,
    e.capacidade,
    e.quantidade,
    e.estoque_minimo,
    p.categoria,
    p.ativo,
    (e.quantidade <= e.estoque_minimo)    as abaixo_minimo
  from public.embalagens e
  join public.produtos  p on p.id = e.produto_id
  order by p.nome, e.capacidade;

-- ---------------------------------------------------------------------
--  View de histórico / Kardex (movimentações com produto e embalagem)
-- ---------------------------------------------------------------------

create or replace view public.vw_movimentacoes
with (security_invoker = true) as
  select
    m.id,
    m.created_at,
    p.nome        as produto,
    e.descricao   as embalagem,
    e.id          as embalagem_id,
    m.tipo,
    m.quantidade,
    m.motivo,
    m.documento,
    m.observacao,
    m.usuario_id
  from public.movimentacoes m
  join public.embalagens e on e.id = m.embalagem_id
  join public.produtos  p on p.id = e.produto_id
  order by m.created_at desc;
