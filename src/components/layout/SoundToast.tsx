import { VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enableSound } from "@/lib/sound";
import { useUiStore } from "@/store/useUiStore";
import { useAppStore } from "@/store/useAppStore";

export function SoundToast() {
  const somAtivo = useUiStore((s) => s.somAtivo);
  const setSomAtivo = useUiStore((s) => s.setSomAtivo);
  const somConfigurado = useAppStore((s) => s.config.som_novo_pedido);
  if (somAtivo || !somConfigurado) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-32px)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-card border border-line bg-white py-2.5 pl-4 pr-2.5 shadow-lg lg:left-[calc(50%+120px)] print:hidden"
    >
      <span className="inline-flex items-center gap-2 font-semibold">
        <VolumeX className="size-4 text-negative" /> O som não está ativo
      </span>
      <Button
        variant="outline"
        size="sm"
        className="border-chart-primary font-bold tracking-wide text-primary hover:bg-chart-primary/10"
        onClick={async () => setSomAtivo(await enableSound())}
      >
        ATIVAR SOM
      </Button>
    </div>
  );
}
