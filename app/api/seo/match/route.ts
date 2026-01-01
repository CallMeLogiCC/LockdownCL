import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import { getSeriesById } from "@/lib/queries";
import { getMatchScoreline, getMatchWinner } from "@/lib/seo";
import { getTeamDefinitionByName } from "@/lib/teams";

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

  const homeTeam = match.home_team ?? "TBD";
  const awayTeam = match.away_team ?? "TBD";
  const homeDef = getTeamDefinitionByName(match.home_team);
  const awayDef = getTeamDefinitionByName(match.away_team);

  return NextResponse.json({
    matchId,
    homeTeam,
    awayTeam,
    scoreline: getMatchScoreline(match),
    winner: getMatchWinner(match) ?? "TBD",
    matchDate: match.match_date,
    season: match.season,
    homeTeamSlug: homeDef?.slug ?? null,
    homeTeamLeague: homeDef?.league ?? null,
    awayTeamSlug: awayDef?.slug ?? null,
    awayTeamLeague: awayDef?.league ?? null
  });
}
