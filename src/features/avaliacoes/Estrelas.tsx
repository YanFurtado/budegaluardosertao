import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Nota em estrelas (suporta meia estrela para médias). */
export function Estrelas({ nota, tamanho = "size-4", className }: { nota: number; tamanho?: string; className?: string }) {
  const arred = Math.round(nota * 2) / 2;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${nota.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5 estrelas`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const cheia = arred >= i;
        const meia = !cheia && arred >= i - 0.5;
        return (
          <span key={i} className={cn("relative inline-block", tamanho)} aria-hidden>
            <Star className={cn("absolute inset-0 text-gray-300", tamanho)} fill="currentColor" strokeWidth={0} />
            {(cheia || meia) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: meia ? "50%" : "100%" }}>
                <Star className={cn("text-[#F29A3F]", tamanho)} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
