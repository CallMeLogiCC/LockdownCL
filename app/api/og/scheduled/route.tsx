/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og";
import { getLogoDataUrl, OG_SIZE } from "@/lib/og";
import { SITE_NAME } from "@/lib/seo";
import { getTeamLogo } from "@/lib/teams";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const dataResponse = await fetch(`${origin}/api/seo/scheduled?slug=${slug}`);

  if (!dataResponse.ok) {
    return new Response("Scheduled match not found", { status: 404 });
  }

  const data = (await dataResponse.json()) as {
    homeTeam: string;
    awayTeam: string;
    division: string;
    week: number | null;
    matchTime: string | null;
    homeTeamSlug: string | null;
    homeTeamLeague: "Lowers" | "Uppers" | "Legends" | "Womens" | null;
    awayTeamSlug: string | null;
    awayTeamLeague: "Lowers" | "Uppers" | "Legends" | "Womens" | null;
  };

  const logoUrl = await getLogoDataUrl(origin);
  const homeLogoUrl =
    data.homeTeamSlug && data.homeTeamLeague
      ? new URL(getTeamLogo(data.homeTeamSlug, data.homeTeamLeague).src, origin).toString()
      : logoUrl;
  const awayLogoUrl =
    data.awayTeamSlug && data.awayTeamLeague
      ? new URL(getTeamLogo(data.awayTeamSlug, data.awayTeamLeague).src, origin).toString()
      : logoUrl;

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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 28,
                overflow: "hidden",
                border: "2px solid rgba(94, 234, 212, 0.4)"
              }}
            >
              <img
                src={homeLogoUrl}
                width={140}
                height={140}
                alt={data.homeTeam}
                style={{ objectFit: "cover" }}
              />
            </div>
            <div style={{ fontSize: 22, color: "#e2e8f0" }}>{data.homeTeam}</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 24,
                textTransform: "uppercase",
                letterSpacing: "0.3em",
                color: "#fb923c"
              }}
            >
              Scheduled
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 12 }}>
              {data.matchTime ?? "TBD"}
            </div>
            <div style={{ fontSize: 20, color: "#94a3b8", marginTop: 6 }}>
              {data.division} · Week {data.week ?? "TBD"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 28,
                overflow: "hidden",
                border: "2px solid rgba(94, 234, 212, 0.4)"
              }}
            >
              <img
                src={awayLogoUrl}
                width={140}
                height={140}
                alt={data.awayTeam}
                style={{ objectFit: "cover" }}
              />
            </div>
            <div style={{ fontSize: 22, color: "#e2e8f0", textAlign: "right" }}>
              {data.awayTeam}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 20, color: "#475569" }}>Scheduled match preview</div>
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
