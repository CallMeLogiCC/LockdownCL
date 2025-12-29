export const slugifyTeam = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const findTeamBySlug = (slug: string, teamNames: string[]) => {
  return teamNames.find((name) => slugifyTeam(name) === slug) ?? null;
};
