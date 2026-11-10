import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bike } from "lucide-react";
import type { Pedido } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const SEM = "__sem__";

/** Escolhe o entregador ao enviar um pedido de delivery. */
export function DispatchDialog({
  pedido,
  onClose,
  onConfirm,
}: {
  pedido: Pedido | null;
  onClose: () => void;
  onConfirm: (entregador: string | null) => void;
}) {
  const todos = useAppStore((s) => s.entregadores);
  const entregadores = useMemo(() => todos.filter((e) => e.ativo), [todos]);
  const [escolha, setEscolha] = useState<string>(SEM);

  useEffect(() => {
    if (pedido) setEscolha(pedido.responsavel_entrega ?? entregadores[0]?.nome ?? SEM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);

  return (
    <Dialog open={!!pedido} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Enviar pedido #{pedido?.numero}</DialogTitle>
          <DialogDescription>
            {pedido?.bairro ? `Entrega em ${pedido.bairro}. ` : ""}Quem vai levar?
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <fieldset className="flex flex-col gap-1">
            <legend className="sr-only">Entregador</legend>
            {[...entregadores.map((e) => ({ valor: e.nome, tipo: e.tipo })), { valor: SEM, tipo: null }].map((op) => (
              <label
                key={op.valor}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors",
                  escolha === op.valor ? "border-chart-primary bg-chart-primary/5" : "border-line hover:bg-gray-50",
                )}
              >
                <input
                  type="radio"
                  name="entregador"
                  className="size-4 accent-[#2F7DBF]"
                  checked={escolha === op.valor}
                  onChange={() => setEscolha(op.valor)}
                />
                <span className="flex-1">{op.valor === SEM ? "Definir depois" : op.valor}</span>
                {op.tipo && <Badge tom={op.tipo === "proprio" ? "blue" : "gray"}>{op.tipo === "proprio" ? "Próprio" : "Parceiro"}</Badge>}
              </label>
            ))}
          </fieldset>
          {entregadores.length === 0 && (
            <p className="mt-3 text-[12px] text-ink-muted">
              Nenhum entregador ativo.{" "}
              <Link to="/delivery" className="font-semibold text-primary hover:underline" onClick={onClose}>
                Cadastrar em Delivery
              </Link>
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button
            onClick={() => {
              onConfirm(escolha === SEM ? null : escolha);
              onClose();
            }}
          >
            <Bike /> Saiu para entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
