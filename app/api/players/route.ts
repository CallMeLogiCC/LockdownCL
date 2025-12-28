import { NextResponse } from "next/server";
import { players } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ players });
}
