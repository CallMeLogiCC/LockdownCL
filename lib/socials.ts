export type SocialPlatform = "twitter" | "twitch" | "youtube" | "tiktok";

const SOCIAL_HOSTS: Record<SocialPlatform, string[]> = {
  twitter: ["twitter.com", "x.com"],
  twitch: ["twitch.tv"],
  youtube: ["youtube.com", "youtu.be"],
  tiktok: ["tiktok.com"]
};

const buildUrl = (platform: SocialPlatform, handle: string) => {
  switch (platform) {
    case "twitter":
      return `https://x.com/${handle}`;
    case "twitch":
      return `https://twitch.tv/${handle}`;
    case "youtube":
      return `https://youtube.com/@${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    default:
      return handle;
  }
};

const sanitizeHandle = (value: string) =>
  value.trim().replace(/^@/, "").replace(/\/+$/, "").trim();

const extractHandleFromUrl = (platform: SocialPlatform, rawValue: string) => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const supportedHosts = SOCIAL_HOSTS[platform];
    if (!supportedHosts.some((entry) => host.endsWith(entry))) {
      return null;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) {
      return null;
    }

    if (platform === "youtube") {
      const [first, second] = pathParts;
      if (first === "channel" || first === "c" || first === "user") {
        return second ? sanitizeHandle(second) : null;
      }
      return sanitizeHandle(first);
    }

    if (platform === "tiktok") {
      return sanitizeHandle(pathParts[0]);
    }

    return sanitizeHandle(pathParts[0]);
  } catch {
    return null;
  }
};

export const normalizeSocialHandle = (platform: SocialPlatform, value: string | null) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const fromUrl = extractHandleFromUrl(platform, trimmed);
  if (fromUrl) {
    return fromUrl;
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const handle = sanitizeHandle(withoutProtocol.split("/")[0]);
  return handle.length > 0 ? handle : null;
};

export const buildSocialUrl = (platform: SocialPlatform, handle: string | null) => {
  if (!handle) {
    return null;
  }
  const normalized = sanitizeHandle(handle);
  return normalized ? buildUrl(platform, normalized) : null;
};
