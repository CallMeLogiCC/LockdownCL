import { NextResponse } from "next/server";
import {
  getMapsBySeries,
  getPlayerStatsBySeries,
  getSeriesById
} from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: { match_id: string } }
) {
  const match = getSeriesById(params.match_id);

  if (!match) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const maps = getMapsBySeries(params.match_id);
  const stats = getPlayerStatsBySeries(params.match_id);

  return NextResponse.json({ series: match, maps, stats });
}
