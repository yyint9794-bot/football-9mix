import { formatHalfTimeScore, formatMatchScore, isMatchFinished } from './matchScore';
import type { Match } from './types';

export function MatchScoreBadge({
  match,
  showHalfTime = false,
  className = 'match-score-badge',
}: {
  match: Match;
  showHalfTime?: boolean;
  className?: string;
}) {
  const score = formatMatchScore(match);
  if (!score) {
    return null;
  }

  const halfTime = showHalfTime ? formatHalfTimeScore(match) : null;
  const finished = isMatchFinished(match);

  return (
    <span className={className} data-finished={finished ? 'true' : 'false'}>
      <strong>{score}</strong>
      {halfTime ? <small>{halfTime}</small> : null}
    </span>
  );
}
