"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PlayerWithStats } from "@/lib/types";
import {
  LEAGUE_LABELS,
  LEAGUE_TEAMS,
  LeagueKey,
  getLeagueForPlayer,
  getPlayerRankForLeague,
  getPlayerStatusForLeague,
  getPlayerTeamForLeague,
  isCoedRegistered,
  isFormerPlayer,
  isFreeAgent,
  isWomensRegistered
} from "@/lib/league";
import { slugifyTeam } from "@/lib/slug";

const formatIgn = (ign: string | null) => (ign && ign.trim() ? ign : "N/A");

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

const sortPlayers = (players: PlayerWithStats[], league: LeagueKey | "All") => {
  return [...players].sort((a, b) => {
    const rankA = league === "Womens" ? a.womens_rank : a.rank_value;
    const rankB = league === "Womens" ? b.womens_rank : b.rank_value;
    const naA =
      league === "Womens" ? a.womens_rank === null : a.rank_is_na || a.rank_value === null;
    const naB =
      league === "Womens" ? b.womens_rank === null : b.rank_is_na || b.rank_value === null;

    if (naA !== naB) {
      return naA ? 1 : -1;
    }
    if (rankA !== rankB) {
      return (rankA ?? 0) - (rankB ?? 0);
    }
    return (a.discord_name ?? "").localeCompare(b.discord_name ?? "");
  });
};

const normalize = (value: string | null) => (value ?? "").toLowerCase();

const leagueOptions = ["All", ...LEAGUE_LABELS];

const getTeamOptions = (players: PlayerWithStats[]) => {
  const teams = new Set<string>();
  players.forEach((player) => {
    if (player.team) {
      teams.add(player.team);
    }
    if (player.womens_team) {
      teams.add(player.womens_team);
    }
  });
  return Array.from(teams).sort((a, b) => a.localeCompare(b));
};

const getStatusOptions = (players: PlayerWithStats[]) => {
  const statuses = new Set<string>();
  players.forEach((player) => {
    if (player.status) {
      statuses.add(player.status);
    }
    if (player.women_status) {
      statuses.add(player.women_status);
    }
  });
  return Array.from(statuses).sort((a, b) => a.localeCompare(b));
};

export default function PlayerLists({ players }: { players: PlayerWithStats[] }) {
  const [activeView, setActiveView] = useState<"all" | "teams" | "free" | "former">("all");
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<LeagueKey | "All">("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");

  const teamOptions = useMemo(() => getTeamOptions(players), [players]);
  const statusOptions = useMemo(() => getStatusOptions(players), [players]);

  const filteredPlayers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const basePlayers = players.filter((player) => {
      if (activeView === "former") {
        return isFormerPlayer(player);
      }
      if (activeView === "free") {
        return isFreeAgent(player);
      }
      if (activeView === "all") {
        return !isFormerPlayer(player);
      }
      return true;
    });

    return sortPlayers(
      basePlayers.filter((player) => {
        if (leagueFilter !== "All") {
          if (leagueFilter === "Womens") {
            if (!isWomensRegistered(player)) {
              return false;
            }
          }

          if (!getLeagueForPlayer(player, leagueFilter)) {
            return false;
          }
        }

        if (teamFilter !== "All") {
          const matchesTeam =
            player.team === teamFilter || player.womens_team === teamFilter;
          if (!matchesTeam) {
            return false;
          }
        }

        if (statusFilter !== "All") {
          const matchesStatus =
            player.status === statusFilter || player.women_status === statusFilter;
          if (!matchesStatus) {
            return false;
          }
        }

        if (searchValue) {
          const combined = [
            normalize(player.discord_name),
            normalize(player.ign),
            normalize(player.team),
            normalize(player.womens_team)
          ].join(" ");
          if (!combined.includes(searchValue)) {
            return false;
          }
        }

        return true;
      }),
      leagueFilter
    );
  }, [activeView, leagueFilter, players, search, statusFilter, teamFilter]);

  const renderPlayerRow = (player: PlayerWithStats, league: LeagueKey | "All") => {
    const leagueKey = league === "All" ? "Lowers" : league;
    const team = getPlayerTeamForLeague(player, leagueKey);
    const status = getPlayerStatusForLeague(player, leagueKey);
    const rankValue = getPlayerRankForLeague(player, leagueKey);
    const rankIsNa = leagueKey === "Womens" ? rankValue === null : !isCoedRegistered(player);

    return (
      <tr key={player.discord_id} className="hover:bg-white/5">
        <td className="px-4 py-3 text-white">
          <Link href={`/players/${player.discord_id}`} className="font-semibold">
            {player.discord_name ?? "Unknown"}
          </Link>
        </td>
        <td className="px-4 py-3 text-white/70">{formatIgn(player.ign)}</td>
        <td className="px-4 py-3 text-white/70">{formatRank(rankValue, rankIsNa)}</td>
        <td className="px-4 py-3 text-white/70">{team ?? "—"}</td>
        <td className="px-4 py-3 text-white/70">{status ?? "—"}</td>
        <td className="px-4 py-3 text-white/70">
          {formatKd(player.total_k, player.total_d)}
        </td>
      </tr>
    );
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Player Lists</h2>
          <p className="text-sm text-white/70">
            Browse every roster, free agent, and former player for the current season.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All Players" },
            { key: "teams", label: "All Teams" },
            { key: "free", label: "All Free Agents" },
            { key: "former", label: "All Former Players" }
          ].map((button) => (
            <button
              key={button.key}
              onClick={() => setActiveView(button.key as typeof activeView)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeView === button.key
                  ? "bg-lockdown-cyan text-black"
                  : "border border-white/20 text-white hover:border-white/60"
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {activeView !== "teams" && (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Discord, IGN, or team"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
          />
          <select
            value={leagueFilter}
            onChange={(event) => setLeagueFilter(event.target.value as LeagueKey | "All")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
          >
            {leagueOptions.map((league) => (
              <option key={league} value={league} className="bg-lockdown-blue">
                {league} League
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
            >
              <option value="All" className="bg-lockdown-blue">
                All Statuses
              </option>
              {statusOptions.map((status) => (
                <option key={status} value={status} className="bg-lockdown-blue">
                  {status}
                </option>
              ))}
            </select>
            <select
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
            >
              <option value="All" className="bg-lockdown-blue">
                All Teams
              </option>
              {teamOptions.map((team) => (
                <option key={team} value={team} className="bg-lockdown-blue">
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeView === "teams" ? (
        <div className="mt-6 space-y-8">
          {LEAGUE_LABELS.map((league) => {
            const teams = LEAGUE_TEAMS[league];
            return (
              <div key={league} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{league} Teams</h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {teams.length} squads
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {teams.map((team) => {
                    const roster = players.filter((player) => {
                      if (league === "Womens") {
                        return (
                          isWomensRegistered(player) &&
                          player.womens_team === team &&
                          player.women_status?.toLowerCase() !== "free agent"
                        );
                      }
                      return (
                        player.team === team &&
                        !isFormerPlayer(player) &&
                        isCoedRegistered(player) &&
                        player.status?.toLowerCase() !== "free agent"
                      );
                    });

                    return (
                      <div
                        key={team}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <Link href={`/teams/${slugifyTeam(team)}`} className="text-white">
                            <h4 className="text-base font-semibold">{team}</h4>
                          </Link>
                          <span className="text-xs text-white/50">{roster.length} players</span>
                        </div>
                        {roster.length === 0 ? (
                          <p className="mt-3 text-sm text-white/50">No registered players.</p>
                        ) : (
                          <div className="mt-3 overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead className="text-left uppercase tracking-widest text-white/40">
                                <tr>
                                  <th className="px-2 py-2">Discord</th>
                                  <th className="px-2 py-2">Rank</th>
                                  <th className="px-2 py-2">KD</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {sortPlayers(roster, league).map((player) => {
                                  const rank = getPlayerRankForLeague(player, league);
                                  const isNa =
                                    league === "Womens" ? rank === null : !isCoedRegistered(player);
                                  return (
                                    <tr key={player.discord_id}>
                                      <td className="px-2 py-2 text-white">
                                        <Link href={`/players/${player.discord_id}`}>
                                          {player.discord_name ?? "Unknown"}
                                        </Link>
                                      </td>
                                      <td className="px-2 py-2 text-white/70">
                                        {formatRank(rank, isNa)}
                                      </td>
                                      <td className="px-2 py-2 text-white/70">
                                        {formatKd(player.total_k, player.total_d)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-white/50">
              <tr>
                <th className="px-4 py-3">Discord Name</th>
                <th className="px-4 py-3">Activision (IGN)</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">OVR KD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-white/60">
                    No players match those filters.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => renderPlayerRow(player, leagueFilter))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
