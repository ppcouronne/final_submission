"use client";

import { useMemo, useState } from "react";
import { METRICS } from "@/config/metrics";
import { formatInt, formatValue, PLATFORM_LABEL } from "@/lib/format";
import type { CampaignSummary, Report } from "@/lib/types";

type SortKey = "name" | "impressions" | "clicks" | string;

function valueOf(c: CampaignSummary, key: SortKey): number | string {
  if (key === "name") return c.campaignName.toLowerCase();
  if (key === "impressions") return c.totals.impressions;
  if (key === "clicks") return c.totals.clicks;
  const m = METRICS.find((x) => x.key === key);
  return m?.compute(c.totals) ?? -Infinity;
}

export default function CampaignTable({ report, showAccount }: { report: Report; showAccount: boolean }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "spend", dir: -1 });

  const rows = useMemo(
    () =>
      [...report.campaigns].sort((a, b) => {
        const va = valueOf(a, sort.key);
        const vb = valueOf(b, sort.key);
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
      }),
    [report.campaigns, sort],
  );

  const header = (key: SortKey, label: string, left = false) => (
    <th className={left ? "left" : undefined} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : key === "name" ? 1 : -1 }))}>
        {label}
      </button>
    </th>
  );

  return (
    <section className="card">
      <div className="section-head">
        <h2>Campaigns</h2>
        <span className="muted">{rows.length} with activity</span>
      </div>
      {rows.length === 0 ? (
        <p className="muted">No campaign activity in this period.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {header("name", "Campaign", true)}
                {showAccount && <th className="left">Account</th>}
                {header("impressions", "Impr.")}
                {header("clicks", "Clicks")}
                {METRICS.map((m) => header(m.key, m.label))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={`${c.accountId}|${c.campaignId}`}>
                  <td>
                    <span
                      className="plat-dot"
                      style={{ ["--swatch" as string]: `var(--series-${c.platform})` }}
                      aria-label={PLATFORM_LABEL[c.platform]}
                      title={PLATFORM_LABEL[c.platform]}
                    />
                    {c.campaignName}
                  </td>
                  {showAccount && <td className="left muted">{c.accountName}</td>}
                  <td>{formatInt(c.totals.impressions)}</td>
                  <td>{formatInt(c.totals.clicks)}</td>
                  {METRICS.map((m) => (
                    <td key={m.key}>{formatValue(m.compute(c.totals), m.format, report.currency)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
