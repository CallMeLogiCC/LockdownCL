import { NextResponse } from "next/server";
import { getSheetId, getSheetsClient } from "@/lib/sheets";
import type { Player } from "@/lib/types";
import { hasDatabaseUrl } from "@/lib/db";
import {
  upsertMaps,
  upsertPlayerMapStats,
  upsertPlayers,
  upsertSeries
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLAYERS_RANGE_FALLBACK = "Player OVR!A2:I";
const SERIES_RANGE_FALLBACK = "Match Log!A2:I";
const MAPS_RANGE_FALLBACK = "Map Log!A2:F";
const PLAYER_LOG_RANGE_FALLBACK = "Player Log!A2:P";

const getRange = (envKey: string, fallback: string) =>
  process.env[envKey] ?? fallback;

const toNumber = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const uniqueByKey = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const formatDateParts = (year: number, month: number, day: number) => {
  const monthValue = `${month}`.padStart(2, "0");
  const dayValue = `${day}`.padStart(2, "0");
  return `${year}-${monthValue}-${dayValue}`;
};

const normalizeMatchDate = (value: string) => {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const monthDayMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (monthDayMatch) {
    const currentYear = new Date().getFullYear();
    const month = Number(monthDayMatch[1]);
    const day = Number(monthDayMatch[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return formatDateParts(currentYear, month, day);
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateParts(
      parsed.getFullYear(),
      parsed.getMonth() + 1,
      parsed.getDate()
    );
  }

  return null;
};

const mapPlayerRow = (row: string[]): Player | null => {
  if (row.length < 3) {
    return null;
  }

  const salary = toNumber(row[8]);

  return {
    discord_id: row[1] ?? "",
    ign: row[2] ?? "",
    rank: row[3] ?? "Unranked",
    team: row[4] ?? "Unassigned",
    status: row[5] ?? "inactive",
    womens_status: row[6] ?? "inactive",
    womens_team: row[7] || null,
    salary
  };
};

export async function POST() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 500 }
    );
  }

  try {
    const sheets = getSheetsClient();
    const sheetId = getSheetId();
    const playerRange = getRange("SHEET_RANGE_PLAYERS", PLAYERS_RANGE_FALLBACK);
    const seriesRange = getRange("SHEET_RANGE_SERIES", SERIES_RANGE_FALLBACK);
    const mapsRange = getRange("SHEET_RANGE_MAPS", MAPS_RANGE_FALLBACK);
    const playerLogRange = getRange(
      "SHEET_RANGE_PLAYER_LOG",
      PLAYER_LOG_RANGE_FALLBACK
    );

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: [playerRange, seriesRange, mapsRange, playerLogRange]
    });

    const [playerValues, seriesValues, mapValues, playerLogValues] =
      response.data.valueRanges?.map((range) => range.values ?? []) ?? [];

    const players = (playerValues ?? [])
      .map((row) => mapPlayerRow(row as string[]))
      .filter((player): player is Player => Boolean(player?.discord_id));

    const series = uniqueByKey(
      (seriesValues ?? [])
        .map((row) => {
          const match_id = row[0] ?? "";
          const match_date = normalizeMatchDate(row[2] ?? "");
          if (!match_id || !match_date) {
            return null;
          }
          return {
            match_id,
            match_date,
            division: row[3] ?? "",
            home_team: row[4] ?? "",
            away_team: row[5] ?? "",
            home_wins: toNumber(row[6]),
            away_wins: toNumber(row[7]),
            series_winner: row[8] ?? ""
          };
        })
        .filter((match): match is NonNullable<typeof match> => Boolean(match)),
      (match) => match.match_id
    );

    const maps = uniqueByKey(
      (mapValues ?? [])
        .map((row) => {
          const match_id = row[0] ?? "";
          const map_number = toNumber(row[1]);
          if (!match_id || !map_number) {
            return null;
          }
          const map_id = `${match_id}-${map_number}`;
          return {
            id: map_id,
            match_id,
            map_number,
            mode: row[2] ?? "",
            map_name: row[3] ?? "",
            winning_team: row[4] ?? "",
            losing_team: row[5] ?? ""
          };
        })
        .filter((map): map is NonNullable<typeof map> => Boolean(map)),
      (map) => map.id
    );

    const playerStats = uniqueByKey(
      (playerLogValues ?? [])
        .map((row) => {
          const match_id = row[0] ?? "";
          const discord_id = row[6] ?? "";
          const map_number = toNumber(row[14]);
          if (!match_id || !discord_id || !map_number) {
            return null;
          }
          const map_id = `${match_id}-${map_number}`;
          return {
            id: `${match_id}-${map_number}-${discord_id}`,
            match_id,
            map_id,
            discord_id,
            kills: toNumber(row[8]),
            deaths: toNumber(row[9]),
            assists: 0,
            hp_time: toNumber(row[11]),
            plants: toNumber(row[12]),
            defuses: toNumber(row[13])
          };
        })
        .filter((stat): stat is NonNullable<typeof stat> => Boolean(stat)),
      (stat) => stat.id
    );

    const upsertedPlayers = await upsertPlayers(players);
    const upsertedSeries = await upsertSeries(series);
    const upsertedMaps = await upsertMaps(maps);
    const upsertedPlayerStats = await upsertPlayerMapStats(playerStats);

    return NextResponse.json({
      status: "ok",
      ranges: {
        players: playerRange,
        series: seriesRange,
        maps: mapsRange,
        playerLog: playerLogRange
      },
      rows: {
        players: playerValues?.length ?? 0,
        series: seriesValues?.length ?? 0,
        maps: mapValues?.length ?? 0,
        playerLog: playerLogValues?.length ?? 0
      },
      upserted: {
        players: upsertedPlayers,
        series: upsertedSeries,
        maps: upsertedMaps,
        playerStats: upsertedPlayerStats
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown ingestion error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
