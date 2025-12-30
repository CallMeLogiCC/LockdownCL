import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import { getSeriesById } from "@/lib/queries";
import { getMatchScoreline, getMatchWinner } from "@/lib/seo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "Missing matchId" }, { status: 400 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const match = await getSeriesById(matchId);

  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    matchId,
    homeTeam: match.home_team ?? "TBD",
    awayTeam: match.away_team ?? "TBD",
    scoreline: getMatchScoreline(match),
    winner: getMatchWinner(match) ?? "TBD",
    matchDate: match.match_date
  });
}
