import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const schedule = await db.rpc("schedule_due_campaigns");
  if (schedule.error) console.error("scheduler", schedule.error.message);

  const workerId = crypto.randomUUID();
  const heartbeat = new Date().toISOString();

  await db.from("workers").upsert({
    id: workerId,
    name: `edge-${workerId.slice(0, 8)}`,
    status: "online",
    last_heartbeat_at: heartbeat,
  });

  const { data: job, error: claimError } = await db.rpc("claim_next_job", {
    p_worker_id: workerId,
  });

  if (claimError) {
    await db.from("workers").update({
      status: "offline",
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", workerId);
    return new Response(JSON.stringify({ error: claimError.message }), { status: 500 });
  }

  if (!job?.id) {
    await db.from("workers").update({
      status: "offline",
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", workerId);
    return Response.json({
      processed: false,
      scheduled: schedule.data ?? 0,
      message: "Fila vazia",
    });
  }

  let { data: sessions, error: sessionError } = await db
    .from("execution_sessions")
    .select("id,planned_pages,planned_duration_sec")
    .eq("job_id", job.id)
    .eq("status", "queued")
    .order("created_at");

  if (sessionError) {
    await db.from("job_runs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: sessionError.message,
    }).eq("job_id", job.id).eq("worker_id", workerId).is("finished_at", null);

    await db.from("jobs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: sessionError.message,
    }).eq("id", job.id);

    return new Response(JSON.stringify({ error: sessionError.message }), { status: 500 });
  }

  if (!sessions?.length) {
    const requested = Math.max(Number(job.payload?.requested_sessions ?? 1), 1);
    const rows = Array.from({ length: Math.min(requested, 100) }, (_, index) => ({
      job_id: job.id,
      campaign_id: job.campaign_id,
      status: "queued",
      planned_pages: 1 + (index % 3),
      planned_duration_sec: 20 + ((index * 17) % 101),
      device: index % 3 === 0 ? "mobile" : "desktop",
      journey: { mode: "simulation", step: index + 1 },
    }));

    const { error } = await db.from("execution_sessions").insert(rows);
    if (error) {
      await db.from("job_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: error.message,
      }).eq("job_id", job.id).eq("worker_id", workerId).is("finished_at", null);

      await db.from("jobs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: error.message,
      }).eq("id", job.id);

      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const result = await db
      .from("execution_sessions")
      .select("id,planned_pages,planned_duration_sec")
      .eq("job_id", job.id)
      .eq("status", "queued")
      .order("created_at");

    sessions = result.data ?? [];
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

  const pagesVisited = (sessions ?? []).reduce((sum, s) => sum + s.planned_pages, 0);

  await db.from("job_runs").update({
    status: "completed",
    finished_at: now,
    metrics: {
      sessions: sessions?.length ?? 0,
      pages_visited: pagesVisited,
    },
  }).eq("job_id", job.id).eq("worker_id", workerId).is("finished_at", null);

  await db.from("jobs").update({
    status: "completed",
    finished_at: now,
  }).eq("id", job.id);

  await db.from("workers").update({
    status: "offline",
    last_heartbeat_at: now,
  }).eq("id", workerId);

  return Response.json({
    processed: true,
    scheduled: schedule.data ?? 0,
    job_id: job.id,
    sessions: sessions?.length ?? 0,
  });
});
