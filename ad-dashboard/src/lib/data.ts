import { composioSource } from "./sources/composio";
import { mockSource } from "./sources/mock";
import type { AdAccount, DataSource, DailyRow, DateRange } from "./types";

export const isLive = () => process.env.DATA_SOURCE === "composio";
const source = (): DataSource => (isLive() ? composioSource : mockSource);

// Simple in-memory cache so repeated filter changes don't re-hit the ad APIs.
const TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  value.catch(() => cache.delete(key)); // don't cache failures
  return value;
}

export function listAccounts(): Promise<AdAccount[]> {
  return cached("accounts", () => source().listAccounts());
}

export function fetchDailyRows(accounts: AdAccount[], range: DateRange): Promise<DailyRow[]> {
  // Cache per account so switching the dropdown reuses already-fetched data.
  return Promise.all(
    accounts.map((a) =>
      cached(`rows|${a.id}|${range.from}|${range.to}`, () => source().fetchDailyRows([a], range)),
    ),
  ).then((b) => b.flat());
}
