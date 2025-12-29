import type {
  MapLog,
  MatchLog,
  Player,
  PlayerLogEntry,
  PlayerModeStat,
  SeriesPlayerStat
} from "@/lib/types";

export const players: Player[] = [
  {
    discord_name: "Shadowbyte#0001",
    discord_id: "185201",
    ign: "Shadowbyte",
    rank_value: 15.5,
    rank_is_na: false,
    team: "Rift Hawks",
    status: "active",
    women_status: "inactive",
    womens_team: null,
    womens_rank: null
  },
  {
    discord_name: "Nova#0002",
    discord_id: "185202",
    ign: "Nova",
    rank_value: 12.5,
    rank_is_na: false,
    team: "Nova Core",
    status: "active",
    women_status: "active",
    womens_team: "Nova Core",
    womens_rank: 12.0
  },
  {
    discord_name: "Raven#0003",
    discord_id: "185203",
    ign: "Raven",
    rank_value: 10.5,
    rank_is_na: false,
    team: "Pulse Unit",
    status: "active",
    women_status: "inactive",
    womens_team: null,
    womens_rank: null
  },
  {
    discord_name: "Cipher#0004",
    discord_id: "185204",
    ign: "Cipher",
    rank_value: 12.5,
    rank_is_na: false,
    team: "Rift Hawks",
    status: "active",
    women_status: "inactive",
    womens_team: null,
    womens_rank: null
  }
];

export const series: MatchLog[] = [
  {
    match_id: "match-001",
    match_date: "2024-04-12",
    home_team: "Rift Hawks",
    away_team: "Nova Core",
    home_wins: 3,
    away_wins: 2,
    series_winner: "Rift Hawks"
  },
  {
    match_id: "match-002",
    match_date: "2024-04-19",
    home_team: "Pulse Unit",
    away_team: "Rift Hawks",
    home_wins: 1,
    away_wins: 3,
    series_winner: "Rift Hawks"
  }
];

export const maps: MapLog[] = [
  {
    match_id: "match-001",
    map_num: 1,
    map: "Embassy",
    mode: "Hardpoint",
    winner_team: "Rift Hawks",
    losing_team: "Nova Core"
  },
  {
    match_id: "match-001",
    map_num: 2,
    map: "Mercado",
    mode: "SnD",
    winner_team: "Nova Core",
    losing_team: "Rift Hawks"
  },
  {
    match_id: "match-001",
    map_num: 3,
    map: "Expo",
    mode: "Control",
    winner_team: "Rift Hawks",
    losing_team: "Nova Core"
  },
  {
    match_id: "match-002",
    map_num: 1,
    map: "Hotel",
    mode: "Hardpoint",
    winner_team: "Rift Hawks",
    losing_team: "Pulse Unit"
  }
];

export const playerLog: PlayerLogEntry[] = [
  {
    match_id: "match-001",
    match_date: "2024-04-12",
    team: "Rift Hawks",
    player: "Shadowbyte",
    discord_id: "185201",
    mode: "Hardpoint",
    k: 28,
    d: 21,
    kd: 1.33,
    hp_time: 85,
    plants: null,
    defuses: null,
    ticks: null,
    write_in: null
  },
  {
    match_id: "match-001",
    match_date: "2024-04-12",
    team: "Nova Core",
    player: "Nova",
    discord_id: "185202",
    mode: "Hardpoint",
    k: 24,
    d: 25,
    kd: 0.96,
    hp_time: 77,
    plants: null,
    defuses: null,
    ticks: null,
    write_in: null
  },
  {
    match_id: "match-001",
    match_date: "2024-04-12",
    team: "Rift Hawks",
    player: "Shadowbyte",
    discord_id: "185201",
    mode: "SnD",
    k: 10,
    d: 8,
    kd: 1.25,
    hp_time: null,
    plants: 1,
    defuses: 0,
    ticks: null,
    write_in: null
  },
  {
    match_id: "match-001",
    match_date: "2024-04-12",
    team: "Nova Core",
    player: "Nova",
    discord_id: "185202",
    mode: "SnD",
    k: 12,
    d: 10,
    kd: 1.2,
    hp_time: null,
    plants: 2,
    defuses: 1,
    ticks: null,
    write_in: null
  },
  {
    match_id: "match-001",
    match_date: "2024-04-12",
    team: "Pulse Unit",
    player: "Raven",
    discord_id: "185203",
    mode: "Control",
    k: 18,
    d: 15,
    kd: 1.2,
    hp_time: null,
    plants: null,
    defuses: null,
    ticks: 30,
    write_in: null
  },
  {
    match_id: "match-001",
    match_date: "2024-04-12",
    team: "Rift Hawks",
    player: "Cipher",
    discord_id: "185204",
    mode: "Hardpoint",
    k: 26,
    d: 19,
    kd: 1.37,
    hp_time: 90,
    plants: null,
    defuses: null,
    ticks: null,
    write_in: null
  }
];

export const getPlayerById = (discordId: string) =>
  players.find((player) => player.discord_id === discordId) ?? null;

export const getSeriesById = (matchId: string) =>
  series.find((match) => match.match_id === matchId) ?? null;

export const getMapsBySeries = (matchId: string) =>
  maps.filter((map) => map.match_id === matchId);

const aggregatePlayerStats = (stats: PlayerLogEntry[]): PlayerModeStat[] => {
  const grouped = new Map<string, PlayerModeStat>();
  stats.forEach((stat) => {
    const key = `${stat.discord_id}-${stat.mode}`;
    const existing = grouped.get(key) ?? {
      discord_id: stat.discord_id,
      mode: stat.mode,
      k: 0,
      d: 0,
      kd: null,
      hp_time: null,
      plants: null,
      defuses: null,
      ticks: null
    };

    existing.k += stat.k ?? 0;
    existing.d += stat.d ?? 0;
    if (stat.mode === "Hardpoint") {
      existing.hp_time = (existing.hp_time ?? 0) + (stat.hp_time ?? 0);
    }
    if (stat.mode === "SnD") {
      existing.plants = (existing.plants ?? 0) + (stat.plants ?? 0);
      existing.defuses = (existing.defuses ?? 0) + (stat.defuses ?? 0);
    }
    if (stat.mode === "Control") {
      existing.ticks = (existing.ticks ?? 0) + (stat.ticks ?? 0);
    }

    if (existing.d > 0) {
      existing.kd = Number((existing.k / existing.d).toFixed(2));
    }

    grouped.set(key, existing);
  });

  return Array.from(grouped.values());
};

export const getPlayerStatsByPlayer = (discordId: string) =>
  aggregatePlayerStats(playerLog.filter((stat) => stat.discord_id === discordId));

export const getPlayerStatsBySeries = (matchId: string): SeriesPlayerStat[] => {
  const stats = playerLog.filter((stat) => stat.match_id === matchId);
  const aggregated = aggregatePlayerStats(stats);
  return aggregated.map((stat) => {
    const player = players.find((entry) => entry.discord_id === stat.discord_id);
    return {
      ...stat,
      discord_id: stat.discord_id ?? "",
      ign: player?.ign ?? null,
      team: player?.team ?? null
    };
  });
};
