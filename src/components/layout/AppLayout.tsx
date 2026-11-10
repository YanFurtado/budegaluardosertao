import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { navItemFor, pageTitleFor } from "@/navigation";
import { useAppStore, useUsuarioLogado } from "@/store/useAppStore";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SoundToast } from "./SoundToast";
import { useSimuladorPedidos } from "./useSimuladorPedidos";

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const usuario = useUsuarioLogado();
  const nomeLoja = useAppStore((s) => s.loja.nome);
  const title = pageTitleFor(location.pathname);
  const item = navItemFor(location.pathname);
  const semPermissao = !!item?.permissao && !usuario?.permissoes.includes(item.permissao);

  useSimuladorPedidos();

  useEffect(() => {
    document.title = `${title} · ${nomeLoja}`;
  }, [title, nomeLoja]);

  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  return (
    <div className="min-h-full">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-h-full flex-col lg:pl-60 print:pl-0">
        <Topbar title={title} onOpenMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          {semPermissao ? (
            <div className="card mx-auto flex max-w-md flex-col items-center gap-2 px-6 py-14 text-center">
              <ShieldAlert className="size-8 text-negative" />
              <h2 className="text-[16px] font-semibold">Sem permissão</h2>
              <p className="text-ink-muted">Seu usuário não tem acesso a esta área. Fale com o administrador da loja.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <SoundToast />
    </div>
  );
}
