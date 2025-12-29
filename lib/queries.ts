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

export async function upsertSeries(series: Series[]): Promise<number> {
  if (series.length === 0) {
    return 0;
  }

  const values: Array<string | number> = [];
  const rows = series.map((match, index) => {
    const offset = index * 8;
    values.push(
      match.match_id,
      match.match_date,
      match.division,
      match.home_team,
      match.away_team,
      match.home_wins,
      match.away_wins,
      match.series_winner
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
  });

  const query = `
    insert into series
      (match_id, match_date, division, home_team, away_team, home_wins, away_wins, series_winner)
    values ${rows.join(", ")}
    on conflict (match_id)
    do update set
      match_date = excluded.match_date,
      division = excluded.division,
      home_team = excluded.home_team,
      away_team = excluded.away_team,
      home_wins = excluded.home_wins,
      away_wins = excluded.away_wins,
      series_winner = excluded.series_winner
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}

export async function upsertMaps(maps: Map[]): Promise<number> {
  if (maps.length === 0) {
    return 0;
  }

  const values: Array<string | number> = [];
  const rows = maps.map((map, index) => {
    const offset = index * 7;
    values.push(
      map.id,
      map.match_id,
      map.map_number,
      map.map_name,
      map.mode,
      map.winning_team,
      map.losing_team
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
  });

  const query = `
    insert into maps
      (id, match_id, map_number, map_name, mode, winning_team, losing_team)
    values ${rows.join(", ")}
    on conflict (id)
    do update set
      match_id = excluded.match_id,
      map_number = excluded.map_number,
      map_name = excluded.map_name,
      mode = excluded.mode,
      winning_team = excluded.winning_team,
      losing_team = excluded.losing_team
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}

export async function upsertPlayerMapStats(
  stats: PlayerMapStat[]
): Promise<number> {
  if (stats.length === 0) {
    return 0;
  }

  const values: Array<string | number> = [];
  const rows = stats.map((stat, index) => {
    const offset = index * 10;
    values.push(
      stat.id,
      stat.match_id,
      stat.map_id,
      stat.discord_id,
      stat.kills,
      stat.deaths,
      stat.assists,
      stat.hp_time,
      stat.plants,
      stat.defuses
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`;
  });

  const query = `
    insert into player_map_stats
      (id, match_id, map_id, discord_id, kills, deaths, assists, hp_time, plants, defuses)
    values ${rows.join(", ")}
    on conflict (id)
    do update set
      match_id = excluded.match_id,
      map_id = excluded.map_id,
      discord_id = excluded.discord_id,
      kills = excluded.kills,
      deaths = excluded.deaths,
      assists = excluded.assists,
      hp_time = excluded.hp_time,
      plants = excluded.plants,
      defuses = excluded.defuses
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}
