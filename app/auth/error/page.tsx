import { Suspense } from "react";
import ErrorClient from "@/app/auth/error/ErrorClient";

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">LockdownCL</p>
            <h1 className="mt-2 text-3xl font-semibold">Sign-in issue</h1>
            <p className="mt-3 text-sm text-white/70">Loading error details…</p>
          </div>
        </section>
      }
    >
      <ErrorClient />
    </Suspense>
  );
}
