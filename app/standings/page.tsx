import type { Metadata } from "next";
import { hasDatabaseUrl } from "@/lib/db";
import { getMatchesBySeason } from "@/lib/queries";
import StandingsTabs from "@/app/components/StandingsTabs";
import { buildStandingsByLeague } from "@/lib/standings";
import { buildCanonicalUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import { DEFAULT_SEASON } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Standings",
  description: SITE_TAGLINE,
  alternates: {
    canonical: buildCanonicalUrl("/standings")
  },
  openGraph: {
    title: `Standings | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    url: buildCanonicalUrl("/standings"),
    images: [
      {
        url: buildCanonicalUrl("/api/og/site"),
        width: 1200,
        height: 630,
        alt: SITE_NAME
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `Standings | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    images: [buildCanonicalUrl("/api/og/site")]
  }
};

export default async function StandingsPage() {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const matches = await getMatchesBySeason(DEFAULT_SEASON);
  const standings = buildStandingsByLeague(matches);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Standings</h2>
        <p className="text-sm text-white/70">
          Track every league&apos;s series record and map differential.
        </p>
      </div>
      <StandingsTabs standings={standings} />
    </section>
  );
}
