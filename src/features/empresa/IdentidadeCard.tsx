import { useRef, useState } from "react";
import { Check, ImageUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/shared/CardHeader";
import { iniciais } from "@/lib/loja";
import { cn } from "@/lib/utils";
import { comprimirImagem } from "@/lib/imagem";

const CORES = ["#FAAD63", "#6CB2EB", "#2BA89E", "#8E5BD9", "#EF5753", "#1F2937"];

interface IdentidadeCardProps {
  nome: string;
  cor: string;
  logo: string | null;
  onCor: (cor: string) => void;
  onLogo: (logo: string | null) => void;
}

export function IdentidadeCard({ nome, cor, logo, onCor, onLogo }: IdentidadeCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  const escolherArquivo = async (arquivo: File | undefined) => {
    setErro(null);
    if (!arquivo) return;
    try {
      // Reduzida para 256 px: o logo aparece no máximo com 80 px na tela.
      onLogo(await comprimirImagem(arquivo, 256, 0.9));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler a imagem.");
    }
  };

  return (
    <section className="card p-4 sm:p-5">
      <CardHeader title="Identidade visual" subtitle="O logo aparece no menu lateral, no login e na página da loja." />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo */}
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Logo da loja" className="size-20 shrink-0 rounded-full border border-line object-cover" />
          ) : (
            <span
              className="flex size-20 shrink-0 items-center justify-center rounded-full text-[22px] font-bold text-ink"
              style={{ background: `${cor}33` }}
              aria-label="Sem logo: mostrando as iniciais"
            >
              {iniciais(nome || "Loja")}
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-2">
            <p className="font-semibold">Logo</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <ImageUp /> {logo ? "Trocar" : "Enviar logo"}
              </Button>
              {logo && (
                <Button variant="ghost" size="sm" className="text-negative hover:bg-negative-soft" onClick={() => onLogo(null)}>
                  <Trash2 /> Remover
                </Button>
              )}
            </div>
            <p className={cn("text-[12px]", erro ? "text-negative" : "text-ink-muted")}>
              {erro ?? "Imagem quadrada. Ela é reduzida automaticamente."}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void escolherArquivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Cor */}
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Cor da marca</p>
          <div className="flex flex-wrap items-center gap-2">
            {CORES.map((c) => {
              const ativa = c.toLowerCase() === cor.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onCor(c)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full ring-offset-2 transition",
                    ativa ? "ring-2 ring-ink" : "hover:ring-2 hover:ring-line",
                  )}
                  style={{ background: c }}
                  aria-label={`Usar a cor ${c}`}
                  aria-pressed={ativa}
                >
                  {ativa && <Check className="size-4 text-white drop-shadow" strokeWidth={3} />}
                </button>
              );
            })}
            <label className="flex items-center gap-2 rounded-md border border-line px-2 py-1 text-[12px] text-ink-muted">
              <input
                type="color"
                value={cor}
                onChange={(e) => onCor(e.target.value.toUpperCase())}
                className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Escolher outra cor"
              />
              <span className="font-mono uppercase">{cor}</span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
