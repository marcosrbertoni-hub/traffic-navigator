import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Globe2, Coins, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatCard } from "@/components/shared/kit";
import { useCampaigns, useSites } from "@/services/campaigns";
import { getSession } from "@/services/auth";
import { supabase } from "@/lib/supabase";

export function PublicPage({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div><div className="mx-auto max-w-6xl px-4 py-14"><PageHeader title={title} description={description} />{children}</div></div>;
}
export function AppOverview({ title="Dashboard", description="Visão geral da sua operação de testes e automação." }: { title?: string; description?: string }) {
  const campaigns = useCampaigns(); const sites = useSites();
  const [credits,setCredits]=useState<number|null>(null); const [completed,setCompleted]=useState<number|null>(null);
  useEffect(()=>{void(async()=>{const session=await getSession();if(!session)return;
    const [b,r]=await Promise.all([supabase.from("credit_balances").select("balance").eq("user_id",session.user.id).maybeSingle(),supabase.from("campaign_execution_summary").select("completed_sessions").eq("user_id",session.user.id)]);
    if(!b.error)setCredits(b.data?.balance??0); if(!r.error)setCompleted((r.data??[]).reduce((sum,row)=>sum+(Number(row.completed_sessions)||0),0));
  })()},[]);
  const active=campaigns.filter(c=>c.status==="active").length; const queued=campaigns.filter(c=>c.status==="active"||c.status==="paused").length;
  return <div className="space-y-6"><PageHeader title={title} description={description} actions={<Button asChild><Link to="/app/campanhas/nova">Nova campanha <ArrowRight /></Link></Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Campanhas ativas" value={active.toLocaleString("pt-BR")} hint="Campanhas em execução" icon={BarChart3}/>
      <StatCard label="Sites" value={sites.length.toLocaleString("pt-BR")} hint="Domínios cadastrados" icon={Globe2}/>
      <StatCard label="Créditos" value={credits===null?"…":credits.toLocaleString("pt-BR")} hint="Saldo disponível" icon={Coins}/>
      <StatCard label="Sessões concluídas" value={completed===null?"…":completed.toLocaleString("pt-BR")} hint={queued ? String(queued)+" campanha(s) em operação" : "Nenhuma campanha em operação"} icon={PlayCircle}/>
    </div>
    <Panel title="Acesso rápido"><div className="grid gap-3 md:grid-cols-3">
      <Link to="/app/sites" className="rounded-xl border p-4 transition hover:bg-muted/40"><b>Sites</b><p className="mt-1 text-sm text-muted-foreground">Cadastre e analise seus domínios.</p></Link>
      <Link to="/app/campanhas" className="rounded-xl border p-4 transition hover:bg-muted/40"><b>Campanhas</b><p className="mt-1 text-sm text-muted-foreground">Configure jornadas, volume e horários.</p></Link>
      <Link to="/app/relatorios" className="rounded-xl border p-4 transition hover:bg-muted/40"><b>Relatórios</b><p className="mt-1 text-sm text-muted-foreground">Acompanhe sessões, páginas e falhas.</p></Link>
    </div></Panel></div>;
}