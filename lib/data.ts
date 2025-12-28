import type { Map, Player, PlayerMapStat, Series } from "@/lib/types";

export const players: Player[] = [
  {
    discord_id: "185201",
    ign: "Shadowbyte",
    rank: "Challenger",
    team: "Rift Hawks",
    status: "active",
    womens_status: "inactive",
    womens_team: null,
    salary: 450
  },
  {
    discord_id: "185202",
    ign: "Nova",
    rank: "Diamond",
    team: "Nova Core",
    status: "active",
    womens_status: "active",
    womens_team: "Nova Core",
    salary: 375
  },
  {
    discord_id: "185203",
    ign: "Raven",
    rank: "Platinum",
    team: "Pulse Unit",
    status: "active",
    womens_status: "inactive",
    womens_team: null,
    salary: 310
  },
  {
    discord_id: "185204",
    ign: "Cipher",
    rank: "Diamond",
    team: "Rift Hawks",
    status: "active",
    womens_status: "inactive",
    womens_team: null,
    salary: 360
  }
];

export const series: Series[] = [
  {
    match_id: "match-001",
    match_date: "2024-04-12",
    division: "Premier",
    home_team: "Rift Hawks",
    away_team: "Nova Core",
    home_wins: 3,
    away_wins: 2,
    series_winner: "Rift Hawks"
  },
  {
    match_id: "match-002",
    match_date: "2024-04-19",
    division: "Premier",
    home_team: "Pulse Unit",
    away_team: "Rift Hawks",
    home_wins: 1,
    away_wins: 3,
    series_winner: "Rift Hawks"
  }
];

export const maps: Map[] = [
  {
    id: "map-001",
    match_id: "match-001",
    map_number: 1,
    map_name: "Hardpoint - Embassy",
    mode: "Hardpoint",
    winning_team: "Rift Hawks",
    losing_team: "Nova Core"
  },
  {
    id: "map-002",
    match_id: "match-001",
    map_number: 2,
    map_name: "Search - Mercado",
    mode: "Search",
    winning_team: "Nova Core",
    losing_team: "Rift Hawks"
  },
  {
    id: "map-003",
    match_id: "match-001",
    map_number: 3,
    map_name: "Control - Expo",
    mode: "Control",
    winning_team: "Rift Hawks",
    losing_team: "Nova Core"
  },
  {
    id: "map-004",
    match_id: "match-002",
    map_number: 1,
    map_name: "Hardpoint - Hotel",
    mode: "Hardpoint",
    winning_team: "Rift Hawks",
    losing_team: "Pulse Unit"
  }
];

export const playerMapStats: PlayerMapStat[] = [
  {
    id: "stat-001",
    match_id: "match-001",
    map_id: "map-001",
    discord_id: "185201",
    kills: 28,
    deaths: 21,
    assists: 9,
    hp_time: 85,
    plants: 0,
    defuses: 0
  },
  {
    id: "stat-002",
    match_id: "match-001",
    map_id: "map-001",
    discord_id: "185202",
    kills: 24,
    deaths: 25,
    assists: 11,
    hp_time: 77,
    plants: 0,
    defuses: 0
  },
  {
    id: "stat-003",
    match_id: "match-001",
    map_id: "map-002",
    discord_id: "185201",
    kills: 10,
    deaths: 8,
    assists: 4,
    hp_time: 0,
    plants: 1,
    defuses: 0
  },
  {
    id: "stat-004",
    match_id: "match-001",
    map_id: "map-002",
    discord_id: "185202",
    kills: 12,
    deaths: 10,
    assists: 3,
    hp_time: 0,
    plants: 2,
    defuses: 1
  },
  {
    id: "stat-005",
    match_id: "match-001",
    map_id: "map-003",
    discord_id: "185203",
    kills: 18,
    deaths: 15,
    assists: 7,
    hp_time: 30,
    plants: 1,
    defuses: 1
  },
  {
    id: "stat-006",
    match_id: "match-001",
    map_id: "map-003",
    discord_id: "185204",
    kills: 22,
    deaths: 17,
    assists: 6,
    hp_time: 45,
    plants: 0,
    defuses: 0
  },
  {
    id: "stat-007",
    match_id: "match-002",
    map_id: "map-004",
    discord_id: "185204",
    kills: 26,
    deaths: 19,
    assists: 8,
    hp_time: 90,
    plants: 0,
    defuses: 0
  }
];

export const getPlayerById = (discordId: string) =>
  players.find((player) => player.discord_id === discordId) ?? null;

export const getSeriesById = (matchId: string) =>
  series.find((match) => match.match_id === matchId) ?? null;

export const getMapsBySeries = (matchId: string) =>
  maps.filter((map) => map.match_id === matchId);

export const getPlayerStatsByPlayer = (discordId: string) =>
  playerMapStats.filter((stat) => stat.discord_id === discordId);

export const getPlayerStatsBySeries = (matchId: string) =>
  playerMapStats.filter((stat) => stat.match_id === matchId);
