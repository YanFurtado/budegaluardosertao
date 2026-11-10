import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Linha de configuração: texto à esquerda, controle à direita. */
export function SettingRow({
  titulo,
  descricao,
  children,
  htmlFor,
  className,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0", className)}>
      <div className="min-w-0 flex-1 basis-60">
        <label htmlFor={htmlFor} className="block font-semibold">
          {titulo}
        </label>
        {descricao && <p className="text-[12px] text-ink-muted">{descricao}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Campo numérico que salva ao sair do campo (ou Enter), dentro de um intervalo. */
export function NumeroSetting({
  valor,
  min,
  max,
  sufixo,
  onSalvar,
  rotulo,
}: {
  valor: number;
  min: number;
  max: number;
  sufixo?: string;
  onSalvar: (v: number) => void;
  rotulo: string;
}) {
  const id = useId();
  const [texto, setTexto] = useState(String(valor));
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => setTexto(String(valor)), [valor]);

  const confirmar = () => {
    const n = Number(texto);
    if (!texto.trim() || !Number.isInteger(n) || n < min || n > max) {
      setErro(`Use um número entre ${min} e ${max}.`);
      setTexto(String(valor));
      return;
    }
    setErro(null);
    if (n !== valor) onSalvar(n);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          className="input w-20 text-right tabular-nums"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
          aria-label={rotulo}
        />
        {sufixo && <span className="text-ink-muted">{sufixo}</span>}
      </div>
      {erro && <p className="text-[12px] text-negative">{erro}</p>}
    </div>
  );
}
