export type Player = {
  discord_id: string;
  ign: string;
  rank: string;
  team: string;
  status: string;
  womens_status: string;
  womens_team: string | null;
  salary: number;
};

export type Series = {
  match_id: string;
  match_date: string;
  division: string;
  home_team: string;
  away_team: string;
  home_wins: number;
  away_wins: number;
  series_winner: string;
};

export type Map = {
  id: string;
  match_id: string;
  map_number: number;
  map_name: string;
  mode: string;
  winning_team: string;
  losing_team: string;
};

export type PlayerMapStat = {
  id: string;
  match_id: string;
  map_id: string;
  discord_id: string;
  kills: number;
  deaths: number;
  assists: number;
  hp_time: number;
  plants: number;
  defuses: number;
};
