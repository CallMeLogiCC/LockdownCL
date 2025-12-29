import { getPool } from "@/lib/db";
import type {
  MapLog,
  MatchLog,
  Player,
  PlayerLogEntry,
  PlayerModeStat,
  SeriesPlayerStat
} from "@/lib/types";

export async function getPlayers(): Promise<Player[]> {
  const { rows } = await getPool().query(
    "select discord_name, discord_id, ign, rank_value, rank_is_na, team, status, women_status, womens_team, womens_rank from player_ovr order by ign"
  );
  return rows as Player[];
}

export async function getPlayerById(discordId: string): Promise<Player | null> {
  const { rows } = await getPool().query(
    "select discord_name, discord_id, ign, rank_value, rank_is_na, team, status, women_status, womens_team, womens_rank from player_ovr where discord_id = $1",
    [discordId]
  );
  return (rows as Player[])[0] ?? null;
}

export async function getSeriesById(matchId: string): Promise<MatchLog | null> {
  const { rows } = await getPool().query(
    "select match_id, match_date, home_team, away_team, home_wins, away_wins, series_winner from match_log where match_id = $1",
    [matchId]
  );
  return (rows as MatchLog[])[0] ?? null;
}

export async function getMapsBySeries(matchId: string): Promise<MapLog[]> {
  const { rows } = await getPool().query(
    "select match_id, map_num, mode, map, winner_team, losing_team from map_log where match_id = $1 order by map_num",
    [matchId]
  );
  return rows as MapLog[];
}

export async function getPlayerStatsByPlayer(
  discordId: string
): Promise<PlayerModeStat[]> {
  const { rows } = await getPool().query(
    `
    select
      pl.discord_id,
      pl.mode,
      sum(coalesce(pl.k, 0))::int as k,
      sum(coalesce(pl.d, 0))::int as d,
      case
        when sum(coalesce(pl.d, 0)) = 0 then null
        else round(sum(coalesce(pl.k, 0))::numeric / nullif(sum(coalesce(pl.d, 0)), 0), 2)::float
      end as kd,
      sum(case when pl.mode = 'Hardpoint' then pl.hp_time end)::int as hp_time,
      sum(case when pl.mode = 'SnD' then pl.plants end)::int as plants,
      sum(case when pl.mode = 'SnD' then pl.defuses end)::int as defuses,
      sum(case when pl.mode = 'Control' then pl.ticks end)::int as ticks
    from player_log pl
    where pl.discord_id = $1
    group by pl.discord_id, pl.mode
    order by pl.mode
    `,
    [discordId]
  );
  return rows as PlayerModeStat[];
}

export async function getPlayerStatsBySeries(matchId: string): Promise<SeriesPlayerStat[]> {
  const { rows } = await getPool().query(
    `
    select
      pl.discord_id,
      coalesce(po.ign, pl.player) as ign,
      coalesce(po.team, pl.team) as team,
      pl.mode,
      sum(coalesce(pl.k, 0))::int as k,
      sum(coalesce(pl.d, 0))::int as d,
      case
        when sum(coalesce(pl.d, 0)) = 0 then null
        else round(sum(coalesce(pl.k, 0))::numeric / nullif(sum(coalesce(pl.d, 0)), 0), 2)::float
      end as kd,
      sum(case when pl.mode = 'Hardpoint' then pl.hp_time end)::int as hp_time,
      sum(case when pl.mode = 'SnD' then pl.plants end)::int as plants,
      sum(case when pl.mode = 'SnD' then pl.defuses end)::int as defuses,
      sum(case when pl.mode = 'Control' then pl.ticks end)::int as ticks
    from player_log pl
    left join player_ovr po on po.discord_id = pl.discord_id
    where pl.match_id = $1
    group by pl.discord_id, ign, team, pl.mode
    order by pl.mode, team, ign
    `,
    [matchId]
  );
  return rows as SeriesPlayerStat[];
}

export async function upsertPlayers(players: Player[]): Promise<number> {
  if (players.length === 0) {
    return 0;
  }

  const values: Array<string | number | boolean | null> = [];
  const rows = players.map((player, index) => {
    const offset = index * 10;
    values.push(
      player.discord_name,
      player.discord_id,
      player.ign,
      player.rank_value,
      player.rank_is_na,
      player.team,
      player.status,
      player.women_status,
      player.womens_team,
      player.womens_rank
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`;
  });

  const query = `
    insert into player_ovr
      (discord_name, discord_id, ign, rank_value, rank_is_na, team, status, women_status, womens_team, womens_rank)
    values ${rows.join(", ")}
    on conflict (discord_id)
    do update set
      discord_name = excluded.discord_name,
      ign = excluded.ign,
      rank_value = excluded.rank_value,
      rank_is_na = excluded.rank_is_na,
      team = excluded.team,
      status = excluded.status,
      women_status = excluded.women_status,
      womens_team = excluded.womens_team,
      womens_rank = excluded.womens_rank
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}

export async function upsertSeries(series: MatchLog[]): Promise<number> {
  if (series.length === 0) {
    return 0;
  }

  const values: Array<string | number | null> = [];
  const rows = series.map((match, index) => {
    const offset = index * 7;
    values.push(
      match.match_id,
      match.match_date,
      match.home_team,
      match.away_team,
      match.home_wins,
      match.away_wins,
      match.series_winner
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
  });

  const query = `
    insert into match_log
      (match_id, match_date, home_team, away_team, home_wins, away_wins, series_winner)
    values ${rows.join(", ")}
    on conflict (match_id)
    do update set
      match_date = excluded.match_date,
      home_team = excluded.home_team,
      away_team = excluded.away_team,
      home_wins = excluded.home_wins,
      away_wins = excluded.away_wins,
      series_winner = excluded.series_winner
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}

export async function upsertMaps(maps: MapLog[]): Promise<number> {
  if (maps.length === 0) {
    return 0;
  }

  const values: Array<string | number> = [];
  const rows = maps.map((map, index) => {
    const offset = index * 6;
    values.push(
      map.match_id,
      map.map_num,
      map.mode,
      map.map,
      map.winner_team,
      map.losing_team
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
  });

  const query = `
    insert into map_log
      (match_id, map_num, mode, map, winner_team, losing_team)
    values ${rows.join(", ")}
    on conflict (match_id, map_num)
    do update set
      match_id = excluded.match_id,
      map_num = excluded.map_num,
      mode = excluded.mode,
      map = excluded.map,
      winner_team = excluded.winner_team,
      losing_team = excluded.losing_team
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}

export async function insertPlayerLogEntries(
  stats: PlayerLogEntry[]
): Promise<number> {
  if (stats.length === 0) {
    return 0;
  }

  const values: Array<string | number | null> = [];
  const rows = stats.map((stat, index) => {
    const offset = index * 14;
    values.push(
      stat.match_id,
      stat.match_date,
      stat.team,
      stat.player,
      stat.discord_id,
      stat.mode,
      stat.k,
      stat.d,
      stat.kd,
      stat.hp_time,
      stat.plants,
      stat.defuses,
      stat.ticks,
      stat.write_in
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`;
  });

  const query = `
    insert into player_log
      (match_id, match_date, team, player, discord_id, mode, k, d, kd, hp_time, plants, defuses, ticks, write_in)
    values ${rows.join(", ")}
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}
