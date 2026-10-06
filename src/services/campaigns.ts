import { useSyncExternalStore } from "react";
import type { Campaign, CampaignDraft, CampaignStatus, ID, Site } from "@/domain/types";
import { DEMO_USER_ID, demoCampaigns, demoSites } from "@/mocks/demo";
import { uid } from "@/lib/format";
import { loadPersistedState, savePersistedState } from "@/services/storage";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/services/auth";

type State = { campaigns: Campaign[]; sites: Site[] };
let state: State = loadPersistedState({ campaigns: demoCampaigns, sites: demoSites });
const listeners = new Set<() => void>();
const set = (next: State) => {
  state = next;
  savePersistedState(state);
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useCampaigns = () => useSyncExternalStore(subscribe, () => state.campaigns, () => state.campaigns);
export const useSites = () => useSyncExternalStore(subscribe, () => state.sites, () => state.sites);
export const getCampaign = (id: ID) => state.campaigns.find((campaign) => campaign.id === id);
export const getSite = (id: ID) => state.sites.find((site) => site.id === id);

function mapSite(row: any): Site {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    domain: row.domain,
    status: row.status === "error" ? "failed" : row.status,
    verification_token: "",
    created_at: row.created_at,
    verified_at: row.verified_at,
    analysis: row.analysis ?? null,
  };
}

function mapCampaign(row: any): Campaign {
  const payload = row.settings ?? {};
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    site_id: row.site_id,
    start_url: payload.start_url ?? "",
    description: payload.description ?? "",
    sitemap_url: payload.sitemap_url ?? "",
    settings: payload.settings ?? {},
    pages: payload.pages ?? [],
    sources: payload.sources ?? [],
    location: payload.location ?? { country: "BR", region: "", city: "", timezone: "America/Sao_Paulo" },
    volume: row.volume ?? {},
    schedule: row.schedule ?? {},
    status: row.status === "cancelled" ? "error" : row.status,
    consumed_sessions: 0,
    created_at: row.created_at,
    last_run_at: null,
  };
}

export async function hydrateBackendState() {
  const session = await getSession();
  if (!session) return;

  const [sitesResult, campaignsResult] = await Promise.all([
    supabase.from("sites").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
    supabase.from("campaigns").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
  ]);

  if (sitesResult.error) throw sitesResult.error;
  if (campaignsResult.error) throw campaignsResult.error;

  set({
    sites: (sitesResult.data ?? []).map(mapSite),
    campaigns: (campaignsResult.data ?? []).map(mapCampaign),
  });
}

export const campaignRepo = {
  async create(draft: CampaignDraft, status: CampaignStatus): Promise<Campaign> {
    const session = await getSession();
    if (!session) throw new Error("Sua sessão expirou. Entre novamente.");

    const row = {
      user_id: session.user.id,
      site_id: draft.site_id,
      name: draft.name,
      status: status === "error" ? "draft" : status,
      settings: {
        start_url: draft.start_url,
        description: draft.description,
        sitemap_url: draft.sitemap_url,
        settings: draft.settings,
        pages: draft.pages,
        sources: draft.sources,
        location: draft.location,
      },
      volume: draft.volume,
      schedule: draft.schedule,
    };

    const { data, error } = await supabase.from("campaigns").insert(row).select("*").single();
    if (error) throw error;

    const campaign = mapCampaign(data);
    set({ ...state, campaigns: [campaign, ...state.campaigns] });
    return campaign;
  },

  async update(id: ID, draft: CampaignDraft) {
    const session = await getSession();
    if (!session) throw new Error("Sua sessão expirou. Entre novamente.");

    const { data, error } = await supabase
      .from("campaigns")
      .update({
        name: draft.name,
        site_id: draft.site_id,
        settings: {
          start_url: draft.start_url,
          description: draft.description,
          sitemap_url: draft.sitemap_url,
          settings: draft.settings,
          pages: draft.pages,
          sources: draft.sources,
          location: draft.location,
        },
        volume: draft.volume,
        schedule: draft.schedule,
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select("*")
      .single();

    if (error) throw error;
    const campaign = mapCampaign(data);
    set({ ...state, campaigns: state.campaigns.map((item) => (item.id === id ? campaign : item)) });
  },

  async setStatus(id: ID, status: CampaignStatus) {
    const session = await getSession();
    if (!session) throw new Error("Sua sessão expirou. Entre novamente.");

    const dbStatus = status === "error" ? "cancelled" : status;
    const { error } = await supabase.from("campaigns").update({ status: dbStatus }).eq("id", id).eq("user_id", session.user.id);
    if (error) throw error;
    set({ ...state, campaigns: state.campaigns.map((campaign) => (campaign.id === id ? { ...campaign, status } : campaign)) });
  },

  async duplicate(id: ID) {
    const campaign = getCampaign(id);
    if (!campaign) return;
    const { id: _id, ...draft } = campaign;
    await campaignRepo.create({ ...draft, name: `${campaign.name} (cópia)` }, "draft");
  },

  async remove(id: ID) {
    const session = await getSession();
    if (!session) throw new Error("Sua sessão expirou. Entre novamente.");
    const { error } = await supabase.from("campaigns").delete().eq("id", id).eq("user_id", session.user.id);
    if (error) throw error;
    set({ ...state, campaigns: state.campaigns.filter((campaign) => campaign.id !== id) });
  },
};

export const siteRepo = {
  async create(input: Pick<Site, "name" | "domain">) {
    const session = await getSession();
    if (!session) throw new Error("Sua sessão expirou. Entre novamente.");

    const { data, error } = await supabase
      .from("sites")
      .insert({ user_id: session.user.id, name: input.name, domain: input.domain })
      .select("*")
      .single();

    if (error) throw error;
    const site = mapSite(data);
    set({ ...state, sites: [site, ...state.sites] });
    return site;
  },

  async update(id: ID, input: Partial<Pick<Site, "name" | "domain">>) {
    const session = await getSession();
    if (!session) throw new Error("Sua sessão expirou. Entre novamente.");
    const { error } = await supabase.from("sites").update(input).eq("id", id).eq("user_id", session.user.id);
    if (error) throw error;
    set({ ...state, sites: state.sites.map((site) => (site.id === id ? { ...site, ...input } : site)) });
  },

  async setAnalysis(id: ID, analysis: Site["analysis"]) {
    const session = await getSession();
    if (!session) throw new Error("Sua sessão expirou. Entre novamente.");

    const { error } = await supabase
      .from("sites")
      .update({ analysis, status: "verified", verified_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;
    set({ ...state, sites: state.sites.map((site) => (site.id === id ? { ...site, analysis, status: "verified", verified_at: site.verified_at ?? new Date().toISOString() } : site)) });
  },

  async remove(id: ID) {
    const session = await getSession();
    if (!session) throw new Error("Sua sessão expirou. Entre novamente.");
    const { error } = await supabase.from("sites").delete().eq("id", id).eq("user_id", session.user.id);
    if (error) throw error;
    set({ ...state, sites: state.sites.filter((site) => site.id !== id) });
  },
};

void uid;
void DEMO_USER_ID;
