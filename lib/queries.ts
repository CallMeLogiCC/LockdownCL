import { getPool } from "@/lib/db";
import type { Map, Player, PlayerMapStat, Series } from "@/lib/types";

export async function getPlayers(): Promise<Player[]> {
  const { rows } = await getPool().query(
    "select discord_id, ign, rank, team, status, womens_status, womens_team, salary from players order by ign"
  );
  return rows as Player[];
}

export async function getPlayerById(discordId: string): Promise<Player | null> {
  const { rows } = await getPool().query(
    "select discord_id, ign, rank, team, status, womens_status, womens_team, salary from players where discord_id = $1",
    [discordId]
  );
  return (rows as Player[])[0] ?? null;
}

export async function getSeriesById(matchId: string): Promise<Series | null> {
  const { rows } = await getPool().query(
    "select match_id, match_date, division, home_team, away_team, home_wins, away_wins, series_winner from series where match_id = $1",
    [matchId]
  );
  return (rows as Series[])[0] ?? null;
}

export async function getMapsBySeries(matchId: string): Promise<Map[]> {
  const { rows } = await getPool().query(
    "select id, match_id, map_number, map_name, mode, winning_team, losing_team from maps where match_id = $1 order by map_number",
    [matchId]
  );
  return rows as Map[];
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
  const { rows } = await getPool().query(
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
  return rows as PlayerMapStatWithContext[];
}

export type SeriesPlayerStat = PlayerMapStat & {
  ign: string;
  team: string;
  map_name: string;
  mode: string;
};

export async function getPlayerStatsBySeries(matchId: string): Promise<SeriesPlayerStat[]> {
  const { rows } = await getPool().query(
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
  return rows as SeriesPlayerStat[];
}

export async function upsertPlayers(players: Player[]): Promise<number> {
  if (players.length === 0) {
    return 0;
  }

  const values: Array<string | number | null> = [];
  const rows = players.map((player, index) => {
    const offset = index * 8;
    values.push(
      player.discord_id,
      player.ign,
      player.rank,
      player.team,
      player.status,
      player.womens_status,
      player.womens_team,
      player.salary
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
  });

  const query = `
    insert into players
      (discord_id, ign, rank, team, status, womens_status, womens_team, salary)
    values ${rows.join(", ")}
    on conflict (discord_id)
    do update set
      ign = excluded.ign,
      rank = excluded.rank,
      team = excluded.team,
      status = excluded.status,
      womens_status = excluded.womens_status,
      womens_team = excluded.womens_team,
      salary = excluded.salary
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}
