"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MatchLog, SeasonNumber } from "@/lib/types";
import {
  DEFAULT_SEASON,
  SEASON_LABELS,
  getMatchLeague,
  getSeasonLeagueOptions,
  getSeasonTeamOptions
} from "@/lib/seasons";
import { formatMatchDateDisplay } from "@/lib/seo";

type MatchesBySeason = Record<SeasonNumber, MatchLog[]>;

type Props = {
  matchesBySeason: MatchesBySeason;
};

export default function MatchesFiltersClient({ matchesBySeason }: Props) {
  const [selectedSeason, setSelectedSeason] = useState<SeasonNumber>(DEFAULT_SEASON);
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  const matches = useMemo(
    () => matchesBySeason[selectedSeason] ?? [],
    [matchesBySeason, selectedSeason]
  );

  const leagueOptions = useMemo(() => getSeasonLeagueOptions(selectedSeason), [selectedSeason]);
  const teamOptions = useMemo(() => getSeasonTeamOptions(selectedSeason), [selectedSeason]);

  const matchesWithLeague = useMemo(
    () =>
      matches.map((match) => ({
        ...match,
        league: getMatchLeague(selectedSeason, match.home_team, match.away_team)
      })),
    [matches, selectedSeason]
  );

  const filteredMatches = useMemo(() => {
    return matchesWithLeague.filter((match) => {
      if (leagueFilter !== "all" && match.league.toLowerCase() !== leagueFilter) {
        return false;
      }
      if (teamFilter && teamFilter !== "all") {
        const query = teamFilter.toLowerCase();
        const home = (match.home_team ?? "").toLowerCase();
        const away = (match.away_team ?? "").toLowerCase();
        if (home !== query && away !== query) {
          return false;
        }
      }
      return true;
    });
  }, [leagueFilter, matchesWithLeague, teamFilter]);

  const handleSeasonChange = (value: string) => {
    const nextSeason = Number(value) as SeasonNumber;
    setSelectedSeason(nextSeason);
    setLeagueFilter("all");
    setTeamFilter("all");
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
            Season
            <select
              value={String(selectedSeason)}
              onChange={(event) => handleSeasonChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {SEASON_LABELS.map((season) => (
                <option key={season.value} value={season.value}>
                  {season.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
            League
            <select
              value={leagueFilter}
              onChange={(event) => setLeagueFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="all">All leagues</option>
              {leagueOptions.map((league) => (
                <option key={league} value={league.toLowerCase()}>
                  {league}
                </option>
              ))}
              <option value="unknown">Unknown</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
            Team
            <select
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="all">All teams</option>
              {teamOptions.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Series results</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            {filteredMatches.length} matches
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {filteredMatches.length === 0 ? (
            <p className="text-sm text-white/60">No matches found for these filters.</p>
          ) : (
            filteredMatches.map((match) => {
              const scoreline = `${match.home_wins ?? 0}-${match.away_wins ?? 0}`;
              const winner =
                (match.home_wins ?? 0) > (match.away_wins ?? 0)
                  ? match.home_team
                  : match.away_team;

              return (
                <Link
                  key={match.match_id}
                  href={`/matches/${match.match_id}`}
                  className="block rounded-xl border border-white/10 bg-black/20 p-4 text-sm transition hover:bg-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {match.home_team ?? "TBD"} vs {match.away_team ?? "TBD"}
                      </p>
                      <p className="text-xs text-white/60">
                        {formatMatchDateDisplay(match.match_date)} · League: {match.league}
                      </p>
                    </div>
                    <div className="text-xs text-white/60">
                      Score: {scoreline} · Winner: {winner ?? "TBD"}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
