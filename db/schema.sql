-- LockdownCL core schema (Supabase/Postgres compatible)

create table if not exists players (
  discord_id text primary key,
  ign text not null,
  rank text not null,
  team text not null,
  status text not null,
  womens_status text not null,
  womens_team text,
  salary integer not null
);

create table if not exists series (
  match_id text primary key,
  match_date date not null,
  division text not null,
  home_team text not null,
  away_team text not null,
  home_wins integer not null,
  away_wins integer not null,
  series_winner text not null
);

create table if not exists maps (
  id text primary key,
  match_id text not null references series(match_id) on delete cascade,
  map_number integer not null,
  map_name text not null,
  mode text not null,
  winning_team text not null,
  losing_team text not null
);

create table if not exists player_map_stats (
  id text primary key,
  match_id text not null references series(match_id) on delete cascade,
  map_id text not null references maps(id) on delete cascade,
  discord_id text not null references players(discord_id) on delete cascade,
  kills integer not null,
  deaths integer not null,
  assists integer not null,
  hp_time integer not null,
  plants integer not null,
  defuses integer not null
);
