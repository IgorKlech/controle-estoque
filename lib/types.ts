/** Linha da view vw_estoque (produto + embalagem). */
export type EstoqueItem = {
  embalagem_id: string;
  produto_id: string;
  produto: string;
  embalagem: string;
  tipo: string | null;
  capacidade: number | null;
  quantidade: number;
  estoque_minimo: number;
  categoria: string | null;
  ativo: boolean;
  abaixo_minimo: boolean;
  proxima_validade: string | null;
  tem_vencido: boolean;
  vence_90: boolean;
};

/** Linha da view vw_movimentacoes (histórico / Kardex). */
export type MovimentacaoItem = {
  id: string;
  created_at: string;
  produto: string;
  embalagem: string;
  embalagem_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo: string | null;
  documento: string | null;
  observacao: string | null;
  usuario_id: string | null;
};

/** Linha da view vw_lotes (lote com situação de validade). */
export type LoteItem = {
  lote_id: string;
  embalagem_id: string;
  produto: string;
  embalagem: string;
  categoria: string | null;
  codigo: string | null;
  validade: string | null;
  quantidade: number;
  vencido: boolean;
  vence_90: boolean;
  dias_para_vencer: number | null;
};

export type TipoMovimentacao = "entrada" | "saida";

/** Motivos pré-definidos por tipo de movimentação. */
export const MOTIVOS_ENTRADA = [
  "Compra",
  "Devolução de cliente",
  "Ajuste de inventário",
  "Transferência",
] as const;

export const MOTIVOS_SAIDA = [
  "Venda",
  "Uso interno",
  "Perda / avaria",
  "Devolução a fornecedor",
  "Ajuste de inventário",
  "Transferência",
] as const;
