import { supabase } from "@/lib/supabase";

export async function createPlannedSessions(jobId: string, campaignId: string, sessions: Array<{pages:string[];durationSec:number;device:string;journey:unknown}>) {
  if (!sessions.length) return;
  const rows = sessions.map((session) => ({
    job_id: jobId,
    campaign_id: campaignId,
    status: "queued",
    planned_pages: session.pages.length,
    planned_duration_sec: session.durationSec,
    device: session.device,
    journey: session.journey,
  }));

  const { error } = await supabase.from("execution_sessions").insert(rows);
  if (error) throw error;
}
