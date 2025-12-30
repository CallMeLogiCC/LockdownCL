import { hasDatabaseUrl } from "@/lib/db";
import { listMatchesForSitemap, listPlayersForSitemap, listTeamsForSitemap } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";

const PLAYERS_CHUNK_SIZE = 500;
const MATCHES_CHUNK_SIZE = 500;

const getLatestDate = (dates: Array<string | null>) => {
  const validDates = dates
    .map((value) => (value ? new Date(value) : null))
    .filter((value): value is Date => value !== null && !Number.isNaN(value.getTime()));
  if (validDates.length === 0) {
    return new Date().toISOString();
  }
  return new Date(Math.max(...validDates.map((date) => date.getTime()))).toISOString();
};

export async function GET() {
  if (!hasDatabaseUrl()) {
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <sitemap>\n    <loc>${SITE_URL}/sitemap-static.xml</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>\n` +
      `</sitemapindex>`;

    return new Response(body, {
      headers: {
        "Content-Type": "application/xml"
      }
    });
  }

  const [players, teams, matches] = await Promise.all([
    listPlayersForSitemap(),
    listTeamsForSitemap(),
    listMatchesForSitemap()
  ]);

  const playerChunks = Math.max(1, Math.ceil(players.length / PLAYERS_CHUNK_SIZE));
  const matchChunks = Math.max(1, Math.ceil(matches.length / MATCHES_CHUNK_SIZE));

  const lastmod = getLatestDate([
    ...players.map((entry) => entry.last_match_date),
    ...teams.map((entry) => entry.last_match_date),
    ...matches.map((entry) => entry.match_date)
  ]);

  const sitemapUrls = [
    `${SITE_URL}/sitemap-static.xml`,
    `${SITE_URL}/sitemap-teams.xml`,
    ...Array.from({ length: playerChunks }, (_, index) =>
      `${SITE_URL}/sitemap-players-${index + 1}.xml`
    ),
    ...Array.from({ length: matchChunks }, (_, index) =>
      `${SITE_URL}/sitemap-matches-${index + 1}.xml`
    )
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemapUrls
      .map(
        (loc) =>
          `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
      )
      .join("\n") +
    `\n</sitemapindex>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
