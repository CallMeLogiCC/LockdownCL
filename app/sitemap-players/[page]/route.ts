import { hasDatabaseUrl } from "@/lib/db";
import { listPlayersForSitemap } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";

const CHUNK_SIZE = 500;

const normalizeDate = (value: string | null) => {
  if (!value) {
    return new Date().toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};

export async function GET(
  _request: Request,
  { params }: { params: { page: string } }
) {
  if (!hasDatabaseUrl()) {
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

    return new Response(body, {
      headers: {
        "Content-Type": "application/xml"
      }
    });
  }

  const pageNumber = Number(params.page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return new Response("Invalid page", { status: 400 });
  }

  const players = await listPlayersForSitemap();
  const start = (pageNumber - 1) * CHUNK_SIZE;
  const chunk = players.slice(start, start + CHUNK_SIZE);

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    chunk
      .map((player) => {
        const loc = `${SITE_URL}/players/${player.discord_id}`;
        const lastmod = normalizeDate(player.last_match_date);
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`;
      })
      .join("\n") +
    `\n</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
