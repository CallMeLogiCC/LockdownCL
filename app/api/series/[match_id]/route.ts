import { NextResponse } from "next/server";
import {
  getMapsBySeries,
  getPlayerStatsBySeries,
  getSeriesById
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { match_id: string } }
) {
  const match = await getSeriesById(params.match_id);

  if (!match) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const maps = await getMapsBySeries(params.match_id);
  const stats = await getPlayerStatsBySeries(params.match_id);

  return NextResponse.json({ series: match, maps, stats });
}
