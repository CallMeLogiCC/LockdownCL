import { BRAND_LOGO_PATH, SITE_URL } from "@/lib/seo";

export async function GET() {
  const logoUrl = new URL(BRAND_LOGO_PATH, SITE_URL);
  const response = await fetch(logoUrl);
  const svgText = await response.text();

  return new Response(svgText, {
    headers: {
      "Content-Type": "image/svg+xml"
    }
  });
}
