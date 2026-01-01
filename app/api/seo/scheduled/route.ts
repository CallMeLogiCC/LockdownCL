import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import { getScheduleBySlug } from "@/lib/queries";
import { DEFAULT_SEASON } from "@/lib/seasons";
import { normalizeScheduleDivision } from "@/lib/schedule";
import { getTeamDefinitionByName } from "@/lib/teams";

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

  const scheduleEntry = await getScheduleBySlug(slug, DEFAULT_SEASON);

  if (!scheduleEntry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const homeTeam = scheduleEntry.home_team ?? "TBD";
  const awayTeam = scheduleEntry.away_team ?? "TBD";
  const homeDef = getTeamDefinitionByName(scheduleEntry.home_team);
  const awayDef = getTeamDefinitionByName(scheduleEntry.away_team);

  return NextResponse.json({
    slug,
    homeTeam,
    awayTeam,
    division: normalizeScheduleDivision(scheduleEntry.division) ?? "TBD",
    week: scheduleEntry.week,
    matchTime: scheduleEntry.match_time,
    homeTeamSlug: homeDef?.slug ?? null,
    homeTeamLeague: homeDef?.league ?? null,
    awayTeamSlug: awayDef?.slug ?? null,
    awayTeamLeague: awayDef?.league ?? null
  });
}
