import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  siteId: z.string().min(1),
  domain: z.string().min(1).max(253),
});

const MAX_URLS = 50;
const MAX_SITEMAPS = 5;
const FETCH_TIMEOUT_MS = 7000;

function normalizeDomain(value: string) {
  const raw = value.trim().replace(/^https?:\/\//i, "").split("/")[0];
  const url = new URL(`https://${raw}`);
  if (url.username || url.password || !url.hostname) throw new Error("Domínio inválido.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host === "::1" || host === "[::1]") {
    throw new Error("Domínios locais não podem ser analisados.");
  }
  if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host)) {
    throw new Error("Endereços privados não podem ser analisados.");
  }
  const private172 = host.match(/^172\.(\d+)\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) {
    throw new Error("Endereços privados não podem ser analisados.");
  }
  return host;
}

async function fetchText(url: string, allowedHost: string, redirects = 0): Promise<{ response: Response; text: string }> {
  if (redirects > 3) throw new Error("Muitos redirecionamentos.");
  const target = new URL(url);
  if (target.protocol !== "http:" && target.protocol !== "https:" || target.hostname.toLowerCase() !== allowedHost) {
    throw new Error("Destino fora do domínio autorizado.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: { "user-agent": "TrafficNavigator-SiteAnalyzer/1.0" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { response, text: "" };
      const next = new URL(location, url);
      if (next.hostname.toLowerCase() !== allowedHost || !["http:", "https:"].includes(next.protocol)) {
        throw new Error("Redirecionamento fora do domínio autorizado.");
      }
      return fetchText(next.toString(), allowedHost, redirects + 1);
    }

    return { response, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

function extractLocs(xml: string) {
  return [...xml.matchAll(/<loc[^>]*>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function toAbsoluteUrl(value: string, base: string) {
  try {
    const url = new URL(value, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>\s*([^<]+?)\s*<\/title>/i)?.[1]?.trim() ?? "";
}

function extractInternalLinks(html: string, origin: string) {
  const links = new Set<string>();
  for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const href = toAbsoluteUrl(match[1], origin);
    if (href && new URL(href).origin === origin) links.add(href.split("#")[0]);
  }
  return links.size;
}

export const analyzeSiteRemote = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    const domain = normalizeDomain(data.domain);
    const base = `https://${domain}`;
    const robotsUrl = `${base}/robots.txt`;
    const defaultSitemapUrl = `${base}/sitemap.xml`;
    const notes: string[] = [];

    let sitemapUrl: string | null = null;
    let sitemapFound = false;
    let sitemapLocs: string[] = [];

    try {
      const sitemap = await fetchText(defaultSitemapUrl, domain);
      if (sitemap.response.ok && /<loc[\s>]/i.test(sitemap.text)) {
        sitemapFound = true;
        sitemapUrl = defaultSitemapUrl;
        const locs = extractLocs(sitemap.text);
        const isIndex = /<sitemapindex[\s>]/i.test(sitemap.text);
        if (isIndex) {
          for (const child of locs.slice(0, MAX_SITEMAPS)) {
            try {
              const childResult = await fetchText(child, domain);
              if (childResult.response.ok) sitemapLocs.push(...extractLocs(childResult.text));
            } catch {
              notes.push(`Não foi possível ler o sitemap ${child}.`);
            }
          }
        } else {
          sitemapLocs = locs;
        }
      }
    } catch {
      notes.push("Sitemap.xml não pôde ser consultado.");
    }

    let robotsAvailable = false;
    try {
      const robots = await fetchText(robotsUrl, domain);
      robotsAvailable = robots.response.ok;
      if (robotsAvailable) {
        const robotsSitemap = robots.text.match(/^\s*sitemap:\s*(\S+)\s*$/im)?.[1];
        if (!sitemapFound && robotsSitemap) {
          try {
            const candidate = await fetchText(robotsSitemap, domain);
            if (candidate.response.ok) {
              sitemapFound = true;
              sitemapUrl = robotsSitemap;
              sitemapLocs = extractLocs(candidate.text);
            }
          } catch {
            notes.push("O sitemap indicado no robots.txt não pôde ser consultado.");
          }
        }
      }
    } catch {
      notes.push("robots.txt não pôde ser consultado.");
    }

    const uniqueUrls = [...new Set(sitemapLocs.map((url) => toAbsoluteUrl(url, base)).filter((url): url is string => Boolean(url)))]
      .filter((url) => new URL(url).hostname === domain)
      .slice(0, MAX_URLS);

    const urls = await Promise.all(uniqueUrls.map(async (url, index) => {
      try {
        const result = await fetchText(url, domain);
        const status = result.response.redirected ? "redirect" : result.response.ok ? "accessible" : "error";
        return {
          id: `${data.siteId}-url-${index + 1}`,
          url,
          path: new URL(url).pathname || "/",
          title: result.response.ok ? extractTitle(result.text) : "",
          status: status as "accessible" | "redirect" | "error",
          internal_links: result.response.ok && /<html|<body|<a\s/i.test(result.text) ? extractInternalLinks(result.text, base) : 0,
        };
      } catch {
        return {
          id: `${data.siteId}-url-${index + 1}`,
          url,
          path: new URL(url).pathname || "/",
          title: "",
          status: "error" as const,
          internal_links: 0,
        };
      }
    }));

    if (sitemapLocs.length > MAX_URLS) notes.push(`A análise inicial foi limitada às primeiras ${MAX_URLS} URLs para evitar sobrecarga.`);
    if (!sitemapFound) notes.push("Nenhum sitemap válido foi encontrado.");

    return {
      site_id: data.siteId,
      sitemap_url: sitemapUrl,
      robots_url: robotsUrl,
      robots_available: robotsAvailable,
      analysis: {
        sitemap_found: sitemapFound,
        url_count: urls.length,
        accessible_urls: urls.filter((url) => url.status === "accessible").length,
        errors: urls.filter((url) => url.status === "error").length,
        redirects: urls.filter((url) => url.status === "redirect").length,
        internal_links: urls.reduce((sum, url) => sum + url.internal_links, 0),
        analyzed_at: new Date().toISOString(),
      },
      urls,
      notes,
    };
  });
