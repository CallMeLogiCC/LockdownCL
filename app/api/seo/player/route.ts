import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import {
  getPlayerProfile,
  getPlayerSeasonDashboard,
  getPlayerTotals,
  getUserProfile
} from "@/lib/queries";
import { DEFAULT_SEASON } from "@/lib/seasons";
import { formatOvrLabel, getPlayerTeamLabel } from "@/lib/seo";
import { getTeamDefinitionByName } from "@/lib/teams";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get("discordId");

  if (!discordId) {
    return NextResponse.json({ error: "Missing discordId" }, { status: 400 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const [profile, totals, seasonDashboard, userProfile] = await Promise.all([
    getPlayerProfile(discordId),
    getPlayerTotals(discordId),
    getPlayerSeasonDashboard(discordId),
    getUserProfile(discordId)
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const teamLabel = getPlayerTeamLabel(profile.team, profile.status);
  const teamDef = getTeamDefinitionByName(profile.team);
  const ovrLabel = formatOvrLabel(totals.ovr_kd);
  const seasonAggregates = seasonDashboard.seasons[DEFAULT_SEASON]?.aggregates.overall;
  const seriesWins = seasonAggregates?.series_wins ?? 0;
  const seriesLosses = seasonAggregates?.series_losses ?? 0;
  const matchesPlayed = seriesWins + seriesLosses;
  const winPct = matchesPlayed > 0 ? (seriesWins / matchesPlayed) * 100 : null;
  const rankLabel =
    profile.rank_is_na || profile.rank_value === null
      ? "NA"
      : profile.rank_value.toFixed(1);

  return NextResponse.json({
    discordId,
    name: profile.discord_name ?? "Unknown",
    team: teamLabel,
    ovr: ovrLabel,
    rank: profile.rank_value,
    rankLabel,
    status: profile.status,
    avatarUrl: userProfile?.avatar_url ?? null,
    teamSlug: teamDef?.slug ?? null,
    teamLeague: teamDef?.league ?? null,
    stats: {
      overallKd: totals.ovr_kd,
      winPct,
      matchesPlayed
    }
  });
}
