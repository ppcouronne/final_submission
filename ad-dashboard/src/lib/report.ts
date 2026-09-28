import { fetchDailyRows, listAccounts } from "./data";
import { eachDay, previousRange } from "./dates";
import type { CampaignSummary, DailyRow, Platform, Report, ReportRequest, Totals } from "./types";

const zero = (): Totals => ({ spend: 0, impressions: 0, clicks: 0, leads: 0 });

function add(t: Totals, r: DailyRow) {
  t.spend += r.spend;
  t.impressions += r.impressions;
  t.clicks += r.clicks;
  t.leads += r.leads;
}

export async function buildReport(req: ReportRequest): Promise<Report> {
  const all = await listAccounts();
  const accounts = all.filter(
    (a) =>
      (req.accountId === "all" || a.id === req.accountId) && (req.platform === "all" || a.platform === req.platform),
  );
  const prev = previousRange(req.range);

  const [rows, prevRows] = await Promise.all([fetchDailyRows(accounts, req.range), fetchDailyRows(accounts, prev)]);

  const totals = zero();
  rows.forEach((r) => add(totals, r));
  const previousTotals = zero();
  prevRows.forEach((r) => add(previousTotals, r));

  // Daily totals per platform, with zero-filled days so lines don't skip gaps.
  const platforms = [...new Set(accounts.map((a) => a.platform))].sort() as Platform[];
  const byDay = new Map<string, Totals>();
  for (const p of platforms) for (const d of eachDay(req.range)) byDay.set(`${p}|${d}`, zero());
  rows.forEach((r) => {
    const t = byDay.get(`${r.platform}|${r.date}`);
    if (t) add(t, r);
  });
  const daily = [...byDay.entries()].map(([k, t]) => {
    const [platform, date] = k.split("|") as [Platform, string];
    return { date, platform, totals: t };
  });

  const names = new Map(all.map((a) => [a.id, a.name]));
  const byCampaign = new Map<string, CampaignSummary>();
  rows.forEach((r) => {
    const key = `${r.accountId}|${r.campaignId}`;
    let c = byCampaign.get(key);
    if (!c) {
      c = {
        platform: r.platform,
        accountId: r.accountId,
        accountName: names.get(r.accountId) ?? r.accountId,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        totals: zero(),
      };
      byCampaign.set(key, c);
    }
    add(c.totals, r);
  });

  const currencies = [...new Set(accounts.map((a) => a.currency))];
  return {
    range: req.range,
    previousRange: prev,
    currency: currencies[0] ?? "USD",
    mixedCurrency: currencies.length > 1,
    totals,
    previousTotals,
    daily,
    campaigns: [...byCampaign.values()].sort((a, b) => b.totals.spend - a.totals.spend),
  };
}
