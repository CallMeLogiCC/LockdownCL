/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og";
import { getLogoDataUrl, OG_SIZE } from "@/lib/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const runtime = "edge";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const logoUrl = await getLogoDataUrl(origin);

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
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 32, color: "#94a3b8" }}>{SITE_TAGLINE}</div>
        </div>
        <div style={{ fontSize: 20, color: "#475569" }}>Official stats hub</div>
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
