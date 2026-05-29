"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Registra uma entrada ou saída de estoque. */
export async function registrarMovimentacao(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const embalagem_id = String(formData.get("embalagem_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const motivo = String(formData.get("motivo") ?? "").trim() || null;
  const documento = String(formData.get("documento") ?? "").trim() || null;
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
    motivo,
    documento,
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
  revalidatePath("/historico");
  return { ok: true };
}

/** Atualiza o estoque mínimo de uma embalagem (alerta de reposição). */
export async function atualizarEstoqueMinimo(
  embalagem_id: string,
  estoque_minimo: number,
): Promise<ActionResult> {
  if (!embalagem_id) return { ok: false, error: "Embalagem inválida." };
  if (!Number.isInteger(estoque_minimo) || estoque_minimo < 0) {
    return { ok: false, error: "Mínimo deve ser um inteiro ≥ 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("embalagens")
    .update({ estoque_minimo })
    .eq("id", embalagem_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}

/** Cria um produto novo com uma ou mais embalagens. */
export async function criarProduto(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim() || null;
  // Embalagens chegam como linhas "descricao|minimo" separadas por \n
  const embalagensRaw = String(formData.get("embalagens") ?? "").trim();

  if (!nome) return { ok: false, error: "Informe o nome do produto." };

  const embalagens = embalagensRaw
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => {
      const [descricao, min] = linha.split("|");
      return {
        descricao: (descricao ?? "").trim(),
        estoque_minimo: Math.max(0, Math.trunc(Number(min ?? 0)) || 0),
      };
    })
    .filter((e) => e.descricao);

  if (embalagens.length === 0) {
    return { ok: false, error: "Adicione ao menos uma embalagem." };
  }

  const supabase = await createClient();

  const { data: produto, error: errProd } = await supabase
    .from("produtos")
    .insert({ nome, categoria })
    .select("id")
    .single();

  if (errProd) {
    const msg = errProd.message.includes("duplicate")
      ? "Já existe um produto com esse nome."
      : errProd.message;
    return { ok: false, error: msg };
  }

  const { error: errEmb } = await supabase.from("embalagens").insert(
    embalagens.map((e) => ({
      produto_id: produto.id,
      descricao: e.descricao,
      estoque_minimo: e.estoque_minimo,
    })),
  );

  if (errEmb) {
    // Desfaz o produto para não deixar órfão sem embalagens.
    await supabase.from("produtos").delete().eq("id", produto.id);
    return { ok: false, error: errEmb.message };
  }

  revalidatePath("/");
  return { ok: true };
}

/** Adiciona uma embalagem a um produto já existente. */
export async function adicionarEmbalagem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const produto_id = String(formData.get("produto_id") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const estoque_minimo = Math.max(
    0,
    Math.trunc(Number(formData.get("estoque_minimo") ?? 0)) || 0,
  );

  if (!produto_id) return { ok: false, error: "Produto inválido." };
  if (!descricao) return { ok: false, error: "Informe a descrição da embalagem." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("embalagens")
    .insert({ produto_id, descricao, estoque_minimo });

  if (error) {
    const msg = error.message.includes("duplicate")
      ? "Esse produto já tem uma embalagem com essa descrição."
      : error.message;
    return { ok: false, error: msg };
  }

  revalidatePath("/");
  return { ok: true };
}
