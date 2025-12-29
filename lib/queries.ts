import { getPool } from "@/lib/db";
import type {
  MapLog,
  MatchLog,
  MatchPlayerRow,
  Player,
  PlayerLogEntry,
  PlayerMatchModeStat,
  PlayerMatchSummary,
  PlayerModeStat,
  PlayerTotals,
  PlayerWithStats,
  TeamModeWinRate
} from "@/lib/types";

export async function listPlayersWithStats(): Promise<PlayerWithStats[]> {
  const { rows } = await getPool().query(
    `
    select
      po.discord_name,
      po.discord_id,
      po.ign,
      po.rank_value,
      po.rank_is_na,
      po.team,
      po.status,
      po.women_status,
      po.womens_team,
      po.womens_rank,
      coalesce(stats.total_k, 0)::int as total_k,
      coalesce(stats.total_d, 0)::int as total_d,
      case
        when coalesce(stats.total_d, 0) = 0 then null
        else round(coalesce(stats.total_k, 0)::numeric / nullif(stats.total_d, 0), 2)::float
      end as ovr_kd
    from player_ovr po
    left join (
      select
        discord_id,
        sum(coalesce(k, 0))::int as total_k,
        sum(coalesce(d, 0))::int as total_d
      from player_log
      group by discord_id
    ) stats on stats.discord_id = po.discord_id
    order by po.discord_name
    `
  );

  return rows as PlayerWithStats[];
}

export async function getPlayerById(discordId: string): Promise<Player | null> {
  const { rows } = await getPool().query(
    `
    select discord_name, discord_id, ign, rank_value, rank_is_na, team, status, women_status, womens_team, womens_rank
    from player_ovr
    where discord_id = $1
    `,
    [discordId]
  );
  return (rows as Player[])[0] ?? null;
}

export async function getPlayerTotals(discordId: string): Promise<PlayerTotals> {
  const { rows } = await getPool().query(
    `
    select
      coalesce(sum(coalesce(k, 0)), 0)::int as total_k,
      coalesce(sum(coalesce(d, 0)), 0)::int as total_d
    from player_log
    where discord_id = $1
    `,
    [discordId]
  );

  const totals = rows[0] as { total_k: number; total_d: number } | undefined;
  const total_k = totals?.total_k ?? 0;
  const total_d = totals?.total_d ?? 0;
  return {
    total_k,
    total_d,
    ovr_kd: total_d === 0 ? null : Number((total_k / total_d).toFixed(2))
  };
}

export async function getPlayerModeStats(discordId: string): Promise<PlayerModeStat[]> {
  const { rows } = await getPool().query(
    `
    select
      mode,
      sum(coalesce(k, 0))::int as k,
      sum(coalesce(d, 0))::int as d,
      case
        when sum(coalesce(d, 0)) = 0 then null
        else round(sum(coalesce(k, 0))::numeric / nullif(sum(coalesce(d, 0)), 0), 2)::float
      end as kd,
      sum(case when mode = 'Hardpoint' then hp_time end)::int as hp_time,
      sum(case when mode = 'SnD' then plants end)::int as plants,
      sum(case when mode = 'SnD' then defuses end)::int as defuses,
      sum(case when mode = 'Control' then ticks end)::int as ticks
    from player_log
    where discord_id = $1
    group by mode
    order by mode
    `,
    [discordId]
  );

  return rows as PlayerModeStat[];
}

export async function getPlayerMatchSummaries(
  discordId: string
): Promise<PlayerMatchSummary[]> {
  const { rows } = await getPool().query(
    `
    select distinct
      ml.match_id,
      ml.match_date,
      ml.home_team,
      ml.away_team,
      ml.home_wins,
      ml.away_wins
    from player_log pl
    join match_log ml on ml.match_id = pl.match_id
    where pl.discord_id = $1
    order by ml.match_date desc nulls last, ml.match_id desc
    `,
    [discordId]
  );

  return rows as PlayerMatchSummary[];
}

export async function getPlayerMatchModeStats(
  discordId: string,
  matchIds: string[]
): Promise<PlayerMatchModeStat[]> {
  if (matchIds.length === 0) {
    return [];
  }

  const { rows } = await getPool().query(
    `
    select
      match_id,
      mode,
      sum(coalesce(k, 0))::int as k,
      sum(coalesce(d, 0))::int as d,
      case
        when sum(coalesce(d, 0)) = 0 then null
        else round(sum(coalesce(k, 0))::numeric / nullif(sum(coalesce(d, 0)), 0), 2)::float
      end as kd,
      sum(case when mode = 'Hardpoint' then hp_time end)::int as hp_time,
      sum(case when mode = 'SnD' then plants end)::int as plants,
      sum(case when mode = 'SnD' then defuses end)::int as defuses,
      sum(case when mode = 'Control' then ticks end)::int as ticks
    from player_log
    where discord_id = $1 and match_id = any($2::text[])
    group by match_id, mode
    order by match_id, mode
    `,
    [discordId, matchIds]
  );

  return rows as PlayerMatchModeStat[];
}

export async function getPlayerMatchTeams(
  discordId: string
): Promise<Array<{ match_id: string; mode: string; team: string | null }>> {
  const { rows } = await getPool().query(
    `
    select distinct match_id, mode, team
    from player_log
    where discord_id = $1
    `,
    [discordId]
  );

  return rows as Array<{ match_id: string; mode: string; team: string | null }>;
}

export async function getSeriesById(matchId: string): Promise<MatchLog | null> {
  const { rows } = await getPool().query(
    `
    select match_id, match_date, home_team, away_team, home_wins, away_wins, series_winner
    from match_log
    where match_id = $1
    `,
    [matchId]
  );
  return (rows as MatchLog[])[0] ?? null;
}

export async function getMatchesByTeam(team: string): Promise<MatchLog[]> {
  const { rows } = await getPool().query(
    `
    select match_id, match_date, home_team, away_team, home_wins, away_wins, series_winner
    from match_log
    where home_team = $1 or away_team = $1
    order by match_date desc nulls last, match_id desc
    `,
    [team]
  );

  return rows as MatchLog[];
}

export async function getAllMatches(): Promise<MatchLog[]> {
  const { rows } = await getPool().query(
    `
    select match_id, match_date, home_team, away_team, home_wins, away_wins, series_winner
    from match_log
    order by match_date desc nulls last
    `
  );

  return rows as MatchLog[];
}

export async function getMapsBySeries(matchId: string): Promise<MapLog[]> {
  const { rows } = await getPool().query(
    `
    select match_id, map_num, mode, map, winner_team, losing_team
    from map_log
    where match_id = $1
    order by map_num
    `,
    [matchId]
  );
  return rows as MapLog[];
}

export async function getMapsByMatchIds(matchIds: string[]): Promise<MapLog[]> {
  if (matchIds.length === 0) {
    return [];
  }
  const { rows } = await getPool().query(
    `
    select match_id, map_num, mode, map, winner_team, losing_team
    from map_log
    where match_id = any($1::text[])
    order by match_id, map_num
    `,
    [matchIds]
  );
  return rows as MapLog[];
}

export async function getMatchPlayerRows(matchId: string): Promise<MatchPlayerRow[]> {
  const { rows } = await getPool().query(
    `
    select
      pl.match_id,
      pl.mode,
      pl.player,
      pl.discord_id,
      pl.team,
      pl.k,
      pl.d,
      pl.kd,
      pl.hp_time,
      pl.plants,
      pl.defuses,
      pl.ticks
    from player_log pl
    where pl.match_id = $1
    order by pl.mode, pl.team, pl.player
    `,
    [matchId]
  );

  return rows as MatchPlayerRow[];
}

export async function getTeamRoster(team: string): Promise<PlayerWithStats[]> {
  const { rows } = await getPool().query(
    `
    select
      po.discord_name,
      po.discord_id,
      po.ign,
      po.rank_value,
      po.rank_is_na,
      po.team,
      po.status,
      po.women_status,
      po.womens_team,
      po.womens_rank,
      coalesce(stats.total_k, 0)::int as total_k,
      coalesce(stats.total_d, 0)::int as total_d,
      case
        when coalesce(stats.total_d, 0) = 0 then null
        else round(coalesce(stats.total_k, 0)::numeric / nullif(stats.total_d, 0), 2)::float
      end as ovr_kd
    from player_ovr po
    left join (
      select
        discord_id,
        sum(coalesce(k, 0))::int as total_k,
        sum(coalesce(d, 0))::int as total_d
      from player_log
      group by discord_id
    ) stats on stats.discord_id = po.discord_id
    where po.team = $1
      and coalesce(po.status, '') != 'Free Agent'
      and not (po.team = 'Former Player' and po.status = 'Unregistered')
    order by po.discord_name
    `,
    [team]
  );

  return rows as PlayerWithStats[];
}

export async function getTeamModeWinRates(team: string): Promise<TeamModeWinRate[]> {
  const { rows } = await getPool().query(
    `
    select
      mode,
      sum(case when winner_team = $1 then 1 else 0 end)::int as wins,
      sum(case when winner_team = $1 or losing_team = $1 then 1 else 0 end)::int as total
    from map_log
    where winner_team = $1 or losing_team = $1
    group by mode
    order by mode
    `,
    [team]
  );

  return rows as TeamModeWinRate[];
}

export async function getAllTeams(): Promise<string[]> {
  const { rows } = await getPool().query(
    `
    select distinct team_name from (
      select team as team_name from player_ovr where team is not null
      union
      select home_team as team_name from match_log where home_team is not null
      union
      select away_team as team_name from match_log where away_team is not null
    ) teams
    order by team_name
    `
  );

  return rows.map((row: { team_name: string }) => row.team_name);
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
      mode = excluded.mode,
      map = excluded.map,
      winner_team = excluded.winner_team,
      losing_team = excluded.losing_team
  `;

  const result = await getPool().query(query, values);
  return result.rowCount ?? 0;
}

export async function insertPlayerLogEntries(entries: PlayerLogEntry[]): Promise<number> {
  if (entries.length === 0) {
    return 0;
  }

  const values: Array<string | number | null> = [];
  const rows = entries.map((entry, index) => {
    const offset = index * 14;
    values.push(
      entry.match_id,
      entry.match_date,
      entry.team,
      entry.player,
      entry.discord_id,
      entry.mode,
      entry.k,
      entry.d,
      entry.kd,
      entry.hp_time,
      entry.plants,
      entry.defuses,
      entry.ticks,
      entry.write_in
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
