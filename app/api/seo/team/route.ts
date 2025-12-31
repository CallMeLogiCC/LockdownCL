import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import { getMatchesByTeam } from "@/lib/queries";
import { computeTeamRecord, getTeamLeagueLabel } from "@/lib/seo";
import { getTeamDefinitionBySlug } from "@/lib/teams";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const teamDef = getTeamDefinitionBySlug(slug);
  const team = teamDef?.displayName ?? null;

  if (!teamDef || !team) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const matches = await getMatchesByTeam(team);
  const record = computeTeamRecord(team, matches);

  return NextResponse.json({
    team,
    league: getTeamLeagueLabel(team),
    record: `${record.seriesWins}-${record.seriesLosses}`,
    mapDiff: record.mapDiff
  });
}
