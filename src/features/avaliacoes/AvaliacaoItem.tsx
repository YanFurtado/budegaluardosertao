import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquareReply, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Avaliacao } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { iniciais } from "@/lib/loja";
import { useAppStore } from "@/store/useAppStore";
import { Estrelas } from "./Estrelas";

const relativo = (d: Date) => formatDistanceToNow(d, { addSuffix: true, locale: ptBR });

function modelos(nome: string, nota: number) {
  const primeiro = nome.split(" ")[0];
  return nota >= 4
    ? [
        { label: "Agradecer", texto: `Muito obrigado, ${primeiro}! Ficamos felizes que tenha gostado. Volte sempre!` },
        { label: "Convidar de novo", texto: `Que bom ter você com a gente, ${primeiro}! Esperamos seu próximo pedido.` },
      ]
    : [
        {
          label: "Pedir desculpas",
          texto: `Oi, ${primeiro}. Sentimos muito pela experiência. Já conversamos com a equipe para melhorar. Conte com a gente!`,
        },
        {
          label: "Chamar no WhatsApp",
          texto: `Oi, ${primeiro}. Pedimos desculpas pelo ocorrido. Vamos te chamar no WhatsApp para resolver, tudo bem?`,
        },
      ];
}

export function AvaliacaoItem({ avaliacao: a, numeroPedido }: { avaliacao: Avaliacao; numeroPedido: number | null }) {
  const responder = useAppStore((s) => s.responderAvaliacao);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const baixa = a.nota <= 2;
  const mostrarEditor = !a.resposta || editando;

  const publicar = () => {
    if (!texto.trim()) return;
    responder(a.id, texto);
    toast.success(editando ? "Resposta atualizada" : "Resposta publicada");
    setEditando(false);
    setTexto("");
  };

  return (
    <li className={cn("flex gap-3 p-4 sm:p-5", baixa && "border-l-4 border-l-negative bg-negative-soft/30")}>
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[12px] font-bold text-ink-muted"
        aria-hidden
      >
        {iniciais(a.cliente_nome)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold">{a.cliente_nome}</span>
          <Estrelas nota={a.nota} />
          <span className="text-[12px] text-ink-muted" title={format(a.criado_em, "dd/MM/yyyy HH:mm")}>
            {relativo(a.criado_em)}
          </span>
          {numeroPedido !== null && <span className="text-[12px] text-ink-muted">Pedido #{numeroPedido}</span>}
        </div>

        <p className={cn("mt-1.5", !a.comentario && "italic text-ink-muted")}>{a.comentario ?? "Sem comentário"}</p>

        {/* Resposta existente */}
        {a.resposta && !editando && (
          <div className="mt-3 rounded-md border-l-2 border-primary bg-gray-50 p-3">
            <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-ink-muted">
              <MessageSquareReply className="size-3.5" />
              <span className="font-semibold text-ink">Resposta da loja</span>
              {a.respondido_em && <span>· {relativo(a.respondido_em)}</span>}
            </p>
            <p className="mt-1">{a.resposta}</p>
            <div className="mt-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTexto(a.resposta ?? "");
                  setEditando(true);
                }}
              >
                <Pencil /> Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-negative hover:bg-negative-soft" onClick={() => setConfirmarRemocao(true)}>
                <Trash2 /> Remover
              </Button>
            </div>
          </div>
        )}

        {/* Editor */}
        {mostrarEditor && (
          <div className="mt-3 flex flex-col gap-2">
            <Textarea
              rows={2}
              value={texto}
              maxLength={500}
              placeholder="Escreva uma resposta pública para o cliente…"
              aria-label={`Responder ${a.cliente_nome}`}
              onChange={(e) => setTexto(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              {modelos(a.cliente_nome, a.nota).map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setTexto(m.texto)}
                  className="rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-muted hover:border-gray-300 hover:text-ink"
                >
                  {m.label}
                </button>
              ))}
              <span className="flex-1" />
              {editando && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditando(false);
                    setTexto("");
                  }}
                >
                  Cancelar
                </Button>
              )}
              <Button size="sm" disabled={!texto.trim()} onClick={publicar}>
                {editando ? "Salvar resposta" : "Responder"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmarRemocao}
        onOpenChange={setConfirmarRemocao}
        title="Remover a resposta?"
        description="A avaliação volta a aparecer como sem resposta."
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          responder(a.id, "");
          toast.success("Resposta removida");
        }}
      />
    </li>
  );
}
