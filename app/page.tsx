import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">LockdownCL Stats</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Track every match, map, and player performance across the LockdownCL seasons. This
          platform ingests official league results and generates shareable series and player reports
          for staff and fans.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/players"
            className="rounded-full bg-lockdown-cyan px-5 py-2 text-sm font-semibold text-black hover:bg-white"
          >
            Browse Players
          </Link>
          <Link
            href="/series/match-001"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:border-white/60"
          >
            View Sample Series
          </Link>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Live-ready data model",
            description: "Schema mirrors the official league data structure for fast ingestion."
          },
          {
            title: "Series breakdowns",
            description: "Scorelines, maps, and every player stat per series in one view."
          },
          {
            title: "Player performance",
            description: "See per-map performance to power MVP discussions and scouting."
          }
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm"
          >
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-white/70">{card.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
