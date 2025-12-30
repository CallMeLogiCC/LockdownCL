import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const filePath = join(process.cwd(), "public", "icon.svg");
  const svg = await readFile(filePath, "utf8");

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml"
    }
  });
}
