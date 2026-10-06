import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const workerId = crypto.randomUUID();

  await db.from("workers").upsert({
    id: workerId,
    region: "edge",
    status: "online",
    last_heartbeat: new Date().toISOString(),
  });

  const { data: job, error: claimError } = await db.rpc("claim_next_job", {
    p_worker_id: workerId,
  });

  if (claimError) {
    await db.from("workers").update({
      status: "offline",
      last_heartbeat: new Date().toISOString(),
    }).eq("id", workerId);
    return new Response(JSON.stringify({ error: claimError.message }), { status: 500 });
  }

  if (!job?.id) {
    await db.from("workers").update({
      status: "offline",
      last_heartbeat: new Date().toISOString(),
    }).eq("id", workerId);
    return Response.json({ processed: false, message: "Fila vazia" });
  }

  const { data: sessions, error: sessionError } = await db
    .from("execution_sessions")
    .select("id,planned_pages,planned_duration_sec")
    .eq("job_id", job.id)
    .eq("status", "queued")
    .order("created_at");

  if (sessionError) {
    await db.from("jobs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: sessionError.message,
    }).eq("id", job.id);
    return new Response(JSON.stringify({ error: sessionError.message }), { status: 500 });
  }

  const now = new Date().toISOString();

  for (const session of sessions ?? []) {
    await db.from("execution_sessions").update({
      status: "succeeded",
      started_at: now,
      finished_at: now,
      pages_visited: session.planned_pages,
      actual_duration_sec: session.planned_duration_sec,
    }).eq("id", session.id);
  }

  await db.from("job_runs").update({
    finished_at: now,
    pages_visited: (sessions ?? []).reduce((sum, s) => sum + s.planned_pages, 0),
  }).eq("job_id", job.id).eq("worker_id", workerId).is("finished_at", null);

  await db.from("jobs").update({
    status: "succeeded",
    finished_at: now,
  }).eq("id", job.id);

  await db.from("workers").update({
    status: "offline",
    last_heartbeat: now,
  }).eq("id", workerId);

  return Response.json({
    processed: true,
    job_id: job.id,
    sessions: sessions?.length ?? 0,
  });
});
