export type Player = {
  discord_name: string | null;
  discord_id: string;
  ign: string | null;
  rank_value: number | null;
  rank_is_na: boolean;
  team: string | null;
  status: string | null;
  women_status: string | null;
  womens_team: string | null;
  womens_rank: number | null;
};

export type MatchLog = {
  match_id: string;
  match_date: string | null;
  home_team: string | null;
  away_team: string | null;
  home_wins: number | null;
  away_wins: number | null;
  series_winner: string | null;
};

export type MapLog = {
  match_id: string;
  map_num: number;
  mode: string;
  map: string;
  winner_team: string;
  losing_team: string;
};

export type PlayerLogEntry = {
  match_id: string;
  match_date: string | null;
  team: string | null;
  player: string | null;
  discord_id: string;
  mode: string;
  k: number | null;
  d: number | null;
  kd: number | null;
  hp_time: number | null;
  plants: number | null;
  defuses: number | null;
  ticks: number | null;
  write_in: string | null;
};

export type PlayerModeStat = {
  discord_id: string;
  mode: string;
  k: number;
  d: number;
  kd: number | null;
  hp_time: number | null;
  plants: number | null;
  defuses: number | null;
  ticks: number | null;
};

export type SeriesPlayerStat = PlayerModeStat & {
  ign: string | null;
  team: string | null;
};
