import { Activity, BarChart3, Boxes, Coins, CreditCard, FileText, Globe, HelpCircle, LayoutDashboard, ListChecks, Megaphone, Package, Server, Settings, Users, Wallet } from "lucide-react";
import type { NavItem } from "@/components/layout/AppShell";

export const PUBLIC_NAV = [
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/recursos", label: "Recursos" },
  { to: "/planos", label: "Planos" },
  { to: "/faq", label: "FAQ" },
  { to: "/contato", label: "Contato" },
] as const;

export const APP_NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/app/sites", label: "Sites", icon: Globe },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/app/creditos", label: "Créditos", icon: Coins },
  { to: "/app/planos", label: "Planos", icon: Package },
  { to: "/app/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
  { to: "/app/ajuda", label: "Ajuda", icon: HelpCircle },
];

export const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/sites", label: "Sites", icon: Globe },
  { to: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/admin/planos", label: "Planos", icon: Package },
  { to: "/admin/creditos", label: "Créditos", icon: Coins },
  { to: "/admin/pagamentos", label: "Pagamentos", icon: Wallet },
  { to: "/admin/tarefas", label: "Tarefas", icon: ListChecks },
  { to: "/admin/logs", label: "Logs", icon: FileText },
  { to: "/admin/workers", label: "Workers", icon: Server },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export const ADMIN_ICONS = { Activity, Boxes };
