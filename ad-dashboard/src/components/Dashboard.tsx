"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOOKBACK_DAYS, LOOKBACK_PRESETS, METRICS } from "@/config/metrics";
import { daysInRange, lookbackRange } from "@/lib/dates";
import { formatDate, PLATFORM_LABEL } from "@/lib/format";
import type { AdAccount, Platform, Report } from "@/lib/types";
import CampaignTable from "./CampaignTable";
import KpiTiles from "./KpiTiles";
import TrendChart from "./TrendChart";

type PlatformFilter = Platform | "all";

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Filters live in the URL so a view can be bookmarked or shared.
  const accountId = params.get("account") ?? "all";
  const platform = (params.get("platform") ?? "all") as PlatformFilter;
  const lookback = params.get("lookback") ?? String(DEFAULT_LOOKBACK_DAYS);
  const isCustom = lookback === "custom";
  const range = useMemo(() => {
    if (isCustom) {
      const fallback = lookbackRange(DEFAULT_LOOKBACK_DAYS);
      return { from: params.get("from") ?? fallback.from, to: params.get("to") ?? fallback.to };
    }
    return lookbackRange(Number(lookback) || DEFAULT_LOOKBACK_DAYS);
  }, [isCustom, lookback, params]);

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const [accounts, setAccounts] = useState<AdAccount[] | null>(null);
  const [live, setLive] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setAccounts(j.accounts);
        setLive(j.live);
      })
      .catch((e) => setError(`Couldn't load ad accounts: ${e.message}`));
  }, []);

  const selectedAccount = accounts?.find((a) => a.id === accountId);
  const effectivePlatform: PlatformFilter = selectedAccount ? selectedAccount.platform : platform;

  useEffect(() => {
    if (!accounts || range.from > range.to) return;
    const ctrl = new AbortController();
    setLoading(true);
    const q = new URLSearchParams({ account: accountId, platform: effectivePlatform, from: range.from, to: range.to });
    fetch(`/api/report?${q}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setReport(j);
        setError(null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(`Couldn't load report: ${e.message}`);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [accounts, accountId, effectivePlatform, range.from, range.to]);

  const grouped = useMemo(() => {
    const g: Record<Platform, AdAccount[]> = { google: [], meta: [] };
    accounts?.forEach((a) => g[a.platform].push(a));
    return g;
  }, [accounts]);

  const nDays = daysInRange(range);

  return (
    <main className="shell">
      <header className="header">
        <div>
          <h1>
            Campaign dashboard
            {!live && accounts && <span className="badge">Demo data</span>}
          </h1>
          <div className="sub">
            {selectedAccount ? selectedAccount.name : "All accounts"} · {formatDate(range.from, { month: "short", day: "numeric", year: "numeric" })} –{" "}
            {formatDate(range.to, { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </header>

      <div className="filters" role="group" aria-label="Filters">
        <div className="field account">
          <label htmlFor="account">Account</label>
          <select id="account" value={accountId} onChange={(e) => setParams({ account: e.target.value === "all" ? null : e.target.value })}>
            <option value="all">All accounts{accounts ? ` (${accounts.length})` : ""}</option>
            {(["google", "meta"] as Platform[]).map(
              (p) =>
                grouped[p].length > 0 && (
                  <optgroup key={p} label={PLATFORM_LABEL[p]}>
                    {grouped[p].map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                ),
            )}
          </select>
        </div>

        <div className="field">
          <label id="platform-label">Platform</label>
          <div className="seg" role="group" aria-labelledby="platform-label">
            {(["all", "google", "meta"] as PlatformFilter[]).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={effectivePlatform === p}
                disabled={!!selectedAccount}
                title={selectedAccount ? "Set by the selected account" : undefined}
                onClick={() => setParams({ platform: p === "all" ? null : p })}
              >
                {p === "all" ? "All" : p === "google" ? "Google" : "Meta"}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="lookback">Lookback period</label>
          <select
            id="lookback"
            value={lookback}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "custom") setParams({ lookback: "custom", from: range.from, to: range.to });
              else setParams({ lookback: v === String(DEFAULT_LOOKBACK_DAYS) ? null : v, from: null, to: null });
            }}
          >
            {LOOKBACK_PRESETS.map((p) => (
              <option key={p.days} value={String(p.days)}>
                {p.label}
              </option>
            ))}
            <option value="custom">Custom range…</option>
          </select>
        </div>

        {isCustom && (
          <>
            <div className="field">
              <label htmlFor="from">From</label>
              <input id="from" type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && setParams({ from: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="to">To</label>
              <input id="to" type="date" value={range.to} min={range.from} onChange={(e) => e.target.value && setParams({ to: e.target.value })} />
            </div>
          </>
        )}

        <div className="range-note">
          Compared with the previous {nDays} {nDays === 1 ? "day" : "days"}
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}
      {accounts && accounts.length === 0 && (
        <div className="notice">No ad accounts found. Connect Google Ads or Meta Ads in Composio, then reload.</div>
      )}
      {report?.mixedCurrency && (
        <div className="notice">
          This selection mixes accounts in different currencies, so totals add them as-is. Pick a single account for exact figures.
        </div>
      )}

      {report && (
        <div className={`stack ${loading ? "loading" : ""}`} aria-busy={loading}>
          <KpiTiles report={report} nDays={nDays} />
          <TrendChart report={report} />
          <CampaignTable report={report} showAccount={!selectedAccount} />
        </div>
      )}
      {!report && !error && <div className="notice">Loading…</div>}

      <p className="muted" style={{ marginTop: 24, fontSize: 12 }}>
        Metrics: {METRICS.map((m) => m.label).join(", ")}. Data excludes today (still incomplete on both platforms).
      </p>
    </main>
  );
}
