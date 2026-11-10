import { useState } from "react";
import { toast } from "sonner";
import type { Pedido } from "@/types";
import { proximoStatus, STATUS_PEDIDO } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { DispatchDialog } from "./DispatchDialog";

/**
 * Ações de avançar/cancelar pedido com os diálogos necessários
 * (motivo do cancelamento, escolha do entregador). Renderize `dialogs` na página.
 */
export function useOrderActions() {
  const mudar = useAppStore((s) => s.mudarStatusPedido);
  const [cancelando, setCancelando] = useState<Pedido | null>(null);
  const [despachando, setDespachando] = useState<Pedido | null>(null);

  const avancar = (p: Pedido) => {
    const prox = proximoStatus(p);
    if (!prox) return;
    if (prox === "em_entrega") {
      setDespachando(p);
      return;
    }
    mudar(p.id, prox);
    toast.success(`Pedido #${p.numero}: ${STATUS_PEDIDO[prox].label.toLowerCase()}`);
  };

  const dialogs = (
    <>
      <CancelOrderDialog
        pedido={cancelando}
        onClose={() => setCancelando(null)}
        onConfirm={(motivo) => {
          if (!cancelando) return;
          mudar(cancelando.id, "cancelado", { motivo });
          toast(`Pedido #${cancelando.numero} ${cancelando.status === "pendente" ? "recusado" : "cancelado"}`, {
            description: motivo,
          });
        }}
      />
      <DispatchDialog
        pedido={despachando}
        onClose={() => setDespachando(null)}
        onConfirm={(entregador) => {
          if (!despachando) return;
          mudar(despachando.id, "em_entrega", { responsavel_entrega: entregador });
          toast.success(`Pedido #${despachando.numero} saiu para entrega`, {
            description: entregador ? `Com ${entregador}` : undefined,
          });
        }}
      />
    </>
  );

  return { avancar, cancelar: setCancelando, dialogs };
}
