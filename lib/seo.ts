import { LEAGUE_TEAMS } from "@/lib/league";
import type { MatchLog } from "@/lib/types";

export const SITE_NAME = "Lockdown CoD League";
export const SITE_TAGLINE =
  "Lockdown CoD League! Stats, Rosters, Standings, and Match History!";
export const SITE_URL = "https://www.lockdowncl.online";
export const BRAND_LOGO_PATH = "/brand/logo.png";

export const buildCanonicalUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
};

const LEAGUE_LABEL_MAP: Record<string, string> = {
  Lowers: "Lowers",
  Uppers: "Uppers",
  Legends: "Legends",
  Womens: "Women"
};

export const getTeamLeagueLabel = (team: string | null) => {
  if (!team) {
    return "Independent";
  }
  const entry = Object.entries(LEAGUE_TEAMS).find(([, teams]) => teams.includes(team));
  if (!entry) {
    return "Independent";
  }
  const [league] = entry;
  return LEAGUE_LABEL_MAP[league] ?? league;
};

export const getPlayerTeamLabel = (team: string | null, status: string | null) => {
  if (!team || status?.toLowerCase() === "free agent") {
    return "Free Agent";
  }
  return team;
};

export const formatOvrLabel = (ovr: number | null) => {
  if (ovr === null || Number.isNaN(ovr)) {
    return "OVR NA";
  }
  return `${ovr.toFixed(2)} OVR`;
};

export const computeTeamRecord = (team: string, matches: MatchLog[]) => {
  let seriesWins = 0;
  let seriesLosses = 0;
  let mapWins = 0;
  let mapLosses = 0;

  matches.forEach((match) => {
    const homeWins = match.home_wins ?? 0;
    const awayWins = match.away_wins ?? 0;
    if (match.home_team === team) {
      mapWins += homeWins;
      mapLosses += awayWins;
      if (homeWins > awayWins) {
        seriesWins += 1;
      } else if (homeWins < awayWins) {
        seriesLosses += 1;
      }
    } else if (match.away_team === team) {
      mapWins += awayWins;
      mapLosses += homeWins;
      if (awayWins > homeWins) {
        seriesWins += 1;
      } else if (awayWins < homeWins) {
        seriesLosses += 1;
      }
    }
  });

  return {
    seriesWins,
    seriesLosses,
    mapDiff: mapWins - mapLosses,
    mapWins,
    mapLosses
  };
};

export const getMatchScoreline = (match: MatchLog) => {
  const homeWins = match.home_wins ?? 0;
  const awayWins = match.away_wins ?? 0;
  return `${homeWins}-${awayWins}`;
};

export const getMatchWinner = (match: MatchLog) => {
  const homeWins = match.home_wins ?? 0;
  const awayWins = match.away_wins ?? 0;
  if (homeWins === awayWins) {
    return null;
  }
  return homeWins > awayWins ? match.home_team : match.away_team;
};

export const formatMatchDateIso = (value: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

export const formatMatchDateDisplay = (value: string | Date | null) => {
  if (!value) {
    return "TBD";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString();
};
