import { LiveStreamPlayer } from '../LiveStreamPlayer';
import { MatchScoreBadge } from '../MatchScoreBadge';
import type { Match } from '../types';

type MobileWatchScreenProps = {
  match: Match;
  onClose: () => void;
};

export function MobileWatchScreen({ match, onClose }: MobileWatchScreenProps) {
  return (
    <div className="m-watch-screen">
      <header className="m-watch-head">
        <button type="button" className="m-icon-btn" onClick={onClose} aria-label="ပိတ်မည်">
          ←
        </button>
        <div>
          <strong>
            {match.homeTeam.name} vs {match.awayTeam.name}
          </strong>
          <small>{match.league.name}</small>
        </div>
      </header>
      <div className="m-watch-player">
        <LiveStreamPlayer match={match} />
      </div>
      <div className="m-watch-meta">
        <MatchScoreBadge match={match} showHalfTime className="match-score-badge live" />
      </div>
    </div>
  );
}
