"use client";

import { useState } from "react";
import Link from "next/link";
import type { StandingRow } from "@/lib/types";
import { LEAGUE_LABELS, LeagueKey } from "@/lib/league";
import { slugifyTeam } from "@/lib/slug";

const formatRecord = (row: StandingRow) => `${row.series_wins}-${row.series_losses}`;

export default function StandingsTabs({ standings }: { standings: Record<LeagueKey, StandingRow[]> }) {
  const [activeLeague, setActiveLeague] = useState<LeagueKey>("Lowers");

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
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
                    <Link href={`/teams/${slugifyTeam(row.team)}`} className="font-semibold">
                      {row.team}
                    </Link>
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
