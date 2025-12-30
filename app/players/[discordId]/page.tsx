import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasDatabaseUrl } from "@/lib/db";
import {
  getPlayerAggregates,
  getPlayerMapBreakdowns,
  getPlayerMatchHistory,
  getPlayerProfile,
  getPlayerTotals
} from "@/lib/queries";
import PlayerProfileClient from "@/app/players/[discordId]/PlayerProfileClient";
import JsonLd from "@/app/components/JsonLd";
import {
  buildCanonicalUrl,
  formatOvrLabel,
  getPlayerTeamLabel,
  SITE_NAME,
  SITE_TAGLINE
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { discordId: string };
}): Promise<Metadata> {
  if (!hasDatabaseUrl()) {
    return {
      title: "Lockdown CoD League",
      description: SITE_TAGLINE
    };
  }

  const [profile, totals] = await Promise.all([
    getPlayerProfile(params.discordId),
    getPlayerTotals(params.discordId)
  ]);

  if (!profile) {
    return {
      title: { absolute: `Not Found | ${SITE_NAME}` },
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const playerName = profile.discord_name ?? "Unknown";
  const teamLabel = getPlayerTeamLabel(profile.team, profile.status);
  const ovrLabel = formatOvrLabel(totals.ovr_kd);
  const title = `${playerName} - ${teamLabel} - ${ovrLabel} | ${SITE_NAME}`;
  const description = `${playerName} is currently listed as ${teamLabel}. Overall KD: ${ovrLabel}.`;
  const url = buildCanonicalUrl(`/players/${params.discordId}`);
  const ogImage = buildCanonicalUrl(`/api/og/player?discordId=${params.discordId}`);

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
          alt: `${playerName} profile card`
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

  const [profile, aggregates, mapBreakdowns, matchHistory, totals] = await Promise.all([
    getPlayerProfile(params.discordId),
    getPlayerAggregates(params.discordId),
    getPlayerMapBreakdowns(params.discordId),
    getPlayerMatchHistory(params.discordId),
    getPlayerTotals(params.discordId)
  ]);

  if (!profile) {
    notFound();
  }

  const playerName = profile.discord_name ?? "Unknown";
  const teamLabel = getPlayerTeamLabel(profile.team, profile.status);
  const ovrLabel = formatOvrLabel(totals.ovr_kd);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: playerName,
          url: buildCanonicalUrl(`/players/${params.discordId}`),
          affiliation:
            teamLabel === "Free Agent"
              ? undefined
              : {
                  "@type": "SportsTeam",
                  name: teamLabel
                }
        }}
      />
      <PlayerProfileClient
        profile={profile}
        aggregates={aggregates}
        mapBreakdowns={mapBreakdowns}
        matchHistory={matchHistory}
      />
      <div className="sr-only">Overall KD: {ovrLabel}</div>
    </>
  );
}
