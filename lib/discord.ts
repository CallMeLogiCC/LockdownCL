export const buildDiscordAvatarUrl = (
  discordId: string,
  avatarHash: string | null | undefined,
  size = 256
) => {
  if (!avatarHash) {
    return null;
  }
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=${size}`;
};

export const buildDiscordBannerUrl = (
  discordId: string,
  bannerHash: string | null | undefined,
  size = 600
) => {
  if (!bannerHash) {
    return null;
  }
  return `https://cdn.discordapp.com/banners/${discordId}/${bannerHash}.png?size=${size}`;
};
