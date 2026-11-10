import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardHeader } from "@/components/shared/CardHeader";
import { cn } from "@/lib/utils";

/** Contraste WCAG entre a cor e o branco (leitura do QR fica ruim abaixo de ~3:1). */
function contrasteComBranco(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (L + 0.05);
}

export interface OpcaoQr {
  id: string;
  label: string;
  url: string;
}

function Segmentado<T extends string | boolean>({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string;
  valor: T;
  opcoes: { v: T; label: string; cor?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold">{rotulo}</p>
      <div className="inline-flex flex-wrap rounded-md border border-line p-0.5" role="radiogroup" aria-label={rotulo}>
        {opcoes.map((o) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={valor === o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "inline-flex items-center gap-2 rounded px-3 py-1.5 text-[13px] font-semibold transition-colors",
              valor === o.v ? "bg-chart-primary/15 text-primary" : "text-ink-muted hover:text-ink",
            )}
          >
            {o.cor && <span className="size-3 rounded-full border border-black/10" style={{ background: o.cor }} />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** QR Code de um dos links da loja (site, WhatsApp ou Instagram), para imprimir. */
export function QrCodeCard({ opcoes, corMarca, nomeArquivo }: { opcoes: OpcaoQr[]; corMarca: string; nomeArquivo: string }) {
  const [destinoId, setDestinoId] = useState(opcoes[0]?.id ?? "");
  const [usarCorMarca, setUsarCorMarca] = useState(false);
  const [imagem, setImagem] = useState<string | null>(null);
  const destino = opcoes.find((o) => o.id === destinoId) ?? opcoes[0];
  const url = destino?.url ?? "";
  const cor = usarCorMarca ? corMarca : "#111827";
  const poucoContraste = usarCorMarca && contrasteComBranco(corMarca) < 3;

  useEffect(() => {
    if (!url) return;
    let ativo = true;
    QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M", color: { dark: cor, light: "#FFFFFF" } })
      .then((d) => ativo && setImagem(d))
      .catch(() => ativo && setImagem(null));
    return () => {
      ativo = false;
    };
  }, [url, cor]);

  return (
    <section className="card min-w-0 p-4 sm:p-5">
      <CardHeader title="QR Code" subtitle="Imprima e coloque no balcão, nas mesas e nas embalagens." />
      {!destino ? (
        <p className="rounded-md border border-dashed border-line px-3 py-6 text-center text-ink-muted">
          Cadastre o WhatsApp, o Instagram ou o site da loja em Minha empresa para gerar o QR Code.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="size-48 shrink-0 rounded-md border border-line bg-white p-2">
            {imagem ? <img src={imagem} alt={`QR Code para ${url}`} className="size-full" /> : <Skeleton className="size-full" />}
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3">
            {opcoes.length > 1 && (
              <Segmentado
                rotulo="Abre"
                valor={destino.id}
                opcoes={opcoes.map((o) => ({ v: o.id, label: o.label }))}
                onChange={setDestinoId}
              />
            )}
            <Segmentado
              rotulo="Cor"
              valor={usarCorMarca}
              opcoes={[
                { v: false, label: "Preto", cor: "#111827" },
                { v: true, label: "Cor da marca", cor: corMarca },
              ]}
              onChange={setUsarCorMarca}
            />
            {poucoContraste && (
              <p className="flex items-start gap-1.5 text-[12px] text-[#A85B12]">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Essa cor é clara e alguns celulares podem ter dificuldade para ler o código. Prefira o preto para impressão.
              </p>
            )}
            <p className="break-all text-[12px] text-ink-muted">{url}</p>
            <div>
              <Button
                disabled={!imagem}
                onClick={() => {
                  if (!imagem) return;
                  const a = document.createElement("a");
                  a.href = imagem;
                  a.download = `qrcode-${nomeArquivo}-${destino.id}.png`;
                  a.click();
                }}
              >
                <Download /> Baixar PNG
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
