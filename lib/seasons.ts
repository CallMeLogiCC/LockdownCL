import { LEAGUE_TEAMS, type LeagueKey } from "@/lib/league";
export type { SeasonNumber } from "@/lib/types";
import type { SeasonNumber } from "@/lib/types";

export const DEFAULT_SEASON: SeasonNumber = 2;

export const SEASON_LABELS: Array<{ value: SeasonNumber; label: string }> = [
  { value: 2, label: "Season 2" },
  { value: 1, label: "Season 1" },
  { value: 0, label: "Season 0" }
];

const SEASON0_TEAMS: Record<"Lowers" | "Uppers", string[]> = {
  Lowers: [
    "Las Vegas Shockwave",
    "Miami Mirage",
    "Milwaukee Saints",
    "New York Nexus",
    "Tampa Bay Vortex",
    "Juneau Glaciers"
  ],
  Uppers: [
    "Baltimore Sluggers",
    "Boston Blaze",
    "Brooklyn Blitz",
    "Dallas Rattlesnakes",
    "Detroit Mobsters",
    "Honolulu Pirates",
    "Myrtle Beach Parrots",
    "Phoenix Nightstalkers",
    "San Francisco Fusion",
    "Seattle Spark"
  ]
};

const SEASON1_TEAMS: Record<"Lowers" | "Uppers", string[]> = {
  Lowers: [
    "Aegis",
    "Obsidian",
    "Clockwork",
    "Templar",
    "Tempest",
    "Rift",
    "Anarchy",
    "Maelstrom"
  ],
  Uppers: [
    "Orcsbane",
    "Phoenix",
    "Hydra",
    "Vanguard",
    "Citadel",
    "Ironclad",
    "Voidborn",
    "Orbitals",
    "Nebula",
    "Nightshade",
    "Wisps",
    "Reapers"
  ]
};

const SEASON_TEAM_MAP: Record<SeasonNumber, Record<LeagueKey, string[]>> = {
  0: {
    Lowers: SEASON0_TEAMS.Lowers,
    Uppers: SEASON0_TEAMS.Uppers,
    Legends: [],
    Womens: []
  },
  1: {
    Lowers: SEASON1_TEAMS.Lowers,
    Uppers: SEASON1_TEAMS.Uppers,
    Legends: [],
    Womens: []
  },
  2: LEAGUE_TEAMS
};

export const getSeasonLeagueOptions = (season: SeasonNumber): LeagueKey[] => {
  if (season === 0 || season === 1) {
    return ["Lowers", "Uppers"];
  }
  return ["Lowers", "Uppers", "Legends", "Womens"];
};

export const getSeasonTeamOptions = (season: SeasonNumber): string[] => {
  const leagueTeams = SEASON_TEAM_MAP[season];
  return (Object.keys(leagueTeams) as LeagueKey[]).flatMap((league) => leagueTeams[league]);
};

const buildTeamLeagueLookup = (season: SeasonNumber) => {
  const lookup = new Map<string, LeagueKey>();
  const leagueTeams = SEASON_TEAM_MAP[season];
  (Object.keys(leagueTeams) as LeagueKey[]).forEach((league) => {
    leagueTeams[league].forEach((team) => lookup.set(team, league));
  });
  return lookup;
};

export const getMatchLeague = (
  season: SeasonNumber,
  homeTeam: string | null,
  awayTeam: string | null
): LeagueKey | "unknown" => {
  const lookup = buildTeamLeagueLookup(season);
  const homeLeague = homeTeam ? lookup.get(homeTeam) : null;
  const awayLeague = awayTeam ? lookup.get(awayTeam) : null;

  if (!homeLeague || !awayLeague) {
    return "unknown";
  }

  return homeLeague === awayLeague ? homeLeague : "unknown";
};

export const isSeasonValue = (value: number): value is SeasonNumber =>
  value === 0 || value === 1 || value === 2;
