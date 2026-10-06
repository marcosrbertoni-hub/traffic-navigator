import type { CampaignPage, ID } from "@/domain/types";

let prefill: { site_id: ID; pages: CampaignPage[] } | null = null;

export const setCampaignPrefill = (site_id: ID, pages: CampaignPage[]) => {
  prefill = { site_id, pages };
};

export const consumeCampaignPrefill = () => {
  const value = prefill;
  prefill = null;
  return value;
};
