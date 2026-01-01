import type { Metadata } from "next";
import Link from "next/link";
import { hasDatabaseUrl } from "@/lib/db";
import { getPrizePool } from "@/lib/queries";
import { buildCanonicalUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import { announcements } from "@/src/config/announcements";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_TAGLINE,
  alternates: {
    canonical: buildCanonicalUrl("/")
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    url: buildCanonicalUrl("/"),
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
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [buildCanonicalUrl("/api/og/site")]
  }
};

const formatPrizeValue = (value: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "TBD";
  }
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isNaN(numeric)) {
    return `$${numeric.toLocaleString()}`;
  }
  return String(value);
};

export default async function HomePage() {
  const prizePool = hasDatabaseUrl() ? await getPrizePool() : null;
  const prizeItems = [
    { label: "Lowers", value: prizePool?.lowers ?? null },
    { label: "Uppers", value: prizePool?.uppers ?? null },
    { label: "Legends", value: prizePool?.legends ?? null },
    { label: "Womens", value: prizePool?.womens ?? null }
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white">LockdownCL Season Hub</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Lowers, Uppers, Legends, and Womens divisions each track their own standings,
              prize pools, and match results. This hub keeps the latest season data in one
              place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/players"
                className="rounded-full bg-lockdown-cyan px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black"
              >
                Players
              </Link>
              <Link
                href="/teams"
                className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/60"
              >
                Teams
              </Link>
              <Link
                href="/standings"
                className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/60"
              >
                Standings
              </Link>
              <Link
                href="/matches"
                className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/60"
              >
                Matches
              </Link>
              <Link
                href="https://discord.gg/SMZ4R8XzWZ"
                className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/60"
              >
                Join Discord
              </Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/70">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">League Snapshot</p>
            <p>
              Follow division standings, roster changes, and match results across every
              LockdownCL league.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Announcements</h3>
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              Latest
            </span>
          </div>
          <div className="mt-4 grid gap-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-semibold text-white">{announcement.title}</h4>
                  <span className="text-xs text-white/50">{announcement.date}</span>
                </div>
                <p className="mt-2 text-sm text-white/70">{announcement.body}</p>
                {announcement.link ? (
                  <Link
                    href={announcement.link}
                    className="mt-3 inline-flex text-xs uppercase tracking-[0.3em] text-lockdown-cyan"
                  >
                    Learn more →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Prize Pools</h3>
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              Current
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {prizePool ? (
              prizeItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                >
                  <span className="text-sm text-white/80">{item.label}</span>
                  <span className="text-sm font-semibold text-white">
                    {formatPrizeValue(item.value)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60">
                Prize pool data is not available yet. Check back soon.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
