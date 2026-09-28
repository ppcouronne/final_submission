import { Composio } from "@composio/core";
import type { AdAccount, DailyRow, DataSource, DateRange } from "../types";

/**
 * Live data via Composio. Composio holds the OAuth tokens for your Google Ads and
 * Meta connections; we call each platform's reporting API through Composio's
 * proxy so the dashboard never handles those tokens itself.
 */

const env = (k: string, fallback = "") => process.env[k]?.trim() || fallback;

let client: Composio | null = null;
function composio(): Composio {
  if (!client) {
    const apiKey = env("COMPOSIO_API_KEY");
    if (!apiKey) throw new Error("COMPOSIO_API_KEY is not set");
    client = new Composio({ apiKey });
  }
  return client;
}

type Param = { in: "query" | "header"; name: string; value: string | number };

async function proxy<T>(
  connectionId: string,
  method: "GET" | "POST",
  endpoint: string,
  opts: { body?: unknown; parameters?: Param[] } = {},
): Promise<T> {
  const res = (await composio().tools.proxyExecute({
    connectedAccountId: connectionId,
    endpoint,
    method,
    body: opts.body,
    parameters: opts.parameters,
  })) as { status?: number; data?: unknown };
  if (res.status && res.status >= 400) {
    throw new Error(`${method} ${endpoint} failed (${res.status}): ${JSON.stringify(res.data).slice(0, 500)}`);
  }
  return res.data as T;
}

async function activeConnections(toolkit: string): Promise<string[]> {
  const res = await composio().connectedAccounts.list({
    userIds: [env("COMPOSIO_USER_ID", "default")],
    toolkitSlugs: [toolkit],
    statuses: ["ACTIVE"],
  });
  return res.items.map((c) => c.id);
}

/* ─────────────────────────── Google Ads ─────────────────────────── */

const gBase = () => `https://googleads.googleapis.com/${env("GOOGLE_ADS_API_VERSION", "v21")}`;

function gHeaders(): Param[] {
  const token = env("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!token) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is not set");
  const headers: Param[] = [{ in: "header", name: "developer-token", value: token }];
  const login = env("GOOGLE_ADS_LOGIN_CUSTOMER_ID").replace(/-/g, "");
  if (login) headers.push({ in: "header", name: "login-customer-id", value: login });
  return headers;
}

interface GSearchResponse<R> {
  results?: R[];
  nextPageToken?: string;
}

async function gaql<R>(connectionId: string, customerId: string, query: string): Promise<R[]> {
  const out: R[] = [];
  let pageToken: string | undefined;
  do {
    const page = await proxy<GSearchResponse<R>>(connectionId, "POST", `${gBase()}/customers/${customerId}/googleAds:search`, {
      body: { query, ...(pageToken ? { pageToken } : {}) },
      parameters: gHeaders(),
    });
    out.push(...(page.results ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return out;
}

async function googleAccounts(): Promise<AdAccount[]> {
  const toolkit = env("COMPOSIO_GOOGLE_ADS_TOOLKIT", "googleads");
  const allow = env("GOOGLE_ADS_CUSTOMER_IDS")
    .split(",")
    .map((s) => s.replace(/\D/g, ""))
    .filter(Boolean);
  const accounts: AdAccount[] = [];

  for (const connectionId of await activeConnections(toolkit)) {
    const { resourceNames = [] } = await proxy<{ resourceNames?: string[] }>(
      connectionId,
      "GET",
      `${gBase()}/customers:listAccessibleCustomers`,
      { parameters: gHeaders() },
    );
    const ids = resourceNames.map((r) => r.split("/")[1]).filter((id) => !allow.length || allow.includes(id));

    for (const customerId of ids) {
      try {
        const [row] = await gaql<{ customer: { descriptiveName?: string; currencyCode?: string; manager?: boolean } }>(
          connectionId,
          customerId,
          "SELECT customer.descriptive_name, customer.currency_code, customer.manager FROM customer",
        );
        if (row?.customer.manager) continue; // manager accounts have no campaigns of their own
        accounts.push({
          id: `google:${customerId}`,
          platform: "google",
          externalId: customerId,
          name: row?.customer.descriptiveName || `Google Ads ${customerId}`,
          currency: row?.customer.currencyCode || "USD",
          connectionId,
        });
      } catch (err) {
        console.warn(`Skipping Google Ads customer ${customerId}:`, (err as Error).message);
      }
    }
  }
  return accounts;
}

interface GRow {
  segments: { date: string };
  campaign: { id: string; name: string };
  metrics: { costMicros?: string; impressions?: string; clicks?: string; conversions?: number };
}

async function googleRows(a: AdAccount, range: DateRange): Promise<DailyRow[]> {
  const rows = await gaql<GRow>(
    a.connectionId!,
    a.externalId,
    `SELECT segments.date, campaign.id, campaign.name,
            metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
     FROM campaign
     WHERE segments.date BETWEEN '${range.from}' AND '${range.to}'`,
  );
  return rows.map((r) => ({
    date: r.segments.date,
    platform: "google",
    accountId: a.id,
    campaignId: r.campaign.id,
    campaignName: r.campaign.name,
    spend: Number(r.metrics.costMicros ?? 0) / 1e6,
    impressions: Number(r.metrics.impressions ?? 0),
    clicks: Number(r.metrics.clicks ?? 0),
    // Google Ads "conversions" = your primary conversion actions (set these to your lead goals).
    leads: Number(r.metrics.conversions ?? 0),
  }));
}

/* ──────────────────────────── Meta Ads ──────────────────────────── */

const mBase = () => `https://graph.facebook.com/${env("META_GRAPH_API_VERSION", "v23.0")}`;

interface MPage<R> {
  data?: R[];
  paging?: { next?: string };
}

async function metaPaged<R>(connectionId: string, url: string): Promise<R[]> {
  const out: R[] = [];
  let next: string | undefined = url;
  while (next) {
    const page: MPage<R> = await proxy<MPage<R>>(connectionId, "GET", next);
    out.push(...(page.data ?? []));
    next = page.paging?.next;
  }
  return out;
}

async function metaAccounts(): Promise<AdAccount[]> {
  const toolkit = env("COMPOSIO_META_ADS_TOOLKIT", "facebook");
  const accounts: AdAccount[] = [];
  for (const connectionId of await activeConnections(toolkit)) {
    const list = await metaPaged<{ id: string; name: string; currency: string }>(
      connectionId,
      `${mBase()}/me/adaccounts?fields=id,name,currency&limit=200`,
    );
    for (const m of list) {
      accounts.push({
        id: `meta:${m.id}`,
        platform: "meta",
        externalId: m.id, // "act_123…"
        name: m.name,
        currency: m.currency,
        connectionId,
      });
    }
  }
  return accounts;
}

interface MInsight {
  date_start: string;
  campaign_id: string;
  campaign_name: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: { action_type: string; value: string }[];
}

function metaLeads(actions: MInsight["actions"]): number {
  const priority = env("META_LEAD_ACTION_TYPES", "lead,onsite_conversion.lead_grouped,offsite_conversion.fb_pixel_lead")
    .split(",")
    .map((s) => s.trim());
  for (const type of priority) {
    const hit = actions?.find((x) => x.action_type === type);
    if (hit) return Number(hit.value);
  }
  return 0;
}

async function metaRows(a: AdAccount, range: DateRange): Promise<DailyRow[]> {
  const qs = new URLSearchParams({
    level: "campaign",
    time_increment: "1",
    time_range: JSON.stringify({ since: range.from, until: range.to }),
    fields: "campaign_id,campaign_name,spend,impressions,clicks,actions",
    limit: "500",
  });
  const rows = await metaPaged<MInsight>(a.connectionId!, `${mBase()}/${a.externalId}/insights?${qs}`);
  return rows.map((r) => ({
    date: r.date_start,
    platform: "meta",
    accountId: a.id,
    campaignId: r.campaign_id,
    campaignName: r.campaign_name,
    spend: Number(r.spend ?? 0),
    impressions: Number(r.impressions ?? 0),
    clicks: Number(r.clicks ?? 0),
    leads: metaLeads(r.actions),
  }));
}

/* ──────────────────────────── Source ───────────────────────────── */

export const composioSource: DataSource = {
  async listAccounts() {
    const results = await Promise.allSettled([googleAccounts(), metaAccounts()]);
    const accounts: AdAccount[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") accounts.push(...r.value);
      else console.error("Failed to list ad accounts:", r.reason);
    }
    return accounts.sort((x, y) => x.name.localeCompare(y.name));
  },
  async fetchDailyRows(accounts, range) {
    const batches = await Promise.all(
      accounts.map((a) => (a.platform === "google" ? googleRows(a, range) : metaRows(a, range))),
    );
    return batches.flat();
  },
};
