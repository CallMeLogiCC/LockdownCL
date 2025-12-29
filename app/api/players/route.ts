import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import { listPlayersWithStats } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 500 }
    );
  }

  const players = await listPlayersWithStats();
  return NextResponse.json({ players });
}
