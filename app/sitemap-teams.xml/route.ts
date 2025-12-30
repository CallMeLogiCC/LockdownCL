import { hasDatabaseUrl } from "@/lib/db";
import { listTeamsForSitemap } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";
import { slugifyTeam } from "@/lib/slug";

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

export async function GET() {
  if (!hasDatabaseUrl()) {
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

    return new Response(body, {
      headers: {
        "Content-Type": "application/xml"
      }
    });
  }

  const teams = await listTeamsForSitemap();

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    teams
      .map((team) => {
        const loc = `${SITE_URL}/teams/${slugifyTeam(team.team_name)}`;
        const lastmod = normalizeDate(team.last_match_date);
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
