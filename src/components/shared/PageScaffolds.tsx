import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Globe2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatCard, DemoBanner } from "@/components/shared/kit";

export function PublicPage({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div><div className="mx-auto max-w-6xl px-4 py-14"><PageHeader title={title} description={description} />{children}</div></div>;
}

export function AppOverview({ title="Dashboard", description="Visão geral da sua operação de testes e automação." }: { title?: string; description?: string }) {
  return <div className="space-y-6"><DemoBanner /><PageHeader title={title} description={description} actions={<Button asChild><Link to="/app/campanhas/nova">Nova campanha <ArrowRight /></Link></Button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Campanhas ativas" value="0" hint="Backend ainda não conectado" icon={BarChart3}/><StatCard label="Sites" value="0" hint="Cadastre seu primeiro domínio" icon={Globe2}/><StatCard label="Créditos" value="500" hint="Saldo demonstrativo" icon={Settings2}/><StatCard label="Tarefas" value="0" hint="Nenhuma execução real" /></div><Panel title="Próximos passos"><div className="grid gap-3 md:grid-cols-3"><Link to="/app/sites" className="rounded-xl border p-4 hover:bg-muted/40"><b>1. Cadastre um site</b><p className="mt-1 text-sm text-muted-foreground">Prepare o domínio para validação.</p></Link><Link to="/app/campanhas/nova" className="rounded-xl border p-4 hover:bg-muted/40"><b>2. Monte uma campanha</b><p className="mt-1 text-sm text-muted-foreground">Defina a jornada e o agendamento.</p></Link><Link to="/app/relatorios" className="rounded-xl border p-4 hover:bg-muted/40"><b>3. Acompanhe resultados</b><p className="mt-1 text-sm text-muted-foreground">Veja métricas quando o backend estiver conectado.</p></Link></div></Panel></div>;
}
