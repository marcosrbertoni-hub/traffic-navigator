import { CREDIT_RULES } from "@/config/site";
import type { CampaignDraft } from "@/domain/types";

export function estimateCredits(d: Pick<CampaignDraft, "settings">) {
  return d.settings.total_sessions * d.settings.pages_per_session * CREDIT_RULES.creditsPerPage;
}

export function estimateDays(d: Pick<CampaignDraft, "settings" | "volume">) {
  if (!d.volume.daily_limit) return null;
  return Math.ceil(d.settings.total_sessions / d.volume.daily_limit);
}

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const SOURCE_LABELS = {
  direct: "Direto",
  referral: "Referência",
  search: "Busca (cenário de teste)",
  social: "Redes sociais",
  custom: "URL personalizada",
} as const;
