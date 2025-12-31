import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasDatabaseUrl } from "@/lib/db";
import { getMapsBySeries, getMatchPlayerRows, getSeriesById } from "@/lib/queries";
import JsonLd from "@/app/components/JsonLd";
import {
  buildCanonicalUrl,
  formatMatchDateDisplay,
  formatMatchDateIso,
  getMatchScoreline,
  getMatchWinner,
  SITE_NAME
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { matchId: string };
}): Promise<Metadata> {
  if (!hasDatabaseUrl()) {
    return {
      title: "Lockdown CoD League"
    };
  }

  const match = await getSeriesById(params.matchId);

  if (!match) {
    return {
      title: { absolute: `Not Found | ${SITE_NAME}` },
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const homeTeam = match.home_team ?? "TBD";
  const awayTeam = match.away_team ?? "TBD";
  const scoreline = getMatchScoreline(match);
  const winner = getMatchWinner(match) ?? "TBD";
  const title = `${homeTeam} vs ${awayTeam} - ${scoreline} - ${winner} Wins! | ${SITE_NAME}`;
  const description = `Series between ${homeTeam} and ${awayTeam}. Final score ${scoreline}. Winner: ${winner}.`;
  const url = buildCanonicalUrl(`/matches/${params.matchId}`);
  const ogImage = buildCanonicalUrl(`/api/og/match?matchId=${params.matchId}`);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${homeTeam} vs ${awayTeam} match card`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

const formatStat = (value: number | null) => (value === null ? "—" : value);

export default async function MatchPage({ params }: { params: { matchId: string } }) {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const match = await getSeriesById(params.matchId);

  if (!match) {
    notFound();
  }

  const [maps, playerRows] = await Promise.all([
    getMapsBySeries(params.matchId, match.season),
    getMatchPlayerRows(params.matchId, match.season)
  ]);

  const winner = getMatchWinner(match) ?? "TBD";
  const formatModeLabel = (mode: string) =>
    match.season === 2 && mode === "Control" ? "Overload" : mode;

  return (
    <section className="flex flex-col gap-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: `${match.home_team ?? "TBD"} vs ${match.away_team ?? "TBD"}`,
          startDate: formatMatchDateIso(match.match_date) ?? undefined,
          url: buildCanonicalUrl(`/matches/${params.matchId}`),
          competitor: [
            {
              "@type": "SportsTeam",
              name: match.home_team ?? "TBD"
            },
            {
              "@type": "SportsTeam",
              name: match.away_team ?? "TBD"
            }
          ]
        }}
      />
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Series</p>
            <h2 className="text-2xl font-semibold text-white">
              {match.home_team ?? "TBD"} vs {match.away_team ?? "TBD"}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {formatMatchDateDisplay(match.match_date)}
            </p>
          </div>
          <Link href="/" className="text-sm">
            ← Back to home
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/70">
          <span>
            Scoreline: {match.home_wins ?? 0} - {match.away_wins ?? 0}
          </span>
          <span>Winner: {winner}</span>
          <span>Match ID: {match.match_id}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Maps in Series</h3>
        {maps.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">No maps recorded.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {maps.map((map) => {
              const mapPlayers = playerRows.filter((row) => row.mode === map.mode);
              return (
                <details
                  key={`${map.match_id}-${map.map_num}`}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <summary className="cursor-pointer list-none text-sm text-white">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>
                        Map {map.map_num}: {map.map} ({formatModeLabel(map.mode)})
                      </span>
                      <span className="text-xs text-white/50">Winner: {map.winner_team}</span>
                    </div>
                  </summary>
                  <div className="mt-3 text-xs text-white/60">
                    Player stats are grouped by mode because map numbers are not stored in player logs.
                  </div>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10 text-xs">
                      <thead className="bg-white/5 text-left uppercase tracking-widest text-white/50">
                        <tr>
                          <th className="px-3 py-2">Player</th>
                          <th className="px-3 py-2">Team</th>
                          <th className="px-3 py-2">Kills</th>
                          <th className="px-3 py-2">Deaths</th>
                          <th className="px-3 py-2">KD</th>
                          <th className="px-3 py-2">HP Time</th>
                          <th className="px-3 py-2">Plants</th>
                          <th className="px-3 py-2">Defuses</th>
                          <th className="px-3 py-2">Ticks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {mapPlayers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-3 py-4 text-center text-white/60">
                              No player stats recorded for this mode.
                            </td>
                          </tr>
                        ) : (
                          mapPlayers.map((row) => (
                            <tr key={`${row.discord_id}-${row.mode}`} className="hover:bg-white/5">
                              <td className="px-3 py-2 text-white">
                                <Link href={`/players/${row.discord_id}`}>
                                  {row.player ?? "Unknown"}
                                </Link>
                              </td>
                              <td className="px-3 py-2 text-white/70">{row.team ?? "—"}</td>
                              <td className="px-3 py-2 text-white/70">{formatStat(row.k)}</td>
                              <td className="px-3 py-2 text-white/70">{formatStat(row.d)}</td>
                              <td className="px-3 py-2 text-white/70">{row.kd ?? "—"}</td>
                              <td className="px-3 py-2 text-white/70">{formatStat(row.hp_time)}</td>
                              <td className="px-3 py-2 text-white/70">{formatStat(row.plants)}</td>
                              <td className="px-3 py-2 text-white/70">{formatStat(row.defuses)}</td>
                              <td className="px-3 py-2 text-white/70">{formatStat(row.ticks)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
