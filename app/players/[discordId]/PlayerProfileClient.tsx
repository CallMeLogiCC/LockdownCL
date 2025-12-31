"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  PlayerAggregates,
  PlayerMapBreakdown,
  PlayerMatchHistoryEntry,
  Player,
  UserProfile
} from "@/lib/types";
import { getLeagueForRank } from "@/lib/league";
import { buildSocialUrl, normalizeSocialHandle } from "@/lib/socials";
import { getTeamDefinitionByName } from "@/lib/teams";
import TeamLogo from "@/app/components/TeamLogo";

const seasons = ["Season 0", "Season 1", "Season 2", "Lifetime"] as const;

const formatKd = (kills: number, deaths: number) => {
  if (kills === 0 && deaths === 0) {
    return "—";
  }
  if (deaths === 0) {
    return "inf";
  }
  return (kills / deaths).toFixed(2);
};

const formatRecord = (wins: number, losses: number) => `${wins}-${losses}`;

const formatModeLabel = (mode: string) => (mode === "Control" ? "Overload" : mode);

const formatModeShort = (mode: string) => (mode === "Control" ? "OVRLD" : mode);

const formatMatchDate = (value: string | null) => {
  if (!value) {
    return "TBD";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
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

const renderModeStat = (modeStats: PlayerAggregates["modes"], mode: string) =>
  modeStats[mode] ?? { kills: 0, deaths: 0, map_wins: 0, map_losses: 0 };

const placeholderBreakdowns = (breakdowns: PlayerMapBreakdown[]) =>
  breakdowns.map((breakdown) => ({
    ...breakdown,
    maps: breakdown.maps.map((map) => ({
      ...map,
      kills: 0,
      deaths: 0,
      wins: 0,
      losses: 0
    }))
  }));

const StatTile = ({
  label,
  value,
  sublabel
}: {
  label: string;
  value: string;
  sublabel?: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
    <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    {sublabel ? <p className="mt-1 text-xs text-white/50">{sublabel}</p> : null}
  </div>
);

const EmptyState = ({ title, message }: { title: string; message: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
    <h3 className="text-base font-semibold text-white">{title}</h3>
    <p className="mt-2 text-sm text-white/60">{message}</p>
  </div>
);

export default function PlayerProfileClient({
  profile,
  aggregates,
  mapBreakdowns,
  matchHistory,
  userProfile,
  showPrivateWarning,
  showEditShortcut
}: {
  profile: Player;
  aggregates: PlayerAggregates;
  mapBreakdowns: PlayerMapBreakdown[];
  matchHistory: PlayerMatchHistoryEntry[];
  userProfile: UserProfile | null;
  showPrivateWarning: boolean;
  showEditShortcut: boolean;
}) {
  const [season, setSeason] = useState<(typeof seasons)[number]>("Season 2");

  const rankDisplay = useMemo(
    () => formatRank(profile.rank_value, profile.rank_is_na),
    [profile.rank_value, profile.rank_is_na]
  );
  const womensRankDisplay = useMemo(
    () => formatRank(profile.womens_rank, profile.womens_rank === null),
    [profile.womens_rank]
  );

  const coedLeague = getLeagueForRank(profile.rank_value, profile.rank_is_na);
  const womensRegistered = profile.womens_rank !== null;

  const socialLinks = [
    {
      label: "Twitter/X",
      url: buildSocialUrl(
        "twitter",
        normalizeSocialHandle("twitter", userProfile?.twitter_url ?? "")
      )
    },
    {
      label: "Twitch",
      url: buildSocialUrl(
        "twitch",
        normalizeSocialHandle("twitch", userProfile?.twitch_url ?? "")
      )
    },
    {
      label: "YouTube",
      url: buildSocialUrl(
        "youtube",
        normalizeSocialHandle("youtube", userProfile?.youtube_url ?? "")
      )
    },
    {
      label: "TikTok",
      url: buildSocialUrl(
        "tiktok",
        normalizeSocialHandle("tiktok", userProfile?.tiktok_url ?? "")
      )
    }
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));

  const season2Breakdowns = mapBreakdowns;
  const lifetimeBreakdowns = placeholderBreakdowns(mapBreakdowns);

  const isSeason2 = season === "Season 2";
  const isLifetime = season === "Lifetime";
  const noHistorySeason = season === "Season 0" || season === "Season 1";

  // Lifetime aggregation note:
  // KD should be computed as total_kills / total_deaths (not average of per-season KDs).
  // Win% should be computed as total_wins / total_games (not average of per-season win%).
  const overallRecord = `${formatRecord(
    aggregates.overall.series_wins,
    aggregates.overall.series_losses
  )} • ${formatRecord(aggregates.overall.map_wins, aggregates.overall.map_losses)}`;

  const hpStats = renderModeStat(aggregates.modes, "Hardpoint");
  const sndStats = renderModeStat(aggregates.modes, "SnD");
  const ctrlStats = renderModeStat(aggregates.modes, "Control");

  const displayedBreakdowns = isSeason2 ? season2Breakdowns : lifetimeBreakdowns;

  return (
    <section className="flex flex-col gap-6">
      {showPrivateWarning ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          You are currently not registered for the league.
        </div>
      ) : null}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
        <div className="relative h-40">
          {userProfile?.banner_url ? (
            <Image
              src={userProfile.banner_url}
              alt={`${profile.discord_name ?? "Player"} banner`}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="h-40 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
          )}
        </div>
        <div className="absolute left-6 top-24 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-lg">
          {userProfile?.avatar_url ? (
            <Image
              src={userProfile.avatar_url}
              alt={`${profile.discord_name ?? "Player"} avatar`}
              width={96}
              height={96}
              className="h-24 w-24 object-cover"
            />
          ) : (
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">Avatar</span>
          )}
        </div>
        <div className="absolute right-6 top-6 flex items-center gap-4">
          {showEditShortcut ? (
            <Link href="/account" className="text-xs text-white/70 hover:text-white">
              Edit profile →
            </Link>
          ) : null}
          <Link href="/players" className="text-xs text-white/60 hover:text-white">
            ← Back to players
          </Link>
        </div>
        <div className="px-6 pb-6 pt-20 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-xl border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-white/10 px-4 py-2">
                <h1 className="text-2xl font-semibold tracking-[0.08em] text-white md:text-3xl">
                  {profile.discord_name ?? "Unknown"}
                </h1>
              </div>
              <p className="text-sm text-white/70">
                Activision ID: {formatIgn(profile.ign)}
              </p>
              {coedLeague || womensRegistered ? (
                <div className="grid gap-2 text-xs text-white/60 md:grid-cols-2">
                  {coedLeague ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                        {coedLeague}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-white/80">
                        {profile.team ? (
                          (() => {
                            const teamDef = getTeamDefinitionByName(profile.team);
                            if (!teamDef) {
                              return <span>{profile.team}</span>;
                            }
                            return (
                              <Link
                                href={`/teams/${teamDef.slug}`}
                                className="inline-flex items-center gap-2 hover:text-white"
                              >
                                <TeamLogo
                                  teamSlug={teamDef.slug}
                                  league={teamDef.league}
                                  alt={`${teamDef.displayName} logo`}
                                  size={24}
                                  className="h-6 w-6 rounded-full border border-white/10"
                                />
                                <span>{teamDef.displayName}</span>
                              </Link>
                            );
                          })()
                        ) : (
                          <span>—</span>
                        )}
                        <span className="text-white/40">·</span>
                        <span>Rank {rankDisplay}</span>
                        <span className="text-white/40">·</span>
                        <span>{profile.status ?? "—"}</span>
                      </div>
                    </div>
                  ) : null}
                  {womensRegistered ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                        Womens
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-white/80">
                        {profile.womens_team ? (
                          (() => {
                            const teamDef = getTeamDefinitionByName(profile.womens_team);
                            if (!teamDef) {
                              return <span>{profile.womens_team}</span>;
                            }
                            return (
                              <Link
                                href={`/teams/${teamDef.slug}`}
                                className="inline-flex items-center gap-2 hover:text-white"
                              >
                                <TeamLogo
                                  teamSlug={teamDef.slug}
                                  league={teamDef.league}
                                  alt={`${teamDef.displayName} logo`}
                                  size={24}
                                  className="h-6 w-6 rounded-full border border-white/10"
                                />
                                <span>{teamDef.displayName}</span>
                              </Link>
                            );
                          })()
                        ) : (
                          <span>—</span>
                        )}
                        <span className="text-white/40">·</span>
                        <span>Rank {womensRankDisplay}</span>
                        <span className="text-white/40">·</span>
                        <span>{profile.women_status ?? profile.status ?? "—"}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {seasons.map((seasonOption) => (
          <button
            key={seasonOption}
            type="button"
            onClick={() => setSeason(seasonOption)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
              seasonOption === season
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            {seasonOption}
          </button>
        ))}
      </div>

      {noHistorySeason ? (
        <EmptyState
          title="No history found for this season yet."
          message="Check back once historical stats are available for this season."
        />
      ) : (
        <>
          {isLifetime ? (
            <EmptyState
              title="Lifetime stats are coming soon"
              message="Lifetime aggregation will include archived seasons. We'll surface combined KD and win rates once the data is backfilled."
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <StatTile
              label="Overall KD"
              value={
                isSeason2
                  ? formatKd(aggregates.overall.kills, aggregates.overall.deaths)
                  : "—"
              }
              sublabel={
                isSeason2
                  ? `${aggregates.overall.kills} K • ${aggregates.overall.deaths} D`
                  : ""
              }
            />
            <StatTile
              label="Overall W/L"
              value={isSeason2 ? overallRecord : "—"}
              sublabel={isSeason2 ? "Series W-L • Maps W-L" : ""}
            />
            <StatTile
              label="HP KD"
              value={isSeason2 ? formatKd(hpStats.kills, hpStats.deaths) : "—"}
            />
            <StatTile
              label="HP W/L"
              value={
                isSeason2
                  ? formatRecord(hpStats.map_wins, hpStats.map_losses)
                  : "—"
              }
            />
            <StatTile
              label="SnD KD"
              value={isSeason2 ? formatKd(sndStats.kills, sndStats.deaths) : "—"}
            />
            <StatTile
              label="SnD W/L"
              value={
                isSeason2
                  ? formatRecord(sndStats.map_wins, sndStats.map_losses)
                  : "—"
              }
            />
            <StatTile
              label="OVRLD KD"
              value={isSeason2 ? formatKd(ctrlStats.kills, ctrlStats.deaths) : "—"}
            />
            <StatTile
              label="OVRLD W/L"
              value={
                isSeason2
                  ? formatRecord(ctrlStats.map_wins, ctrlStats.map_losses)
                  : "—"
              }
            />
          </div>

          <div className="grid gap-6">
            {displayedBreakdowns.map((breakdown) => (
              <div
                key={breakdown.mode}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-white">
                    {formatModeLabel(breakdown.mode)} maps
                  </h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                    {formatModeShort(breakdown.mode)}
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-white/70">
                    <thead className="text-xs uppercase tracking-[0.2em] text-white/40">
                      <tr>
                        <th className="pb-2">Map</th>
                        <th className="pb-2">KD</th>
                        <th className="pb-2">W/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.maps.map((map) => (
                        <tr
                          key={`${breakdown.mode}-${map.name}`}
                          className="border-t border-white/5"
                        >
                          <td className="py-2 pr-4 text-white">{map.name}</td>
                          <td className="py-2">
                            {isSeason2
                              ? formatKd(map.kills, map.deaths)
                              : "—"}
                          </td>
                          <td className="py-2">
                            {isSeason2 ? formatRecord(map.wins, map.losses) : "0-0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-white">Match History</h3>
                <p className="text-sm text-white/60">
                  Series are ordered by match date. Map stats are paired by map order within each
                  mode.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {isSeason2 ? (
                matchHistory.length === 0 ? (
                  <p className="text-sm text-white/60">No matches logged yet.</p>
                ) : (
                  matchHistory.map((match) => (
                    <details
                      key={match.match_id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white">
                          <div>
                            <p className="font-semibold">
                              {match.home_team ?? "TBD"} vs {match.away_team ?? "TBD"}
                            </p>
                            <p className="text-xs text-white/60">
                              {formatMatchDate(match.match_date)} · Opponent:{" "}
                              {match.opponent ?? "TBD"}
                            </p>
                          </div>
                          <div className="text-xs text-white/60">
                            Series score: {match.home_wins ?? 0}-{match.away_wins ?? 0} · Result:{" "}
                            {match.series_result}
                          </div>
                        </div>
                      </summary>
                      <div className="mt-4 space-y-4 text-sm text-white/70">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
                          <span>
                            Total K/D: {match.totals.k} / {match.totals.d}
                          </span>
                          <span>KD {formatKd(match.totals.k, match.totals.d)}</span>
                        </div>
                        {match.maps.length === 0 ? (
                          <p>No map details recorded.</p>
                        ) : (
                          <div className="space-y-3">
                            {match.maps.map((map) => (
                              <div
                                key={`${match.match_id}-${map.map_num}-${map.mode}`}
                                className="rounded-xl border border-white/10 bg-white/5 p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-white">
                                    Map {map.map_num}: {map.map} ({formatModeLabel(map.mode)})
                                  </span>
                                  <span className="text-xs text-white/50">
                                    Winner: {map.winner_team}
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-white/60">
                                  {map.player_stats ? (
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span>
                                        {map.player_stats.k} K · {map.player_stats.d} D · KD{" "}
                                        {formatKd(map.player_stats.k, map.player_stats.d)}
                                      </span>
                                      {map.mode === "Hardpoint" ? (
                                        <span>HP Time: {map.player_stats.hp_time ?? 0}</span>
                                      ) : null}
                                      {map.mode === "SnD" ? (
                                        <span>
                                          Plants: {map.player_stats.plants ?? 0} · Defuses:{" "}
                                          {map.player_stats.defuses ?? 0}
                                        </span>
                                      ) : null}
                                      {map.mode === "Control" ? (
                                        <span>Ticks: {map.player_stats.ticks ?? 0}</span>
                                      ) : null}
                                    </div>
                                  ) : (
                                    "No player stats for this map."
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  ))
                )
              ) : (
                <p className="text-sm text-white/60">
                  Match history will appear once lifetime aggregation is available.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
