import Link from "next/link";

export default function SignInButton() {
  return (
    <Link
      href="/auth/signin"
      className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/60 hover:text-white"
    >
      Sign In
    </Link>
  );
}
