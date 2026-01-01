/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og";
import { getLogoDataUrl, OG_SIZE } from "@/lib/og";
import { SITE_NAME } from "@/lib/seo";
import { getTeamLogo } from "@/lib/teams";

export const runtime = "edge";

const truncate = (value: string, max = 40) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

const formatWinPct = (value: number | null) => {
  if (value === null) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
};

const formatKd = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return value.toFixed(2);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get("discordId");

  if (!discordId) {
    return new Response("Missing discordId", { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const dataResponse = await fetch(`${origin}/api/seo/player?discordId=${discordId}`);

  if (!dataResponse.ok) {
    return new Response("Player not found", { status: 404 });
  }

  const data = (await dataResponse.json()) as {
    name: string;
    team: string;
    ovr: string;
    rankLabel: string;
    avatarUrl: string | null;
    teamSlug: string | null;
    teamLeague: "Lowers" | "Uppers" | "Legends" | "Womens" | null;
    stats: {
      overallKd: number | null;
      winPct: number | null;
      matchesPlayed: number;
    };
  };

  const logoUrl = await getLogoDataUrl(origin);
  const avatarUrl = data.avatarUrl ?? logoUrl;
  const teamLogoUrl =
    data.teamSlug && data.teamLeague
      ? new URL(getTeamLogo(data.teamSlug, data.teamLeague).src, origin).toString()
      : null;

  const title = truncate(data.name, 34);
  const subtitle = truncate(data.team, 40);

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          backgroundColor: "#050505",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img src={logoUrl} width={64} height={64} alt="LockdownCL" />
          <span style={{ fontSize: 24, color: "#94a3b8" }}>{SITE_NAME}</span>
        </div>

        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 32,
              overflow: "hidden",
              border: "2px solid rgba(148, 163, 184, 0.4)"
            }}
          >
            <img
              src={avatarUrl}
              width={160}
              height={160}
              alt={data.name}
              style={{ objectFit: "cover" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
              {title}
            </div>
            <div style={{ fontSize: 28, color: "#5eead4" }}>{subtitle}</div>
            <div style={{ fontSize: 22, color: "#94a3b8" }}>{data.ovr}</div>
          </div>

          {teamLogoUrl ? (
            <div
              style={{
                marginLeft: "auto",
                width: 120,
                height: 120,
                borderRadius: 24,
                overflow: "hidden",
                border: "2px solid rgba(94, 234, 212, 0.4)"
              }}
            >
              <img
                src={teamLogoUrl}
                width={120}
                height={120}
                alt={data.team}
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "space-between",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            padding: "20px 24px",
            borderRadius: 24,
            border: "1px solid rgba(148, 163, 184, 0.25)"
          }}
        >
          <div>
            <div style={{ fontSize: 16, color: "#94a3b8" }}>Overall KD</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {formatKd(data.stats.overallKd)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, color: "#94a3b8" }}>Win %</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {formatWinPct(data.stats.winPct)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, color: "#94a3b8" }}>Matches</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{data.stats.matchesPlayed}</div>
          </div>
          <div>
            <div style={{ fontSize: 16, color: "#94a3b8" }}>Rank</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{data.rankLabel}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: OG_SIZE.width,
      height: OG_SIZE.height
    }
  );

  imageResponse.headers.set(
    "Cache-Control",
    "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800"
  );

  return imageResponse;
}
