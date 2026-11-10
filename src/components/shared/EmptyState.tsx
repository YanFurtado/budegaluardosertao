import type { ReactNode } from "react";
import { SearchX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  className?: string;
  message?: string;
  icon?: LucideIcon;
  /** Botão/ação opcional abaixo da mensagem. */
  action?: ReactNode;
}

export function EmptyState({ className, message = "Nada encontrado", icon: Icon = SearchX, action }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-muted",
        className,
      )}
    >
      <Icon className="size-6 text-gray-300" aria-hidden />
      <span>{message}</span>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
