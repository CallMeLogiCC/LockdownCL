"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile, Player } from "@/lib/types";
import { normalizeSocialHandle } from "@/lib/socials";

type Props = {
  discordId: string;
  displayName: string;
  playerProfile: Player | null;
  userProfile: UserProfile | null;
  canEdit: boolean;
  isAdmin: boolean;
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const MAX_BANNER_SIZE = 5 * 1024 * 1024;

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export default function AccountProfileClient({
  discordId,
  displayName,
  playerProfile,
  userProfile,
  canEdit,
  isAdmin
}: Props) {
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(userProfile?.banner_url ?? "");
  const [twitterUrl, setTwitterUrl] = useState(
    normalizeSocialHandle("twitter", userProfile?.twitter_url ?? "") ?? ""
  );
  const [twitchUrl, setTwitchUrl] = useState(
    normalizeSocialHandle("twitch", userProfile?.twitch_url ?? "") ?? ""
  );
  const [youtubeUrl, setYoutubeUrl] = useState(
    normalizeSocialHandle("youtube", userProfile?.youtube_url ?? "") ?? ""
  );
  const [tiktokUrl, setTiktokUrl] = useState(
    normalizeSocialHandle("tiktok", userProfile?.tiktok_url ?? "") ?? ""
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const router = useRouter();

  const uploadImage = async (file: File, type: "avatar" | "banner") => {
    setError(null);
    setStatus(null);
    if (file.type === "image/gif") {
      setError("Gifs are not yet supported");
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are supported");
      return;
    }
    const maxSize = type === "avatar" ? MAX_AVATAR_SIZE : MAX_BANNER_SIZE;
    if (file.size > maxSize) {
      setError(
        type === "avatar"
          ? "Avatar images must be 2MB or smaller"
          : "Banner images must be 5MB or smaller"
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(type);
    try {
      const response = await fetch(`/api/uploads?type=${type}`, {
        method: "POST",
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Upload failed");
      }
      if (type === "avatar") {
        setAvatarUrl(data.url);
      } else {
        setBannerUrl(data.url);
      }
      setStatus("Upload complete.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: normalizeUrl(avatarUrl),
          bannerUrl: normalizeUrl(bannerUrl),
          twitterUrl: normalizeSocialHandle("twitter", twitterUrl),
          twitchUrl: normalizeSocialHandle("twitch", twitchUrl),
          youtubeUrl: normalizeSocialHandle("youtube", youtubeUrl),
          tiktokUrl: normalizeSocialHandle("tiktok", tiktokUrl)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save profile");
      }
      setStatus("Profile updated.");
      router.push(`/players/${discordId}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">My Profile</h2>
          <p className="mt-2 text-sm text-white/70">
            Signed in as <span className="text-white">{displayName}</span>
          </p>
          <p className="text-xs text-white/50">Discord ID: {discordId}</p>
        </div>
        {isAdmin ? (
          <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-200">
            Admin
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-sm font-semibold text-white">Profile Images</h3>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Avatar</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar preview"
                      width={80}
                      height={80}
                      className="h-20 w-20 object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                      No avatar
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={!canEdit || uploading === "avatar"}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadImage(file, "avatar");
                    }
                  }}
                  className="text-xs text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Banner</p>
              <div className="mt-3 space-y-3">
                <div className="h-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  {bannerUrl ? (
                    <Image
                      src={bannerUrl}
                      alt="Banner preview"
                      width={600}
                      height={160}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                      No banner
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={!canEdit || uploading === "banner"}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadImage(file, "banner");
                    }
                  }}
                  className="text-xs text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-sm font-semibold text-white">Social Links</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">Twitter/X</label>
              <input
                value={twitterUrl}
                onChange={(event) => setTwitterUrl(event.target.value)}
                onBlur={(event) => {
                  setTwitterUrl(normalizeSocialHandle("twitter", event.target.value) ?? "");
                }}
                disabled={!canEdit}
                placeholder="handle (no @)"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">Twitch</label>
              <input
                value={twitchUrl}
                onChange={(event) => setTwitchUrl(event.target.value)}
                onBlur={(event) => {
                  setTwitchUrl(normalizeSocialHandle("twitch", event.target.value) ?? "");
                }}
                disabled={!canEdit}
                placeholder="handle"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">YouTube</label>
              <input
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                onBlur={(event) => {
                  setYoutubeUrl(normalizeSocialHandle("youtube", event.target.value) ?? "");
                }}
                disabled={!canEdit}
                placeholder="handle"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">TikTok</label>
              <input
                value={tiktokUrl}
                onChange={(event) => setTiktokUrl(event.target.value)}
                onBlur={(event) => {
                  setTiktokUrl(normalizeSocialHandle("tiktok", event.target.value) ?? "");
                }}
                disabled={!canEdit}
                placeholder="handle"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
              />
            </div>
          </div>
        </div>
      </div>

      {playerProfile ? (
        <p className="mt-4 text-xs text-white/50">
          League status: {playerProfile.status ?? "N/A"}
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {status ? <p className="mt-4 text-sm text-emerald-200">{status}</p> : null}

      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canEdit || saving}
          className="rounded-full bg-lockdown-cyan px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = "/api/auth/signout?callbackUrl=/")}
          className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/60"
        >
          Log out
        </button>
      </div>

      {!canEdit ? (
        <p className="mt-4 text-xs text-white/40">
          Profile edits are available once you are registered with the league.
        </p>
      ) : null}
    </div>
  );
}
