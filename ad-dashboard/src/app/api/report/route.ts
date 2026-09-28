import { NextRequest, NextResponse } from "next/server";
import { daysInRange, isISODate } from "@/lib/dates";
import { buildReport } from "@/lib/report";
import type { Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_DAYS = 366;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const from = q.get("from");
  const to = q.get("to");
  const platform = (q.get("platform") ?? "all") as Platform | "all";
  const accountId = q.get("account") ?? "all";

  if (!isISODate(from) || !isISODate(to) || from > to) {
    return NextResponse.json({ error: "from/to must be valid YYYY-MM-DD dates with from <= to" }, { status: 400 });
  }
  if (daysInRange({ from, to }) > MAX_DAYS) {
    return NextResponse.json({ error: `Range is limited to ${MAX_DAYS} days` }, { status: 400 });
  }
  if (!["all", "google", "meta"].includes(platform)) {
    return NextResponse.json({ error: "platform must be all, google or meta" }, { status: 400 });
  }

  try {
    return NextResponse.json(await buildReport({ accountId, platform, range: { from, to } }));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
