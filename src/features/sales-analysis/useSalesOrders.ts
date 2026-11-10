import { useEffect, useState } from "react";
import { fetchSalesOrders, type SalesOrdersResult, type SalesQuery } from "@/services/salesAnalysis";
import { useAppStore } from "@/store/useAppStore";

/** Busca os pedidos do período atual e do período de comparação. */
export function useSalesOrders(query: SalesQuery) {
  const [data, setData] = useState<SalesOrdersResult | null>(null);
  const [loading, setLoading] = useState(true);
  // Refaz a busca quando chega/muda um pedido.
  const pedidos = useAppStore((s) => s.pedidos);

  // Chave estável: só refaz a busca quando o conteúdo da consulta muda.
  const key = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSalesOrders(query).then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pedidos]);

  return { data, loading };
}
