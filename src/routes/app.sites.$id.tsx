import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DemoBanner, EmptyState, PageHeader, Panel, StatCard, StatusBadge, DataTable } from "@/components/shared/kit";
import { getSite } from "@/services/campaigns";
import { analyzeSiteDemo, type SiteAnalysisResult } from "@/services/site-analysis";

export const Route = createFileRoute("/app/sites/$id")({ component: SiteDetails });

function SiteDetails() {
  const { id } = Route.useParams();
  const site = getSite(id);
  const [result, setResult] = useState<SiteAnalysisResult | null>(null);

  const currentAnalysis = result?.analysis ?? site?.analysis ?? null;
  const urls = result?.urls ?? [];

  const stats = useMemo(() => currentAnalysis ? [
    { label: "URLs encontradas", value: currentAnalysis.url_count ?? 0 },
    { label: "Acessíveis", value: currentAnalysis.accessible_urls ?? 0 },
    { label: "Redirecionamentos", value: currentAnalysis.redirects ?? 0 },
    { label: "Erros", value: currentAnalysis.errors ?? 0 },
  ] : [], [currentAnalysis]);

  if (!site) return <EmptyState title="Site não encontrado" description="O domínio solicitado não existe no ambiente atual." action={<Button asChild><Link to="/app/sites">Voltar para sites</Link></Button>} />;

  const runAnalysis = () => setResult(analyzeSiteDemo(id));

  return <div>
    <DemoBanner>A análise exibida nesta etapa é demonstrativa. O crawler real ficará no backend e só analisará domínios autorizados.</DemoBanner>
    <PageHeader
      title={site.name}
      description={site.domain}
      actions={<div className="flex gap-2"><Button variant="outline" asChild><Link to="/app/sites">Voltar</Link></Button><Button onClick={runAnalysis}>Analisar domínio</Button></div>}
    />

    <div className="grid gap-4 md:grid-cols-4">{stats.length ? stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.value} />) : <Panel className="md:col-span-4"><p className="text-sm text-muted-foreground">Ainda não há análise. Execute a análise demonstrativa para visualizar o fluxo.</p></Panel>}</div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
      <Panel>
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">URLs descobertas</h2><p className="text-sm text-muted-foreground">Estas URLs poderão ser selecionadas na criação de campanhas.</p></div>{urls.length > 0 && <Button size="sm" asChild><Link to="/app/campanhas/nova">Usar em campanha</Link></Button>}</div>
        {urls.length ? <DataTable rows={urls} rowKey={(r) => r.id} columns={[
          { key: "url", header: "URL", cell: (r) => <span className="break-all">{r.url}</span> },
          { key: "title", header: "Título", cell: (r) => r.title },
          { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status === "accessible" ? "verified" : r.status === "redirect" ? "warn" : "failed"} /> },
          { key: "internal_links", header: "Links internos", cell: (r) => r.internal_links },
        ]} /> : <EmptyState title="Nenhuma URL carregada" description="Execute a análise para descobrir as páginas do domínio." />}
      </Panel>

      <Panel>
        <h2 className="font-semibold">Diagnóstico</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4"><span>Sitemap</span><b>{currentAnalysis?.sitemap_found ? "Encontrado" : "Não analisado"}</b></div>
          <div className="flex justify-between gap-4"><span>Robots.txt</span><b>{currentAnalysis ? "Disponível para análise" : "Aguardando"}</b></div>
          <div className="flex justify-between gap-4"><span>Links internos</span><b>{currentAnalysis?.internal_links ?? "—"}</b></div>
          <div className="flex justify-between gap-4"><span>Status do domínio</span><StatusBadge status={site.status} /></div>
        </div>
        {result?.notes && <div className="mt-6 space-y-2 text-xs text-muted-foreground">{result.notes.map((note) => <p key={note}>{note}</p>)}</div>}
      </Panel>
    </div>
  </div>;
}
