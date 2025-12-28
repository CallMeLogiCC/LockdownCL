import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    databaseUrlSet: hasDatabaseUrl(),
    nodeEnv: process.env.NODE_ENV ?? null
  });
}
