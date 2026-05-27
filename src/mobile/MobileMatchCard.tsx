import { canWatchMatch } from '../api';
import { formatMatchScore, hasMatchScore } from '../matchScore';
import { TeamLogo } from '../TeamLogo';
import { isLiveMatch } from '../matchUi';
import type { Match } from '../types';

type MobileMatchCardProps = {
  match: Match;
  onWatch: (match: Match) => void;
  onBet?: () => void;
  compact?: boolean;
  kickoffLabel?: string;
  showWatch?: boolean;
  forceWatch?: boolean;
};

export function MobileMatchCard({
  match,
  onWatch,
  onBet,
  compact = false,
  kickoffLabel,
  showWatch = true,
  forceWatch = false,
}: MobileMatchCardProps) {
  const live = isLiveMatch(match);
  const score = formatMatchScore(match);
  const watchable = canWatchMatch(match);
  const timeLabel = kickoffLabel || match.time;

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
          <small>{timeLabel}</small>
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

      {showWatch || forceWatch ? (
        <div className="m-match-actions">
          <button
            type="button"
            className="m-btn m-btn-primary"
            disabled={!watchable}
            onClick={() => watchable && onWatch(match)}
          >
            {watchable ? (live || forceWatch ? 'တိုက်ရိုက်ကြည့်' : 'ကြည့်မည်') : 'ကြည့်ရှုလို့ မရသေးပါ'}
          </button>
          {onBet ? (
            <button type="button" className="m-btn m-btn-ghost" onClick={onBet}>
              လောင်းမည်
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
