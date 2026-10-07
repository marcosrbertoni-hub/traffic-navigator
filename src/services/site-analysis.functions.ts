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

function sameSite(host: string, allowedHost: string) {
  const strip = (h: string) => h.toLowerCase().replace(/^www\./, "");
  return strip(host) === strip(allowedHost);
}

async function fetchText(url: string, allowedHost: string, redirects = 0): Promise<{ response: Response & { finalUrl?: string; wasRedirected?: boolean }; text: string }> {
  if (redirects > 5) throw new Error("Muitos redirecionamentos.");
  const target = new URL(url);
  if (target.protocol !== "http:" && target.protocol !== "https:" || !sameSite(target.hostname, allowedHost)) {
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
      if (!sameSite(next.hostname, allowedHost) || !["http:", "https:"].includes(next.protocol)) {
        throw new Error("Redirecionamento fora do domínio autorizado.");
      }
      return fetchText(next.toString(), allowedHost, redirects + 1);
    }

    return { response: Object.assign(response, { finalUrl: url, wasRedirected: redirects > 0 }), text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

function extractLocs(xml: string) {
  return [...xml.matchAll(/<loc[^>]*>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1]?.trim() ?? "")
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

function collectInternalLinks(html: string, base: string, domain: string) {
  const out = new Set<string>();
  for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const href = match[1] ? toAbsoluteUrl(match[1], base) : null;
    if (!href) continue;
    const u = new URL(href);
    if (!sameSite(u.hostname, domain)) continue;
    if (/\.(jpe?g|png|gif|webp|svg|pdf|zip|css|js|ico|mp4|mp3|xml)$/i.test(u.pathname)) continue;
    u.hash = "";
    out.add(u.toString());
  }
  return [...out];
}

function extractInternalLinks(html: string, origin: string) {
  const links = new Set<string>();
  for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (!raw) continue;
    const href = toAbsoluteUrl(raw, origin);
    if (href && sameSite(new URL(href).hostname, new URL(origin).hostname)) links.add(href.split("#")[0] ?? href);
  }
  return links.size;
}

export const analyzeSiteRemote = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    const domain = normalizeDomain(data.domain);
    const notes: string[] = [];
    let base = `https://${domain}`;
    let homeHtml = "";
    for (const candidate of [`https://${domain}/`, `http://${domain}/`]) {
      try {
        const home = await fetchText(candidate, domain);
        if (home.response.ok) {
          base = new URL(home.response.finalUrl ?? candidate).origin;
          homeHtml = home.text;
          break;
        }
      } catch { /* tenta próximo */ }
    }
    if (!homeHtml) notes.push("A página inicial não respondeu; verifique se o domínio está no ar.");
    const robotsUrl = `${base}/robots.txt`;
    const defaultSitemapUrl = `${base}/sitemap.xml`;

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

    if (sitemapLocs.length === 0 && homeHtml) {
      notes.push("Sem sitemap: as páginas foram descobertas seguindo os links do site.");
      const found = new Set<string>([`${base}/`, ...collectInternalLinks(homeHtml, base, domain)]);
      for (const page of [...found].slice(1, 8)) {
        if (found.size >= MAX_URLS) break;
        try {
          const r = await fetchText(page, domain);
          if (r.response.ok) collectInternalLinks(r.text, base, domain).forEach((l) => found.add(l));
        } catch { /* ignora */ }
      }
      sitemapLocs = [...found];
    }

    const uniqueUrls = [...new Set(sitemapLocs.map((url) => toAbsoluteUrl(url, base)).filter((url): url is string => Boolean(url)))]
      .filter((url) => sameSite(new URL(url).hostname, domain))
      .slice(0, MAX_URLS);

    const urls = await Promise.all(uniqueUrls.map(async (url, index) => {
      try {
        const result = await fetchText(url, domain);
        const status = result.response.wasRedirected ? "redirect" : result.response.ok ? "accessible" : "error";
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
    if (urls.length === 0) throw new Error("Não foi possível encontrar páginas neste domínio. Confira se o endereço está correto e se o site está no ar.");

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
