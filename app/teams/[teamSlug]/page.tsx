import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDatabaseUrl } from "@/lib/db";
import {
  getAllTeams,
  getMatchesByTeam,
  getTeamModeWinRates,
  getTeamRoster
} from "@/lib/queries";
import { findTeamBySlug } from "@/lib/slug";
import type { MatchLog, PlayerWithStats, TeamModeWinRateRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const formatRank = (rankValue: number | string | null, isNa: boolean) => {
  if (isNa || rankValue === null) {
    return "NA";
  }
  const parsed = typeof rankValue === "number" ? rankValue : Number(rankValue);
  if (Number.isNaN(parsed)) {
    return "NA";
  }
  return parsed.toFixed(1);
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

const sortRoster = (roster: PlayerWithStats[]) =>
  [...roster].sort((a, b) => {
    const naA = a.rank_is_na || a.rank_value === null;
    const naB = b.rank_is_na || b.rank_value === null;
    if (naA !== naB) {
      return naA ? 1 : -1;
    }
    if (a.rank_value !== b.rank_value) {
      return (a.rank_value ?? 0) - (b.rank_value ?? 0);
    }
    return (a.discord_name ?? "").localeCompare(b.discord_name ?? "");
  });

const computeTeamRecord = (team: string, matches: MatchLog[]) => {
  let seriesWins = 0;
  let seriesLosses = 0;
  let mapWins = 0;
  let mapLosses = 0;

  matches.forEach((match) => {
    const homeWins = match.home_wins ?? 0;
    const awayWins = match.away_wins ?? 0;
    if (match.home_team === team) {
      mapWins += homeWins;
      mapLosses += awayWins;
      if (homeWins > awayWins) {
        seriesWins += 1;
      } else if (homeWins < awayWins) {
        seriesLosses += 1;
      }
    } else if (match.away_team === team) {
      mapWins += awayWins;
      mapLosses += homeWins;
      if (awayWins > homeWins) {
        seriesWins += 1;
      } else if (awayWins < homeWins) {
        seriesLosses += 1;
      }
    }
  });

  return {
    seriesWins,
    seriesLosses,
    mapDiff: mapWins - mapLosses,
    mapWins,
    mapLosses
  };
};

const getModeWinDisplay = (mode: string, rates: TeamModeWinRateRow[]) => {
  const entry = rates.find((rate) => rate.mode === mode);
  if (!entry || entry.total === 0) {
    return "—";
  }
  return `${((entry.wins / entry.total) * 100).toFixed(1)}%`;
};

const formatMatchDate = (value: string | Date | null) => {
  if (!value) {
    return "TBD";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString();
};

export default async function TeamPage({ params }: { params: { teamSlug: string } }) {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const teamNames = await getAllTeams();
  const team = findTeamBySlug(params.teamSlug, teamNames);

  if (!team) {
    notFound();
  }

  const [roster, matches, modeRates] = await Promise.all([
    getTeamRoster(team),
    getMatchesByTeam(team),
    getTeamModeWinRates(team)
  ]);

  const record = computeTeamRecord(team, matches);

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Team</p>
            <h2 className="text-2xl font-semibold text-white">{team}</h2>
            <p className="mt-2 text-sm text-white/70">
              Series record: {record.seriesWins}-{record.seriesLosses} · Map diff: {record.mapDiff}
            </p>
          </div>
          <Link href="/" className="text-sm">
            ← Back to home
          </Link>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            HP Win %: {getModeWinDisplay("Hardpoint", modeRates)}
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            SnD Win %: {getModeWinDisplay("SnD", modeRates)}
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            CTRL Win %: {getModeWinDisplay("Control", modeRates)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Roster</h3>
        {roster.length === 0 ? (
          <p className="mt-2 text-sm text-white/60">No active players listed.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-white/50">
                <tr>
                  <th className="px-4 py-3">Discord Name</th>
                  <th className="px-4 py-3">IGN</th>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">OVR KD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sortRoster(roster).map((player) => (
                  <tr key={player.discord_id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white">
                      <Link href={`/players/${player.discord_id}`} className="font-semibold">
                        {player.discord_name ?? "Unknown"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {player.ign && player.ign.trim() ? player.ign : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {formatRank(player.rank_value, player.rank_is_na)}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {formatKd(player.total_k, player.total_d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Match History</h3>
        {matches.length === 0 ? (
          <p className="mt-2 text-sm text-white/60">No matches recorded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {matches.map((match) => {
              const opponent = match.home_team === team ? match.away_team : match.home_team;
              const scoreline = `${match.home_wins ?? 0}-${match.away_wins ?? 0}`;
              const winner =
                (match.home_wins ?? 0) > (match.away_wins ?? 0)
                  ? match.home_team
                  : match.away_team;

              return (
                <div
                  key={match.match_id}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {match.home_team ?? "TBD"} vs {match.away_team ?? "TBD"}
                      </p>
                      <p className="text-xs text-white/60">
                        {formatMatchDate(match.match_date)} · Opponent: {opponent ?? "TBD"}
                      </p>
                    </div>
                    <div className="text-xs text-white/60">Score: {scoreline}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                    <span>Winner: {winner ?? "TBD"}</span>
                    <Link href={`/matches/${match.match_id}`} className="text-xs">
                      View series →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
