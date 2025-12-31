import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getPlayerById, updateUserProfile } from "@/lib/queries";

const normalize = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export async function PUT(request: Request) {
  const session = await getAuthSession();
  const discordId = session?.user?.discordId ?? null;

  if (!discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const playerProfile = await getPlayerById(discordId);
  if (!playerProfile) {
    return NextResponse.json({ error: "Profile edits are unavailable" }, { status: 403 });
  }

  const body = await request.json();
  const updated = await updateUserProfile({
    discordId,
    avatarUrl: normalize(body.avatarUrl),
    bannerUrl: normalize(body.bannerUrl),
    twitterUrl: normalize(body.twitterUrl),
    twitchUrl: normalize(body.twitchUrl),
    youtubeUrl: normalize(body.youtubeUrl),
    tiktokUrl: normalize(body.tiktokUrl)
  });

  if (!updated) {
    return NextResponse.json({
      ok: true,
      warning: "Profile storage is unavailable. Changes were not persisted."
    });
  }

  return NextResponse.json({ ok: true });
}
