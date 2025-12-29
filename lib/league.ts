import type { PlayerWithStats } from "@/lib/types";

export const LOWER_TEAMS = [
  "Aegis",
  "Tempest",
  "Tarnished",
  "Templar",
  "Syndicate",
  "Autheryum",
  "BornToShootL",
  "Sleepers",
  "0utlawz",
  "Leverage",
  "Hellstrom",
  "Kyber"
];

export const UPPER_TEAMS = [
  "Orcsbane",
  "BornToShootU",
  "Celestial",
  "RawHoney",
  "Citadel",
  "Ironclad",
  "Voidborn",
  "Obsidian",
  "Nebula",
  "Nightshade",
  "Wisps",
  "Reapers",
  "Anarchy",
  "Avocados",
  "Haunted",
  "1OF1"
];

export const LEGENDS_TEAMS = [
  "FaYz",
  "Legends",
  "Clockwork",
  "Contenders",
  "Phoenix",
  "Hydra",
  "Vanguard",
  "Orbitals",
  "Legacy",
  "Enigma",
  "SuperSe7eN",
  "Challengers"
];

export const WOMENS_TEAMS = [
  "Rift",
  "Nova",
  "HEX",
  "CelestialStars",
  "Valkyries",
  "Roseblade",
  "Sirens",
  "PiinkPonyClub"
];

export const LEAGUE_LABELS = ["Lowers", "Uppers", "Legends", "Womens"] as const;
export type LeagueKey = (typeof LEAGUE_LABELS)[number];

export const LEAGUE_TEAMS: Record<LeagueKey, string[]> = {
  Lowers: LOWER_TEAMS,
  Uppers: UPPER_TEAMS,
  Legends: LEGENDS_TEAMS,
  Womens: WOMENS_TEAMS
};

const normalizeField = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }
  return value.trim();
};

export const isFormerPlayer = (player: PlayerWithStats) =>
  player.team === "Former Player" && player.status === "Unregistered";

export const isFreeAgent = (player: PlayerWithStats) =>
  player.status?.toLowerCase() === "free agent";

export const isWomensEligible = (player: PlayerWithStats) => {
  if (player.women_status?.toLowerCase() === "unregistered") {
    return false;
  }

  const womensFields = [
    normalizeField(player.women_status),
    normalizeField(player.womens_team),
    player.womens_rank !== null ? String(player.womens_rank) : ""
  ];

  return womensFields.some((value) => value !== "" && value.toLowerCase() !== "na");
};

export const getLeagueForRank = (rankValue: number | null, rankIsNa: boolean) => {
  if (rankIsNa || rankValue === null) {
    return null;
  }

  if (rankValue >= 0.5 && rankValue <= 6.0) {
    return "Lowers";
  }
  if (rankValue >= 6.5 && rankValue <= 12.0) {
    return "Uppers";
  }
  if (rankValue >= 12.5 && rankValue <= 18.0) {
    return "Legends";
  }

  return null;
};

export const getLeagueForPlayer = (player: PlayerWithStats, league: LeagueKey) => {
  if (league === "Womens") {
    return isWomensEligible(player);
  }
  const bucket = getLeagueForRank(player.rank_value, player.rank_is_na);
  return bucket === league;
};

export const getPlayerTeamForLeague = (player: PlayerWithStats, league: LeagueKey) =>
  league === "Womens" ? player.womens_team : player.team;

export const getPlayerRankForLeague = (player: PlayerWithStats, league: LeagueKey) =>
  league === "Womens" ? player.womens_rank : player.rank_value;

export const getPlayerStatusForLeague = (player: PlayerWithStats, league: LeagueKey) =>
  league === "Womens" ? player.women_status ?? player.status : player.status;
