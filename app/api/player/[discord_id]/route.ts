import { NextResponse } from "next/server";
import { getPlayerById, getPlayerStatsByPlayer } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: { discord_id: string } }
) {
  const player = getPlayerById(params.discord_id);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const stats = getPlayerStatsByPlayer(params.discord_id);

  return NextResponse.json({ player, stats });
}
