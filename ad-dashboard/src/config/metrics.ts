import type { Totals } from "@/lib/types";

/**
 * The key metrics shown on the dashboard, in display order.
 *
 * To add a metric: add an entry here. `compute` receives the raw additive
 * totals for the selection (spend, impressions, clicks, leads) and returns the
 * value, or null when it can't be computed (e.g. dividing by zero).
 */
export interface MetricDef {
  key: string;
  label: string;
  format: "currency" | "number" | "percent";
  /** Whether a higher value is good — decides the delta colour. null = neutral. */
  higherIsBetter: boolean | null;
  compute: (t: Totals) => number | null;
}

const ratio = (num: number, den: number) => (den > 0 ? num / den : null);

export const METRICS: MetricDef[] = [
  {
    key: "spend",
    label: "Spend",
    format: "currency",
    higherIsBetter: null,
    compute: (t) => t.spend,
  },
  {
    key: "cpm",
    label: "CPM",
    format: "currency",
    higherIsBetter: false,
    compute: (t) => {
      const r = ratio(t.spend, t.impressions);
      return r === null ? null : r * 1000;
    },
  },
  {
    key: "ctr",
    label: "CTR",
    format: "percent",
    higherIsBetter: true,
    compute: (t) => ratio(t.clicks, t.impressions),
  },
  {
    key: "leads",
    label: "Leads",
    format: "number",
    higherIsBetter: true,
    compute: (t) => t.leads,
  },
  {
    key: "cpl",
    label: "CPL",
    format: "currency",
    higherIsBetter: false,
    compute: (t) => ratio(t.spend, t.leads),
  },
];

export const LOOKBACK_PRESETS = [
  { days: 7, label: "Last 7 days" },
  { days: 14, label: "Last 14 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
] as const;

export const DEFAULT_LOOKBACK_DAYS = 30;
