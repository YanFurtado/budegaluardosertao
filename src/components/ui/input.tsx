import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn("input w-full", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn("input h-auto w-full resize-y py-2", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

/** Campo em R$ (aceita vírgula). `value` em número; null quando vazio. */
export function CurrencyInput({
  value,
  onChange,
  className,
  placeholder = "0,00",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [texto, setTexto] = React.useState(value === null ? "" : String(value).replace(".", ","));
  React.useEffect(() => {
    const atual = texto === "" ? null : Number(texto.replace(/\./g, "").replace(",", "."));
    if (atual !== value) setTexto(value === null ? "" : String(value).replace(".", ","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">R$</span>
      <input
        inputMode="decimal"
        className="input w-full pl-9 tabular-nums"
        placeholder={placeholder}
        value={texto}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d,.]/g, "");
          setTexto(t);
          const n = t === "" ? null : Number(t.replace(/\./g, "").replace(",", "."));
          onChange(n === null || Number.isNaN(n) ? null : n);
        }}
        {...props}
      />
    </div>
  );
}

/** Rótulo + controle + dica/erro. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-negative">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
