import Link from "next/link";
import { players } from "@/lib/data";

export default function PlayersPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Players</h2>
        <p className="text-sm text-white/70">Active roster pulled from the LockdownCL database.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-white/50">
            <tr>
              <th className="px-4 py-3">IGN</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {players.map((player) => (
              <tr key={player.discord_id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-semibold text-white">{player.ign}</td>
                <td className="px-4 py-3 text-white/70">{player.team}</td>
                <td className="px-4 py-3 text-white/70">{player.rank}</td>
                <td className="px-4 py-3">
                  <Link href={`/player/${player.discord_id}`}>View profile</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
