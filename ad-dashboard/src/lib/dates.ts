import type { DateRange } from "./types";

const DAY = 86_400_000;

export const toISO = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(`${s}T00:00:00Z`);

export function isISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parse(s).getTime());
}

/** Last `days` full days, ending yesterday (today's data is still incomplete). */
export function lookbackRange(days: number, today = new Date()): DateRange {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - DAY);
  return { from: toISO(new Date(end.getTime() - (days - 1) * DAY)), to: toISO(end) };
}

export function daysInRange(r: DateRange): number {
  return Math.round((parse(r.to).getTime() - parse(r.from).getTime()) / DAY) + 1;
}

/** The equal-length period immediately before `r`. */
export function previousRange(r: DateRange): DateRange {
  const n = daysInRange(r);
  const prevTo = new Date(parse(r.from).getTime() - DAY);
  return { from: toISO(new Date(prevTo.getTime() - (n - 1) * DAY)), to: toISO(prevTo) };
}

export function eachDay(r: DateRange): string[] {
  const out: string[] = [];
  for (let t = parse(r.from).getTime(); t <= parse(r.to).getTime(); t += DAY) out.push(toISO(new Date(t)));
  return out;
}
