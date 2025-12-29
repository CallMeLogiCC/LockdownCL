import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import {
  getPlayerById,
  getPlayerMatchSummaries,
  getPlayerModeStats,
  getPlayerTotals
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { discord_id: string } }
) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 500 }
    );
  }

  const player = await getPlayerById(params.discord_id);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const [totals, modes, matches] = await Promise.all([
    getPlayerTotals(params.discord_id),
    getPlayerModeStats(params.discord_id),
    getPlayerMatchSummaries(params.discord_id)
  ]);

  return NextResponse.json({ player, totals, modes, matches });
}
