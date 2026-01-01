import { Buffer } from "buffer";
import { BRAND_LOGO_PATH, SITE_URL } from "@/lib/seo";

export const OG_SIZE = { width: 1200, height: 630 };

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  return Buffer.from(buffer).toString("base64");
};

export const getLogoDataUrl = async (origin?: string) => {
  const baseUrl = origin ?? SITE_URL;
  const logoUrl = new URL(BRAND_LOGO_PATH, baseUrl).toString();
  const response = await fetch(logoUrl);
  if (!response.ok) {
    return logoUrl;
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  return `data:${contentType};base64,${base64}`;
};
