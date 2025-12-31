import type { Adapter } from "next-auth/adapters";
import { getServerSession } from "next-auth/next";
import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import PostgresAdapter from "@auth/pg-adapter";
import { getPool, hasDatabaseUrl } from "@/lib/db";
import { buildDiscordAvatarUrl, buildDiscordBannerUrl } from "@/lib/discord";
import { ensureUserProfile, getDiscordIdForUserId } from "@/lib/queries";

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

const safeGetDiscordIdForUserId = async (userId: string) => {
  try {
    return await getDiscordIdForUserId(userId);
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    console.error("Failed to resolve Discord id for user", error);
    return null;
  }
};

export const authOptions: NextAuthOptions = {
  adapter: hasDatabase ? (PostgresAdapter(getPool()) as Adapter) : undefined,
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
  session: hasDatabase
    ? {
        strategy: "database",
        maxAge: 60 * 60 * 24 * 90,
        updateAge: 60 * 60 * 24
      }
    : undefined,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "discord" && hasDatabase) {
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
      return true;
    },
    async session({ session, user }) {
      if (session.user && hasDatabase && user?.id) {
        session.user.id = user.id;
        const discordId = await safeGetDiscordIdForUserId(user.id);
        session.user.discordId = discordId;
        session.user.isAdmin = discordId ? adminIds.includes(discordId) : false;
      }
      return session;
    }
  }
};

export const getAuthSession = () => getServerSession(authOptions);

export const getSafeAuthSession = async () => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("Failed to load auth session", error);
    return null;
  }
};
