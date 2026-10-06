import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DemoBanner, EmptyState, PageHeader, Panel, StatCard, StatusBadge } from "@/components/shared/kit";
import { getSite } from "@/services/campaigns";
import { analyzeSiteDemo, type SiteAnalysisResult } from "@/services/site-analysis";
import { setCampaignPrefill } from "@/services/campaign-prefill";

export const Route = createFileRoute("/app/sites/$id")({ component: SiteDetails });

function SiteDetails() {
  const { id } = Route.useParams();
  const site = getSite(id);
  const [result, setResult] = useState<SiteAnalysisResult | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  if (!site) return <EmptyState title="Site não encontrado" description="O domínio solicitado não existe no ambiente atual." action={<Button asChild><Link to="/app/sites">Voltar para sites</Link></Button>} />;

  const current = result ?? (site.analysis ? analyzeSiteDemo(id) : null);
  const urls = current?.urls ?? [];
  const allSelected = urls.length > 0 && selected.length === urls.length;

  const runAnalysis = () => {
    const next = analyzeSiteDemo(id);
    setResult(next);
    setSelected(next?.urls.map((url) => url.id) ?? []);
  };

  const toggleUrl = (urlId: string) => setSelected((items) => items.includes(urlId) ? items.filter((item) => item !== urlId) : [...items, urlId]);
  const useSelected = () => {
    if (!current) return;
    const pages = current.urls.filter((url) => selected.includes(url.id)).map((url, index) => ({ id: `page-${index + 1}`, url: url.url, weight: 1 }));
    setCampaignPrefill(site.id, pages);
  };

  const stats = current ? [
    ["URLs encontradas", current.analysis.url_count ?? 0],
    ["Acessíveis", current.analysis.accessible_urls ?? 0],
    ["Redirecionamentos", current.analysis.redirects ?? 0],
  ] : [];

  return <div>
    <DemoBanner>A análise exibida nesta etapa é demonstrativa. O crawler real ficará no backend e só analisará domínios autorizados.</DemoBanner>
    <PageHeader title={site.name} description={site.domain} actions={<div className="flex gap-2"><Button variant="outline" asChild><Link to="/app/sites">Voltar</Link></Button><Button onClick={runAnalysis}>Analisar domínio</Button></div>} />

    <div className="grid gap-4 md:grid-cols-3">{stats.length ? stats.map(([label, value]) => <StatCard key={String(label)} label={String(label)} value={value} />) : <Panel className="md:col-span-3"><p className="text-sm text-muted-foreground">Execute a análise para descobrir as páginas do domínio.</p></Panel>}</div>

    <Panel className="mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold">URLs descobertas</h2><p className="text-sm text-muted-foreground">{selected.length} de {urls.length} selecionadas.</p></div>
        <div className="flex flex-wrap gap-2">
          {urls.length > 0 && <Button size="sm" variant="outline" onClick={() => setSelected(allSelected ? [] : urls.map((url) => url.id))}>{allSelected ? "Limpar seleção" : "Selecionar todas"}</Button>}
          <Button size="sm" disabled={!selected.length} onClick={useSelected} asChild><Link to="/app/campanhas/nova">Usar selecionadas na campanha</Link></Button>
        </div>
      </div>

      {urls.length ? <div className="space-y-2">{urls.map((url) => <label key={url.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40"><input type="checkbox" className="mt-1" checked={selected.includes(url.id)} onChange={() => toggleUrl(url.id)} /><span className="min-w-0 flex-1"><span className="block break-all text-sm font-medium">{url.url}</span><span className="text-xs text-muted-foreground">{url.title} · {url.internal_links} links internos</span></span><StatusBadge status={url.status === "accessible" ? "verified" : url.status === "redirect" ? "warn" : "failed"} /></label>)}</div> : <EmptyState title="Nenhuma URL carregada" description="Execute a análise para descobrir as páginas do domínio." />}
    </Panel>

    {current && <Panel className="mt-6">
      <h2 className="font-semibold">Diagnóstico</h2>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
        <div><span className="text-muted-foreground">Sitemap</span><p className="font-medium">{current.analysis.sitemap_found ? "Encontrado" : "Não encontrado"}</p></div>
        <div><span className="text-muted-foreground">Robots.txt</span><p className="font-medium">Disponível para análise</p></div>
        <div><span className="text-muted-foreground">Links internos</span><p className="font-medium">{current.analysis.internal_links ?? 0}</p></div>
        <div><span className="text-muted-foreground">Status</span><StatusBadge status={site.status} /></div>
      </div>
    </Panel>}
  </div>;
}
