import { notFound } from "next/navigation";
import { hasDatabaseUrl } from "@/lib/db";
import {
  getPlayerAggregates,
  getPlayerMapBreakdowns,
  getPlayerMatchHistory,
  getPlayerProfile
} from "@/lib/queries";
import PlayerProfileClient from "@/app/players/[discordId]/PlayerProfileClient";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params
}: {
  params: { discordId: string };
}) {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const [profile, aggregates, mapBreakdowns, matchHistory] = await Promise.all([
    getPlayerProfile(params.discordId),
    getPlayerAggregates(params.discordId),
    getPlayerMapBreakdowns(params.discordId),
    getPlayerMatchHistory(params.discordId)
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <PlayerProfileClient
      profile={profile}
      aggregates={aggregates}
      mapBreakdowns={mapBreakdowns}
      matchHistory={matchHistory}
    />
  );
}
