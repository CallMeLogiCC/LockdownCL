"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PlayerWithStats } from "@/lib/types";
import {
  LEAGUE_LABELS,
  type LeagueKey,
  getLeagueForRank,
  isCoedRegistered,
  isFormerPlayer,
  isWomensRegistered
} from "@/lib/league";
import { TEAM_DEFS, getTeamDefinitionByName } from "@/lib/teams";

type PlayerRow = {
  rowId: string;
  discordId: string;
  discordName: string | null;
  ign: string | null;
  rankValue: number | null;
  rankIsNa: boolean;
  team: string | null;
  status: string | null;
  total_k: number;
  total_d: number;
  leagueKey: LeagueKey | null;
  rowType: "Open" | "Womens";
  isFormer: boolean;
};

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

const normalize = (value: string | null) => (value ?? "").toLowerCase();

const leagueOptions = ["All", ...LEAGUE_LABELS];

const getTeamOptions = () =>
  TEAM_DEFS.map((team) => team.displayName).sort((a, b) => a.localeCompare(b));

const getStatusOptions = (rows: PlayerRow[]) => {
  const statuses = new Set<string>();
  rows.forEach((row) => {
    if (row.status) {
      statuses.add(row.status);
    }
  });
  return Array.from(statuses).sort((a, b) => a.localeCompare(b));
};

const isFreeAgentStatus = (status: string | null) =>
  status?.toLowerCase().includes("free agent") ?? false;

const isPendingStatus = (status: string | null) =>
  status?.toLowerCase().includes("pending") ?? false;

const isFormerStatus = (status: string | null, team: string | null) => {
  const normalizedStatus = status?.toLowerCase() ?? "";
  const normalizedTeam = team?.toLowerCase() ?? "";
  return (
    normalizedStatus === "former player" ||
    normalizedStatus === "unregistered" ||
    normalizedTeam === "former player"
  );
};

const buildPlayerRows = (players: PlayerWithStats[]): PlayerRow[] => {
  return players.flatMap((player) => {
    const rows: PlayerRow[] = [];
    const womensRegistered = isWomensRegistered(player);
    const womensOnly = womensRegistered && !isCoedRegistered(player);

    if (!womensOnly) {
      rows.push({
        rowId: `${player.discord_id}-open`,
        discordId: player.discord_id,
        discordName: player.discord_name,
        ign: player.ign,
        rankValue: player.rank_value,
        rankIsNa: player.rank_is_na || player.rank_value === null,
        team: player.team,
        status: player.status,
        total_k: player.total_k,
        total_d: player.total_d,
        leagueKey: getLeagueForRank(player.rank_value, player.rank_is_na),
        rowType: "Open",
        isFormer: isFormerPlayer(player)
      });
    }

    if (womensRegistered) {
      rows.push({
        rowId: `${player.discord_id}-womens`,
        discordId: player.discord_id,
        discordName: player.discord_name,
        ign: player.ign,
        rankValue: player.womens_rank,
        rankIsNa: player.womens_rank === null,
        team: player.womens_team,
        status: player.women_status,
        total_k: player.total_k,
        total_d: player.total_d,
        leagueKey: "Womens",
        rowType: "Womens",
        isFormer: isFormerStatus(player.women_status, player.womens_team)
      });
    }

    return rows;
  });
};

const sortRows = (rows: PlayerRow[], view: "all" | "active" | "free" | "pending" | "former") => {
  const getRank = (row: PlayerRow) => (row.rankIsNa || row.rankValue === null ? Infinity : row.rankValue);

  return [...rows].sort((a, b) => {
    if (view === "all") {
      const formerOrder = Number(a.isFormer) - Number(b.isFormer);
      if (formerOrder !== 0) {
        return formerOrder;
      }

      const leagueOrder = Number(a.rowType === "Womens") - Number(b.rowType === "Womens");
      if (leagueOrder !== 0) {
        return leagueOrder;
      }

      const rankDiff = getRank(a) - getRank(b);
      if (rankDiff !== 0) {
        return rankDiff;
      }
    } else {
      const rankDiff = getRank(a) - getRank(b);
      if (rankDiff !== 0) {
        return rankDiff;
      }
    }

    return (a.discordName ?? "").localeCompare(b.discordName ?? "");
  });
};

export default function PlayerLists({ players }: { players: PlayerWithStats[] }) {
  const [activeView, setActiveView] = useState<
    "all" | "active" | "free" | "pending" | "former"
  >("all");
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<LeagueKey | "All">("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");

  const rows = useMemo(() => buildPlayerRows(players), [players]);
  const teamOptions = useMemo(() => getTeamOptions(), []);
  const statusOptions = useMemo(() => getStatusOptions(rows), [rows]);

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const baseRows = rows.filter((row) => {
      if (activeView === "former") {
        return row.isFormer;
      }
      if (activeView === "free") {
        return isFreeAgentStatus(row.status);
      }
      if (activeView === "pending") {
        return isPendingStatus(row.status);
      }
      if (activeView === "active") {
        return !row.isFormer && !isFreeAgentStatus(row.status) && !isPendingStatus(row.status);
      }
      return true;
    });

    return sortRows(
      baseRows.filter((row) => {
        if (leagueFilter !== "All" && row.leagueKey !== leagueFilter) {
          return false;
        }

        if (teamFilter !== "All" && row.team !== teamFilter) {
          return false;
        }

        if (statusFilter !== "All" && row.status !== statusFilter) {
          return false;
        }

        if (searchValue) {
          const combined = [
            normalize(row.discordName),
            normalize(row.ign),
            normalize(row.team),
            normalize(row.status)
          ].join(" ");
          if (!combined.includes(searchValue)) {
            return false;
          }
        }

        return true;
      }),
      activeView
    );
  }, [activeView, leagueFilter, rows, search, statusFilter, teamFilter]);

  const renderPlayerRow = (row: PlayerRow) => {
    const teamDef = getTeamDefinitionByName(row.team);

    return (
      <tr key={row.rowId} className="hover:bg-white/5">
        <td className="px-4 py-3 text-white">
          <Link href={`/players/${row.discordId}`} className="font-semibold">
            {row.discordName ?? "Unknown"}
          </Link>
        </td>
        <td className="px-4 py-3 text-white/70">{formatIgn(row.ign)}</td>
        <td className="px-4 py-3 text-white/70">{formatRank(row.rankValue, row.rankIsNa)}</td>
        <td className="px-4 py-3 text-white/70">
          {teamDef ? (
            <Link href={`/teams/${teamDef.slug}`} className="text-white/80 hover:text-white">
              {teamDef.displayName}
            </Link>
          ) : (
            row.team ?? "—"
          )}
        </td>
        <td className="px-4 py-3 text-white/70">{row.status ?? "—"}</td>
        <td className="px-4 py-3 text-white/70">{formatKd(row.total_k, row.total_d)}</td>
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
            { key: "active", label: "Active" },
            { key: "free", label: "Free Agents" },
            { key: "pending", label: "Pending" },
            { key: "former", label: "Former Players" }
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
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-white/60">
                  No players match those filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => renderPlayerRow(row))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
