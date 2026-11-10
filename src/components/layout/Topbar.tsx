import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardPlus,
  LayoutGrid,
  Link2,
  LogOut,
  Menu,
  Printer,
  Settings,
  Star,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { iniciais } from "@/lib/loja";
import { labelCargo } from "@/lib/permissoes";
import { useAppStore, useUsuarioLogado } from "@/store/useAppStore";
import type { Notificacao } from "@/types";

const iconBtn =
  "flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40";

const ICONE_NOTIFICACAO: Record<Notificacao["tipo"], LucideIcon> = {
  pedido: ClipboardPlus,
  avaliacao: Star,
  caixa: Wallet,
  sistema: Bell,
};

export function Topbar({ title, onOpenMenu }: { title: string; onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const usuario = useUsuarioLogado();
  const notificacoes = useAppStore((s) => s.notificacoes);
  const marcarLidas = useAppStore((s) => s.marcarNotificacoesLidas);
  const sair = useAppStore((s) => s.sair);
  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const pode = (p: string) => !!usuario?.permissoes.includes(p as never);

  const atalhos: { label: string; icon: LucideIcon; to: string; ok: boolean }[] = [
    { label: "Novo pedido", icon: ClipboardPlus, to: "/gestao-pedidos?novo=1", ok: pode("pedidos") },
    { label: "Caixa", icon: Wallet, to: "/caixa", ok: pode("caixa") },
    { label: "Catálogo", icon: BookOpen, to: "/catalogo", ok: pode("catalogo") },
    { label: "Meus links", icon: Link2, to: "/meus-links", ok: true },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white px-4 sm:px-6 print:hidden">
      <button type="button" className={cn(iconBtn, "-ml-2 lg:hidden")} onClick={onOpenMenu} aria-label="Abrir menu">
        <Menu className="size-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-[17px] font-medium sm:text-[20px]">{title}</h1>

      <div className="flex items-center gap-1">
        {/* Atalhos */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn(iconBtn, "hidden sm:flex")} aria-label="Atalhos" title="Atalhos">
              <LayoutGrid className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Atalhos</DropdownMenuLabel>
            {atalhos
              .filter((a) => a.ok)
              .map((a) => (
                <DropdownMenuItem key={a.to} onSelect={() => navigate(a.to)}>
                  <a.icon /> {a.label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          className={cn(iconBtn, "text-positive hover:text-positive")}
          aria-label="Imprimir"
          title="Imprimir"
          onClick={() => window.print()}
        >
          <Printer className="size-5" />
        </button>

        {/* Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(iconBtn, "relative")}
              aria-label={naoLidas ? `Notificações (${naoLidas} não lidas)` : "Notificações"}
              title="Notificações"
            >
              <Bell className="size-5" />
              {naoLidas > 0 && (
                <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white">
                  {naoLidas > 9 ? "9+" : naoLidas}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="font-semibold">Notificações</span>
              {naoLidas > 0 && (
                <button type="button" onClick={marcarLidas} className="text-[12px] font-semibold text-primary hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto p-1">
              {notificacoes.length === 0 ? (
                <p className="px-3 py-6 text-center text-ink-muted">Nenhuma notificação</p>
              ) : (
                notificacoes.slice(0, 15).map((n) => {
                  const Icon = ICONE_NOTIFICACAO[n.tipo];
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className="items-start gap-3"
                      onSelect={() => {
                        marcarLidas();
                        if (n.link) navigate(n.link);
                      }}
                    >
                      <Icon className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate", !n.lida && "font-bold")}>{n.titulo}</span>
                        <span className="block truncate text-[12px] text-ink-muted">{n.descricao}</span>
                        <span className="block text-[11px] text-ink-muted">
                          {formatDistanceToNow(n.em, { addSuffix: true, locale: ptBR })}
                        </span>
                      </span>
                      {!n.lida && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Não lida" />}
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-1.5 rounded-full p-1 pr-2 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40"
              aria-label="Menu do usuário"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-chart-primary text-[12px] font-bold text-white">
                {usuario ? iniciais(usuario.nome) : "?"}
              </span>
              <ChevronDown className="size-4 text-ink-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {usuario && (
              <div className="px-3 py-2">
                <p className="font-semibold">{usuario.nome}</p>
                <p className="text-[12px] text-ink-muted">
                  {labelCargo(usuario.cargo)} · {usuario.email}
                </p>
              </div>
            )}
            <DropdownMenuSeparator />
            {pode("equipe") && (
              <DropdownMenuItem onSelect={() => navigate("/administrativo")}>
                <UserRound /> Equipe e permissões
              </DropdownMenuItem>
            )}
            {pode("configuracoes") && (
              <DropdownMenuItem onSelect={() => navigate("/configuracoes")}>
                <Settings /> Configurações
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-negative"
              onSelect={() => {
                // Sai primeiro da área protegida (senão ela mandaria para o login) e volta para a loja.
                navigate("/", { replace: true });
                sair();
              }}
            >
              <LogOut /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
