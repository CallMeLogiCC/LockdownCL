import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerById, getPlayerStatsByPlayer } from "@/lib/queries";

export default async function PlayerPage({
  params
}: {
  params: { discord_id: string };
}) {
  const player = await getPlayerById(params.discord_id);

  if (!player) {
    notFound();
  }

  const mapDetails = await getPlayerStatsByPlayer(params.discord_id);

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Player</p>
            <h2 className="text-2xl font-semibold text-white">{player.ign}</h2>
            <p className="mt-2 text-sm text-white/70">
              {player.team} · {player.rank} · Status: {player.status}
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
              <th className="px-4 py-3">Series</th>
              <th className="px-4 py-3">Opponent</th>
              <th className="px-4 py-3">Map</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Kills</th>
              <th className="px-4 py-3">Deaths</th>
              <th className="px-4 py-3">Assists</th>
              <th className="px-4 py-3">HP Time</th>
              <th className="px-4 py-3">Plants</th>
              <th className="px-4 py-3">Defuses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {mapDetails.map((stat) => (
              <tr key={stat.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white">
                  <Link href={`/series/${stat.match_id}`}>{stat.match_id}</Link>
                </td>
                <td className="px-4 py-3 text-white/70">{stat.opponent}</td>
                <td className="px-4 py-3 text-white/70">{stat.map_name}</td>
                <td className="px-4 py-3 text-white/70">{stat.mode}</td>
                <td className="px-4 py-3 text-white">{stat.kills}</td>
                <td className="px-4 py-3 text-white/70">{stat.deaths}</td>
                <td className="px-4 py-3 text-white/70">{stat.assists}</td>
                <td className="px-4 py-3 text-white/70">{stat.hp_time}s</td>
                <td className="px-4 py-3 text-white/70">{stat.plants}</td>
                <td className="px-4 py-3 text-white/70">{stat.defuses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
