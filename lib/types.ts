export type SeasonNumber = 0 | 1 | 2;

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

export type PlayerWithStats = Player & {
  total_k: number;
  total_d: number;
  ovr_kd: number | null;
};

export type MatchLog = {
  match_id: string;
  match_date: string | null;
  home_team: string | null;
  away_team: string | null;
  home_wins: number | null;
  away_wins: number | null;
  series_winner: string | null;
  season: SeasonNumber;
};

export type LogSource = {
  source_sheet: string;
  source_row: number;
};

export type MapLog = {
  match_id: string;
  map_num: number;
  mode: string;
  map: string;
  winner_team: string;
  losing_team: string;
  season: SeasonNumber;
};

export type MatchLogIngest = MatchLog & LogSource;
export type MapLogIngest = MapLog & LogSource;

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
  season: SeasonNumber;
};

export type PlayerLogEntryIngest = PlayerLogEntry & LogSource;

export type PlayerLogRow = PlayerLogEntry & {
  id: number;
};

export type PlayerModeStat = {
  discord_id?: string;
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
  discord_id: string;
  ign: string | null;
  team: string | null;
  k: number | null;
  d: number | null;
  kd: number | null;
  hp_time: number | null;
  plants: number | null;
  defuses: number | null;
  ticks: number | null;
};

export type TeamModeWinRate = {
  mode: string;
  wins: number;
  total: number;
};

export type TeamModeWinRateRow = TeamModeWinRate;

export type StandingRow = {
  team: string;
  series_wins: number;
  series_losses: number;
  map_wins: number;
  map_losses: number;
  map_diff: number;
};

export type PlayerTotals = {
  total_k: number;
  total_d: number;
  ovr_kd: number | null;
};

export type PlayerMatchSummary = {
  match_id: string;
  match_date: string | null;
  home_team: string | null;
  away_team: string | null;
  home_wins: number | null;
  away_wins: number | null;
  season: SeasonNumber;
};

export type PlayerMatchModeStat = {
  match_id: string;
  mode: string;
  k: number;
  d: number;
  kd: number | null;
  hp_time: number | null;
  plants: number | null;
  defuses: number | null;
  ticks: number | null;
};

export type MatchPlayerRow = {
  match_id: string;
  mode: string;
  player: string | null;
  discord_id: string;
  team: string | null;
  k: number | null;
  d: number | null;
  kd: number | null;
  hp_time: number | null;
  plants: number | null;
  defuses: number | null;
  ticks: number | null;
  season: SeasonNumber;
};

export type PlayerAggregates = {
  overall: {
    kills: number;
    deaths: number;
    series_wins: number;
    series_losses: number;
    map_wins: number;
    map_losses: number;
  };
  modes: Record<
    string,
    {
      kills: number;
      deaths: number;
      map_wins: number;
      map_losses: number;
    }
  >;
};

export type PlayerMapBreakdown = {
  mode: string;
  label: string;
  maps: Array<{
    name: string;
    kills: number;
    deaths: number;
    wins: number;
    losses: number;
  }>;
};

export type PlayerMatchMapDetail = {
  map_num: number;
  mode: string;
  map: string;
  winner_team: string;
  losing_team: string;
  player_stats: {
    k: number;
    d: number;
    hp_time: number | null;
    plants: number | null;
    defuses: number | null;
    ticks: number | null;
    write_in: string | null;
    is_esub: boolean;
  } | null;
};

export type PlayerMatchSeriesTags = {
  esub_maps: number;
  released: boolean;
  esub_ineligible: boolean;
} | null;

export type PlayerMatchHistoryEntry = {
  match_id: string;
  match_date: string | null;
  home_team: string | null;
  away_team: string | null;
  home_wins: number | null;
  away_wins: number | null;
  player_team: string | null;
  opponent: string | null;
  series_result: "W" | "L";
  totals: {
    k: number;
    d: number;
  };
  maps: PlayerMatchMapDetail[];
  season: SeasonNumber;
  series_tags: PlayerMatchSeriesTags;
};

export type UserProfile = {
  discord_id: string;
  avatar_url: string | null;
  banner_url: string | null;
  twitter_url: string | null;
  twitch_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  updated_at: string | null;
};
