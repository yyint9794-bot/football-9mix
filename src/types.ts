export type Team = {
  name: string;
  logo: string;
};

export type League = {
  name: string;
  logo: string;
};

export type StreamLinks = Record<string, string>;

export type Match = {
  id: string;
  league: League;
  time: string;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
  streamLinks: StreamLinks;
  [key: string]: unknown;
};

export type FootballResponse = {
  author: string;
  website: string;
  country: string;
  copyright: string;
  football_api_status: string;
  matches: Match[];
};
