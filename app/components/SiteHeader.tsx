import Image from "next/image";
import Link from "next/link";
import { getSafeAuthSession } from "@/lib/auth";
import SignInButton from "@/app/components/SignInButton";

export default async function SiteHeader() {
  const session = await getSafeAuthSession();
  const discordId = session?.user?.discordId ?? null;
  const isLoggedIn = Boolean(discordId);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/logo.jpg"
              alt="LockdownCL"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-white/10 object-cover"
            />
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">LockdownCL</p>
              <p className="text-lg font-semibold text-white">Stats Hub</p>
            </div>
          </Link>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          <Link href="/">Home</Link>
          <Link href="/players">Players</Link>
          <Link href="/teams">Teams</Link>
          <Link href="/standings">Standings</Link>
          <Link href="/matches">Matches</Link>
        </nav>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href={`/players/${discordId}`}
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/60 hover:text-white"
            >
              Profile
            </Link>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 pb-3 text-xs text-white/60 md:hidden">
        <div className="flex flex-wrap gap-3">
          <Link href="/">Home</Link>
          <Link href="/players">Players</Link>
          <Link href="/teams">Teams</Link>
          <Link href="/standings">Standings</Link>
          <Link href="/matches">Matches</Link>
        </div>
      </div>
    </header>
  );
}
