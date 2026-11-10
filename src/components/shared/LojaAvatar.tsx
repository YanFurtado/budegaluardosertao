import type { Loja } from "@/types";
import { iniciais } from "@/lib/loja";
import { cn } from "@/lib/utils";

/** Logo da empresa (ou as iniciais na cor da marca, quando não há logo). */
export function LojaAvatar({ loja, className }: { loja: Pick<Loja, "nome" | "logo_url" | "cor_marca">; className?: string }) {
  if (loja.logo_url) {
    return <img src={loja.logo_url} alt="" className={cn("size-10 shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-ink", className)}
      style={{ background: `${loja.cor_marca}40` }}
      aria-hidden
    >
      {iniciais(loja.nome)}
    </span>
  );
}
