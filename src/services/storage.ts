import type { Campaign, Site } from "@/domain/types";

const STORAGE_KEY = "traffic-navigator:demo-state:v1";

export type PersistedState = {
  campaigns: Campaign[];
  sites: Site[];
};

const isBrowser = () => typeof window !== "undefined";

export function loadPersistedState(fallback: PersistedState): PersistedState {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!Array.isArray(parsed.campaigns) || !Array.isArray(parsed.sites)) return fallback;

    return {
      campaigns: parsed.campaigns,
      sites: parsed.sites,
    };
  } catch {
    return fallback;
  }
}

export function savePersistedState(state: PersistedState) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable in private browsing or restricted environments.
  }
}
