import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { gerarPedidoSimulado } from "@/lib/simulador";
import { formatCurrency } from "@/lib/format";
import { playNewOrderSound } from "@/lib/sound";

/** Modo demonstração: de tempos em tempos chega um pedido novo (Configurações → Simular pedidos). */
export function useSimuladorPedidos() {
  const ativo = useAppStore((s) => s.config.simular_pedidos && !s.loja.pausada && !!s.usuarioLogadoId);
  const navigate = useNavigate();

  useEffect(() => {
    if (!ativo) return;
    let timer: number;

    const receber = () => {
      const s = useAppStore.getState();
      const input = gerarPedidoSimulado(s);
      if (!input) return;
      const p = s.criarPedido(input);
      const descricao = `${p.cliente_nome} · ${formatCurrency(p.total)}`;
      s.notificar({ tipo: "pedido", titulo: `Novo pedido #${p.numero}`, descricao, link: "/gestao-pedidos" });

      if (useUiStore.getState().somAtivo && s.config.som_novo_pedido) playNewOrderSound();
      toast(`Novo pedido #${p.numero}`, {
        description: descricao,
        action: { label: "Ver", onClick: () => navigate("/gestao-pedidos") },
      });
      if (s.config.notificacoes_navegador && "Notification" in window && Notification.permission === "granted" && document.hidden) {
        new Notification(`Novo pedido #${p.numero}`, { body: descricao });
      }
    };

    const agendar = (primeira: boolean) => {
      const ms = primeira ? 25_000 + Math.random() * 20_000 : 70_000 + Math.random() * 80_000;
      timer = window.setTimeout(() => {
        receber();
        agendar(false);
      }, ms);
    };

    agendar(true);
    return () => window.clearTimeout(timer);
  }, [ativo, navigate]);
}
