import type { Match } from '../types';

export type OddsBodySection = {
  kind: 'body';
  title: 'ဘော်ဒီ';
  givingTeam: string;
  homeLine: string;
  homeRate: string;
  awayLine: string;
  awayRate: string;
};

export type OddsGoalSection = {
  kind: 'goal';
  title: 'ဂိုးပေါင်း';
  goalLine: string;
  overRate: string;
  underRate: string;
};

export type OddsSection = OddsBodySection | OddsGoalSection;

export type BetSide = 'body-home' | 'body-away' | 'goal-over' | 'goal-under';

export type BettingMatchRow = {
  match: Match;
  league: string;
  kickoffLabel: string;
  kickoffMs: number;
  body?: OddsBodySection;
  goal?: OddsGoalSection;
  closed: boolean;
};

export type BetPick = {
  matchId: string;
  league: string;
  homeName: string;
  awayName: string;
  side: BetSide;
  oddsLabel: string;
  summary: string;
};
