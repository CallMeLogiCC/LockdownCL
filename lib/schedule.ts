import { slugifyTeam } from "@/lib/slug";
import type { MatchLog, ScheduleMatch } from "@/lib/types";

export const normalizeScheduleDivision = (value: string | null) => {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "legend" || normalized === "legends") {
    return "Legends";
  }
  if (normalized === "women" || normalized === "womens" || normalized === "women's") {
    return "Womens";
  }
  if (normalized === "lowers") {
    return "Lowers";
  }
  if (normalized === "uppers") {
    return "Uppers";
  }
  return value.trim();
};

export const buildScheduleSlug = ({
  season,
  home_team,
  away_team
}: Pick<ScheduleMatch, "season" | "home_team" | "away_team">) => {
  const homeSlug = slugifyTeam(home_team ?? "tbd");
  const awaySlug = slugifyTeam(away_team ?? "tbd");
  return `s${season}-${homeSlug}-vs-${awaySlug}`;
};

export const formatScheduleDateRange = (start: string | null, end: string | null) => {
  if (!start && !end) {
    return "TBD";
  }
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start ?? end ?? "TBD";
};

export const hasMatchTime = (match: ScheduleMatch) =>
  Boolean(match.match_time && match.match_time.trim());

const isDateWithinRange = (
  matchDate: string | null,
  startDate: string | null,
  endDate: string | null
) => {
  if (!matchDate) {
    return false;
  }
  const match = new Date(matchDate);
  if (Number.isNaN(match.getTime())) {
    return false;
  }
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start && !Number.isNaN(start.getTime()) && match < start) {
    return false;
  }
  if (end && !Number.isNaN(end.getTime()) && match > end) {
    return false;
  }
  return true;
};

export type LinkedScheduleMatch = ScheduleMatch & { matchId: string | null };

export const linkScheduleMatches = (
  schedule: ScheduleMatch[],
  matches: MatchLog[]
): LinkedScheduleMatch[] => {
  const usedMatchIds = new Set<string>();
  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = a.match_date ? new Date(a.match_date).getTime() : Number.POSITIVE_INFINITY;
    const dateB = b.match_date ? new Date(b.match_date).getTime() : Number.POSITIVE_INFINITY;
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    return a.match_id.localeCompare(b.match_id);
  });

  return schedule.map((entry) => {
    const candidate = sortedMatches.find((match) => {
      if (usedMatchIds.has(match.match_id)) {
        return false;
      }
      if (match.home_team !== entry.home_team || match.away_team !== entry.away_team) {
        return false;
      }
      return isDateWithinRange(match.match_date, entry.start_date, entry.end_date);
    });

    if (candidate) {
      usedMatchIds.add(candidate.match_id);
    }

    return {
      ...entry,
      matchId: candidate?.match_id ?? null
    };
  });
};
