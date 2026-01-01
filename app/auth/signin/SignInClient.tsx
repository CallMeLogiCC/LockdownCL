"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const DEFAULT_CALLBACK = "/account";

const isBlockedPath = (path: string) => path.startsWith("/api/auth") || path.startsWith("/auth");

export default function SignInClient() {
  const searchParams = useSearchParams();
  const [disabled, setDisabled] = useState(false);

  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    if (!raw) {
      return DEFAULT_CALLBACK;
    }
    if (raw.startsWith("/")) {
      return isBlockedPath(raw) ? DEFAULT_CALLBACK : raw;
    }
    try {
      const parsed = new URL(raw);
      if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
        const pathWithQuery = `${parsed.pathname}${parsed.search}`;
        return isBlockedPath(parsed.pathname) ? DEFAULT_CALLBACK : pathWithQuery;
      }
    } catch (error) {
      console.warn("Invalid callbackUrl provided", error);
    }
    return DEFAULT_CALLBACK;
  }, [searchParams]);

  const handleSignIn = async () => {
    if (disabled) {
      return;
    }
    setDisabled(true);
    setTimeout(() => setDisabled(false), 3000);
    await signIn("discord", { callbackUrl });
  };

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">LockdownCL</p>
        <h1 className="mt-2 text-3xl font-semibold">Sign in with Discord</h1>
        <p className="mt-3 text-sm text-white/70">
          Use your Discord account to manage your profile and view your public stats.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSignIn}
        disabled={disabled}
        className="rounded-full bg-lockdown-cyan px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        {disabled ? "Opening Discord..." : "Continue with Discord"}
      </button>

      <div className="text-xs text-white/50">
        <p>
          If you recently tried signing in, wait a few seconds before trying again to
          avoid rate limits.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
        <Link href="/" className="hover:text-white">
          Return Home
        </Link>
        <Link href="/players" className="hover:text-white">
          Browse Players
        </Link>
      </div>
    </section>
  );
}
