import { formatMatchScore, hasMatchScore } from '../matchScore';
import { TeamLogo } from '../TeamLogo';
import { isLiveMatch } from '../matchUi';
import type { Match } from '../types';

type MobileMatchCardProps = {
  match: Match;
  onWatch: (match: Match) => void;
  onBet?: () => void;
  compact?: boolean;
};

export function MobileMatchCard({ match, onWatch, onBet, compact = false }: MobileMatchCardProps) {
  const live = isLiveMatch(match);
  const score = formatMatchScore(match);

  return (
    <article className={`m-match-card${compact ? ' compact' : ''}${live ? ' live' : ''}`}>
      <div className="m-match-top">
        <span className="m-match-league">{match.league.name}</span>
        {live ? <span className="m-live-pill">LIVE</span> : null}
      </div>

      <div className="m-match-teams">
        <div className="m-team">
          <TeamLogo
            src={match.homeTeam.logo}
            name={match.homeTeam.name}
            engName={String(match.homeEngName || '')}
            large={!compact}
          />
          <strong>{match.homeTeam.name}</strong>
        </div>

        <div className="m-match-center">
          {score && hasMatchScore(match) ? (
            <span className="m-score">{score}</span>
          ) : (
            <span className="m-vs">VS</span>
          )}
          <small>{match.time}</small>
        </div>

        <div className="m-team">
          <TeamLogo
            src={match.awayTeam.logo}
            name={match.awayTeam.name}
            engName={String(match.awayEngName || '')}
            large={!compact}
          />
          <strong>{match.awayTeam.name}</strong>
        </div>
      </div>

      <div className="m-match-actions">
        <button type="button" className="m-btn m-btn-primary" onClick={() => onWatch(match)}>
          {live ? 'တိုက်ရိုက်ကြည့်' : 'ကြည့်မည်'}
        </button>
        {onBet ? (
          <button type="button" className="m-btn m-btn-ghost" onClick={onBet}>
            လောင်းမည်
          </button>
        ) : null}
      </div>
    </article>
  );
}
