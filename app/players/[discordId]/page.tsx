import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDatabaseUrl } from "@/lib/db";
import {
  getMapsByMatchIds,
  getPlayerById,
  getPlayerMatchModeStats,
  getPlayerMatchSummaries,
  getPlayerMatchTeams,
  getPlayerModeStats,
  getPlayerTotals
} from "@/lib/queries";
import type { PlayerModeStat } from "@/lib/types";

export const dynamic = "force-dynamic";

const formatIgn = (ign: string | null) => (ign && ign.trim() ? ign : "N/A");

const formatRank = (rankValue: number | null, isNa: boolean) => {
  if (isNa || rankValue === null) {
    return "NA";
  }
  return rankValue.toFixed(1);
};

const formatKd = (kills: number, deaths: number) => {
  if (kills === 0 && deaths === 0) {
    return "—";
  }
  if (deaths === 0) {
    return "inf";
  }
  return (kills / deaths).toFixed(2);
};

const buildModeStat = (stats: PlayerModeStat[], mode: string) =>
  stats.find((stat) => stat.mode === mode) ?? {
    mode,
    k: 0,
    d: 0,
    kd: null,
    hp_time: null,
    plants: null,
    defuses: null,
    ticks: null
  };

const getModeWinPercentage = (
  mode: string,
  playerTeams: Array<{ match_id: string; mode: string; team: string | null }>,
  maps: Array<{
    match_id: string;
    mode: string;
    winner_team: string;
    losing_team: string;
  }>
) => {
  const entries = playerTeams.filter((entry) => entry.mode === mode && entry.team);
  let wins = 0;
  let losses = 0;

  entries.forEach((entry) => {
    maps
      .filter((map) => map.match_id === entry.match_id && map.mode === mode)
      .forEach((map) => {
        if (map.winner_team === entry.team) {
          wins += 1;
        } else if (map.losing_team === entry.team) {
          losses += 1;
        }
      });
  });

  const total = wins + losses;
  if (total === 0) {
    return "—";
  }
  return `${((wins / total) * 100).toFixed(1)}%`;
};

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

  const player = await getPlayerById(params.discordId);
  if (!player) {
    notFound();
  }

  const [totals, modeStats, matchSummaries, playerTeams] = await Promise.all([
    getPlayerTotals(params.discordId),
    getPlayerModeStats(params.discordId),
    getPlayerMatchSummaries(params.discordId),
    getPlayerMatchTeams(params.discordId)
  ]);

  const matchIds = matchSummaries.map((match) => match.match_id);
  const [mapLogs, matchModeStats] = await Promise.all([
    getMapsByMatchIds(matchIds),
    getPlayerMatchModeStats(params.discordId, matchIds)
  ]);

  const hpStat = buildModeStat(modeStats, "Hardpoint");
  const sndStat = buildModeStat(modeStats, "SnD");
  const ctrlStat = buildModeStat(modeStats, "Control");

  const rankDisplay = formatRank(player.rank_value, player.rank_is_na);

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Player</p>
            <h2 className="text-2xl font-semibold text-white">
              {player.discord_name ?? "Unknown"}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              IGN: {formatIgn(player.ign)} · Team: {player.team ?? "—"} · Rank: {rankDisplay} ·
              Status: {player.status ?? "—"}
            </p>
          </div>
          <Link href="/" className="text-sm">
            ← Back to home
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/50">Overall</h3>
          <p className="mt-2 text-2xl font-semibold text-white">{formatKd(totals.total_k, totals.total_d)}</p>
          <p className="text-sm text-white/70">
            {totals.total_k} K · {totals.total_d} D
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/50">Hardpoint</h3>
          <p className="mt-2 text-2xl font-semibold text-white">{formatKd(hpStat.k, hpStat.d)}</p>
          <p className="text-sm text-white/70">HP Win %: {getModeWinPercentage("Hardpoint", playerTeams, mapLogs)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/50">Search &amp; Destroy</h3>
          <p className="mt-2 text-2xl font-semibold text-white">{formatKd(sndStat.k, sndStat.d)}</p>
          <p className="text-sm text-white/70">SnD Win %: {getModeWinPercentage("SnD", playerTeams, mapLogs)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/50">Control</h3>
          <p className="mt-2 text-2xl font-semibold text-white">{formatKd(ctrlStat.k, ctrlStat.d)}</p>
          <p className="text-sm text-white/70">CTRL Win %: {getModeWinPercentage("Control", playerTeams, mapLogs)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Match History</h3>
        <p className="text-sm text-white/70">
          Series are ordered by match date. Map stats are grouped by mode because map numbers are
          not stored in player logs.
        </p>
        <div className="mt-4 space-y-4">
          {matchSummaries.length === 0 ? (
            <p className="text-sm text-white/60">No matches logged yet.</p>
          ) : (
            matchSummaries.map((match) => {
              const opponent =
                match.home_team === player.team ? match.away_team : match.home_team;
              const matchMaps = mapLogs.filter((map) => map.match_id === match.match_id);
              const playerMatchStats = matchModeStats.filter(
                (stat) => stat.match_id === match.match_id
              );

              return (
                <details
                  key={match.match_id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <summary className="cursor-pointer list-none text-sm text-white">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {match.home_team ?? "TBD"} vs {match.away_team ?? "TBD"}
                        </p>
                        <p className="text-xs text-white/60">
                          {match.match_date ?? "TBD"} · Opponent: {opponent ?? "TBD"}
                        </p>
                      </div>
                      <div className="text-xs text-white/60">
                        Series score: {match.home_wins ?? 0}-{match.away_wins ?? 0}
                      </div>
                    </div>
                  </summary>
                  <div className="mt-4 space-y-3 text-sm text-white/70">
                    <Link href={`/matches/${match.match_id}`} className="text-sm">
                      View full series →
                    </Link>
                    {matchMaps.length === 0 ? (
                      <p>No map details recorded.</p>
                    ) : (
                      matchMaps.map((map) => {
                        const mapStat = playerMatchStats.find((stat) => stat.mode === map.mode);
                        return (
                          <div
                            key={`${match.match_id}-${map.map_num}`}
                            className="rounded-xl border border-white/10 bg-white/5 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span>
                                Map {map.map_num}: {map.map} ({map.mode})
                              </span>
                              <span className="text-xs text-white/50">
                                Winner: {map.winner_team}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-white/60">
                              {mapStat
                                ? `${mapStat.k} K · ${mapStat.d} D · KD ${formatKd(
                                    mapStat.k,
                                    mapStat.d
                                  )}`
                                : "No player stats for this mode."}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </details>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
