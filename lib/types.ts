/** Linha da view vw_estoque (produto + embalagem). */
export type EstoqueItem = {
  embalagem_id: string;
  produto_id: string;
  produto: string;
  embalagem: string;
  tipo: string | null;
  capacidade: number | null;
  quantidade: number;
};

export type TipoMovimentacao = "entrada" | "saida";
