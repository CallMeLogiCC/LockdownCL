import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDatabaseUrl } from "@/lib/db";
import { getPlayerById, getPlayerStatsByPlayer } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params
}: {
  params: { discord_id: string };
}) {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const player = await getPlayerById(params.discord_id);

  if (!player) {
    notFound();
  }

  const mapDetails = await getPlayerStatsByPlayer(params.discord_id);
  const displayRank = player.rank_is_na
    ? "NA"
    : player.rank_value !== null
      ? player.rank_value
      : "NA";

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Player</p>
            <h2 className="text-2xl font-semibold text-white">
              {player.ign ?? "Unknown"}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {player.team ?? "Unassigned"} · Rank: {displayRank} · Status:{" "}
              {player.status ?? "unknown"}
            </p>
          </div>
          <Link href="/players" className="text-sm">
            ← Back to players
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-white/50">
            <tr>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Kills</th>
              <th className="px-4 py-3">Deaths</th>
              <th className="px-4 py-3">KD</th>
              <th className="px-4 py-3">HP Time</th>
              <th className="px-4 py-3">Plants</th>
              <th className="px-4 py-3">Defuses</th>
              <th className="px-4 py-3">Ticks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {mapDetails.map((stat) => (
              <tr key={`${stat.discord_id}-${stat.mode}`} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white/70">{stat.mode}</td>
                <td className="px-4 py-3 text-white">{stat.k}</td>
                <td className="px-4 py-3 text-white/70">{stat.d}</td>
                <td className="px-4 py-3 text-white/70">
                  {stat.kd !== null ? stat.kd.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 text-white/70">
                  {stat.hp_time !== null ? `${stat.hp_time}s` : "—"}
                </td>
                <td className="px-4 py-3 text-white/70">
                  {stat.plants !== null ? stat.plants : "—"}
                </td>
                <td className="px-4 py-3 text-white/70">
                  {stat.defuses !== null ? stat.defuses : "—"}
                </td>
                <td className="px-4 py-3 text-white/70">
                  {stat.ticks !== null ? stat.ticks : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
