import { useEffect, useState } from "react";
import type { Pedido, StatusPedido, TipoPedido } from "@/types";
import type { Tom } from "@/lib/pedidos";
import { contem } from "@/components/shared/SearchInput";

export const TOM_TIPO: Record<TipoPedido, Tom> = { delivery: "blue", retirada: "purple", no_local: "teal" };

/** Cor sólida do ponto de cada status (cabeçalho das colunas). */
export const COR_STATUS: Record<StatusPedido, string> = {
  pendente: "bg-accent",
  em_preparo: "bg-chart-primary",
  pronto: "bg-[#8E5BD9]",
  em_entrega: "bg-[#2BA89E]",
  concluido: "bg-positive",
  cancelado: "bg-negative",
};

export const minutosDesde = (d: Date, agora: Date) => Math.max(0, Math.floor((agora.getTime() - d.getTime()) / 60000));

export function formatDuracao(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** Relógio que atualiza a cada `ms` (para tempos decorridos). */
export function useAgora(ms = 30_000) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return agora;
}

export function useMediaQuery(query: string) {
  const [ok, setOk] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setOk(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return ok;
}

/** Busca por número (#1234), telefone (4+ dígitos) ou nome do cliente. */
export function buscaPedido(p: Pedido, busca: string) {
  const b = busca.trim();
  if (!b) return true;
  const semHash = b.replace(/^#/, "");
  if (/^\d+$/.test(semHash) && String(p.numero).includes(semHash)) return true;
  const digitos = b.replace(/\D/g, "");
  if (digitos.length >= 4 && p.cliente_telefone?.replace(/\D/g, "").includes(digitos)) return true;
  return contem(p.cliente_nome, b);
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
