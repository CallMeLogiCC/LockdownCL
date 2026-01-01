import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasDatabaseUrl } from "@/lib/db";
import { getMatchesBySeason, getScheduleBySlug } from "@/lib/queries";
import {
  buildCanonicalUrl,
  SITE_NAME,
  SITE_TAGLINE
} from "@/lib/seo";
import { DEFAULT_SEASON } from "@/lib/seasons";
import {
  formatScheduleDateRange,
  linkScheduleMatches,
  normalizeScheduleDivision
} from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { matchSlug: string };
}): Promise<Metadata> {
  if (!hasDatabaseUrl()) {
    return {
      title: "Lockdown CoD League",
      description: SITE_TAGLINE
    };
  }

  const scheduleEntry = await getScheduleBySlug(params.matchSlug, DEFAULT_SEASON);

  if (!scheduleEntry) {
    return {
      title: { absolute: `Not Found | ${SITE_NAME}` },
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const homeTeam = scheduleEntry.home_team ?? "TBD";
  const awayTeam = scheduleEntry.away_team ?? "TBD";
  const divisionLabel = normalizeScheduleDivision(scheduleEntry.division) ?? "TBD";
  const title = `${homeTeam} vs ${awayTeam} · Scheduled | ${SITE_NAME}`;
  const description = `Scheduled ${divisionLabel} match: ${homeTeam} vs ${awayTeam}.`;
  const url = buildCanonicalUrl(`/matches/scheduled/${params.matchSlug}`);
  const ogImage = buildCanonicalUrl(`/api/og/scheduled?slug=${params.matchSlug}`);

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
          alt: `${homeTeam} vs ${awayTeam} scheduled match card`
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

export default async function ScheduledMatchPage({
  params
}: {
  params: { matchSlug: string };
}) {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const scheduleEntry = await getScheduleBySlug(params.matchSlug, DEFAULT_SEASON);

  if (!scheduleEntry) {
    notFound();
  }

  const matches = await getMatchesBySeason(DEFAULT_SEASON);
  const linked = linkScheduleMatches([scheduleEntry], matches)[0];

  if (linked?.matchId) {
    redirect(`/matches/${linked.matchId}`);
  }

  const divisionLabel = normalizeScheduleDivision(scheduleEntry.division) ?? "TBD";
  const dateRange = formatScheduleDateRange(
    scheduleEntry.start_date,
    scheduleEntry.end_date
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        Scheduled Match — Not Yet Played
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Scheduled</p>
            <h2 className="text-2xl font-semibold text-white">
              {scheduleEntry.home_team ?? "TBD"} vs {scheduleEntry.away_team ?? "TBD"}
            </h2>
            <p className="mt-2 text-sm text-white/70">{divisionLabel}</p>
          </div>
          <Link href="/matches" className="text-sm">
            ← Back to matches
          </Link>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">Week</span>
            <p className="mt-2 text-white">{scheduleEntry.week ?? "TBD"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              Date Range
            </span>
            <p className="mt-2 text-white">{dateRange}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              Match Time
            </span>
            <p className="mt-2 text-white">{scheduleEntry.match_time ?? "TBD"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              Stream Link/VOD
            </span>
            {scheduleEntry.stream_link ? (
              <Link
                href={scheduleEntry.stream_link}
                className="mt-2 inline-block text-white underline"
              >
                Watch stream
              </Link>
            ) : (
              <p className="mt-2 text-white">TBD</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">Home GM</span>
            <p className="mt-2 text-white">{scheduleEntry.home_gm ?? "TBD"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">Away GM</span>
            <p className="mt-2 text-white">{scheduleEntry.away_gm ?? "TBD"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
