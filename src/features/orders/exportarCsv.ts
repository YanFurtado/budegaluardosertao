import { format } from "date-fns";
import type { Pedido } from "@/types";
import { labelTipoPedido } from "@/data/catalogo";
import { STATUS_PEDIDO } from "@/lib/pedidos";

const num = (n: number) => n.toFixed(2).replace(".", ",");
const cel = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Baixa os pedidos em CSV (separador ";", UTF-8 com BOM — abre direto no Excel em pt-BR). */
export function exportarPedidosCsv(pedidos: Pedido[], nomeArquivo: string) {
  const cabecalho = [
    "Número", "Data", "Hora", "Status", "Tipo", "Cliente", "Telefone", "Bairro", "Pagamento",
    "Produtos", "Entrega", "Serviço", "Adicionais", "Maquineta", "Desconto", "Total", "Cupom",
    "Canal", "Origem", "Entregador", "Motivo do cancelamento",
  ];
  const linhas = pedidos.map((p) =>
    [
      p.numero,
      format(p.criado_em, "dd/MM/yyyy"),
      format(p.criado_em, "HH:mm"),
      STATUS_PEDIDO[p.status].label,
      labelTipoPedido(p.tipo_pedido),
      p.cliente_nome,
      p.cliente_telefone,
      p.bairro,
      p.forma_pagamento,
      num(p.total_produtos),
      num(p.taxa_entrega),
      num(p.taxa_servico),
      num(p.taxas_adicionais),
      num(p.taxa_maquineta),
      num(p.desconto),
      num(p.total),
      p.cupom_codigo,
      p.canal_venda,
      p.origem,
      p.responsavel_entrega,
      p.motivo_cancelamento,
    ]
      .map(cel)
      .join(";"),
  );
  const conteudo = "﻿" + [cabecalho.join(";"), ...linhas].join("\r\n");
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
