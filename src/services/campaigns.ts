/**
 * Data access layer (repository pattern).
 * Today: in-memory demo store (resets on reload).
 * Later: swap implementations for server functions backed by Lovable Cloud —
 * components only depend on these functions/hooks, never on the storage.
 */
import { useSyncExternalStore } from "react";
import type { Campaign, CampaignDraft, CampaignStatus, ID, Site } from "@/domain/types";
import { DEMO_USER_ID, demoCampaigns, demoSites } from "@/mocks/demo";
import { uid } from "@/lib/format";
import { loadPersistedState, savePersistedState } from "@/services/storage";

type State = { campaigns: Campaign[]; sites: Site[] };
let state: State = loadPersistedState({ campaigns: demoCampaigns, sites: demoSites });
const listeners = new Set<() => void>();
const set = (next: State) => {
  state = next;
  savePersistedState(state);
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useCampaigns = () => useSyncExternalStore(subscribe, () => state.campaigns, () => state.campaigns);
export const useSites = () => useSyncExternalStore(subscribe, () => state.sites, () => state.sites);
export const getCampaign = (id: ID) => state.campaigns.find((c) => c.id === id);
export const getSite = (id: ID) => state.sites.find((s) => s.id === id);

export const campaignRepo = {
  create(draft: CampaignDraft, status: CampaignStatus): Campaign {
    const c: Campaign = { ...draft, id: `cmp-${uid()}`, user_id: DEMO_USER_ID, status, consumed_sessions: 0, created_at: new Date().toISOString(), last_run_at: null };
    set({ ...state, campaigns: [c, ...state.campaigns] });
    return c;
  },
  update(id: ID, draft: CampaignDraft) {
    set({ ...state, campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...draft } : c)) });
  },
  setStatus(id: ID, status: CampaignStatus) {
    set({ ...state, campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, status } : c)) });
  },
  duplicate(id: ID) {
    const c = getCampaign(id);
    if (c) campaignRepo.create({ ...c, name: `${c.name} (cópia)` }, "draft");
  },
  remove(id: ID) {
    set({ ...state, campaigns: state.campaigns.filter((c) => c.id !== id) });
  },
};

export const siteRepo = {
  create(input: Pick<Site, "name" | "domain">) {
    const s: Site = { ...input, id: `site-${uid()}`, user_id: DEMO_USER_ID, status: "pending", verification_token: `nv-${uid()}`, created_at: new Date().toISOString(), verified_at: null, analysis: null };
    set({ ...state, sites: [s, ...state.sites] });
    return s;
  },
  update(id: ID, input: Partial<Pick<Site, "name" | "domain">>) {
    set({ ...state, sites: state.sites.map((s) => (s.id === id ? { ...s, ...input } : s)) });
  },
  setAnalysis(id: ID, analysis: Site["analysis"]) {
    set({ ...state, sites: state.sites.map((s) => (s.id === id ? { ...s, analysis, status: "verified", verified_at: s.verified_at ?? new Date().toISOString() } : s)) });
  },
  remove(id: ID) {
    set({ ...state, sites: state.sites.filter((s) => s.id !== id) });
  },
};
