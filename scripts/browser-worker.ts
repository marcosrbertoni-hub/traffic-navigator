import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const MAX_PAGES_PER_SESSION = 3;
const DEFAULT_DWELL_MS = 5000;

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function journeyPages(journey: unknown): string[] {
  if (!journey || typeof journey !== "object") return [];
  const pages = (journey as { pages?: unknown }).pages;
  return Array.isArray(pages)
    ? pages.filter((page): page is string => typeof page === "string").slice(0, MAX_PAGES_PER_SESSION)
    : [];
}

async function main() {
  await db.rpc("schedule_due_campaigns");

  const workerId = crypto.randomUUID();
  await db.from("workers").upsert({
    id: workerId,
    name: "browser-" + workerId.slice(0, 8),
    status: "online",
    last_heartbeat_at: new Date().toISOString(),
    metadata: { engine: "playwright", mode: "browser-journey" },
  });

  try {
    const { data: job, error: claimError } = await db.rpc("claim_next_job", {
      p_worker_id: workerId,
    });

    if (claimError) throw claimError;
    if (!job?.id) {
      console.log("Queue empty.");
      return;
    }

    const { data: campaign, error: campaignError } = await db
      .from("campaigns")
      .select("id,site_id,settings")
      .eq("id", job.campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw campaignError ?? new Error("Campaign not found.");
    }

    const { data: site, error: siteError } = await db
      .from("sites")
      .select("domain")
      .eq("id", campaign.site_id)
      .single();

    if (siteError || !site) {
      throw siteError ?? new Error("Campaign site not found.");
    }

    let { data: session, error: sessionError } = await db
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
      const startUrl =
        typeof settings.start_url === "string"
          ? settings.start_url
          : "https://" + site.domain + "/";
      const payload = (job.payload ?? {}) as Record<string, unknown>;
      const requested = Math.min(Math.max(Number(payload.requested_sessions ?? 1), 1), 100);

      const rows = Array.from({ length: requested }, (_, index) => {
        const pages = Array.from(
          { length: Math.min(Math.max(campaignPages.length, 1), MAX_PAGES_PER_SESSION) },
          (_, offset) => campaignPages.length
            ? campaignPages[(index + offset) % campaignPages.length]
            : startUrl,
        );

        return {
          job_id: job.id,
          campaign_id: job.campaign_id,
          status: "queued",
          planned_pages: pages.length,
          planned_duration_sec: 5,
          device: index % 2 === 0 ? "desktop" : "mobile",
          journey: { mode: "authorized-browser-test", start: startUrl, pages },
          pages_visited: 0,
          actual_duration_sec: 0,
        };
      });

      const { error: insertError } = await db.from("execution_sessions").insert(rows);
      if (insertError) throw insertError;

      const result = await db
        .from("execution_sessions")
        .select("id,planned_pages,planned_duration_sec,device,journey,pages_visited,actual_duration_sec")
        .eq("job_id", job.id)
        .eq("status", "queued")
        .order("created_at")
        .limit(1)
        .maybeSingle();

      if (result.error || !result.data) {
        throw result.error ?? new Error("Could not create execution session.");
      }
      session = result.data;
    }

    const pages = journeyPages(session.journey);
    const targetUrl = pages[0];
    if (!targetUrl) throw new Error("Session has no target URL.");

    const parsed = new URL(targetUrl);
    if (normalizeHost(parsed.hostname) !== normalizeHost(site.domain)) {
      throw new Error("URL outside authorized domain: " + parsed.hostname);
    }

    await db.from("execution_sessions").update({
      status: "running",
      started_at: new Date().toISOString(),
      error: null,
    }).eq("id", session.id);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: session.device === "mobile"
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
      userAgent: session.device === "mobile"
        ? "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 Chrome/153 Mobile Safari/537.36"
        : undefined,
    });

    const page = await context.newPage();
    const started = Date.now();

    try {
      await page.goto(parsed.toString(), {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(DEFAULT_DWELL_MS);

      const finalUrl = new URL(page.url());
      if (normalizeHost(finalUrl.hostname) !== normalizeHost(site.domain)) {
        throw new Error("Navigation left authorized domain: " + finalUrl.hostname);
      }

      const visited = (session.pages_visited ?? 0) + 1;
      const duration = (session.actual_duration_sec ?? 0) +
        Math.max(1, Math.round((Date.now() - started) / 1000));
      const remaining = pages.slice(1);

      if (remaining.length > 0) {
        await db.from("execution_sessions").update({
          status: "queued",
          pages_visited: visited,
          actual_duration_sec: duration,
          journey: { ...(session.journey as Record<string, unknown>), pages: remaining },
          error: null,
        }).eq("id", session.id);
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
        }).eq("id", session.id);

        const { count } = await db
          .from("execution_sessions")
          .select("id", { count: "exact", head: true })
          .eq("job_id", job.id)
          .eq("status", "queued");

        if ((count ?? 0) > 0) {
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
          browser: true,
          page_url: targetUrl,
          final_url: page.url(),
          analytics_runtime: true,
          pages_visited: visited,
          remaining_pages_in_session: remaining.length,
        },
      }).eq("job_id", job.id).eq("worker_id", workerId).is("finished_at", null);

      console.log(JSON.stringify({
        processed: true,
        jobId: job.id,
        sessionId: session.id,
        page: targetUrl,
        finalUrl: page.url(),
        pagesVisited: visited,
      }));
    } finally {
      await context.close();
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browser worker failed";
    console.error(message);
    await db.from("logs").insert({
      level: "error",
      source: "browser-worker",
      message,
      metadata: { worker_id: workerId },
    });
    throw error;
  } finally {
    await db.from("workers").update({
      status: "offline",
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", workerId);
  }
}

main().catch(() => process.exit(1));
