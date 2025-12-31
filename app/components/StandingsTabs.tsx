"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LEAGUE_LABELS, LeagueKey } from "@/lib/league";
import type { StandingRowWithMeta } from "@/lib/standings";
import TeamLogo from "@/app/components/TeamLogo";

const formatRecord = (row: StandingRowWithMeta) =>
  `${row.series_wins}-${row.series_losses}`;

export default function StandingsTabs({
  standings
}: {
  standings: Record<LeagueKey, StandingRowWithMeta[]>;
}) {
  const searchParams = useSearchParams();
  const leagueFromQuery = useMemo(() => {
    const value = searchParams.get("league");
    if (!value) {
      return null;
    }
    const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    return (LEAGUE_LABELS as readonly string[]).includes(normalized)
      ? (normalized as LeagueKey)
      : null;
  }, [searchParams]);

  const [activeLeague, setActiveLeague] = useState<LeagueKey>(leagueFromQuery ?? "Lowers");

  useEffect(() => {
    if (leagueFromQuery && leagueFromQuery !== activeLeague) {
      setActiveLeague(leagueFromQuery);
    }
  }, [activeLeague, leagueFromQuery]);

  return (
    <section id="standings" className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">League Standings</h2>
          <p className="text-sm text-white/70">Series wins and map differential by league.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {LEAGUE_LABELS.map((league) => (
            <button
              key={league}
              onClick={() => setActiveLeague(league)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeLeague === league
                  ? "bg-lockdown-cyan text-black"
                  : "border border-white/20 text-white hover:border-white/60"
              }`}
            >
              {league} League
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-white/50">
            <tr>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Series W-L</th>
              <th className="px-4 py-3">Map Diff</th>
              <th className="px-4 py-3">Maps Won</th>
              <th className="px-4 py-3">Maps Lost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {standings[activeLeague].length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/60">
                  No standings available yet.
                </td>
              </tr>
            ) : (
              standings[activeLeague].map((row) => (
                <tr key={row.team} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white">
                    <div className="flex items-center gap-3">
                      <TeamLogo
                        teamSlug={row.teamSlug}
                        league={row.league}
                        alt={`${row.team} logo`}
                        size={28}
                        className="h-7 w-7 rounded-full border border-white/10 bg-white/5"
                      />
                      <Link href={`/teams/${row.teamSlug}`} className="font-semibold">
                        {row.team}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/70">{formatRecord(row)}</td>
                  <td className="px-4 py-3 text-white/70">{row.map_diff}</td>
                  <td className="px-4 py-3 text-white/70">{row.map_wins}</td>
                  <td className="px-4 py-3 text-white/70">{row.map_losses}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
