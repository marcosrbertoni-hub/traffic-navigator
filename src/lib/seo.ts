import { BRAND } from "@/config/site";

/** Builds per-route head() metadata. */
export function pageHead(title: string, description: string, opts: { noindex?: boolean } = {}) {
  const full = `${title} — ${BRAND.name}`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(opts.noindex ? [{ name: "robots", content: "noindex" }] : []),
    ],
  };
}
