import { useMemo } from 'react';
import { hasStream } from '../api';
import { isLiveMatch } from '../matchUi';
import type { Match } from '../types';
import { MobileMatchCard } from './MobileMatchCard';

type MobileLiveScreenProps = {
  matches: Match[];
  loading: boolean;
  onWatch: (match: Match) => void;
};

export function MobileLiveScreen({ matches, loading, onWatch }: MobileLiveScreenProps) {
  const liveMatches = useMemo(
    () => matches.filter((m) => isLiveMatch(m) && hasStream(m)).sort((a, b) => String(a.time).localeCompare(String(b.time))),
    [matches],
  );

  return (
    <div className="m-screen m-live-screen">
      <p className="m-screen-lead">တိုက်ရိုက် ကြည့်ရှုနိုင်သော ပွဲများ</p>
      {loading ? <p className="m-hint">ဖတ်နေပါတယ်…</p> : null}
      <div className="m-section-list">
        {liveMatches.map((match) => (
          <MobileMatchCard key={match.id} match={match} onWatch={onWatch} compact />
        ))}
        {!loading && !liveMatches.length ? (
          <p className="m-hint">ယခု တိုက်ရိုက် ပွဲ မရှိသေးပါ</p>
        ) : null}
      </div>
    </div>
  );
}
