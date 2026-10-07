import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, DataTable, StatusBadge } from "@/components/shared/kit";
import { useSites } from "@/services/campaigns";

export const Route=createFileRoute("/app/sites")({component:Sites});

function Sites(){
  const rows=useSites();
  const location = useLocation();

  if (location.pathname !== "/app/sites") {
    return <Outlet />;
  }

  return <div>
    <PageHeader title="Meus sites" description="Domínios autorizados para seus testes." actions={<Button asChild><Link to="/app/sites/novo">Adicionar site</Link></Button>}/>
    <Panel>{rows.length === 0 ? <EmptyState title="Nenhum site cadastrado" description="Cadastre seu primeiro domínio para começar os testes." action={<Button asChild><Link to="/app/sites/novo">Adicionar site</Link></Button>} /> : <DataTable rows={rows} rowKey={(r)=>r.id} columns={[
      {key:"name",header:"Site",cell:(r)=><Link className="font-semibold hover:underline" to="/app/sites/$id" params={{id:r.id}}>{r.name}</Link>},
      {key:"domain",header:"Domínio",cell:(r)=>r.domain},
      {key:"status",header:"Status",cell:(r)=><StatusBadge status={r.status}/>},
      {key:"analysis",header:"Análise",cell:(r)=><span>{r.analysis?"Disponível":"Pendente"}</span>},
      {key:"actions",header:"Ações",cell:(r)=><Button size="sm" variant="outline" asChild><Link to="/app/sites/$id" params={{id:r.id}}>Abrir</Link></Button>},
    ]}/>}</Panel>
  </div>
}
