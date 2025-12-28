import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMapsBySeries,
  getPlayerStatsBySeries,
  getSeriesById
} from "@/lib/queries";

export default async function SeriesPage({ params }: { params: { match_id: string } }) {
  const match = await getSeriesById(params.match_id);

  if (!match) {
    notFound();
  }

  const maps = await getMapsBySeries(params.match_id);
  const statsWithPlayer = await getPlayerStatsBySeries(params.match_id);

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Series</p>
            <h2 className="text-2xl font-semibold text-white">
              {match.home_team} vs {match.away_team}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {match.match_date} · Division: {match.division}
            </p>
          </div>
          <Link href="/players" className="text-sm">
            ← Back to players
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/70">
          <span>Scoreline: {match.home_wins} - {match.away_wins}</span>
          <span>Winner: {match.series_winner}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Maps in Series</h3>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          {maps.map((map) => (
            <li key={map.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Map {map.map_number}: {map.map_name} ({map.mode})
              </span>
              <span className="text-white/50">Winner: {map.winning_team}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-white/50">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Map</th>
              <th className="px-4 py-3">Kills</th>
              <th className="px-4 py-3">Deaths</th>
              <th className="px-4 py-3">Assists</th>
              <th className="px-4 py-3">HP Time</th>
              <th className="px-4 py-3">Plants</th>
              <th className="px-4 py-3">Defuses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {statsWithPlayer.map((stat) => (
              <tr key={stat.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white">
                  <Link href={`/player/${stat.discord_id}`}>{stat.ign}</Link>
                </td>
                <td className="px-4 py-3 text-white/70">{stat.team}</td>
                <td className="px-4 py-3 text-white/70">
                  {stat.map_name} ({stat.mode})
                </td>
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
