import { NextResponse } from "next/server";
import { getSheetId, getSheetsClient } from "@/lib/sheets";
import type {
  MapLogIngest,
  MatchLogIngest,
  Player,
  PlayerLogEntryIngest
} from "@/lib/types";
import { hasDatabaseUrl } from "@/lib/db";
import {
  upsertMaps,
  upsertPlayerLogEntries,
  upsertPlayers,
  upsertSeries
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLAYERS_RANGE_FALLBACK = "Player OVR!A2:J";
const SERIES_RANGE_FALLBACK = "Match Log!A2:I";
const MAPS_RANGE_FALLBACK = "Map Log!A2:F";
const PLAYER_LOG_RANGE_FALLBACK = "Player Log!A2:P";

const getRange = (envKey: string, fallback: string) =>
  process.env[envKey] ?? fallback;

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const buildHeaderIndex = (headers: string[]) => {
  const index = new Map<string, number>();
  headers.forEach((header, idx) => {
    const normalized = normalizeHeader(header);
    if (normalized) {
      index.set(normalized, idx);
    }
  });
  return index;
};

const getHeaderIndex = (
  index: Map<string, number>,
  candidates: string[],
  fallback: number
) => {
  for (const candidate of candidates) {
    const normalized = normalizeHeader(candidate);
    const match = index.get(normalized);
    if (match !== undefined) {
      return match;
    }
  }
  return fallback;
};

const getHeaderRange = (range: string) => {
  const [sheetName, gridRange] = range.split("!");
  if (!sheetName || !gridRange) {
    return null;
  }

  const match = gridRange.match(/^([A-Z]+)(\d+)(:([A-Z]+)(\d+)?)?$/i);
  if (!match) {
    return null;
  }

  const startCol = match[1];
  const endCol = match[4] ?? startCol;
  return `${sheetName}!${startCol}1:${endCol}1`;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const toNullableInteger = (value: unknown) => {
  const numeric = toNullableNumber(value);
  return numeric === null ? null : Math.round(numeric);
};

const toRequiredInteger = (value: unknown) => {
  const numeric = toNullableInteger(value);
  return numeric ?? 0;
};

const getSheetName = (range: string) => range.split("!")[0] ?? "";

const getStartRow = (range: string) => {
  const [, gridRange] = range.split("!");
  if (!gridRange) {
    return 1;
  }
  const match = gridRange.match(/^[A-Z]+(\d+)/i);
  if (!match) {
    return 1;
  }
  const start = Number(match[1]);
  return Number.isNaN(start) ? 1 : start;
};

const withSourceRows = <T>(rows: T[], startRow: number) =>
  rows.map((row, index) => ({ row, source_row: startRow + index }));

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

const allowedModes = ["Hardpoint", "SnD", "Control"] as const;

const normalizeMode = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const matched = allowedModes.find(
    (mode) => mode.toLowerCase() === trimmed.toLowerCase()
  );
  return matched ?? null;
};

const parseRank = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return { rank_value: null, rank_is_na: true };
    }
    if (trimmed.toLowerCase() === "na") {
      return { rank_value: null, rank_is_na: true };
    }
    const numeric = Number(trimmed);
    if (Number.isNaN(numeric) || numeric < 0.5 || numeric > 18.0) {
      return { rank_value: null, rank_is_na: true };
    }
    return { rank_value: numeric, rank_is_na: false };
  }
  const numeric = toNullableNumber(value);
  if (numeric === null || numeric < 0.5 || numeric > 18.0) {
    return { rank_value: null, rank_is_na: true };
  }
  return { rank_value: numeric, rank_is_na: false };
};

const mapPlayerRow = (row: string[]): Player | null => {
  if (row.length < 2) {
    return null;
  }

  const rank = parseRank(row[4]);
  const womensRank = toNullableNumber(row[9]);

  return {
    discord_name: row[0] ?? null,
    discord_id: row[1] ?? "",
    ign: row[2] ?? null,
    rank_value: rank.rank_value,
    rank_is_na: rank.rank_is_na,
    team: row[5] ?? null,
    status: row[6] ?? null,
    women_status: row[7] ?? null,
    womens_team: row[8] || null,
    womens_rank: womensRank
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

    const playerHeaderRange = getHeaderRange(playerRange);
    const seriesHeaderRange = getHeaderRange(seriesRange);
    const mapsHeaderRange = getHeaderRange(mapsRange);
    const playerLogHeaderRange = getHeaderRange(playerLogRange);

    const headerRanges = [
      playerHeaderRange,
      seriesHeaderRange,
      mapsHeaderRange,
      playerLogHeaderRange
    ].filter((range): range is string => Boolean(range));

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: [playerRange, seriesRange, mapsRange, playerLogRange, ...headerRanges]
    });

    const valueRanges = response.data.valueRanges?.map((range) => range.values ?? []) ?? [];
    const [playerValues, seriesValues, mapValues, playerLogValues] = valueRanges;
    let headerOffset = 4;
    const playerHeaderValues = playerHeaderRange
      ? valueRanges[headerOffset++] ?? []
      : [];
    const seriesHeaderValues = seriesHeaderRange
      ? valueRanges[headerOffset++] ?? []
      : [];
    const mapsHeaderValues = mapsHeaderRange
      ? valueRanges[headerOffset++] ?? []
      : [];
    const playerLogHeaderValues = playerLogHeaderRange
      ? valueRanges[headerOffset++] ?? []
      : [];

    const mapHeaderIndex = buildHeaderIndex(mapsHeaderValues[0] ?? []);
    const playerLogHeaderIndex = buildHeaderIndex(playerLogHeaderValues[0] ?? []);

    const players = (playerValues ?? [])
      .map((row) => mapPlayerRow(row as string[]))
      .filter((player): player is Player => Boolean(player?.discord_id));

    const seriesStartRow = getStartRow(seriesRange);
    const mapsStartRow = getStartRow(mapsRange);
    const playerLogStartRow = getStartRow(playerLogRange);
    const seriesSheet = getSheetName(seriesRange);
    const mapsSheet = getSheetName(mapsRange);
    const playerLogSheet = getSheetName(playerLogRange);

    const series = withSourceRows(seriesValues ?? [], seriesStartRow)
      .map(({ row, source_row }) => {
        const match_id = row[0] ?? "";
        const match_date = normalizeMatchDate(row[2] ?? "");
        if (!match_id) {
          return null;
        }
        return {
          match_id,
          match_date,
          home_team: row[4] ?? null,
          away_team: row[5] ?? null,
          home_wins: toNullableInteger(row[6]),
          away_wins: toNullableInteger(row[7]),
          series_winner: row[8] ?? null,
          source_sheet: seriesSheet,
          source_row
        } satisfies MatchLogIngest;
      })
      .filter((match): match is NonNullable<typeof match> => Boolean(match));

    const maps = withSourceRows(mapValues ?? [], mapsStartRow)
      .map(({ row, source_row }) => {
        const match_id =
          row[
            getHeaderIndex(mapHeaderIndex, ["match id", "match_id"], 0)
          ] ?? "";
        const map_num = toRequiredInteger(
          row[
            getHeaderIndex(mapHeaderIndex, ["map #", "map number", "map_num"], 1)
          ]
        );
        const mode = normalizeMode(
          row[getHeaderIndex(mapHeaderIndex, ["mode", "game mode"], 2)]
        );
        if (!match_id || !map_num || !mode) {
          return null;
        }
        return {
          match_id,
          map_num,
          mode,
          map:
            row[
              getHeaderIndex(mapHeaderIndex, ["map", "map name"], 3)
            ] ?? "",
          winner_team:
            row[
              getHeaderIndex(
                mapHeaderIndex,
                ["winner team", "winning team", "winner"],
                4
              )
            ] ?? "",
          losing_team:
            row[
              getHeaderIndex(
                mapHeaderIndex,
                ["losing team", "loser"],
                5
              )
            ] ?? "",
          source_sheet: mapsSheet,
          source_row
        } satisfies MapLogIngest;
      })
      .filter((map): map is NonNullable<typeof map> => Boolean(map));

    const playerStats = withSourceRows(playerLogValues ?? [], playerLogStartRow)
      .map(({ row, source_row }) => {
        const match_id =
          row[
            getHeaderIndex(playerLogHeaderIndex, ["match id", "match_id"], 0)
          ] ?? "";
        const match_date = normalizeMatchDate(
          row[getHeaderIndex(playerLogHeaderIndex, ["match date", "date"], 2)] ??
            ""
        );
        const mode = normalizeMode(
          row[getHeaderIndex(playerLogHeaderIndex, ["mode", "game mode"], 7)]
        );
        const discord_id =
          row[
            getHeaderIndex(
              playerLogHeaderIndex,
              ["discord id", "discord_id", "discord"],
              6
            )
          ] ?? "";
        if (!match_id || !discord_id || !mode) {
          return null;
        }

        const hp_time =
          mode === "Hardpoint"
            ? toNullableInteger(
                row[
                  getHeaderIndex(
                    playerLogHeaderIndex,
                    ["hp time", "hardpoint time", "hill time"],
                    11
                  )
                ]
              )
            : null;
        const plants =
          mode === "SnD"
            ? toNullableInteger(
                row[getHeaderIndex(playerLogHeaderIndex, ["plants"], 12)]
              )
            : null;
        const defuses =
          mode === "SnD"
            ? toNullableInteger(
                row[getHeaderIndex(playerLogHeaderIndex, ["defuses"], 13)]
              )
            : null;
        const ticks =
          mode === "Control"
            ? toNullableInteger(
                row[getHeaderIndex(playerLogHeaderIndex, ["ticks"], 14)]
              )
            : null;

        return {
          match_id,
          match_date,
          team:
            row[
              getHeaderIndex(playerLogHeaderIndex, ["team", "team name"], 4)
            ] ?? null,
          player:
            row[
              getHeaderIndex(playerLogHeaderIndex, ["player", "player name"], 5)
            ] ?? null,
          discord_id,
          mode,
          k: toNullableInteger(
            row[getHeaderIndex(playerLogHeaderIndex, ["k", "kills"], 8)]
          ),
          d: toNullableInteger(
            row[getHeaderIndex(playerLogHeaderIndex, ["d", "deaths"], 9)]
          ),
          kd: toNullableNumber(
            row[getHeaderIndex(playerLogHeaderIndex, ["kd", "k/d"], 10)]
          ),
          hp_time,
          plants,
          defuses,
          ticks,
          write_in:
            row[getHeaderIndex(playerLogHeaderIndex, ["write in", "write_in"], 15)] ??
            null,
          source_sheet: playerLogSheet,
          source_row
        } satisfies PlayerLogEntryIngest;
      })
      .filter((stat): stat is NonNullable<typeof stat> => Boolean(stat));

    const upsertedPlayers = await upsertPlayers(players);
    const upsertedSeries = await upsertSeries(series);
    const upsertedMaps = await upsertMaps(maps);
    const upsertedPlayerStats = await upsertPlayerLogEntries(playerStats);

    return NextResponse.json({
      player_log: upsertedPlayerStats,
      map_log: upsertedMaps,
      match_log: upsertedSeries,
      player_ovr: upsertedPlayers
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown ingestion error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
