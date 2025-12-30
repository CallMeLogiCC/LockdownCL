import type { Metadata } from "next";
import { hasDatabaseUrl } from "@/lib/db";
import { listPlayersWithStats } from "@/lib/queries";
import PlayerLists from "@/app/components/PlayerLists";
import { buildCanonicalUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Players",
  description: SITE_TAGLINE,
  alternates: {
    canonical: buildCanonicalUrl("/players")
  },
  openGraph: {
    title: `Players | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    url: buildCanonicalUrl("/players"),
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
    title: `Players | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    images: [buildCanonicalUrl("/api/og/site")]
  }
};

export default async function PlayersPage() {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const players = await listPlayersWithStats();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Players</h2>
        <p className="text-sm text-white/70">
          Search the full current-season player directory.
        </p>
      </div>
      <PlayerLists players={players} />
    </section>
  );
}
