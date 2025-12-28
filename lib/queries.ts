import { pool } from "@/lib/db";
import type { Map, Player, PlayerMapStat, Series } from "@/lib/types";

export async function getPlayers(): Promise<Player[]> {
  const { rows } = await pool.query<Player>(
    "select discord_id, ign, rank, team, status, womens_status, womens_team, salary from players order by ign"
  );
  return rows;
}

export async function getPlayerById(discordId: string): Promise<Player | null> {
  const { rows } = await pool.query<Player>(
    "select discord_id, ign, rank, team, status, womens_status, womens_team, salary from players where discord_id = $1",
    [discordId]
  );
  return rows[0] ?? null;
}

export async function getSeriesById(matchId: string): Promise<Series | null> {
  const { rows } = await pool.query<Series>(
    "select match_id, match_date, division, home_team, away_team, home_wins, away_wins, series_winner from series where match_id = $1",
    [matchId]
  );
  return rows[0] ?? null;
}

export async function getMapsBySeries(matchId: string): Promise<Map[]> {
  const { rows } = await pool.query<Map>(
    "select id, match_id, map_number, map_name, mode, winning_team, losing_team from maps where match_id = $1 order by map_number",
    [matchId]
  );
  return rows;
}

export type PlayerMapStatWithContext = PlayerMapStat & {
  map_name: string;
  mode: string;
  opponent: string;
  match_id: string;
};

export async function getPlayerStatsByPlayer(
  discordId: string
): Promise<PlayerMapStatWithContext[]> {
  const { rows } = await pool.query<PlayerMapStatWithContext>(
    `
    select
      pms.id,
      pms.match_id,
      pms.map_id,
      pms.discord_id,
      pms.kills,
      pms.deaths,
      pms.assists,
      pms.hp_time,
      pms.plants,
      pms.defuses,
      m.map_name,
      m.mode,
      case
        when s.home_team = p.team then s.away_team
        else s.home_team
      end as opponent
    from player_map_stats pms
    join maps m on m.id = pms.map_id
    join series s on s.match_id = pms.match_id
    join players p on p.discord_id = pms.discord_id
    where pms.discord_id = $1
    order by pms.match_id, m.map_number
    `,
    [discordId]
  );
  return rows;
}

export type SeriesPlayerStat = PlayerMapStat & {
  ign: string;
  team: string;
  map_name: string;
  mode: string;
};

export async function getPlayerStatsBySeries(matchId: string): Promise<SeriesPlayerStat[]> {
  const { rows } = await pool.query<SeriesPlayerStat>(
    `
    select
      pms.id,
      pms.match_id,
      pms.map_id,
      pms.discord_id,
      pms.kills,
      pms.deaths,
      pms.assists,
      pms.hp_time,
      pms.plants,
      pms.defuses,
      p.ign,
      p.team,
      m.map_name,
      m.mode
    from player_map_stats pms
    join players p on p.discord_id = pms.discord_id
    join maps m on m.id = pms.map_id
    where pms.match_id = $1
    order by m.map_number, p.team, p.ign
    `,
    [matchId]
  );
  return rows;
}
