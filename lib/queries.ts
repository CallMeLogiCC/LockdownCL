import { cache } from "react";
import { getPool } from "@/lib/db";
import type {
  MapLog,
  MatchLog,
  MatchPlayerRow,
  Player,
  PlayerAggregates,
  PlayerLogEntry,
  PlayerLogRow,
  PlayerMapBreakdown,
  PlayerMatchHistoryEntry,
  PlayerMatchModeStat,
  PlayerMatchSummary,
  PlayerModeStat,
  PlayerTotals,
  PlayerWithStats,
  UserProfile,
  TeamModeWinRateRow
} from "@/lib/types";
import { TEAM_DEFS } from "@/lib/teams";

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

const MAP_LISTS: Record<string, string[]> = {
  Hardpoint: ["Blackheart", "Colossus", "Den", "Exposure", "Scar"],
  SnD: ["Raid", "Colossus", "Den", "Exposure", "Scar"],
  Control: ["Den", "Exposure", "Scar"]
};

const getPlayerPageBaseData = cache(async (discordId: string) => {
  const { rows: playerRows } = await getPool().query(
    `
    select
      id,
      match_id,
      match_date,
      team,
      player,
      discord_id,
      mode,
      k,
      d,
      kd,
      hp_time,
      plants,
      defuses,
      ticks,
      write_in
    from player_log
    where discord_id = $1
    order by match_id, mode, id
    `,
    [discordId]
  );

  const playerLogs = playerRows as PlayerLogRow[];
  const matchIds = Array.from(new Set(playerLogs.map((row) => row.match_id)));

  if (matchIds.length === 0) {
    return {
      playerLogs,
      matchLogs: [] as MatchLog[],
      mapLogs: [] as MapLog[],
      matchIds
    };
  }

  const [{ rows: matchRows }, { rows: mapRows }] = await Promise.all([
    getPool().query(
      `
      select match_id, match_date, home_team, away_team, home_wins, away_wins, series_winner
      from match_log
      where match_id = any($1::text[])
      order by match_date desc nulls last, match_id desc
      `,
      [matchIds]
    ),
    getPool().query(
      `
      select match_id, map_num, mode, map, winner_team, losing_team
      from map_log
      where match_id = any($1::text[])
      order by match_id, map_num
      `,
      [matchIds]
    )
  ]);

  return {
    playerLogs,
    matchLogs: matchRows as MatchLog[],
    mapLogs: mapRows as MapLog[],
    matchIds
  };
});

const getMatchTeamMap = (playerLogs: PlayerLogRow[]) => {
  const matchTeams = new Map<string, string>();
  playerLogs.forEach((row) => {
    if (row.team && !matchTeams.has(row.match_id)) {
      matchTeams.set(row.match_id, row.team);
    }
  });
  return matchTeams;
};

const buildModeKey = (matchId: string, mode: string) => `${matchId}__${mode}`;

const buildPlayerLogsByMatchMode = (playerLogs: PlayerLogRow[]) => {
  const grouped = new Map<string, PlayerLogRow[]>();
  playerLogs.forEach((row) => {
    const key = buildModeKey(row.match_id, row.mode);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(row);
  });
  return grouped;
};

const buildMapLogsByMatchMode = (mapLogs: MapLog[]) => {
  const grouped = new Map<string, MapLog[]>();
  mapLogs.forEach((row) => {
    const key = buildModeKey(row.match_id, row.mode);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(row);
  });
  return grouped;
};

export async function getPlayerProfile(discordId: string): Promise<Player | null> {
  return getPlayerById(discordId);
}

export async function getPlayerAggregates(discordId: string): Promise<PlayerAggregates> {
  const { playerLogs, matchLogs, mapLogs } = await getPlayerPageBaseData(discordId);
  const matchTeams = getMatchTeamMap(playerLogs);

  const totals = playerLogs.reduce(
    (acc, row) => {
      acc.kills += row.k ?? 0;
      acc.deaths += row.d ?? 0;
      return acc;
    },
    { kills: 0, deaths: 0 }
  );

  const modes: PlayerAggregates["modes"] = {};
  playerLogs.forEach((row) => {
    if (!modes[row.mode]) {
      modes[row.mode] = { kills: 0, deaths: 0, map_wins: 0, map_losses: 0 };
    }
    modes[row.mode].kills += row.k ?? 0;
    modes[row.mode].deaths += row.d ?? 0;
  });

  let seriesWins = 0;
  let seriesLosses = 0;

  matchLogs.forEach((match) => {
    const team = matchTeams.get(match.match_id);
    if (!team) {
      return;
    }
    const homeWins = match.home_wins ?? 0;
    const awayWins = match.away_wins ?? 0;
    if (team === match.home_team && homeWins > awayWins) {
      seriesWins += 1;
    } else if (team === match.away_team && awayWins > homeWins) {
      seriesWins += 1;
    } else {
      seriesLosses += 1;
    }
  });

  let mapWins = 0;
  let mapLosses = 0;
  mapLogs.forEach((map) => {
    const team = matchTeams.get(map.match_id);
    if (!team) {
      return;
    }
    if (map.winner_team === team) {
      mapWins += 1;
      if (modes[map.mode]) {
        modes[map.mode].map_wins += 1;
      }
    } else if (map.losing_team === team) {
      mapLosses += 1;
      if (modes[map.mode]) {
        modes[map.mode].map_losses += 1;
      }
    }
  });

  return {
    overall: {
      kills: totals.kills,
      deaths: totals.deaths,
      series_wins: seriesWins,
      series_losses: seriesLosses,
      map_wins: mapWins,
      map_losses: mapLosses
    },
    modes
  };
}

export async function getPlayerMapBreakdowns(
  discordId: string
): Promise<PlayerMapBreakdown[]> {
  const { playerLogs, mapLogs, matchIds } = await getPlayerPageBaseData(discordId);
  const matchTeams = getMatchTeamMap(playerLogs);
  const playerLogsByMatchMode = buildPlayerLogsByMatchMode(playerLogs);
  const mapLogsByMatchMode = buildMapLogsByMatchMode(mapLogs);

  const modeBreakdowns: PlayerMapBreakdown[] = Object.entries(MAP_LISTS).map(
    ([mode, maps]) => ({
      mode,
      label: mode === "Control" ? "Overload" : mode,
      maps: maps.map((mapName) => ({
        name: mapName,
        kills: 0,
        deaths: 0,
        wins: 0,
        losses: 0
      }))
    })
  );

  const breakdownMap = new Map<string, Map<string, PlayerMapBreakdown["maps"][0]>>();
  modeBreakdowns.forEach((breakdown) => {
    const inner = new Map<string, PlayerMapBreakdown["maps"][0]>();
    breakdown.maps.forEach((entry) => {
      inner.set(entry.name, entry);
    });
    breakdownMap.set(breakdown.mode, inner);
  });

  matchIds.forEach((matchId) => {
    Object.keys(MAP_LISTS).forEach((mode) => {
      const mapRows = mapLogsByMatchMode.get(buildModeKey(matchId, mode)) ?? [];
      const playerRows = playerLogsByMatchMode.get(buildModeKey(matchId, mode)) ?? [];
      mapRows.forEach((mapRow, index) => {
        const mapEntry = breakdownMap.get(mode)?.get(mapRow.map);
        if (!mapEntry) {
          return;
        }
        const playerRow = playerRows[index];
        if (!playerRow) {
          return;
        }
        mapEntry.kills += playerRow.k ?? 0;
        mapEntry.deaths += playerRow.d ?? 0;
        const team = matchTeams.get(matchId);
        if (team) {
          if (mapRow.winner_team === team) {
            mapEntry.wins += 1;
          } else if (mapRow.losing_team === team) {
            mapEntry.losses += 1;
          }
        }
      });
    });
  });

  return modeBreakdowns;
}

export async function getPlayerMatchHistory(
  discordId: string
): Promise<PlayerMatchHistoryEntry[]> {
  const { playerLogs, matchLogs, mapLogs } = await getPlayerPageBaseData(discordId);
  const matchTeams = getMatchTeamMap(playerLogs);
  const playerLogsByMatch = new Map<string, PlayerLogRow[]>();
  playerLogs.forEach((row) => {
    if (!playerLogsByMatch.has(row.match_id)) {
      playerLogsByMatch.set(row.match_id, []);
    }
    playerLogsByMatch.get(row.match_id)?.push(row);
  });

  const playerLogsByMatchMode = buildPlayerLogsByMatchMode(playerLogs);
  const mapLogsByMatch = new Map<string, MapLog[]>();
  mapLogs.forEach((row) => {
    if (!mapLogsByMatch.has(row.match_id)) {
      mapLogsByMatch.set(row.match_id, []);
    }
    mapLogsByMatch.get(row.match_id)?.push(row);
  });

  return matchLogs.map((match) => {
    const team = matchTeams.get(match.match_id) ?? null;
    const opponent =
      team && match.home_team && match.away_team
        ? team === match.home_team
          ? match.away_team
          : match.home_team
        : null;
    const homeWins = match.home_wins ?? 0;
    const awayWins = match.away_wins ?? 0;
    const seriesWin =
      team &&
      ((team === match.home_team && homeWins > awayWins) ||
        (team === match.away_team && awayWins > homeWins));

    const matchPlayerRows = playerLogsByMatch.get(match.match_id) ?? [];
    const totals = matchPlayerRows.reduce(
      (acc, row) => {
        acc.k += row.k ?? 0;
        acc.d += row.d ?? 0;
        return acc;
      },
      { k: 0, d: 0 }
    );

    const matchMapRows = mapLogsByMatch.get(match.match_id) ?? [];
    const modeCounters: Record<string, number> = {
      Hardpoint: 0,
      SnD: 0,
      Control: 0
    };

    const maps = matchMapRows.map((mapRow) => {
      const counter = modeCounters[mapRow.mode] ?? 0;
      const playerRows =
        playerLogsByMatchMode.get(buildModeKey(match.match_id, mapRow.mode)) ?? [];
      const playerRow = playerRows[counter];
      modeCounters[mapRow.mode] = counter + 1;

      return {
        map_num: mapRow.map_num,
        mode: mapRow.mode,
        map: mapRow.map,
        winner_team: mapRow.winner_team,
        losing_team: mapRow.losing_team,
        player_stats: playerRow
          ? {
              k: playerRow.k ?? 0,
              d: playerRow.d ?? 0,
              hp_time: playerRow.hp_time,
              plants: playerRow.plants,
              defuses: playerRow.defuses,
              ticks: playerRow.ticks
            }
          : null
      };
    });

    return {
      match_id: match.match_id,
      match_date: match.match_date,
      home_team: match.home_team,
      away_team: match.away_team,
      home_wins: match.home_wins,
      away_wins: match.away_wins,
      player_team: team,
      opponent,
      series_result: seriesWin ? "W" : "L",
      totals,
      maps
    };
  });
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

export async function getDiscordIdForUserId(userId: string): Promise<string | null> {
  const { rows } = await getPool().query(
    `
    select "providerAccountId"
    from accounts
    where "userId" = $1 and provider = 'discord'
    `,
    [userId]
  );
  const row = rows[0] as { providerAccountId?: string } | undefined;
  return row?.providerAccountId ?? null;
}

export async function getUserProfile(discordId: string): Promise<UserProfile | null> {
  try {
    const { rows } = await getPool().query(
      `
      select
        discord_id,
        avatar_url,
        banner_url,
        twitter_url,
        twitch_url,
        youtube_url,
        tiktok_url,
        updated_at
      from user_profiles
      where discord_id = $1
      `,
      [discordId]
    );

    return (rows as UserProfile[])[0] ?? null;
  } catch (error) {
    if ((error as { code?: string }).code === "42P01") {
      return null;
    }
    throw error;
  }
}

export async function ensureUserProfile({
  discordId,
  avatarUrl,
  bannerUrl
}: {
  discordId: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}) {
  try {
    await getPool().query(
      `
      insert into user_profiles (discord_id, avatar_url, banner_url, updated_at)
      values ($1, $2, $3, now())
      on conflict (discord_id) do nothing
      `,
      [discordId, avatarUrl, bannerUrl]
    );
  } catch (error) {
    if ((error as { code?: string }).code === "42P01") {
      return;
    }
    throw error;
  }
}

export async function updateUserProfile({
  discordId,
  avatarUrl,
  bannerUrl,
  twitterUrl,
  twitchUrl,
  youtubeUrl,
  tiktokUrl
}: {
  discordId: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  twitterUrl: string | null;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
}): Promise<boolean> {
  try {
    await getPool().query(
      `
      insert into user_profiles (
        discord_id,
        avatar_url,
        banner_url,
        twitter_url,
        twitch_url,
        youtube_url,
        tiktok_url,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, now())
      on conflict (discord_id)
      do update set
        avatar_url = excluded.avatar_url,
        banner_url = excluded.banner_url,
        twitter_url = excluded.twitter_url,
        twitch_url = excluded.twitch_url,
        youtube_url = excluded.youtube_url,
        tiktok_url = excluded.tiktok_url,
        updated_at = now()
      `,
      [
        discordId,
        avatarUrl,
        bannerUrl,
        twitterUrl,
        twitchUrl,
        youtubeUrl,
        tiktokUrl
      ]
    );
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === "42P01") {
      return false;
    }
    throw error;
  }
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
      and po.rank_is_na = false
      and po.rank_value is not null
    order by po.discord_name
    `,
    [team]
  );

  return rows as PlayerWithStats[];
}

export async function getTeamModeWinRates(team: string): Promise<TeamModeWinRateRow[]> {
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

  return rows as TeamModeWinRateRow[];
}

export async function getAllTeams(): Promise<string[]> {
  return TEAM_DEFS.map((team) => team.displayName);
}

export async function listPlayersForSitemap(): Promise<
  Array<{ discord_id: string; last_match_date: string | null }>
> {
  const { rows } = await getPool().query(
    `
    select
      po.discord_id,
      max(pl.match_date) as last_match_date
    from player_ovr po
    left join player_log pl on pl.discord_id = po.discord_id
    group by po.discord_id
    order by po.discord_id
    `
  );

  return rows as Array<{ discord_id: string; last_match_date: string | null }>;
}

export async function listTeamsForSitemap(): Promise<
  Array<{ team_name: string; last_match_date: string | null }>
> {
  const teamNames = TEAM_DEFS.map((team) => team.displayName);
  const { rows } = await getPool().query(
    `
    select
      teams.team_name,
      max(match_log.match_date) as last_match_date
    from (
      select unnest($1::text[]) as team_name
    ) teams
    left join match_log
      on match_log.home_team = teams.team_name
      or match_log.away_team = teams.team_name
    group by teams.team_name
    order by teams.team_name
    `,
    [teamNames]
  );

  return rows as Array<{ team_name: string; last_match_date: string | null }>;
}

export async function listMatchesForSitemap(): Promise<
  Array<{ match_id: string; match_date: string | null }>
> {
  const { rows } = await getPool().query(
    `
    select match_id, match_date
    from match_log
    order by match_date desc nulls last, match_id desc
    `
  );

  return rows as Array<{ match_id: string; match_date: string | null }>;
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
