import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, DemoBanner, DataTable, StatusBadge } from "@/components/shared/kit";
import { useSites } from "@/services/campaigns";

export const Route=createFileRoute("/app/sites")({component:Sites});

function Sites(){
  const rows=useSites();
  return <div>
    <DemoBanner>Os domínios abaixo são apenas dados de demonstração. A análise real será executada no backend após a conexão do crawler.</DemoBanner>
    <PageHeader title="Meus sites" description="Domínios autorizados para seus testes." actions={<Button asChild><Link to="/app/sites/novo">Adicionar site</Link></Button>}/>
    <Panel><DataTable rows={rows} rowKey={(r)=>r.id} columns={[
      {key:"name",header:"Site",cell:(r)=><Link className="font-semibold hover:underline" to="/app/sites/$id" params={{id:r.id}}>{r.name}</Link>},
      {key:"domain",header:"Domínio",cell:(r)=>r.domain},
      {key:"status",header:"Status",cell:(r)=><StatusBadge status={r.status}/>},
      {key:"analysis",header:"Análise",cell:(r)=><span>{r.analysis?"Disponível":"Pendente"}</span>},
      {key:"actions",header:"Ações",cell:(r)=><Button size="sm" variant="outline" asChild><Link to="/app/sites/$id" params={{id:r.id}}>Abrir</Link></Button>},
    ]}/></Panel>
  </div>
}
