import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Bell, Check, Link2, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusLoja } from "@/lib/loja";
import { LojaAvatar } from "@/components/shared/LojaAvatar";
import { NAV_ITEMS } from "@/navigation";
import { useAppStore, useUsuarioLogado } from "@/store/useAppStore";

const NOTIF_KEY = "painel:aviso-notificacoes-dispensado";

function readDismissed() {
  try {
    return localStorage.getItem(NOTIF_KEY) === "1";
  } catch {
    return false;
  }
}

/** Reavalia a cada minuto para o selo aberto/fechado acompanhar o relógio. */
function useAgora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const loja = useAppStore((s) => s.loja);
  const pendentes = useAppStore((s) => s.pedidos.filter((p) => p.status === "pendente").length);
  const usuario = useUsuarioLogado();
  const agora = useAgora();
  const status = statusLoja(loja, agora);
  const [notifDismissed, setNotifDismissed] = useState(readDismissed);

  const dismissNotif = () => {
    setNotifDismissed(true);
    try {
      localStorage.setItem(NOTIF_KEY, "1");
    } catch {
      /* armazenamento indisponível */
    }
  };

  const askNotificationPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        useAppStore.getState().atualizarConfig({ notificacoes_navegador: true });
        dismissNotif();
      }
    }
  };

  const itens = NAV_ITEMS.filter((i) => !i.permissao || usuario?.permissoes.includes(i.permissao));

  return (
    <>
      {/* Fundo escuro do drawer (mobile) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden print:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-white transition-transform duration-200 print:hidden",
          open ? "translate-x-0 shadow-xl" : "-translate-x-full",
          "lg:translate-x-0 lg:shadow-none",
        )}
        aria-label="Menu principal"
      >
        {/* Identidade da empresa */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
          <NavLink to="/gestao-pedidos" className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
            <LojaAvatar loja={loja} className="size-9" />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-extrabold leading-tight tracking-tight" title={loja.nome}>
                {loja.nome}
              </span>
              <span className="block truncate text-[11px] text-ink-muted">
                {loja.bairro}, {loja.cidade} - {loja.uf}
              </span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-gray-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Status e avisos */}
          <div className="px-4 pb-3 pt-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                status.aberta ? "bg-positive-soft text-[#1F8A4C]" : "bg-negative-soft text-[#C53A36]",
              )}
            >
              {status.aberta ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : loja.pausada ? (
                <Pause className="size-3.5" strokeWidth={3} />
              ) : (
                <X className="size-3.5" strokeWidth={3} />
              )}
              {status.texto}
            </span>

            {!notifDismissed && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-accent/40 bg-accent/10 p-2.5 text-[12px]">
                <Bell className="mt-0.5 size-3.5 shrink-0 text-[#B86A1F]" />
                <button type="button" onClick={askNotificationPermission} className="flex-1 text-left font-semibold hover:underline">
                  Ativar notificações de pedidos
                </button>
                <button
                  type="button"
                  onClick={dismissNotif}
                  className="-m-1 rounded p-1 text-ink-muted hover:bg-accent/20 hover:text-ink"
                  aria-label="Dispensar aviso"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Menu */}
          <nav className="flex flex-col gap-0.5 px-2 pb-4">
            {itens.map((item) => {
              const Icon = item.icon;
              const contador = item.path === "/gestao-pedidos" ? pendentes : 0;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      isActive ? "bg-chart-primary/10 font-semibold text-primary" : "text-ink hover:bg-gray-100",
                    )
                  }
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {contador > 0 && (
                    <span
                      className="min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-ink"
                      aria-label={`${contador} pedidos em análise`}
                    >
                      {contador}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Rodapé */}
        <NavLink
          to="/meus-links"
          onClick={onClose}
          className="flex h-12 shrink-0 items-center gap-2 border-t border-line px-5 font-semibold text-primary hover:bg-gray-50"
        >
          <Link2 className="size-4" /> Ver meus links
        </NavLink>
      </aside>
    </>
  );
}
