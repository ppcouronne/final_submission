import { eachDay } from "../dates";
import type { AdAccount, DailyRow, DataSource, DateRange, Platform } from "../types";

/** Demo data so the dashboard works before any ad account is connected. */

const ACCOUNTS: (AdAccount & { campaigns: string[] })[] = [
  acct("google", "1234567890", "Acme Dental — Google", ["Search | Brand", "Search | Implants", "PMax | Local"]),
  acct("google", "2345678901", "Northside Roofing — Google", ["Search | Emergency repair", "Search | Replacement"]),
  acct("google", "3456789012", "Harbor Law — Google", ["Search | Personal injury", "Display | Remarketing"]),
  acct("meta", "act_4567890123", "Acme Dental — Meta", ["Lead form | Free consult", "Retargeting | Site visitors"]),
  acct("meta", "act_5678901234", "Northside Roofing — Meta", ["Lead form | Spring promo", "Awareness | Local reach"]),
  acct("meta", "act_6789012345", "Harbor Law — Meta", ["Lead form | Case review"]),
];

function acct(platform: Platform, externalId: string, name: string, campaigns: string[]) {
  return { id: `${platform}:${externalId}`, platform, externalId, name, currency: "CAD", campaigns };
}

// Small deterministic PRNG so numbers are stable between reloads.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  // Avalanche so near-identical strings (consecutive dates) don't give near-identical numbers.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function row(a: AdAccount, campaign: string, idx: number, date: string): DailyRow {
  const seed = `${a.id}|${idx}`;
  const base = 40 + hash(seed) * 180; // daily budget-ish
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const weekly = dow === 0 || dow === 6 ? 0.75 : 1.05;
  const noise = 0.8 + hash(`${seed}|${date}`) * 0.4;
  const spend = base * weekly * noise;
  const cpm = a.platform === "meta" ? 9 + hash(seed + "cpm") * 8 : 18 + hash(seed + "cpm") * 25;
  const impressions = Math.round((spend / cpm) * 1000);
  const ctr = a.platform === "meta" ? 0.008 + hash(seed + "ctr") * 0.012 : 0.03 + hash(seed + "ctr") * 0.05;
  const clicks = Math.round(impressions * ctr * (0.85 + hash(`${seed}|${date}|c`) * 0.3));
  const cvr = 0.04 + hash(seed + "cvr") * 0.1;
  const leads = Math.round(clicks * cvr * (0.6 + hash(`${seed}|${date}|l`) * 0.8));
  return {
    date,
    platform: a.platform,
    accountId: a.id,
    campaignId: `${a.externalId}-${idx}`,
    campaignName: campaign,
    spend: Math.round(spend * 100) / 100,
    impressions,
    clicks,
    leads,
  };
}

export const mockSource: DataSource = {
  async listAccounts() {
    return ACCOUNTS.map(({ campaigns: _c, ...a }) => a);
  },
  async fetchDailyRows(accounts: AdAccount[], range: DateRange) {
    const days = eachDay(range);
    const wanted = new Set(accounts.map((a) => a.id));
    return ACCOUNTS.filter((a) => wanted.has(a.id)).flatMap((a) =>
      a.campaigns.flatMap((c, i) => days.map((d) => row(a, c, i, d))),
    );
  },
};
