import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildCanonicalUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How to Join Lockdown CoD League",
  description: SITE_TAGLINE,
  alternates: {
    canonical: buildCanonicalUrl("/howtojoin")
  },
  openGraph: {
    title: `How to Join | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    url: buildCanonicalUrl("/howtojoin"),
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
    title: `How to Join | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    images: [buildCanonicalUrl("/api/og/site")]
  }
};

export default function HowToJoinPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/brand/logo.jpg"
              alt="LockdownCL"
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">LockdownCL</p>
              <h1 className="text-3xl font-semibold text-white">
                How to Join Lockdown CoD League
              </h1>
            </div>
          </div>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            ← Back to Home
          </Link>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-white/70">
          Follow the steps below to join the LockdownCL community and register for the
          league.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Step-by-step</h2>
        <ol className="mt-4 space-y-4 text-sm text-white/70">
          <li className="rounded-xl border border-white/10 bg-black/20 p-4">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">Step 1</span>
            <p className="mt-2">
              Join the Discord: {" "}
              <Link href="https://discord.gg/SMZ4R8XzWZ" className="underline">
                https://discord.gg/SMZ4R8XzWZ
              </Link>
            </p>
          </li>
          <li className="rounded-xl border border-white/10 bg-black/20 p-4">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">Step 2</span>
            <p className="mt-2">
              Fill out the intent form in #register-here:{" "}
              <Link
                href="https://discord.com/channels/1407148843274997823/1413913299367759922"
                className="underline"
              >
                https://discord.com/channels/1407148843274997823/1413913299367759922
              </Link>
            </p>
          </li>
          <li className="rounded-xl border border-white/10 bg-black/20 p-4">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">Step 3</span>
            <p className="mt-2">
              If you have issues, open a ticket in the Discord and a staff member will
              help you.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}
