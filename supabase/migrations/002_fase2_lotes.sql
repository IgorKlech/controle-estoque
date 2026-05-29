-- =====================================================================
--  Controle de Estoque — Migração 002 (Fase 2: Lote + Validade + FEFO)
--
--  ADITIVA e segura: não apaga dados. Pode rodar mais de uma vez.
--  Rode no Supabase > SQL Editor DEPOIS de 001_fase1.sql.
--
--  O que faz:
--   - cria a tabela `lotes` (cada lote = código + validade + saldo)
--   - liga movimentações a um lote
--   - faz backfill: o estoque atual de cada embalagem vira um lote inicial
--   - FEFO: saída consome automaticamente o lote que vence primeiro
--   - funções (RPC) registrar_entrada e registrar_saida_fefo (atômicas)
--   - views de lotes/vencimento e estoque com info de validade
-- =====================================================================

-- ---------------------------------------------------------------------
--  Tabela de lotes
-- ---------------------------------------------------------------------
create table if not exists public.lotes (
  id           uuid primary key default gen_random_uuid(),
  embalagem_id uuid not null references public.embalagens (id) on delete cascade,
  codigo       text,                       -- número do lote (opcional)
  validade     date,                       -- data de validade (opcional)
  quantidade   integer not null default 0 check (quantidade >= 0),
  created_at   timestamptz not null default now()
);

create index if not exists idx_lotes_embalagem on public.lotes (embalagem_id);
create index if not exists idx_lotes_validade  on public.lotes (validade);

-- Mescla lotes iguais (mesma embalagem + mesmo código + mesma validade).
-- coalesce trata NULL para o índice único funcionar.
create unique index if not exists uq_lotes_chave
  on public.lotes (
    embalagem_id,
    coalesce(codigo, ''),
    coalesce(validade, '9999-12-31'::date)
  );

-- Movimentação aponta para o lote afetado (nulo = histórico legado).
alter table public.movimentacoes
  add column if not exists lote_id uuid references public.lotes (id) on delete set null;

-- ---------------------------------------------------------------------
--  RLS para lotes (mesma regra das demais tabelas)
-- ---------------------------------------------------------------------
alter table public.lotes enable row level security;

drop policy if exists "auth full access lotes" on public.lotes;
create policy "auth full access lotes"
  on public.lotes for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
--  Trigger: agora atualiza o saldo da EMBALAGEM e do LOTE
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
    if new.lote_id is not null then
      update public.lotes
         set quantidade = quantidade + new.quantidade
       where id = new.lote_id;
    end if;
  elsif new.tipo = 'saida' then
    update public.embalagens
       set quantidade = quantidade - new.quantidade
     where id = new.embalagem_id;
    if new.lote_id is not null then
      update public.lotes
         set quantidade = quantidade - new.quantidade
       where id = new.lote_id;
    end if;
  end if;
  return new;
end;
$$;

-- O trigger em si já foi criado na 001; o "create or replace function" acima
-- basta. Garantimos que ele existe:
drop trigger if exists trg_aplicar_movimentacao on public.movimentacoes;
create trigger trg_aplicar_movimentacao
  after insert on public.movimentacoes
  for each row execute function public.aplicar_movimentacao();

-- ---------------------------------------------------------------------
--  Backfill: estoque atual de cada embalagem vira um "ESTOQUE INICIAL"
--  (só para embalagens com saldo e que ainda não têm lote)
-- ---------------------------------------------------------------------
insert into public.lotes (embalagem_id, codigo, validade, quantidade)
select e.id, 'ESTOQUE INICIAL', null, e.quantidade
from public.embalagens e
where e.quantidade > 0
  and not exists (select 1 from public.lotes l where l.embalagem_id = e.id);

-- ---------------------------------------------------------------------
--  RPC: registrar ENTRADA (cria/acha o lote e lança a movimentação)
-- ---------------------------------------------------------------------
create or replace function public.registrar_entrada(
  p_embalagem_id uuid,
  p_quantidade   integer,
  p_codigo       text default null,
  p_validade     date default null,
  p_motivo       text default null,
  p_documento    text default null,
  p_observacao   text default null
)
returns void
language plpgsql
as $$
declare
  v_lote_id uuid;
  v_codigo  text := nullif(btrim(coalesce(p_codigo, '')), '');
begin
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'Quantidade deve ser maior que zero';
  end if;

  -- procura lote existente com mesma chave
  select id into v_lote_id
  from public.lotes
  where embalagem_id = p_embalagem_id
    and coalesce(codigo, '') = coalesce(v_codigo, '')
    and coalesce(validade, '9999-12-31'::date) = coalesce(p_validade, '9999-12-31'::date);

  if v_lote_id is null then
    insert into public.lotes (embalagem_id, codigo, validade, quantidade)
    values (p_embalagem_id, v_codigo, p_validade, 0)
    returning id into v_lote_id;
  end if;

  insert into public.movimentacoes
    (embalagem_id, lote_id, tipo, quantidade, motivo, documento, observacao, usuario_id)
  values
    (p_embalagem_id, v_lote_id, 'entrada', p_quantidade, p_motivo, p_documento, p_observacao, auth.uid());
end;
$$;

-- ---------------------------------------------------------------------
--  RPC: registrar SAÍDA por FEFO (consome o lote que vence primeiro)
-- ---------------------------------------------------------------------
create or replace function public.registrar_saida_fefo(
  p_embalagem_id uuid,
  p_quantidade   integer,
  p_motivo       text default null,
  p_documento    text default null,
  p_observacao   text default null
)
returns void
language plpgsql
as $$
declare
  v_restante    integer := p_quantidade;
  v_disponivel  integer;
  v_consumir    integer;
  r             record;
begin
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'Quantidade deve ser maior que zero';
  end if;

  select coalesce(sum(quantidade), 0) into v_disponivel
  from public.lotes
  where embalagem_id = p_embalagem_id;

  -- Sem lotes cadastrados: baixa direto da embalagem (compatibilidade)
  if v_disponivel = 0 then
    insert into public.movimentacoes
      (embalagem_id, lote_id, tipo, quantidade, motivo, documento, observacao, usuario_id)
    values
      (p_embalagem_id, null, 'saida', p_quantidade, p_motivo, p_documento, p_observacao, auth.uid());
    return;
  end if;

  if v_disponivel < p_quantidade then
    raise exception 'Estoque insuficiente: disponível %, solicitado %', v_disponivel, p_quantidade;
  end if;

  -- Consome do que vence primeiro (validade asc, nulos por último)
  for r in
    select id, quantidade
    from public.lotes
    where embalagem_id = p_embalagem_id and quantidade > 0
    order by validade asc nulls last, created_at asc
    for update
  loop
    exit when v_restante <= 0;
    v_consumir := least(r.quantidade, v_restante);

    insert into public.movimentacoes
      (embalagem_id, lote_id, tipo, quantidade, motivo, documento, observacao, usuario_id)
    values
      (p_embalagem_id, r.id, 'saida', v_consumir, p_motivo, p_documento, p_observacao, auth.uid());

    v_restante := v_restante - v_consumir;
  end loop;
end;
$$;

grant execute on function public.registrar_entrada(uuid, integer, text, date, text, text, text) to authenticated;
grant execute on function public.registrar_saida_fefo(uuid, integer, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
--  View de lotes (com situação de validade)
-- ---------------------------------------------------------------------
create or replace view public.vw_lotes
with (security_invoker = true) as
  select
    l.id            as lote_id,
    l.embalagem_id,
    p.nome          as produto,
    e.descricao     as embalagem,
    p.categoria,
    l.codigo,
    l.validade,
    l.quantidade,
    (l.validade is not null and l.validade < current_date)                            as vencido,
    (l.validade is not null and l.validade >= current_date
       and l.validade <= current_date + 90)                                           as vence_90,
    case when l.validade is not null then (l.validade - current_date) end             as dias_para_vencer
  from public.lotes l
  join public.embalagens e on e.id = l.embalagem_id
  join public.produtos  p on p.id = e.produto_id
  where l.quantidade > 0
  order by l.validade asc nulls last, p.nome;

-- ---------------------------------------------------------------------
--  View de estoque (recriada com info de validade agregada)
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
    (e.quantidade <= e.estoque_minimo)    as abaixo_minimo,
    lv.proxima_validade,
    coalesce(lv.tem_vencido, false)       as tem_vencido,
    coalesce(lv.vence_90, false)          as vence_90
  from public.embalagens e
  join public.produtos p on p.id = e.produto_id
  left join lateral (
    select
      min(l.validade)                                                  as proxima_validade,
      bool_or(l.validade < current_date)                              as tem_vencido,
      bool_or(l.validade >= current_date and l.validade <= current_date + 90) as vence_90
    from public.lotes l
    where l.embalagem_id = e.id and l.quantidade > 0 and l.validade is not null
  ) lv on true
  order by p.nome, e.capacidade;
