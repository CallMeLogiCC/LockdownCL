import { NextResponse } from "next/server";
import { getSheetId, getSheetRange, getSheetsClient } from "@/lib/sheets";
import type { Player } from "@/lib/types";
import { hasDatabaseUrl } from "@/lib/db";
import { upsertPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLAYERS_RANGE_FALLBACK = "players!A2:H";

const mapPlayerRow = (row: string[]): Player | null => {
  if (row.length < 3) {
    return null;
  }

  const salary = Number(row[7] ?? 0);

  return {
    discord_id: row[0] ?? "",
    ign: row[1] ?? "",
    rank: row[2] ?? "Unranked",
    team: row[3] ?? "Unassigned",
    status: row[4] ?? "inactive",
    womens_status: row[5] ?? "inactive",
    womens_team: row[6] || null,
    salary: Number.isNaN(salary) ? 0 : salary
  };
};

export async function POST() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 500 }
    );
  }

  const sheets = getSheetsClient();
  const sheetId = getSheetId();
  const range = getSheetRange(PLAYERS_RANGE_FALLBACK);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range
  });

  const values = response.data.values ?? [];
  const players = values
    .map((row) => mapPlayerRow(row as string[]))
    .filter((player): player is Player => Boolean(player?.discord_id));

  const upserted = await upsertPlayers(players);

  return NextResponse.json({
    status: "ok",
    range,
    rows: values.length,
    upserted
  });
}
