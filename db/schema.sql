-- LockdownCL core schema (Postgres compatible)

-- Player Log: discord_id is intentionally NOT unique to allow many rows per player.
create table if not exists player_log (
  id bigserial primary key,
  match_id text not null,
  match_date date,
  team text,
  player text,
  discord_id text,
  mode text check (mode in ('Hardpoint','SnD','Control')),
  k integer,
  d integer,
  kd numeric(5,2),
  hp_time integer,
  plants integer,
  defuses integer,
  ticks integer,
  write_in text,
  season integer not null default 2,
  source_sheet text not null,
  source_row integer not null,
  unique (source_sheet, source_row),
  constraint player_log_season_valid check (season in (0, 1, 2))
);

create index if not exists player_log_match_id_idx on player_log (match_id);
create index if not exists player_log_discord_id_idx on player_log (discord_id);
create index if not exists player_log_team_idx on player_log (team);
create index if not exists player_log_match_date_idx on player_log (match_date);
create index if not exists player_log_mode_idx on player_log (mode);
create index if not exists player_log_season_match_id_idx on player_log (season, match_id);
create index if not exists player_log_season_discord_id_idx on player_log (season, discord_id);

create table if not exists map_log (
  id bigserial primary key,
  match_id text not null,
  map_num integer not null,
  mode text not null check (mode in ('Hardpoint','SnD','Control')),
  map text not null,
  winner_team text not null,
  losing_team text not null,
  season integer not null default 2,
  source_sheet text not null,
  source_row integer not null,
  unique (source_sheet, source_row),
  unique (match_id, map_num),
  constraint map_log_season_valid check (season in (0, 1, 2))
);

create index if not exists map_log_match_id_idx on map_log (match_id);
create index if not exists map_log_mode_idx on map_log (mode);
create index if not exists map_log_season_match_id_idx on map_log (season, match_id);
create index if not exists map_log_season_match_map_idx on map_log (season, match_id, map_num);

create table if not exists match_log (
  match_id text primary key,
  match_date date,
  home_team text,
  away_team text,
  home_wins integer,
  away_wins integer,
  series_winner text,
  season integer not null default 2,
  source_sheet text not null,
  source_row integer not null,
  unique (source_sheet, source_row),
  constraint match_log_season_valid check (season in (0, 1, 2))
);

create index if not exists match_log_season_match_id_idx on match_log (season, match_id);

create table if not exists player_ovr (
  discord_name text,
  discord_id text primary key,
  ign text,
  -- rank_value stores numeric ranks; rank_is_na allows explicit NA without overloading text.
  rank_value numeric(4,1),
  rank_is_na boolean not null default false,
  team text,
  status text,
  women_status text,
  womens_team text,
  womens_rank numeric(4,1),
  constraint player_ovr_rank_valid
    check (
      (rank_is_na and rank_value is null)
      or (not rank_is_na and rank_value between 0.5 and 18.0)
    )
);

create table if not exists ingest_runs (
  id bigserial primary key,
  started_at timestamp not null default now(),
  finished_at timestamp,
  seasons text not null,
  summary jsonb,
  success boolean not null default false,
  error text
);

-- Auth.js / NextAuth tables
create table if not exists users (
  id bigserial primary key,
  name text,
  email text,
  "emailVerified" timestamp,
  image text
);

create table if not exists accounts (
  id bigserial primary key,
  "userId" bigint not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text
);

create unique index if not exists accounts_provider_providerAccountId_key
  on accounts (provider, "providerAccountId");

create table if not exists sessions (
  id bigserial primary key,
  "sessionToken" text not null unique,
  "userId" bigint not null references users(id) on delete cascade,
  expires timestamp not null
);

create table if not exists verification_token (
  identifier text not null,
  token text not null,
  expires timestamp not null,
  primary key (identifier, token)
);

create table if not exists user_profiles (
  discord_id text primary key,
  avatar_url text,
  banner_url text,
  twitter_url text,
  twitch_url text,
  youtube_url text,
  tiktok_url text,
  updated_at timestamp not null default now()
);
