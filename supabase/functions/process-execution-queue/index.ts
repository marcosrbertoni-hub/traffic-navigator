import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BATCH_SIZE = 4;
const PAGE_TIMEOUT_MS = 8000;
const MAX_PAGES_PER_SESSION = 3;

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function extractPages(journey: unknown): string[] {
  if (!journey || typeof journey !== "object") return [];
  const pages = (journey as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return [];
  return pages.filter((page): page is string => typeof page === "string").slice(0, MAX_PAGES_PER_SESSION);
}

async function fetchAuthorizedPage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
  const started = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "TrafficNavigator/1.0 authorized-site-test",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    return {
      ok: response.ok,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      finalUrl: response.url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Math.round(performance.now() - started),
      finalUrl: url,
      error: error instanceof Error ? error.message : "request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  if (!req.headers.get("Authorization")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const schedule = await db.rpc("schedule_due_campaigns");
  if (schedule.error) console.error("scheduler", schedule.error.message);

  const workerId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.from("workers").upsert({
    id: workerId,
    name: `edge-${workerId.slice(0, 8)}`,
    status: "online",
    last_heartbeat_at: now,
    metadata: { engine: "http-journey", batch_size: BATCH_SIZE },
  });

  const finishWorker = async () => {
    await db.from("workers").update({
      status: "offline",
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", workerId);
  };

  try {
    const { data: job, error: claimError } = await db.rpc("claim_next_job", {
      p_worker_id: workerId,
    });

    if (claimError) throw claimError;

    if (!job?.id) {
      await finishWorker();
      return Response.json({
        processed: false,
        scheduled: schedule.data ?? 0,
        message: "Fila vazia",
      });
    }

    const { data: campaign, error: campaignError } = await db
      .from("campaigns")
      .select("id,site_id,settings")
      .eq("id", job.campaign_id)
      .single();

    if (campaignError || !campaign) throw campaignError ?? new Error("Campanha não encontrada.");

    const { data: site, error: siteError } = await db
      .from("sites")
      .select("domain")
      .eq("id", campaign.site_id)
      .single();

    if (siteError || !site) throw siteError ?? new Error("Site da campanha não encontrado.");

    let { data: sessions, error: sessionError } = await db
      .from("execution_sessions")
      .select("id,planned_pages,planned_duration_sec,device,journey")
      .eq("job_id", job.id)
      .eq("status", "queued")
      .order("created_at")
      .limit(BATCH_SIZE);

    if (sessionError) throw sessionError;

    if (!sessions?.length) {
      const settings = (campaign.settings ?? {}) as Record<string, unknown>;
      const campaignPages = Array.isArray(settings.pages)
        ? settings.pages
            .map((item) => (item && typeof item === "object" ? (item as { url?: unknown }).url : null))
            .filter((url): url is string => typeof url === "string" && url.length > 0)
        : [];
      const startUrl = typeof settings.start_url === "string" ? settings.start_url : `https://${site.domain}/`;
      const requested = Math.max(Number(job.payload?.requested_sessions ?? 1), 1);
      const rows = Array.from({ length: Math.min(requested, 100) }, (_, index) => {
        const pageCount = Math.min(Math.max(campaignPages.length, 1), MAX_PAGES_PER_SESSION);
        const pages = Array.from({ length: pageCount }, (_, offset) =>
          campaignPages.length ? campaignPages[(index + offset) % campaignPages.length] : startUrl,
        );
        return {
          job_id: job.id,
          campaign_id: job.campaign_id,
          status: "queued",
          planned_pages: pages.length,
          planned_duration_sec: 5,
          device: index % 2 === 0 ? "desktop" : "mobile",
          journey: { mode: "authorized-http-test", start: startUrl, pages },
        };
      });

      const { error: insertError } = await db.from("execution_sessions").insert(rows);
      if (insertError) throw insertError;

      const result = await db
        .from("execution_sessions")
        .select("id,planned_pages,planned_duration_sec,device,journey")
        .eq("job_id", job.id)
        .eq("status", "queued")
        .order("created_at")
        .limit(BATCH_SIZE);

      if (result.error) throw result.error;
      sessions = result.data ?? [];
    }

    const allowedHost = normalizeHost(site.domain);
    let sessionsSucceeded = 0;
    let sessionsFailed = 0;
    let pagesVisited = 0;
    let totalDurationMs = 0;

    for (const session of sessions) {
      const startedAt = new Date().toISOString();
      await db.from("execution_sessions").update({
        status: "running",
        started_at: startedAt,
        error: null,
      }).eq("id", session.id);

      const pages = extractPages(session.journey);
      const errors: string[] = [];
      let visited = 0;
      let durationMs = 0;

      for (const page of pages) {
        let parsed: URL;
        try {
          parsed = new URL(page);
        } catch {
          errors.push(`URL inválida: ${page}`);
          continue;
        }

        if (normalizeHost(parsed.hostname) !== allowedHost) {
          errors.push(`URL fora do domínio autorizado: ${parsed.hostname}`);
          continue;
        }

        const result = await fetchAuthorizedPage(parsed.toString());
        durationMs += result.durationMs;
        if (result.ok) {
          visited += 1;
        } else {
          errors.push(`${parsed.pathname || "/"} retornou ${result.status || result.error || "erro"}`);
        }
      }

      const succeeded = visited > 0 && errors.length === 0;
      if (succeeded) sessionsSucceeded += 1;
      else sessionsFailed += 1;
      pagesVisited += visited;
      totalDurationMs += durationMs;

      await db.from("execution_sessions").update({
        status: succeeded ? "succeeded" : "failed",
        finished_at: new Date().toISOString(),
        pages_visited: visited,
        actual_duration_sec: Math.max(1, Math.round(durationMs / 1000)),
        error: errors.length ? errors.join(" | ").slice(0, 2000) : null,
      }).eq("id", session.id);
    }

    const { count: remaining } = await db
      .from("execution_sessions")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job.id)
      .eq("status", "queued");

    const hasRemaining = (remaining ?? 0) > 0;
    const runFinishedAt = new Date().toISOString();

    await db.from("job_runs").update({
      status: "completed",
      finished_at: runFinishedAt,
      metrics: {
        sessions_processed: sessionsSucceeded + sessionsFailed,
        sessions_succeeded: sessionsSucceeded,
        sessions_failed: sessionsFailed,
        pages_visited: pagesVisited,
        request_duration_sec: Math.round(totalDurationMs / 1000),
        remaining_sessions: remaining ?? 0,
      },
    }).eq("job_id", job.id).eq("worker_id", workerId).is("finished_at", null);

    if (hasRemaining) {
      await db.from("jobs").update({
        status: "queued",
        scheduled_at: new Date(Date.now() + 1000).toISOString(),
        started_at: null,
      }).eq("id", job.id);
    } else {
      await db.from("jobs").update({
        status: "completed",
        finished_at: runFinishedAt,
      }).eq("id", job.id);
    }

    await finishWorker();

    return Response.json({
      processed: true,
      scheduled: schedule.data ?? 0,
      job_id: job.id,
      sessions_processed: sessionsSucceeded + sessionsFailed,
      pages_visited: pagesVisited,
      remaining_sessions: remaining ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution worker failed";

    await db.from("logs").insert({
      level: "error",
      source: "execution-worker",
      message,
      metadata: { worker_id: workerId },
    });

    await db.from("workers").update({
      status: "offline",
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", workerId);

    return Response.json({ error: message }, { status: 500 });
  }
});
