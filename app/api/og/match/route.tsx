/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og";
import { getLogoDataUrl, OG_SIZE } from "@/lib/og";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";

const truncate = (value: string, max = 44) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return new Response("Missing matchId", { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const dataResponse = await fetch(`${origin}/api/seo/match?matchId=${matchId}`);

  if (!dataResponse.ok) {
    return new Response("Match not found", { status: 404 });
  }

  const data = (await dataResponse.json()) as {
    homeTeam: string;
    awayTeam: string;
    scoreline: string;
    winner: string;
  };

  const logoUrl = await getLogoDataUrl(origin);
  const title = truncate(`${data.homeTeam} vs ${data.awayTeam}`, 42);
  const subtitle = truncate(`Score ${data.scoreline} · ${data.winner} Wins`, 56);

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
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1 }}>{title}</div>
          <div style={{ fontSize: 32, color: "#94a3b8" }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 20, color: "#475569" }}>Match recap</div>
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
