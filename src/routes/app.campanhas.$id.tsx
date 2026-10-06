import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatusBadge } from "@/components/shared/kit";
import { getCampaign, campaignRepo } from "@/services/campaigns";
import { enqueueCampaign } from "@/services/execution";

export const Route=createFileRoute("/app/campanhas/$id")({component:CampaignDetail});

function CampaignDetail(){
  const {id}=Route.useParams();
  const campaign=getCampaign(id);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  if(!campaign) return <div><PageHeader title="Campanha não encontrada" description="O registro não está disponível." actions={<Button variant="outline" asChild><Link to="/app/campanhas">Voltar</Link></Button>}/></div>;

  const start=async()=>{
    setLoading(true); setMessage("");
    try {
      await campaignRepo.setStatus(id,"active");
      const jobId=await enqueueCampaign(id);
      setMessage(`Campanha ativada e colocada na fila. Job: ${jobId.slice(0,8)}…`);
    } catch(err) {
      setMessage(err instanceof Error ? err.message : "Não foi possível iniciar a campanha.");
    } finally { setLoading(false); }
  };

  return <div>
    <PageHeader title={campaign.name} description={campaign.start_url} actions={<Button variant="outline" asChild><Link to="/app/campanhas">Voltar</Link></Button>}/>
    <div className="grid gap-4 md:grid-cols-3">
      <Panel title="Estado"><StatusBadge status={campaign.status}/><p className="mt-3 text-sm text-muted-foreground">{campaign.consumed_sessions.toLocaleString("pt-BR")} sessões consumidas.</p></Panel>
      <Panel title="Planejamento"><p className="text-sm">{campaign.settings.total_sessions.toLocaleString("pt-BR")} sessões</p><p className="mt-1 text-sm text-muted-foreground">{campaign.settings.pages_per_session} páginas por sessão</p></Panel>
      <Panel title="Janela"><p className="text-sm">{campaign.schedule.start_time} — {campaign.schedule.end_time}</p><p className="mt-1 text-sm text-muted-foreground">{campaign.schedule.weekdays.length} dia(s) configurado(s)</p></Panel>
    </div>
    <Panel title="Configuração" className="mt-4">
      <dl className="grid gap-4 md:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Site</dt><dd className="font-medium">{campaign.site_id}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Distribuição</dt><dd className="font-medium">{campaign.volume.distribution}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Duração</dt><dd className="font-medium">{campaign.settings.min_duration_sec}s — {campaign.settings.max_duration_sec}s</dd></div>
        <div><dt className="text-xs text-muted-foreground">Localização</dt><dd className="font-medium">{campaign.location.city || "Todas"} / {campaign.location.region || "Todas"} / {campaign.location.country}</dd></div>
      </dl>
    </Panel>
    {campaign.status !== "active" && <div className="mt-4"><Button onClick={()=>void start()} disabled={loading}>{loading?"Entrando na fila…":"Ativar e colocar na fila"}</Button></div>}
    {message && <p role="status" className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm">{message}</p>}
  </div>;
}
