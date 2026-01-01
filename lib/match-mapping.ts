import type { MapLog, MatchPlayerRow, SeasonNumber } from "@/lib/types";

export type MatchPlayerRowWithMap = MatchPlayerRow & { map_num?: number };

type AssignMapOptions = {
  playerRows: MatchPlayerRow[];
  mapLogs: MapLog[];
  season: SeasonNumber;
};

const sortBySourceRow = (rows: MatchPlayerRow[]) =>
  [...rows].sort((a, b) => a.source_row - b.source_row);

const countConsecutiveMaps = (mapLogs: MapLog[], startIndex: number) => {
  const mode = mapLogs[startIndex]?.mode;
  if (!mode) {
    return 0;
  }
  let count = 0;
  for (let index = startIndex; index < mapLogs.length; index += 1) {
    if (mapLogs[index].mode !== mode) {
      break;
    }
    count += 1;
  }
  return count;
};

export const assignMapNumbersToPlayerRows = ({
  playerRows,
  mapLogs,
  season
}: AssignMapOptions): MatchPlayerRowWithMap[] => {
  const sortedRows = sortBySourceRow(playerRows).map((row) => ({ ...row }));

  if (mapLogs.length === 0 || sortedRows.length === 0) {
    return sortedRows;
  }

  if (season >= 2) {
    sortedRows.forEach((row, index) => {
      const mapNum = Math.floor(index / 8) + 1;
      if (mapNum <= mapLogs.length) {
        row.map_num = mapNum;
      }
    });
    return sortedRows;
  }

  let rowIndex = 0;

  for (let mapIndex = 0; mapIndex < mapLogs.length; mapIndex += 1) {
    if (rowIndex >= sortedRows.length) {
      break;
    }

    const map = mapLogs[mapIndex];
    if (sortedRows[rowIndex].mode !== map.mode) {
      continue;
    }

    let runLength = 0;
    while (
      rowIndex + runLength < sortedRows.length &&
      sortedRows[rowIndex + runLength].mode === map.mode
    ) {
      runLength += 1;
    }

    const sameModeMapsAhead = countConsecutiveMaps(mapLogs, mapIndex);
    let take = Math.min(8, runLength - (sameModeMapsAhead - 1));
    if (take < 0) {
      take = 0;
    }

    for (let offset = 0; offset < take; offset += 1) {
      sortedRows[rowIndex + offset].map_num = map.map_num;
    }

    rowIndex += take;
  }

  return sortedRows;
};

type PlayerTagOptions = {
  row: MatchPlayerRow;
  matchLeague: string;
  season: SeasonNumber;
};

export const getPlayerTagLabel = ({
  row,
  matchLeague,
  season
}: PlayerTagOptions): "ESub" | "Released" | null => {
  if (season < 2) {
    return null;
  }
  if (row.write_in === "ESub") {
    return "ESub";
  }
  const currentTeam = matchLeague === "Womens" ? row.current_womens_team : row.current_team;
  if (row.team && currentTeam && row.team !== currentTeam) {
    return "Released";
  }
  return null;
};
