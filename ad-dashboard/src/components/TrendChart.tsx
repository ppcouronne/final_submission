"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { METRICS } from "@/config/metrics";
import { formatDate, formatValue, PLATFORM_LABEL } from "@/lib/format";
import type { Platform, Report } from "@/lib/types";

const HEIGHT = 260;
const M = { top: 12, right: 76, bottom: 28, left: 64 };

/** Round a max value up to a "nice" axis ceiling and return the tick values. */
function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw)!;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export default function TrendChart({ report }: { report: Report }) {
  const [metricKey, setMetricKey] = useState(METRICS[0].key);
  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];

  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { dates, series } = useMemo(() => {
    const dates = [...new Set(report.daily.map((d) => d.date))].sort();
    const platforms = [...new Set(report.daily.map((d) => d.platform))].sort() as Platform[];
    const series = platforms.map((p) => {
      const byDate = new Map(report.daily.filter((d) => d.platform === p).map((d) => [d.date, metric.compute(d.totals)]));
      return { platform: p, values: dates.map((d) => byDate.get(d) ?? null) };
    });
    return { dates, series };
  }, [report.daily, metric]);

  const [hover, setHover] = useState<number | null>(null);

  const innerW = width - M.left - M.right;
  const innerH = HEIGHT - M.top - M.bottom;
  const maxV = Math.max(0, ...series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const ticks = niceTicks(maxV);
  const yMax = ticks[ticks.length - 1] || 1;
  const x = (i: number) => M.left + (dates.length <= 1 ? innerW / 2 : (i / (dates.length - 1)) * innerW);
  const y = (v: number) => M.top + innerH - (v / yMax) * innerH;

  const path = (values: (number | null)[]) => {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const xTickEvery = Math.max(1, Math.ceil(dates.length / Math.max(2, Math.floor(innerW / 90))));
  const fmt = (v: number | null) => formatValue(v, metric.format, report.currency);
  const fmtAxis = (v: number) => formatValue(v, metric.format, report.currency, true);

  // Direct end-labels only when they won't collide (2 series max here).
  const lastVals = series.map((s) => [...s.values].reverse().find((v) => v !== null) ?? null);
  const endLabelsFit =
    series.length > 1 && lastVals.every((v) => v !== null) && Math.abs(y(lastVals[0]!) - y(lastVals[1]!)) >= 14;

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = dates.length <= 1 ? 0 : Math.round(((px - M.left) / innerW) * (dates.length - 1));
    setHover(Math.min(dates.length - 1, Math.max(0, i)));
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>{metric.label} by day</h2>
        <div className="seg" role="group" aria-label="Chart metric">
          {METRICS.map((m) => (
            <button key={m.key} type="button" aria-pressed={m.key === metric.key} onClick={() => setMetricKey(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {series.length > 1 && (
        <div className="legend" style={{ marginBottom: 8 }}>
          {series.map((s) => (
            <span key={s.platform} style={{ ["--swatch" as string]: `var(--series-${s.platform})` }}>
              {PLATFORM_LABEL[s.platform]}
            </span>
          ))}
        </div>
      )}

      <div className="chart-wrap" ref={wrapRef}>
        <svg height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={`${metric.label} per day by platform`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--axis)" : "var(--grid)"} strokeWidth={1} />
              <text className="tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {fmtAxis(t)}
              </text>
            </g>
          ))}
          {dates.map((d, i) =>
            i % xTickEvery === 0 ? (
              <text key={d} className="tick" x={x(i)} y={HEIGHT - 8} textAnchor="middle">
                {formatDate(d)}
              </text>
            ) : null,
          )}

          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + innerH} stroke="var(--axis)" strokeWidth={1} />}

          {series.map((s) => (
            <path
              key={s.platform}
              d={path(s.values)}
              fill="none"
              stroke={`var(--series-${s.platform})`}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hover !== null &&
            series.map((s) =>
              s.values[hover] !== null ? (
                <circle
                  key={s.platform}
                  cx={x(hover)}
                  cy={y(s.values[hover]!)}
                  r={4}
                  fill={`var(--series-${s.platform})`}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ) : null,
            )}

          {endLabelsFit &&
            series.map((s, i) => (
              <text key={s.platform} className="end-label" x={width - M.right + 8} y={y(lastVals[i]!)} dy="0.32em">
                {s.platform === "google" ? "Google" : "Meta"}
              </text>
            ))}

          <rect
            x={M.left}
            y={M.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hover !== null && (
          <div
            className="tooltip"
            style={{
              left: x(hover) > width / 2 ? undefined : x(hover) + 12,
              right: x(hover) > width / 2 ? width - x(hover) + 12 : undefined,
              top: M.top,
            }}
          >
            <div className="t-date">{formatDate(dates[hover], { weekday: "short", month: "short", day: "numeric" })}</div>
            {series.map((s) => (
              <div key={s.platform} className="t-row">
                <span style={{ ["--swatch" as string]: `var(--series-${s.platform})` }}>{PLATFORM_LABEL[s.platform]}</span>
                <span>{fmt(s.values[hover])}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="data-table">
        <summary>View as table</summary>
        <div className="table-scroll" style={{ marginTop: 8 }}>
          <table>
            <thead>
              <tr>
                <th className="left">Date</th>
                {series.map((s) => (
                  <th key={s.platform}>{PLATFORM_LABEL[s.platform]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((d, i) => (
                <tr key={d}>
                  <td className="left">{formatDate(d, { weekday: "short", month: "short", day: "numeric" })}</td>
                  {series.map((s) => (
                    <td key={s.platform}>{fmt(s.values[i])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
