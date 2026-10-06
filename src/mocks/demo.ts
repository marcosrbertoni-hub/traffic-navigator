/**
 * DEMO DATA — shown only while no backend is connected.
 * Every screen using it displays the <DemoBanner />. Delete when real APIs land.
 */
import type { Campaign, CampaignDraft, CreditTransaction, LogEntry, Payment, Site, Worker } from "@/domain/types";

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toISOString();

export const DEMO_USER_ID = "demo-user";

export const emptyDraft = (): CampaignDraft => ({
  name: "",
  site_id: "",
  start_url: "",
  description: "",
  sitemap_url: "",
  settings: { total_sessions: 1000, pages_per_session: 3, min_duration_sec: 30, max_duration_sec: 180, desktop_pct: 60, new_visitor_pct: 70 },
  pages: [],
  sources: [{ id: "s1", type: "direct", label: "Direto", weight: 100 }],
  location: { country: "BR", region: "", city: "", timezone: "America/Sao_Paulo" },
  volume: { daily_limit: 100, distribution: "variable", interval_min_sec: 30, interval_max_sec: 120 },
  schedule: { start_time: "08:00", end_time: "22:00", weekdays: [1, 2, 3, 4, 5], distribution: "even", peak_hours: [], timezone: "America/Sao_Paulo" },
});

export const demoSites: Site[] = [
  { id: "site-1", user_id: DEMO_USER_ID, name: "Loja Exemplo", domain: "loja-exemplo.com.br", status: "verified", verification_token: "nv-7f3a9c", created_at: d(40), verified_at: d(39), analysis: null },
  { id: "site-2", user_id: DEMO_USER_ID, name: "Blog Exemplo", domain: "blog-exemplo.com", status: "pending", verification_token: "nv-1b22de", created_at: d(5), verified_at: null, analysis: null },
];

export const demoCampaigns: Campaign[] = [
  { ...emptyDraft(), id: "cmp-1", user_id: DEMO_USER_ID, name: "Teste de carga — Home", site_id: "site-1", start_url: "https://loja-exemplo.com.br/", status: "active", consumed_sessions: 420, created_at: d(20), last_run_at: d(0) },
  { ...emptyDraft(), id: "cmp-2", user_id: DEMO_USER_ID, name: "Navegação de categorias", site_id: "site-1", start_url: "https://loja-exemplo.com.br/categorias", status: "paused", consumed_sessions: 150, created_at: d(12), last_run_at: d(3) },
  { ...emptyDraft(), id: "cmp-3", user_id: DEMO_USER_ID, name: "Fluxo de artigos", site_id: "site-2", start_url: "https://blog-exemplo.com/", status: "draft", consumed_sessions: 0, created_at: d(2), last_run_at: null },
];

export const demoSeries = Array.from({ length: 14 }, (_, i) => ({
  label: new Date(Date.now() - (13 - i) * 864e5).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  planejadas: 80 + Math.round(Math.sin(i / 2) * 20 + 20),
  executadas: 70 + Math.round(Math.cos(i / 3) * 18 + 15),
  erros: Math.round(2 + Math.abs(Math.sin(i)) * 4),
}));

export const demoCreditTx: CreditTransaction[] = [
  { id: "t1", user_id: DEMO_USER_ID, type: "grant", amount: 500, description: "Créditos de teste", created_at: d(40) },
  { id: "t2", user_id: DEMO_USER_ID, type: "purchase", amount: 10000, description: "Plano Essencial — ciclo mensal", created_at: d(30) },
  { id: "t3", user_id: DEMO_USER_ID, type: "consumption", amount: -1260, campaign_id: "cmp-1", description: "Teste de carga — Home", created_at: d(1) },
  { id: "t4", user_id: DEMO_USER_ID, type: "consumption", amount: -450, campaign_id: "cmp-2", description: "Navegação de categorias", created_at: d(3) },
  { id: "t5", user_id: DEMO_USER_ID, type: "expiration", amount: -120, description: "Créditos de teste expirados", created_at: d(10) },
];

export const demoPayments: Payment[] = [
  { id: "p1", user_id: DEMO_USER_ID, amount: 0, currency: "BRL", status: "paid", description: "Plano Essencial — mensal (valor demonstrativo)", invoice_url: null, created_at: d(30) },
  { id: "p2", user_id: DEMO_USER_ID, amount: 0, currency: "BRL", status: "pending", description: "Plano Essencial — próxima fatura", invoice_url: null, created_at: d(0) },
];

export const demoWorkers: Worker[] = [
  { id: "wk-sa-1", region: "sa-east", status: "offline", last_heartbeat: null, jobs_in_progress: 0 },
  { id: "wk-us-1", region: "us-east", status: "offline", last_heartbeat: null, jobs_in_progress: 0 },
];

export const demoLogs: LogEntry[] = [
  { id: "l1", level: "info", source: "api", message: "Ambiente de demonstração iniciado", created_at: d(0) },
  { id: "l2", level: "warn", source: "scheduler", message: "Scheduler não configurado (fase 2)", created_at: d(0) },
  { id: "l3", level: "error", source: "workers", message: "Nenhum worker registrado", created_at: d(0) },
];
