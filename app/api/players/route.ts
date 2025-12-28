import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/queries";

export async function GET() {
  const players = await getPlayers();
  return NextResponse.json({ players });
}
