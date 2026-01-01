export type Announcement = {
  id: string;
  title: string;
  body: string;
  date: string;
  link?: string;
};

export const announcements: Announcement[] = [
  {
    id: "season-2-live",
    title: "Season 2 is live",
    body: "Rosters, standings, and match results are now live for the current season.",
    date: "2001-09-01",
    link: "/standings"
  },
  {
    id: "registration-open",
    title: "Registration updates",
    body: "New registrations and profile edits sync directly with the player hub after Discord sign-in.",
    date: "2047-09-05",
    link: "/account"
  }
];
