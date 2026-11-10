import { useEffect, useState } from "react";
import type { Pedido } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOTIVOS_CANCELAMENTO } from "@/lib/pedidos";
import { cn } from "@/lib/utils";

const OUTRO = "__outro__";

export function CancelOrderDialog({
  pedido,
  onClose,
  onConfirm,
}: {
  pedido: Pedido | null;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState(MOTIVOS_CANCELAMENTO[0]);
  const [outro, setOutro] = useState("");

  useEffect(() => {
    if (pedido) {
      setMotivo(MOTIVOS_CANCELAMENTO[0]);
      setOutro("");
    }
  }, [pedido]);

  const recusar = pedido?.status === "pendente";
  const texto = motivo === OUTRO ? outro.trim() : motivo;

  return (
    <Dialog open={!!pedido} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {recusar ? "Recusar" : "Cancelar"} pedido #{pedido?.numero}
          </DialogTitle>
          <DialogDescription>O motivo fica registrado no histórico do pedido.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1.5 text-[12px] font-semibold">Motivo</legend>
            {[...MOTIVOS_CANCELAMENTO, OUTRO].map((m) => (
              <label
                key={m}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors",
                  motivo === m ? "border-chart-primary bg-chart-primary/5" : "border-line hover:bg-gray-50",
                )}
              >
                <input
                  type="radio"
                  name="motivo-cancelamento"
                  className="size-4 accent-[#2F7DBF]"
                  checked={motivo === m}
                  onChange={() => setMotivo(m)}
                />
                {m === OUTRO ? "Outro motivo" : m}
              </label>
            ))}
          </fieldset>
          {motivo === OUTRO && (
            <Textarea
              className="mt-2"
              placeholder="Descreva o motivo"
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
              autoFocus
              aria-label="Outro motivo"
            />
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button
            className="bg-negative hover:bg-[#d9443f]"
            disabled={!texto}
            onClick={() => {
              onConfirm(texto);
              onClose();
            }}
          >
            {recusar ? "Recusar pedido" : "Cancelar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
