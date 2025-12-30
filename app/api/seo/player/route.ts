import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import { getPlayerProfile, getPlayerTotals } from "@/lib/queries";
import { formatOvrLabel, getPlayerTeamLabel } from "@/lib/seo";

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

  const [profile, totals] = await Promise.all([
    getPlayerProfile(discordId),
    getPlayerTotals(discordId)
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const teamLabel = getPlayerTeamLabel(profile.team, profile.status);
  const ovrLabel = formatOvrLabel(totals.ovr_kd);

  return NextResponse.json({
    discordId,
    name: profile.discord_name ?? "Unknown",
    team: teamLabel,
    ovr: ovrLabel,
    rank: profile.rank_value,
    status: profile.status
  });
}
