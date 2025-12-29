import { hasDatabaseUrl } from "@/lib/db";
import { listPlayersWithStats } from "@/lib/queries";
import PlayerLists from "@/app/components/PlayerLists";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const players = await listPlayersWithStats();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Players</h2>
        <p className="text-sm text-white/70">
          Search the full current-season player directory.
        </p>
      </div>
      <PlayerLists players={players} />
    </section>
  );
}
