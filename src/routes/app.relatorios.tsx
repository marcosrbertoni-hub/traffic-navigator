import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppOverview } from "@/components/shared/PageScaffolds";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/services/auth";

type Summary = { campaign_id:string; name:string; sessions_total:number; sessions_queued:number; sessions_running:number; sessions_succeeded:number; sessions_failed:number; pages_visited:number; avg_duration_sec:number };

export const Route=createFileRoute("/app/relatorios")({component:Reports});

function Reports(){
  const [rows,setRows]=useState<Summary[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let mounted=true;
    void (async()=>{
      const session=await getSession();
      if(!session){setLoading(false);return;}
      const {data,error}=await supabase.from("campaign_execution_summary").select("*").eq("user_id",session.user.id).order("name");
      if(mounted && !error) setRows((data??[]) as Summary[]);
      if(mounted) setLoading(false);
    })();
    return()=>{mounted=false;};
  },[]);

  if(loading) return <AppOverview title="Relatórios" description="Carregando métricas das execuções…"/>;
  return <div className="space-y-6"><AppOverview title="Relatórios" description="Acompanhamento das sessões e jornadas executadas."/>
    <div className="grid gap-4 md:grid-cols-4">
      <Metric title="Sessões" value={rows.reduce((n,r)=>n+r.sessions_total,0)}/>
      <Metric title="Concluídas" value={rows.reduce((n,r)=>n+r.sessions_succeeded,0)}/>
      <Metric title="Falhas" value={rows.reduce((n,r)=>n+r.sessions_failed,0)}/>
      <Metric title="Páginas visitadas" value={rows.reduce((n,r)=>n+r.pages_visited,0)}/>
    </div>
    <div className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Por campanha</h2><div className="mt-4 divide-y">{rows.map(r=><div key={r.campaign_id} className="flex items-center justify-between gap-4 py-3"><span>{r.name}</span><span className="text-sm text-muted-foreground">{r.sessions_succeeded}/{r.sessions_total} concluídas · {r.pages_visited} páginas</span></div>)}{!rows.length&&<p className="py-6 text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>}</div></div>
  </div>;
}

function Metric({title,value}:{title:string;value:number}){return <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-semibold">{value.toLocaleString("pt-BR")}</p></div>;}
