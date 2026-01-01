import { NextRequest, NextResponse } from "next/server";
import { getSheetId, getSheetsClient } from "@/lib/sheets";
import type {
  MapLogIngest,
  MatchLogIngest,
  Player,
  PlayerLogEntryIngest,
  ScheduleMatchIngest
} from "@/lib/types";
import { hasDatabaseUrl } from "@/lib/db";
import {
  createIngestRun,
  finalizeIngestRun,
  upsertMaps,
  upsertPlayerLogEntries,
  upsertPlayers,
  upsertSchedule,
  upsertSeries
} from "@/lib/queries";
import { isSeasonValue, type SeasonNumber } from "@/lib/seasons";
import { buildScheduleSlug } from "@/lib/schedule";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLAYERS_RANGE_FALLBACK = "Player OVR!A2:J";
const SERIES_RANGE_FALLBACK = "Match Log!A2:I";
const MAPS_RANGE_FALLBACK = "Map Log!A2:F";
const PLAYER_LOG_RANGE_FALLBACK = "Player Log!A2:P";
const SCHEDULE_RANGE_FALLBACK = "schedule!A2:J";

const SERIES_GRID_RANGE = "A2:I";
const MAPS_GRID_RANGE = "A2:F";
const PLAYER_LOG_GRID_RANGE = "A2:P";
const SCHEDULE_GRID_RANGE = "A2:J";

const SEASON_SHEETS: Record<
  SeasonNumber,
  { series: string; maps: string; playerLog: string }
> = {
  0: {
    series: "match_log_s0",
    maps: "map_log_s0",
    playerLog: "player_log_s0"
  },
  1: {
    series: "match_log_s1",
    maps: "map_log_s1",
    playerLog: "player_log_s1"
  },
  2: {
    series: "Match Log",
    maps: "Map Log",
    playerLog: "Player Log"
  }
};

const getRange = (envKey: string, fallback: string) =>
  process.env[envKey] ?? fallback;

const getGridRange = (range: string, fallbackGrid: string) => {
  const [, gridRange] = range.split("!");
  return gridRange ?? fallbackGrid;
};

const buildSeasonRange = (sheetName: string, gridRange: string) =>
  `${sheetName}!${gridRange}`;

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

const parseSeasonsParam = (value: string | null): SeasonNumber[] | null => {
  if (!value) {
    return [2];
  }
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return [2];
  }
  const seasons = parts.map((part) => Number(part));
  if (seasons.some((season) => !Number.isInteger(season) || !isSeasonValue(season))) {
    return null;
  }
  return Array.from(new Set(seasons)) as SeasonNumber[];
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

const toNullableString = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length === 0 ? null : text;
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

const buildScheduleId = (values: Array<string | number | null>) => {
  const payload = values
    .map((value) => (value === null || value === undefined ? "" : String(value)))
    .join("|");
  return createHash("sha256").update(payload).digest("hex");
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

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const seasons = parseSeasonsParam(url.searchParams.get("seasons"));
  if (!seasons) {
    return NextResponse.json(
      { error: "Invalid seasons parameter. Use comma-separated values: 0,1,2." },
      { status: 400 }
    );
  }

  let ingestRunId = 0;
  const summary: Record<string, unknown> = {
    seasons: {},
    player_ovr: { inserted: 0, updated: 0 }
  };

  try {
    ingestRunId = await createIngestRun(seasons);
    const sheets = getSheetsClient();
    const sheetId = getSheetId();
    const playerRange = getRange("SHEET_RANGE_PLAYERS", PLAYERS_RANGE_FALLBACK);
    const seriesRange = getRange("SHEET_RANGE_SERIES", SERIES_RANGE_FALLBACK);
    const mapsRange = getRange("SHEET_RANGE_MAPS", MAPS_RANGE_FALLBACK);
    const playerLogRange = getRange(
      "SHEET_RANGE_PLAYER_LOG",
      PLAYER_LOG_RANGE_FALLBACK
    );
    const scheduleRange = getRange("SHEET_RANGE_SCHEDULE", SCHEDULE_RANGE_FALLBACK);

    const seriesGrid = getGridRange(seriesRange, SERIES_GRID_RANGE);
    const mapsGrid = getGridRange(mapsRange, MAPS_GRID_RANGE);
    const playerLogGrid = getGridRange(playerLogRange, PLAYER_LOG_GRID_RANGE);
    const scheduleGrid = getGridRange(scheduleRange, SCHEDULE_GRID_RANGE);

    const playerHeaderRange = getHeaderRange(playerRange);
    const playerResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: [playerRange, ...(playerHeaderRange ? [playerHeaderRange] : [])]
    });

    const playerRanges =
      playerResponse.data.valueRanges?.map((range) => range.values ?? []) ?? [];
    const [playerValues] = playerRanges;
    const players = (playerValues ?? [])
      .map((row) => mapPlayerRow(row as string[]))
      .filter((player): player is Player => Boolean(player?.discord_id));

    const upsertedPlayers = await upsertPlayers(players);
    summary.player_ovr = upsertedPlayers;

    for (const season of seasons) {
      const seasonSheets = SEASON_SHEETS[season];
      const seasonSeriesRange = buildSeasonRange(seasonSheets.series, seriesGrid);
      const seasonMapsRange = buildSeasonRange(seasonSheets.maps, mapsGrid);
      const seasonPlayerLogRange = buildSeasonRange(
        seasonSheets.playerLog,
        playerLogGrid
      );
      const seasonScheduleRange =
        season === 2 ? buildSeasonRange("schedule", scheduleGrid) : null;

      const seasonSeriesHeaderRange = getHeaderRange(seasonSeriesRange);
      const seasonMapsHeaderRange = getHeaderRange(seasonMapsRange);
      const seasonPlayerLogHeaderRange = getHeaderRange(seasonPlayerLogRange);
      const seasonScheduleHeaderRange = seasonScheduleRange
        ? getHeaderRange(seasonScheduleRange)
        : null;

      const seasonHeaderRanges = [
        seasonSeriesHeaderRange,
        seasonMapsHeaderRange,
        seasonPlayerLogHeaderRange,
        seasonScheduleHeaderRange
      ].filter((range): range is string => Boolean(range));

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges: [
          seasonSeriesRange,
          seasonMapsRange,
          seasonPlayerLogRange,
          ...(seasonScheduleRange ? [seasonScheduleRange] : []),
          ...seasonHeaderRanges
        ]
      });

      const valueRanges =
        response.data.valueRanges?.map((range) => range.values ?? []) ?? [];
      const [seriesValues, mapValues, playerLogValues, scheduleValues] = valueRanges;
      let headerOffset = seasonScheduleRange ? 4 : 3;
      const seriesHeaderValues = seasonSeriesHeaderRange
        ? valueRanges[headerOffset++] ?? []
        : [];
      const mapsHeaderValues = seasonMapsHeaderRange
        ? valueRanges[headerOffset++] ?? []
        : [];
      const playerLogHeaderValues = seasonPlayerLogHeaderRange
        ? valueRanges[headerOffset++] ?? []
        : [];
      const scheduleHeaderValues =
        seasonScheduleHeaderRange && seasonScheduleRange
          ? valueRanges[headerOffset++] ?? []
          : [];

      const mapHeaderIndex = buildHeaderIndex(mapsHeaderValues[0] ?? []);
      const playerLogHeaderIndex = buildHeaderIndex(playerLogHeaderValues[0] ?? []);
      const scheduleHeaderIndex = buildHeaderIndex(scheduleHeaderValues[0] ?? []);

      const seriesStartRow = getStartRow(seasonSeriesRange);
      const mapsStartRow = getStartRow(seasonMapsRange);
      const playerLogStartRow = getStartRow(seasonPlayerLogRange);
      const scheduleStartRow = seasonScheduleRange
        ? getStartRow(seasonScheduleRange)
        : 1;
      const seriesSheet = getSheetName(seasonSeriesRange);
      const mapsSheet = getSheetName(seasonMapsRange);
      const playerLogSheet = getSheetName(seasonPlayerLogRange);
      const scheduleSheet = seasonScheduleRange ? getSheetName(seasonScheduleRange) : "";

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
            season,
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
            season,
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
              row[
                getHeaderIndex(playerLogHeaderIndex, ["write in", "write_in"], 15)
              ] ?? null,
            season,
            source_sheet: playerLogSheet,
            source_row
          } satisfies PlayerLogEntryIngest;
        })
        .filter((stat): stat is NonNullable<typeof stat> => Boolean(stat));

      const schedule =
        seasonScheduleRange && season === 2
          ? withSourceRows(scheduleValues ?? [], scheduleStartRow)
              .map(({ row, source_row }) => {
                const week = toNullableInteger(
                  row[getHeaderIndex(scheduleHeaderIndex, ["week"], 0)]
                );
                const startDate = normalizeMatchDate(
                  row[getHeaderIndex(scheduleHeaderIndex, ["start date", "start"], 1)] ??
                    ""
                );
                const endDate = normalizeMatchDate(
                  row[getHeaderIndex(scheduleHeaderIndex, ["end date", "end"], 2)] ?? ""
                );
                const division = toNullableString(
                  row[getHeaderIndex(scheduleHeaderIndex, ["division"], 3)]
                );
                const homeTeam = toNullableString(
                  row[getHeaderIndex(scheduleHeaderIndex, ["home team", "home"], 4)]
                );
                const awayTeam = toNullableString(
                  row[getHeaderIndex(scheduleHeaderIndex, ["away team", "away"], 5)]
                );
                const homeGm = toNullableString(
                  row[getHeaderIndex(scheduleHeaderIndex, ["home gm", "home gm name"], 6)]
                );
                const awayGm = toNullableString(
                  row[getHeaderIndex(scheduleHeaderIndex, ["away gm", "away gm name"], 7)]
                );
                const matchTime = toNullableString(
                  row[getHeaderIndex(scheduleHeaderIndex, ["match time", "time"], 8)]
                );
                const streamLink = toNullableString(
                  row[
                    getHeaderIndex(
                      scheduleHeaderIndex,
                      ["stream link/vod", "stream link", "vod"],
                      9
                    )
                  ]
                );

                if (!homeTeam && !awayTeam && !division && !week) {
                  return null;
                }

                const scheduleId = buildScheduleId([
                  season,
                  week,
                  startDate,
                  endDate,
                  division,
                  homeTeam,
                  awayTeam,
                  homeGm,
                  awayGm,
                  matchTime,
                  streamLink
                ]);

                return {
                  schedule_id: scheduleId,
                  season,
                  week,
                  start_date: startDate,
                  end_date: endDate,
                  division,
                  home_team: homeTeam,
                  away_team: awayTeam,
                  home_gm: homeGm,
                  away_gm: awayGm,
                  match_time: matchTime,
                  stream_link: streamLink,
                  slug: buildScheduleSlug({
                    season,
                    home_team: homeTeam,
                    away_team: awayTeam
                  }),
                  source_sheet: scheduleSheet,
                  source_row
                } satisfies ScheduleMatchIngest;
              })
              .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
          : [];

      const upsertedSeries = await upsertSeries(series);
      const upsertedMaps = await upsertMaps(maps);
      const upsertedPlayerStats = await upsertPlayerLogEntries(playerStats);
      const upsertedSchedule = await upsertSchedule(schedule);

      (summary.seasons as Record<string, unknown>)[season] = {
        match_log: upsertedSeries,
        map_log: upsertedMaps,
        player_log: upsertedPlayerStats,
        schedule: upsertedSchedule
      };
    }

    await finalizeIngestRun({
      id: ingestRunId,
      summary,
      success: true
    });

    return NextResponse.json({
      processed_seasons: seasons,
      ...summary
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown ingestion error";
    await finalizeIngestRun({
      id: ingestRunId,
      summary: { error: message },
      success: false,
      error: message
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
