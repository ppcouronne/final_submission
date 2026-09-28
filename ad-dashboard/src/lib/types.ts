export type Platform = "google" | "meta";

export interface AdAccount {
  /** Stable id used across the app, e.g. "google:1234567890" or "meta:act_123". */
  id: string;
  platform: Platform;
  /** Id on the ad platform itself. */
  externalId: string;
  name: string;
  currency: string;
  /** Composio connected-account id used to authorize requests (live mode only). */
  connectionId?: string;
}

/** One campaign on one day. Every report is aggregated from these rows. */
export interface DailyRow {
  date: string; // YYYY-MM-DD
  platform: Platform;
  accountId: string;
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

/** Raw additive totals — derived metrics are computed from these. */
export interface Totals {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export interface DateRange {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
}

export interface ReportRequest {
  accountId: string | "all";
  platform: Platform | "all";
  range: DateRange;
}

export interface CampaignSummary {
  platform: Platform;
  accountId: string;
  accountName: string;
  campaignId: string;
  campaignName: string;
  totals: Totals;
}

export interface Report {
  range: DateRange;
  previousRange: DateRange;
  currency: string;
  /** True when the selection mixes accounts with different currencies. */
  mixedCurrency: boolean;
  totals: Totals;
  previousTotals: Totals;
  /** Per-day totals for each platform in the selection. */
  daily: { date: string; platform: Platform; totals: Totals }[];
  campaigns: CampaignSummary[];
}

export interface DataSource {
  listAccounts(): Promise<AdAccount[]>;
  fetchDailyRows(accounts: AdAccount[], range: DateRange): Promise<DailyRow[]>;
}
