"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MovimentacaoResult = { ok: true } | { ok: false; error: string };

export async function registrarMovimentacao(
  _prev: MovimentacaoResult | null,
  formData: FormData,
): Promise<MovimentacaoResult> {
  const embalagem_id = String(formData.get("embalagem_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  if (!embalagem_id || (tipo !== "entrada" && tipo !== "saida")) {
    return { ok: false, error: "Dados inválidos." };
  }
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return {
      ok: false,
      error: "Quantidade deve ser um inteiro maior que zero.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("movimentacoes").insert({
    embalagem_id,
    tipo,
    quantidade,
    observacao,
    usuario_id: user?.id ?? null,
  });

  if (error) {
    // O CHECK (quantidade >= 0) no banco impede estoque negativo.
    const msg = error.message.includes("quantidade_check")
      ? "Estoque insuficiente para esta saída."
      : error.message;
    return { ok: false, error: msg };
  }

  revalidatePath("/");
  return { ok: true };
}
