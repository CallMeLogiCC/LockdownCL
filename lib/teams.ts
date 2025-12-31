import { LEAGUE_TEAMS, type LeagueKey } from "@/lib/league";
import { slugifyTeam } from "@/lib/slug";

export type TeamDefinition = {
  league: LeagueKey;
  displayName: string;
  slug: string;
};

export const DEFAULT_TEAM_LOGO = "/brand/logo.jpg";

export const TEAM_DEFS: TeamDefinition[] = (
  Object.entries(LEAGUE_TEAMS) as Array<[LeagueKey, string[]]>
).flatMap(([league, teams]) =>
  teams.map((team) => ({
    league,
    displayName: team,
    slug: slugifyTeam(team)
  }))
);

const TEAM_DEFS_BY_SLUG = new Map(TEAM_DEFS.map((team) => [team.slug, team]));
const TEAM_DEFS_BY_NAME = new Map(TEAM_DEFS.map((team) => [team.displayName, team]));

export const getTeamDefinitionBySlug = (slug: string) => TEAM_DEFS_BY_SLUG.get(slug) ?? null;

export const getTeamDefinitionByName = (name: string | null) =>
  name ? TEAM_DEFS_BY_NAME.get(name) ?? null : null;

export const getTeamsForLeague = (league: LeagueKey) =>
  TEAM_DEFS.filter((team) => team.league === league);

export const isCanonicalTeamName = (name: string | null) => Boolean(getTeamDefinitionByName(name));

export const getTeamLogo = (teamSlug: string, league: LeagueKey) => {
  const leagueFolder = league.toLowerCase();
  const basePath = `/team-logos/${leagueFolder}/${teamSlug}`;
  return {
    src: `${basePath}.png`,
    fallbacks: [`${basePath}.jpg`, `${basePath}.jpeg`],
    defaultSrc: DEFAULT_TEAM_LOGO
  };
};
