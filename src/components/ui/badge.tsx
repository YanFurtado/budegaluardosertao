import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Tom } from "@/lib/pedidos";

const TONS: Record<Tom, string> = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-[#E6F1FB] text-[#21639C]",
  green: "bg-positive-soft text-[#1F7A45]",
  red: "bg-negative-soft text-[#B3302C]",
  orange: "bg-[#FFF1E0] text-[#A85B12]",
  purple: "bg-[#F1EAFB] text-[#6B3FB0]",
  teal: "bg-[#E0F4F2] text-[#1C7A72]",
};

export function Badge({ tom = "gray", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tom?: Tom }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold leading-4",
        TONS[tom],
        className,
      )}
      {...props}
    />
  );
}
