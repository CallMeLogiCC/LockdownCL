import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/db";
import { getPlayerById, getUserProfile } from "@/lib/queries";
import AccountProfileClient from "@/app/account/AccountProfileClient";

export const dynamic = "force-dynamic";

const isUnregisteredStatus = (status: string | null, team: string | null) => {
  const normalized = (status ?? "").toLowerCase();
  const teamValue = (team ?? "").toLowerCase();
  return normalized === "unregistered" || teamValue === "former player";
};

export default async function AccountPage() {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const session = await getAuthSession();
  const discordId = session?.user?.discordId ?? null;

  if (!discordId) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  const [playerProfile, userProfile] = await Promise.all([
    getPlayerById(discordId),
    getUserProfile(discordId)
  ]);

  const isRegistered = Boolean(playerProfile);
  const showPrivateWarning = playerProfile
    ? isUnregisteredStatus(playerProfile.status, playerProfile.team)
    : false;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Account</h1>
          <p className="text-sm text-white/70">
            Manage your LockdownCL profile details and socials.
          </p>
        </div>
        {isRegistered ? (
          <Link
            href={`/players/${discordId}`}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/60"
          >
            View Public Profile
          </Link>
        ) : null}
      </div>

      {showPrivateWarning ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          You are currently not registered for the league.
        </div>
      ) : null}

      {!isRegistered ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          <p className="text-white">You are not registered for the league.</p>
          <p className="mt-2">
            To register, join the Discord and register there:{" "}
            <a
              href="https://discord.gg/SMZ4R8XzWZ"
              target="_blank"
              rel="noreferrer"
              className="text-lockdown-cyan"
            >
              https://discord.gg/SMZ4R8XzWZ
            </a>
          </p>
        </div>
      ) : null}

      <AccountProfileClient
        discordId={discordId}
        displayName={session?.user?.name ?? "Unknown"}
        playerProfile={playerProfile}
        userProfile={userProfile}
        canEdit={isRegistered}
        isAdmin={Boolean(session?.user?.isAdmin)}
      />
    </section>
  );
}
