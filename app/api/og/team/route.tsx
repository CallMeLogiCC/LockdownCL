/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og";
import { getLogoDataUrl, OG_SIZE } from "@/lib/og";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";

const truncate = (value: string, max = 40) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const dataResponse = await fetch(`${origin}/api/seo/team?slug=${slug}`);

  if (!dataResponse.ok) {
    return new Response("Team not found", { status: 404 });
  }

  const data = (await dataResponse.json()) as {
    team: string;
    league: string;
    record: string;
    mapDiff: number;
  };

  const logoUrl = await getLogoDataUrl(origin);
  const title = truncate(data.team, 34);
  const subtitle = truncate(`${data.league} · ${data.record} · Map Diff ${data.mapDiff}`, 56);

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
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1 }}>{title}</div>
          <div style={{ fontSize: 32, color: "#94a3b8" }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 20, color: "#475569" }}>Team overview</div>
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
