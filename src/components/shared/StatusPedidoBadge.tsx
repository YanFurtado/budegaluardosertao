import type { StatusPedido } from "@/types";
import { Badge } from "@/components/ui/badge";
import { STATUS_PEDIDO } from "@/lib/pedidos";

export function StatusPedidoBadge({ status }: { status: StatusPedido }) {
  const s = STATUS_PEDIDO[status];
  return <Badge tom={s.tom}>{s.label}</Badge>;
}
