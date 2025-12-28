import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const players = await getPlayers();
  return NextResponse.json({ players });
}
