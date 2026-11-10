import {
  Bike,
  BookOpen,
  Briefcase,
  ChartLine,
  ClipboardList,
  History,
  NotebookPen,
  Settings,
  Star,
  Store,
  TicketPercent,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Permissao } from "@/types";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Título exibido na topbar (padrão: label). */
  pageTitle?: string;
  /** Permissão necessária para ver o item e abrir a página. */
  permissao?: Permissao;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Gestão de pedidos", path: "/gestao-pedidos", icon: ClipboardList, permissao: "pedidos" },
  { label: "Caixa", path: "/caixa", icon: Wallet, permissao: "caixa" },
  { label: "Desempenho", path: "/analise-vendas", icon: ChartLine, pageTitle: "Análise das vendas", permissao: "desempenho" },
  { label: "Histórico de pedidos", path: "/historico-pedidos", icon: History, permissao: "pedidos" },
  { label: "Minha empresa", path: "/minha-empresa", icon: Store, permissao: "configuracoes" },
  { label: "Catálogo", path: "/catalogo", icon: BookOpen, permissao: "catalogo" },
  { label: "Delivery", path: "/delivery", icon: Bike, permissao: "configuracoes" },
  { label: "Cupons e descontos", path: "/cupons-descontos", icon: TicketPercent, permissao: "marketing" },
  { label: "Clientes", path: "/clientes", icon: Users, permissao: "clientes" },
  { label: "Avaliações", path: "/avaliacoes", icon: Star, permissao: "clientes" },
  { label: "Fiado", path: "/fiado", icon: NotebookPen, permissao: "fiado" },
  { label: "Administrativo", path: "/administrativo", icon: Briefcase, permissao: "equipe" },
  { label: "Configurações", path: "/configuracoes", icon: Settings, permissao: "configuracoes" },
];

export function navItemFor(pathname: string) {
  return NAV_ITEMS.find((i) => pathname.startsWith(i.path));
}

export function pageTitleFor(pathname: string): string {
  const item = navItemFor(pathname);
  if (item) return item.pageTitle ?? item.label;
  if (pathname.startsWith("/meus-links")) return "Meus links";
  return "Painel";
}
