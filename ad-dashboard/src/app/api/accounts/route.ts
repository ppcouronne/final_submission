import { NextResponse } from "next/server";
import { isLive, listAccounts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await listAccounts();
    // Never send connection ids to the browser.
    return NextResponse.json({
      live: isLive(),
      accounts: accounts.map(({ connectionId: _c, ...a }) => a),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
