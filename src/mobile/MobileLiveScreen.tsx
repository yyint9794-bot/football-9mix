import { useMemo } from 'react';
import { canWatchMatch, isLiveMatch } from '../matchUi';
import type { Match } from '../types';
import { MobileMatchCard } from './MobileMatchCard';

type MobileLiveScreenProps = {
  matches: Match[];
  loading: boolean;
  onWatch: (match: Match) => void;
};

export function MobileLiveScreen({ matches, loading, onWatch }: MobileLiveScreenProps) {
  const liveMatches = useMemo(
    () =>
      matches
        .filter((match) => isLiveMatch(match) && canWatchMatch(match))
        .sort((a, b) => String(a.time).localeCompare(String(b.time))),
    [matches],
  );

  return (
    <div className="m-screen m-live-screen">
      <p className="m-screen-lead">တိုက်ရိုက်ကြည့်ရန် — ယခု ကြည့်နိုင်သော ပွဲ</p>
      {loading ? <p className="m-hint">ဖတ်နေပါတယ်…</p> : null}
      <div className="m-section-list">
        {liveMatches.map((match) => (
          <MobileMatchCard key={match.id} match={match} onWatch={onWatch} compact forceWatch />
        ))}
        {!loading && !liveMatches.length ? (
          <p className="m-hint">ယခု တိုက်ရိုက် ကြည့်နိုင်သော ပွဲ မရှိသေးပါ</p>
        ) : null}
      </div>
    </div>
  );
}
