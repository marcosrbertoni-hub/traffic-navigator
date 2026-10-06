import type { ID, SiteAnalysis } from "@/domain/types";
import { getSite, siteRepo } from "@/services/campaigns";
import { analyzeSiteRemote } from "@/services/site-analysis.functions";

export interface DiscoveredUrl {
  id: ID;
  url: string;
  path: string;
  title: string;
  status: "accessible" | "redirect" | "error";
  internal_links: number;
}

export interface SiteAnalysisResult {
  site_id: ID;
  sitemap_url: string | null;
  robots_url: string;
  analysis: SiteAnalysis;
  urls: DiscoveredUrl[];
  notes: string[];
}

const slug = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

export const analyzeSiteDemo = (siteId: ID): SiteAnalysisResult | null => {
  const site = getSite(siteId);
  if (!site) return null;

  const domain = site.domain.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const key = slug(domain) || "site";
  const paths = ["/", "/sobre", "/servicos", "/blog", "/contato", "/politica-de-privacidade", "/termos"];
  const urls: DiscoveredUrl[] = paths.map((path, index) => ({
    id: `${siteId}-url-${index + 1}`,
    url: `https://${domain}${path === "/" ? "" : path}`,
    path,
    title: path === "/" ? site.name : path.slice(1).split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
    status: "accessible",
    internal_links: Math.max(2, (index * 3 + key.length) % 14),
  }));

  const analysis: SiteAnalysis = {
    sitemap_found: true,
    url_count: urls.length,
    accessible_urls: urls.filter((url) => url.status === "accessible").length,
    errors: urls.filter((url) => url.status === "error").length,
    redirects: urls.filter((url) => url.status === "redirect").length,
    internal_links: urls.reduce((sum, url) => sum + url.internal_links, 0),
    analyzed_at: new Date().toISOString(),
  };

  siteRepo.setAnalysis(siteId, analysis);
  return {
    site_id: siteId,
    sitemap_url: `https://${domain}/sitemap.xml`,
    robots_url: `https://${domain}/robots.txt`,
    analysis,
    urls,
    notes: [
      "Esta análise é uma simulação local da interface.",
      "O crawler real será executado no backend, com autorização do domínio.",
      "As URLs encontradas poderão alimentar campanhas e relatórios.",
    ],
  };
};


export const analyzeSite = async (siteId: ID): Promise<SiteAnalysisResult | null> => {
  const site = getSite(siteId);
  if (!site) return null;

  const result = await analyzeSiteRemote({ data: { siteId, domain: site.domain } });
  await siteRepo.setAnalysis(siteId, result.analysis);
  return result as SiteAnalysisResult;
};
