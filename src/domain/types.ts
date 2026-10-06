/**
 * Domain model — mirrors the future database schema (Lovable Cloud / Postgres).
 * Field names use snake_case to map 1:1 to table columns.
 * Tables: users, profiles, sites, campaigns, campaign_settings, campaign_pages,
 * campaign_sources, campaign_locations, campaign_schedules, plans, subscriptions,
 * credits, credit_transactions, payments, jobs, job_runs, workers, logs.
 */

export type ID = string;
export type ISODate = string;

export interface Profile {
  id: ID;
  user_id: ID;
  full_name: string;
  email: string;
  company?: string;
  created_at: ISODate;
}

export type SiteStatus = "pending" | "verified" | "failed";
export interface SiteAnalysis {
  sitemap_found: boolean | null;
  url_count: number | null;
  accessible_urls: number | null;
  errors: number | null;
  redirects: number | null;
  internal_links: number | null;
  analyzed_at: ISODate | null;
}
export interface Site {
  id: ID;
  user_id: ID;
  name: string;
  domain: string;
  status: SiteStatus;
  verification_token: string;
  created_at: ISODate;
  verified_at: ISODate | null;
  analysis: SiteAnalysis | null;
}

export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "error";
export type Distribution = "fixed" | "variable";

export interface CampaignSettings {
  total_sessions: number;
  pages_per_session: number;
  min_duration_sec: number;
  max_duration_sec: number;
  desktop_pct: number; // mobile = 100 - desktop
  new_visitor_pct: number; // returning = 100 - new
}
export interface CampaignPage {
  id: ID;
  url: string;
  weight: number;
}
export type SourceType = "direct" | "referral" | "search" | "social" | "custom";
export interface CampaignSource {
  id: ID;
  type: SourceType;
  label: string;
  value?: string; // referral URL, search scenario term, network name
  weight: number;
}
export interface CampaignLocation {
  country: string;
  region: string;
  city: string;
  timezone: string;
}
export interface CampaignVolume {
  daily_limit: number;
  distribution: Distribution;
  interval_min_sec: number;
  interval_max_sec: number;
}
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface CampaignSchedule {
  start_time: string; // HH:mm
  end_time: string;
  weekdays: Weekday[];
  distribution: "even" | "peak";
  peak_hours: number[];
  timezone: string;
}

export interface CampaignDraft {
  name: string;
  site_id: ID | "";
  start_url: string;
  description: string;
  sitemap_url: string;
  settings: CampaignSettings;
  pages: CampaignPage[];
  sources: CampaignSource[];
  location: CampaignLocation;
  volume: CampaignVolume;
  schedule: CampaignSchedule;
}

export interface Campaign extends CampaignDraft {
  id: ID;
  user_id: ID;
  status: CampaignStatus;
  consumed_sessions: number;
  created_at: ISODate;
  last_run_at: ISODate | null;
}

export interface Plan {
  id: ID;
  name: string;
  tagline: string;
  price_monthly: number | null; // null = to be defined
  credits_monthly: number;
  max_sites: number | null;
  max_campaigns: number | null;
  features: string[];
  highlighted?: boolean;
  is_trial?: boolean;
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export interface Subscription {
  id: ID;
  user_id: ID;
  plan_id: ID;
  status: SubscriptionStatus;
  current_period_end: ISODate;
  cancel_at_period_end: boolean;
}

export type CreditTxType = "purchase" | "grant" | "consumption" | "expiration" | "refund";
export interface CreditTransaction {
  id: ID;
  user_id: ID;
  type: CreditTxType;
  amount: number; // + in / - out
  campaign_id?: ID;
  description: string;
  created_at: ISODate;
}

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export interface Payment {
  id: ID;
  user_id: ID;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  invoice_url: string | null;
  created_at: ISODate;
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";
export interface Job {
  id: ID;
  campaign_id: ID;
  status: JobStatus;
  scheduled_for: ISODate;
  attempts: number;
}
export interface JobRun {
  id: ID;
  job_id: ID;
  worker_id: ID;
  started_at: ISODate;
  finished_at: ISODate | null;
  pages_visited: number;
  error?: string;
}
export type WorkerStatus = "online" | "idle" | "offline";
export interface Worker {
  id: ID;
  region: string;
  status: WorkerStatus;
  last_heartbeat: ISODate | null;
  jobs_in_progress: number;
}
export type LogLevel = "info" | "warn" | "error";
export interface LogEntry {
  id: ID;
  level: LogLevel;
  source: string;
  message: string;
  created_at: ISODate;
}
