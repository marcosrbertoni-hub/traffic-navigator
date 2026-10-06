import { supabase } from "@/lib/supabase";
import { getSession } from "@/services/auth";

export async function enqueueCampaign(campaignId: string) {
  const session = await getSession();
  if (!session) throw new Error("Sua sessão expirou. Entre novamente.");

  const { data, error } = await supabase.rpc("enqueue_campaign", {
    p_campaign_id: campaignId,
  });

  if (error) throw error;
  return data as string;
}
