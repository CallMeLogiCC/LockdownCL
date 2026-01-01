"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const rateLimitMessage =
  "Discord is temporarily rate limiting sign-ins due to too many login attempts. Please wait 10–30 minutes and try again.";

const getErrorMessage = (error: string | null) => {
  if (!error) {
    return "Something went wrong during sign-in. Please try again.";
  }

  const normalized = error.toLowerCase();
  if (
    normalized.includes("oauthcallback") ||
    normalized.includes("invalid_request") ||
    normalized.includes("ratelimit") ||
    normalized.includes("rate")
  ) {
    return rateLimitMessage;
  }

  if (normalized.includes("configuration")) {
    return "Authentication is not configured correctly. Please contact the site admin.";
  }

  if (normalized.includes("accessdenied")) {
    return "Sign-in was canceled or denied. Please try again.";
  }

  return "We couldn't complete sign-in. Please try again or return later.";
};

export default function ErrorClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = getErrorMessage(error);

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">LockdownCL</p>
        <h1 className="mt-2 text-3xl font-semibold">Sign-in issue</h1>
        <p className="mt-3 text-sm text-white/70">{message}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/auth/signin"
          className="rounded-full bg-lockdown-cyan px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black"
        >
          Back to Sign In
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/60"
        >
          Return Home
        </Link>
      </div>

      {error ? <p className="text-xs text-white/40">Error code: {error}</p> : null}
    </section>
  );
}
