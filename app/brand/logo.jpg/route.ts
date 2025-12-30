import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const filePath = join(process.cwd(), "public", "brand", "logo.jpg");
  const image = await readFile(filePath);

  return new Response(image, {
    headers: {
      "Content-Type": "image/jpeg"
    }
  });
}
