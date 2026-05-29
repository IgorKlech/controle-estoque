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
