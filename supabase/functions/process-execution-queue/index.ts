import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PAGE_TIMEOUT_MS = 5000;
const MAX_PAGES_PER_SESSION = 3;

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function getJourneyPages(journey: unknown): string[] {
  if (!journey || typeof journey !== "object") return [];
  const value = (journey as { pages?: unknown }).pages;
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === "string").slice(0, MAX_PAGES_PER_SESSION) : [];
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
  await db.from("workers").upsert({
    id: workerId,
    name: `edge-${workerId.slice(0, 8)}`,
    status: "online",
    last_heartbeat_at: new Date().toISOString(),
    metadata: { engine: "http-journey", mode: "page-by-page" },
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

    const { data: session, error: sessionError } = await db
      .from("execution_sessions")
      .select("id,planned_pages,planned_duration_sec,device,journey,pages_visited,actual_duration_sec")
      .eq("job_id", job.id)
      .eq("status", "queued")
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session) {
      const settings = (campaign.settings ?? {}) as Record<string, unknown>;
      const campaignPages = Array.isArray(settings.pages)
        ? settings.pages
            .map((item) => item && typeof item === "object" ? (item as { url?: unknown }).url : null)
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
          pages_visited: 0,
          actual_duration_sec: 0,
        };
      });

      const { error: insertError } = await db.from("execution_sessions").insert(rows);
      if (insertError) throw insertError;
    }

    const { data: current, error: currentError } = await db
      .from("execution_sessions")
      .select("id,planned_pages,journey,pages_visited,actual_duration_sec")
      .eq("job_id", job.id)
      .eq("status", "queued")
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current) throw new Error("Nenhuma sessão disponível para execução.");

    const remainingPages = getJourneyPages(current.journey);
    const page = remainingPages[0];

    if (!page) {
      await db.from("execution_sessions").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
      }).eq("id", current.id);

      await db.from("jobs").update({
        status: "queued",
        scheduled_at: new Date(Date.now() + 1000).toISOString(),
        started_at: null,
      }).eq("id", job.id);

      await db.from("job_runs").update({
        status: "completed",
        finished_at: new Date().toISOString(),
        metrics: { page_step: true, sessions_processed: 1, pages_visited: current.pages_visited ?? 0 },
      }).eq("job_id", job.id).eq("worker_id", workerId).is("finished_at", null);

      await finishWorker();
      return Response.json({ processed: true, job_id: job.id, message: "Sessão concluída." });
    }

    await db.from("execution_sessions").update({
      status: "running",
      started_at: new Date().toISOString(),
      error: null,
    }).eq("id", current.id);

    let parsed: URL;
    try {
      parsed = new URL(page);
    } catch {
      await db.from("execution_sessions").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: `URL inválida: ${page}`,
      }).eq("id", current.id);
      throw new Error(`URL inválida: ${page}`);
    }

    if (normalizeHost(parsed.hostname) !== normalizeHost(site.domain)) {
      await db.from("execution_sessions").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: `URL fora do domínio autorizado: ${parsed.hostname}`,
      }).eq("id", current.id);
      throw new Error("URL fora do domínio autorizado.");
    }

    const result = await fetchAuthorizedPage(parsed.toString());
    const visited = (current.pages_visited ?? 0) + (result.ok ? 1 : 0);
    const duration = (current.actual_duration_sec ?? 0) + Math.max(1, Math.round(result.durationMs / 1000));
    const nextPages = remainingPages.slice(1);
    const errors = result.ok ? null : `${parsed.pathname || "/"} retornou ${result.status || result.error || "erro"}`;

    if (!result.ok) {
      await db.from("execution_sessions").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        pages_visited: visited,
        actual_duration_sec: duration,
        error: errors,
      }).eq("id", current.id);

      await db.from("jobs").update({
        status: "queued",
        scheduled_at: new Date(Date.now() + 1000).toISOString(),
        started_at: null,
      }).eq("id", job.id);
    } else if (nextPages.length > 0) {
      await db.from("execution_sessions").update({
        status: "queued",
        pages_visited: visited,
        actual_duration_sec: duration,
        journey: { ...(current.journey as Record<string, unknown>), pages: nextPages },
        error: null,
      }).eq("id", current.id);

      await db.from("jobs").update({
        status: "queued",
        scheduled_at: new Date(Date.now() + 1000).toISOString(),
        started_at: null,
      }).eq("id", job.id);
    } else {
      await db.from("execution_sessions").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        pages_visited: visited,
        actual_duration_sec: duration,
        error: null,
      }).eq("id", current.id);

      const { count: remainingSessions } = await db
        .from("execution_sessions")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("status", "queued");

      if ((remainingSessions ?? 0) > 0) {
        await db.from("jobs").update({
          status: "queued",
          scheduled_at: new Date(Date.now() + 1000).toISOString(),
          started_at: null,
        }).eq("id", job.id);
      } else {
        await db.from("jobs").update({
          status: "completed",
          finished_at: new Date().toISOString(),
        }).eq("id", job.id);
      }
    }

    await db.from("job_runs").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      metrics: {
        page_step: true,
        page_url: page,
        page_ok: result.ok,
        pages_visited: visited,
        remaining_pages_in_session: nextPages.length,
      },
    }).eq("job_id", job.id).eq("worker_id", workerId).is("finished_at", null);

    await finishWorker();

    return Response.json({
      processed: true,
      job_id: job.id,
      page_ok: result.ok,
      page_url: page,
      pages_visited: visited,
      remaining_pages: nextPages.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution worker failed";
    await db.from("logs").insert({
      level: "error",
      source: "execution-worker",
      message,
      metadata: { worker_id: workerId },
    });
    await finishWorker();
    return Response.json({ error: message }, { status: 500 });
  }
});