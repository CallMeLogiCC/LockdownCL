import { getServerSession } from "next-auth/next";
import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { hasDatabaseUrl } from "@/lib/db";
import { buildDiscordAvatarUrl, buildDiscordBannerUrl } from "@/lib/discord";
import { ensureUserProfile } from "@/lib/queries";

const parseAdminIds = () =>
  (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const adminIds = parseAdminIds();

type DiscordProfile = {
  id: string;
  username?: string | null;
  global_name?: string | null;
  avatar?: string | null;
  banner?: string | null;
};

const getDiscordProfileName = (profile: DiscordProfile) =>
  profile.global_name ?? profile.username ?? "Unknown";

const hasDatabase = hasDatabaseUrl();
const isMissingTableError = (error: unknown) =>
  (error as { code?: string }).code === "42P01";

const DEFAULT_LOGIN_REDIRECT = "/account";
const DISALLOWED_REDIRECT_PATHS = [
  "/api/auth",
  "/auth/signin",
  "/auth/error"
];

const isDisallowedRedirect = (pathname: string) =>
  DISALLOWED_REDIRECT_PATHS.some((path) => pathname.startsWith(path));

const sanitizeRedirect = (url: string, baseUrl: string) => {
  if (!url) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  if (url.startsWith("/")) {
    return isDisallowedRedirect(url) ? DEFAULT_LOGIN_REDIRECT : url;
  }

  try {
    const targetUrl = new URL(url);
    const base = new URL(baseUrl);
    if (targetUrl.origin !== base.origin) {
      return DEFAULT_LOGIN_REDIRECT;
    }
    const pathWithQuery = `${targetUrl.pathname}${targetUrl.search}`;
    return isDisallowedRedirect(targetUrl.pathname)
      ? DEFAULT_LOGIN_REDIRECT
      : pathWithQuery;
  } catch (error) {
    console.warn("Invalid redirect URL provided", error);
    return DEFAULT_LOGIN_REDIRECT;
  }
};

const shouldUseSecureCookies = process.env.NODE_ENV === "production";
const cookieDomain = shouldUseSecureCookies ? ".lockdowncl.online" : undefined;

const safeEnsureUserProfile = async (params: {
  discordId: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}) => {
  try {
    await ensureUserProfile(params);
  } catch (error) {
    if (isMissingTableError(error)) {
      return;
    }
    console.error("Failed to ensure user profile", error);
  }
};

let loggedMissingSecret = false;
const logMissingSecret = () => {
  if (loggedMissingSecret) {
    return;
  }
  loggedMissingSecret = true;
  console.error("NEXTAUTH_SECRET is missing; authentication will fail until set.");
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  useSecureCookies: shouldUseSecureCookies,
  cookies: {
    sessionToken: {
      name: shouldUseSecureCookies
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: shouldUseSecureCookies,
        domain: cookieDomain
      }
    },
    callbackUrl: {
      name: shouldUseSecureCookies
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: shouldUseSecureCookies,
        domain: cookieDomain
      }
    },
    csrfToken: {
      name: shouldUseSecureCookies ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: shouldUseSecureCookies
      }
    }
  },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      authorization: { params: { scope: "identify" } },
      profile(profile: DiscordProfile) {
        return {
          id: profile.id,
          name: getDiscordProfileName(profile),
          email: null,
          image: buildDiscordAvatarUrl(profile.id, profile.avatar)
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 90,
    updateAge: 60 * 60 * 24
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (!process.env.NEXTAUTH_SECRET) {
        logMissingSecret();
      }
      if (account?.provider === "discord") {
        if (!account.providerAccountId) {
          console.error("Discord sign-in missing provider account id.");
          return false;
        }
        if (hasDatabase) {
          const discordId = account.providerAccountId;
          const discordProfile = profile as DiscordProfile | undefined;
          const avatarUrl = buildDiscordAvatarUrl(discordId, discordProfile?.avatar ?? null);
          const bannerUrl = buildDiscordBannerUrl(discordId, discordProfile?.banner ?? null);
          await safeEnsureUserProfile({
            discordId,
            avatarUrl,
            bannerUrl
          });
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      const safeUrl = sanitizeRedirect(url, baseUrl);
      if (safeUrl !== url) {
        console.info("Auth redirect sanitized", { url, safeUrl });
      }
      return safeUrl;
    },
    async jwt({ token, account }) {
      if (account?.provider === "discord") {
        token.discordId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const discordId =
          typeof token.discordId === "string" ? token.discordId : token.sub ?? null;
        session.user.id = token.sub ?? null;
        session.user.discordId = discordId;
        session.user.isAdmin = discordId ? adminIds.includes(discordId) : false;
      }
      return session;
    }
  },
  events: {
    async signIn({ user, account }) {
      console.info("User signed in", {
        provider: account?.provider,
        userId: user?.id
      });
    },
    async error(message) {
      console.error("NextAuth error", message);
    }
  }
};

export const getAuthSession = () => getServerSession(authOptions);

export const getSafeAuthSession = async () => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    const digest = (error as { digest?: string }).digest;
    if (digest !== "DYNAMIC_SERVER_USAGE") {
      console.error("Failed to load auth session", error);
    }
    return null;
  }
};
