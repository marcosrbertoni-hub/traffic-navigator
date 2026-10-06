import type { Campaign } from "@/domain/types";

export type PlannedSession = {
  index: number;
  pages: string[];
  durationSec: number;
  device: "desktop" | "mobile";
  journey: { start: string; pages: string[] };
};

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

export function planSessions(campaign: Campaign, count: number): PlannedSession[] {
  const pages = campaign.pages.length
    ? campaign.pages.map((p) => p.url)
    : [campaign.start_url];

  const total = Math.max(0, Math.min(count, campaign.settings.total_sessions));
  const min = Math.max(5, campaign.settings.min_duration_sec);
  const max = Math.max(min, campaign.settings.max_duration_sec);
  const sessions: PlannedSession[] = [];

  for (let i = 0; i < total; i += 1) {
    const ratio = total <= 1 ? 0.5 : i / (total - 1);
    const durationSec = Math.round(min + (max - min) * ((ratio * 0.73 + ((i * 17) % 31) / 100) % 1));
    const pageCount = Math.min(pages.length, Math.max(1, campaign.settings.pages_per_session));
    const selected = Array.from({ length: pageCount }, (_, offset) => pick(pages, i + offset));
    const desktop = ((i * 37) % 100) < campaign.settings.desktop_pct;

    sessions.push({
      index: i + 1,
      pages: selected,
      durationSec,
      device: desktop ? "desktop" : "mobile",
      journey: { start: campaign.start_url, pages: selected },
    });
  }

  return sessions;
}
