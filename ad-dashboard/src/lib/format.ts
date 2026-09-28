import type { MetricDef } from "@/config/metrics";

export function formatValue(v: number | null, format: MetricDef["format"], currency: string, compact = false): string {
  if (v === null || !isFinite(v)) return "—";
  switch (format) {
    case "currency": {
      // Compact: $12.9K above 10k, whole units above 100, cents below.
      const big = compact && Math.abs(v) >= 10_000;
      const digits = big ? 1 : compact && (Math.abs(v) >= 100 || v === 0) ? 0 : 2;
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        notation: big ? "compact" : "standard",
        maximumFractionDigits: digits,
        minimumFractionDigits: big ? 0 : digits,
      }).format(v);
    }
    case "percent":
      return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(v);
    case "number":
      return new Intl.NumberFormat(undefined, {
        notation: compact && Math.abs(v) >= 10_000 ? "compact" : "standard",
        maximumFractionDigits: compact && Math.abs(v) >= 10_000 ? 1 : 0,
      }).format(v);
  }
}

export function formatInt(v: number): string {
  return new Intl.NumberFormat().format(Math.round(v));
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: "UTC" });
}

export const PLATFORM_LABEL = { google: "Google Ads", meta: "Meta Ads" } as const;
