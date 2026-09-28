import { METRICS, type MetricDef } from "@/config/metrics";
import { formatValue } from "@/lib/format";
import type { Report } from "@/lib/types";

function Delta({ m, cur, prev, nDays }: { m: MetricDef; cur: number | null; prev: number | null; nDays: number }) {
  if (cur === null || prev === null || prev === 0) {
    return <div className="delta">No data for previous {nDays} days</div>;
  }
  const change = (cur - prev) / Math.abs(prev);
  const flat = Math.abs(change) < 0.005;
  const up = change > 0;
  const tone = flat || m.higherIsBetter === null ? "flat" : up === m.higherIsBetter ? "good" : "bad";
  const pct = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(Math.abs(change));
  return (
    <div className="delta">
      <span className={tone}>
        {flat ? "● " : up ? "▲ " : "▼ "}
        {flat ? "0%" : `${up ? "+" : "−"}${pct}`}
      </span>{" "}
      vs previous {nDays} days
    </div>
  );
}

export default function KpiTiles({ report, nDays }: { report: Report; nDays: number }) {
  return (
    <section className="kpis" aria-label="Key metrics">
      {METRICS.map((m) => {
        const cur = m.compute(report.totals);
        const prev = m.compute(report.previousTotals);
        return (
          <div key={m.key} className="card kpi">
            <div className="label">{m.label}</div>
            <div className="value" title={formatValue(cur, m.format, report.currency)}>
              {formatValue(cur, m.format, report.currency, true)}
            </div>
            <Delta m={m} cur={cur} prev={prev} nDays={nDays} />
          </div>
        );
      })}
    </section>
  );
}
