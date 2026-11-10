import { toast } from "sonner";
import type { Loja, Pedido } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { labelTipoPedido } from "@/data/catalogo";
import { escapeHtml } from "./utils";

/** Abre uma janela só com a comanda (layout de bobina 80 mm) e chama a impressão. */
export function imprimirComanda(p: Pedido, loja: Loja, atendente: string, vias = 1) {
  const e = escapeHtml;
  const linha = (rotulo: string, valor: string, forte = false) =>
    `<div class="row${forte ? " strong" : ""}"><span>${e(rotulo)}</span><span>${e(valor)}</span></div>`;

  const itens = p.itens
    .map(
      (i) =>
        `<div class="item"><div class="row"><span>${i.quantidade}x ${e(i.nome)}</span><span>${e(
          formatCurrency(i.quantidade * i.preco_unitario),
        )}</span></div>${i.observacao ? `<div class="obs">↳ ${e(i.observacao)}</div>` : ""}</div>`,
    )
    .join("");

  const valores = [
    linha("Produtos", formatCurrency(p.total_produtos)),
    p.taxa_entrega ? linha("Entrega", formatCurrency(p.taxa_entrega)) : "",
    p.taxa_servico ? linha("Serviço", formatCurrency(p.taxa_servico)) : "",
    p.taxas_adicionais ? linha("Adicionais", formatCurrency(p.taxas_adicionais)) : "",
    p.taxa_maquineta ? linha("Maquineta", formatCurrency(p.taxa_maquineta)) : "",
    p.desconto ? linha(`Desconto${p.cupom_codigo ? ` (${p.cupom_codigo})` : ""}`, `-${formatCurrency(p.desconto)}`) : "",
    linha("TOTAL", formatCurrency(p.total), true),
  ].join("");

  const via = `
    <section class="via">
      <h1>${e(loja.nome)}</h1>
      <p class="center">${e(loja.telefone)}</p>
      <hr />
      <h2>PEDIDO #${p.numero}</h2>
      <p class="center">${e(labelTipoPedido(p.tipo_pedido).toUpperCase())} · ${e(formatDateTime(p.criado_em))}</p>
      ${p.agendado_para ? `<p class="center strong">AGENDADO: ${e(formatDateTime(p.agendado_para))}</p>` : ""}
      <hr />
      <p><b>Cliente:</b> ${e(p.cliente_nome)}</p>
      ${p.cliente_telefone ? `<p><b>Tel.:</b> ${e(p.cliente_telefone)}</p>` : ""}
      ${p.endereco ? `<p><b>Endereço:</b> ${e(p.endereco)}${p.bairro ? ` – ${e(p.bairro)}` : ""}</p>` : ""}
      <hr />
      ${itens}
      <hr />
      ${valores}
      <hr />
      <p><b>Pagamento:</b> ${e(p.forma_pagamento)}</p>
      ${
        p.troco_para
          ? `<p><b>Troco para:</b> ${e(formatCurrency(p.troco_para))} (levar ${e(formatCurrency(p.troco_para - p.total))})</p>`
          : ""
      }
      ${p.observacao ? `<p class="obs-box"><b>Obs.:</b> ${e(p.observacao)}</p>` : ""}
      <hr />
      <p class="center small">Atendente: ${e(atendente)}</p>
    </section>`;

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comanda #${p.numero}</title>
    <style>
      @page { size: 80mm auto; margin: 4mm; }
      * { box-sizing: border-box; }
      body { font-family: "Courier New", monospace; font-size: 12px; color: #000; width: 72mm; margin: 0 auto; }
      h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
      h2 { font-size: 16px; text-align: center; margin: 4px 0; }
      p { margin: 2px 0; }
      hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
      .center { text-align: center; } .small { font-size: 10px; } .strong { font-weight: bold; }
      .row { display: flex; justify-content: space-between; gap: 8px; }
      .row.strong { font-size: 14px; }
      .item { margin-bottom: 3px; } .obs { padding-left: 10px; font-size: 11px; }
      .obs-box { border: 1px solid #000; padding: 4px; margin-top: 4px; }
      .via + .via { page-break-before: always; }
    </style></head><body>${Array.from({ length: Math.max(1, vias) }, () => via).join("")}</body></html>`;

  const janela = window.open("", "_blank", "width=380,height=640");
  if (!janela) {
    toast.error("Não foi possível abrir a impressão", { description: "Permita pop-ups para este site." });
    return;
  }
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  janela.focus();
  setTimeout(() => {
    janela.print();
  }, 250);
}
