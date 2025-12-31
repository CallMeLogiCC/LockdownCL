import { NextResponse } from "next/server";
import { getMapsBySeries, getMatchPlayerRows, getSeriesById } from "@/lib/queries";
import { hasDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { match_id: string } }
) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 500 }
    );
  }

  const match = await getSeriesById(params.match_id);

  if (!match) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const maps = await getMapsBySeries(params.match_id, match.season);
  const stats = await getMatchPlayerRows(params.match_id, match.season);

  return NextResponse.json({ series: match, maps, stats });
}
