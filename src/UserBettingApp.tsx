import { useEffect, useMemo, useState } from 'react';
import { getFootballMatches } from './api';
import {
  buildBettingRows,
  formatBodyAwayPickLabel,
  formatBodyHomePickLabel,
  formatBodyPillLabel,
  formatGoalCenterLabel,
  formatGoalPickLabel,
  getBodyGivingSide,
  groupBettingRowsByLeague,
} from './betting/odds';
import { getEnglishTeamName } from './betting/teamNames';
import type { BetPick, BetSide, BettingMatchRow } from './betting/types';
import { LeagueFilterSheet } from './LeagueFilterSheet';
import { TermsAgreementModal } from './TermsAgreementModal';
import { UserWalletPanel } from './UserWalletPanel';
import type { Match } from './types';
import { formatMmk } from './wallet/api';
import { useAuth } from './wallet/AuthContext';

type Screen = 'hub' | 'body-goal' | 'maung' | 'wallet';

type UserBettingAppProps = {
  onClose: () => void;
};

function buildPick(
  row: BettingMatchRow,
  side: BetSide,
  oddsLabel: string,
  summary: string,
  homeName: string,
  awayName: string,
): BetPick {
  return {
    matchId: String(row.match.id),
    league: row.league,
    homeName,
    awayName,
    side,
    oddsLabel,
    summary,
  };
}

export function UserBettingApp({ onClose }: UserBettingAppProps) {
  const { user, logout, refresh } = useAuth();
  const [screen, setScreen] = useState<Screen>('hub');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stake, setStake] = useState('');
  const [betStatus, setBetStatus] = useState('');
  const [maungPicks, setMaungPicks] = useState<BetPick[]>([]);
  const [bodyPicks, setBodyPicks] = useState<BetPick[]>([]);
  const [showTerms, setShowTerms] = useState(!user?.termsAccepted);
  const [showLeagueFilter, setShowLeagueFilter] = useState(false);
  const [leagueFilter, setLeagueFilter] = useState<Set<string> | null>(null);

  useEffect(() => {
    setShowTerms(!user?.termsAccepted);
  }, [user?.termsAccepted]);

  useEffect(() => {
    let disposed = false;
    getFootballMatches(undefined, (partial) => {
      if (!disposed && partial.length) {
        setMatches(partial);
        setLoading(false);
      }
    })
      .then((next) => {
        if (!disposed) {
          setMatches(next);
        }
      })
      .catch(() => {
        if (!disposed) {
          setError('ကြေးဒေတာ မရသေးပါ — ခဏနေပြီး ထပ်စမ်းပါ');
        }
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  const bettingRows = useMemo(() => buildBettingRows(matches), [matches]);
  const availableLeagues = useMemo(
    () => [...new Set(bettingRows.map((row) => row.league))].sort((a, b) => a.localeCompare(b)),
    [bettingRows],
  );
  const filteredRows = useMemo(() => {
    if (!leagueFilter || leagueFilter.size === availableLeagues.length) {
      return bettingRows;
    }
    return bettingRows.filter((row) => leagueFilter.has(row.league));
  }, [bettingRows, leagueFilter, availableLeagues.length]);
  const leagueGroups = useMemo(() => groupBettingRowsByLeague(filteredRows), [filteredRows]);

  const openBetsEstimate = 0;

  if (!user) {
    return null;
  }

  if (showTerms) {
    return (
      <TermsAgreementModal
        onAgreed={() => setShowTerms(false)}
        onDisagree={() => {
          void logout();
          onClose();
        }}
      />
    );
  }

  const toggleMaungPick = (
    row: BettingMatchRow,
    side: BetSide,
    oddsLabel: string,
    summary: string,
    homeName: string,
    awayName: string,
  ) => {
    if (row.closed) {
      return;
    }
    const pick = buildPick(row, side, oddsLabel, summary, homeName, awayName);
    setMaungPicks((current) => {
      const existing = current.find((item) => item.matchId === pick.matchId);
      if (existing?.side === side) {
        return current.filter((item) => item.matchId !== pick.matchId);
      }
      return [...current.filter((item) => item.matchId !== pick.matchId), pick];
    });
    setBetStatus('');
  };

  /** ဘော်ဒီ — ပွဲများစွာထဲက အသင်းတစ်သင်းသာ ရွေးနိုင် */
  const toggleBodyPick = (
    row: BettingMatchRow,
    side: 'body-home' | 'body-away',
    oddsLabel: string,
    summary: string,
    homeName: string,
    awayName: string,
  ) => {
    if (row.closed) {
      return;
    }
    const pick = buildPick(row, side, oddsLabel, summary, homeName, awayName);
    setBodyPicks((current) => {
      const existing = current[0];
      if (existing?.matchId === pick.matchId && existing.side === side) {
        return [];
      }
      return [pick];
    });
    setBetStatus('');
  };

  const isSelected = (picks: BetPick[], matchId: string, side: BetSide) =>
    picks.some((pick) => pick.matchId === matchId && pick.side === side);

  const handlePlaceBet = () => {
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) {
      setBetStatus('လောင်းငွေ ထည့်ပါ');
      return;
    }
    if (amount > user.balance) {
      setBetStatus('လက်ကျန်ငွေ မလုံလောက်ပါ');
      return;
    }
    if (screen === 'maung') {
      if (maungPicks.length < 2 || maungPicks.length > 11) {
        setBetStatus('မောင်းအတွက် ပွဲ ၂ မှ ၁၁ ပွဲ ရွေးပါ');
        return;
      }
      const slip = maungPicks.map((pick) => pick.summary).join(' / ');
      setBetStatus(`မောင်း ${maungPicks.length} — ${slip} — ${formatMmk(amount)}`);
      return;
    }
    if (screen === 'body-goal') {
      if (bodyPicks.length !== 1) {
        setBetStatus('ဘော်ဒီအတွက် အသင်းတစ်သင်းသာ ရွေးပါ');
        return;
      }
      setBetStatus(`${bodyPicks[0].summary} — ${formatMmk(amount)}`);
    }
  };

  const renderBetFooter = (mode: 'body' | 'maung') => {
    const pickCount = mode === 'maung' ? maungPicks.length : bodyPicks.length;
    return (
      <footer className={`bet-footer${mode === 'maung' ? ' maung-footer' : ''}`}>
        {mode === 'maung' ? (
          <>
            <span className="bet-footer-label">မောင်း {pickCount}</span>
            <span className="bet-footer-divider" aria-hidden />
            <label className="bet-footer-stake">
              <span>လောင်းငွေ</span>
              <input
                type="number"
                min="1000"
                max="500000"
                placeholder="ပမာဏ"
                value={stake}
                onChange={(event) => setStake(event.target.value)}
              />
            </label>
            <button type="button" className="bet-footer-submit" onClick={handlePlaceBet}>
              လောင်းမည်
            </button>
          </>
        ) : (
          <>
            <span className="bet-footer-label bet-footer-team">
              {bodyPicks[0] ? bodyPicks[0].summary : 'လောင်းငွေ'}
            </span>
            <input
              type="number"
              min="1000"
              max="500000"
              placeholder="ပမာဏ"
              value={stake}
              onChange={(event) => setStake(event.target.value)}
            />
            <button type="button" className="bet-footer-submit" onClick={handlePlaceBet}>
              လောင်းမည်
            </button>
          </>
        )}
      </footer>
    );
  };

  const renderMatchCard = (row: BettingMatchRow, mode: 'body-goal' | 'maung') => {
    const picks = mode === 'maung' ? maungPicks : bodyPicks;
    const cardClass = `bet-match-card${row.closed ? ' closed' : ''}`;

    const homeName = getEnglishTeamName(row.match, 'home');
    const awayName = getEnglishTeamName(row.match, 'away');
    const bodyGivingSide = row.body ? getBodyGivingSide(row.body, row.match) : 'home';
    const bodyPill = row.body ? formatBodyPillLabel(row.body, row.match) : '—';
    const overOdds = row.goal ? formatGoalCenterLabel(row.goal, 'over') : '—';
    const underOdds = row.goal ? formatGoalCenterLabel(row.goal, 'under') : '—';

    const homeSummary = row.body
      ? formatBodyHomePickLabel(row.body, homeName, row.match)
      : homeName;
    const awaySummary = row.body
      ? formatBodyAwayPickLabel(row.body, awayName, row.match)
      : awayName;
    const homeOddsLabel = row.body ? homeSummary.replace(`${homeName} `, '') : bodyPill;
    const awayOddsLabel = row.body ? awaySummary.replace(`${awayName} `, '') : bodyPill;

    const onMaungSide = (side: BetSide, oddsLabel: string, summary: string) => {
      toggleMaungPick(row, side, oddsLabel, summary, homeName, awayName);
    };

    const onBodyTeam = (side: 'body-home' | 'body-away', oddsLabel: string, summary: string) => {
      toggleBodyPick(row, side, oddsLabel, summary, homeName, awayName);
    };

    return (
      <article className={cardClass} key={row.match.id}>
        <p className="bet-kickoff">ပွဲချိန် : {row.kickoffLabel}</p>

        {row.body ? (
          <div className={`bet-grid-row body favor-${bodyGivingSide}`}>
            <button
              type="button"
              className={`bet-team-btn home${isSelected(picks, String(row.match.id), 'body-home') ? ' selected' : ''}`}
              disabled={row.closed}
              onClick={() =>
                mode === 'maung'
                  ? onMaungSide('body-home', homeOddsLabel, homeSummary)
                  : onBodyTeam('body-home', homeOddsLabel, homeSummary)
              }
            >
              {homeName}
            </button>
            <button
              type="button"
              className={`bet-team-btn away${isSelected(picks, String(row.match.id), 'body-away') ? ' selected' : ''}`}
              disabled={row.closed}
              onClick={() =>
                mode === 'maung'
                  ? onMaungSide('body-away', awayOddsLabel, awaySummary)
                  : onBodyTeam('body-away', awayOddsLabel, awaySummary)
              }
            >
              {awayName}
            </button>
            <span className="bet-odds-side" aria-hidden>
              {bodyPill}
            </span>
          </div>
        ) : null}

        {row.goal && mode === 'maung' ? (
          <div className="bet-grid-row goal">
            <button
              type="button"
              className={`bet-label-btn over${isSelected(picks, String(row.match.id), 'goal-over') ? ' selected' : ''}`}
              disabled={row.closed}
              onClick={() =>
                row.goal &&
                onMaungSide('goal-over', overOdds, formatGoalPickLabel(row.goal, 'over'))
              }
            >
              Over
            </button>
            <button
              type="button"
              className={`bet-label-btn under${isSelected(picks, String(row.match.id), 'goal-under') ? ' selected' : ''}`}
              disabled={row.closed}
              onClick={() =>
                row.goal &&
                onMaungSide('goal-under', underOdds, formatGoalPickLabel(row.goal, 'under'))
              }
            >
              Under
            </button>
            <span className="bet-odds-center" aria-hidden>
              {overOdds}
            </span>
          </div>
        ) : null}

        {row.closed ? <p className="bet-closed-note">ကြေးပိတ်</p> : null}
      </article>
    );
  };

  const renderBettingTopbar = (title: string) => (
    <header className="betting-topbar dark">
      <button
        type="button"
        className="live-back-btn"
        onClick={() => {
          setBetStatus('');
          setShowLeagueFilter(false);
          setScreen('hub');
        }}
      >
        ←
      </button>
      <strong>{title}</strong>
      <div className="betting-topbar-actions">
        <button
          type="button"
          className="bet-league-filter-btn"
          aria-label="လိဂ်ရွေးချယ်ရန်"
          onClick={() => setShowLeagueFilter(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <button type="button" className="live-close-btn" onClick={onClose}>
          ပိတ်မည်
        </button>
      </div>
    </header>
  );

  if (screen === 'wallet') {
    return (
      <div className="betting-app-overlay">
        <div className="betting-app-shell">
          <header className="betting-topbar">
            <button type="button" className="live-back-btn" onClick={() => setScreen('hub')}>
              ← နောက်သို့
            </button>
            <strong>ငွေစာရင်း</strong>
            <button type="button" className="live-close-btn" onClick={onClose}>
              ပိတ်မည်
            </button>
          </header>
          <UserWalletPanel />
        </div>
      </div>
    );
  }

  if (screen === 'body-goal' || screen === 'maung') {
    const filterActive = Boolean(leagueFilter && leagueFilter.size < availableLeagues.length);
    return (
      <div className="betting-app-overlay">
        <div className="betting-app-shell dark bet-odds-screen">
          {renderBettingTopbar(screen === 'maung' ? 'မောင်း' : 'ဘော်ဒီ/ဂိုးပေါင်း')}

          {filterActive ? (
            <p className="bet-filter-hint">
              လိဂ် {leagueFilter?.size} ခု ရွေးထား — ပွဲ {filteredRows.length}
            </p>
          ) : null}

          <div className="bet-list">
            {loading ? <p className="bet-loading">API ကြေးဒေတာ ဖတ်နေပါတယ်…</p> : null}
            {error ? <p className="bet-error">{error}</p> : null}
            {!loading && !filteredRows.length ? (
              <p className="bet-error">
                {filterActive ? 'ရွေးထားသော လိဂ်တွင် ကြေးမရှိပါ' : 'ယခု ကြေးမထုတ်ရသေးပါ'}
              </p>
            ) : null}
            {leagueGroups.map((group) => (
              <section className="bet-league-section" key={group.league}>
                <div className="bet-league-bar">
                  <span className="bet-league-star" aria-hidden>
                    ★
                  </span>
                  {group.league}
                </div>
                {group.rows.map((row) => renderMatchCard(row, screen))}
              </section>
            ))}
          </div>

          {betStatus ? <p className="bet-status-toast">{betStatus}</p> : null}
          {renderBetFooter(screen === 'maung' ? 'maung' : 'body')}

          {showLeagueFilter && availableLeagues.length ? (
            <LeagueFilterSheet
              leagues={availableLeagues}
              selected={leagueFilter}
              onChange={setLeagueFilter}
              onClose={() => setShowLeagueFilter(false)}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="betting-app-overlay">
      <div className="betting-app-shell hub">
        <header className="betting-hub-head">
          <button type="button" className="menu-button" aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
          <div className="betting-hub-brand">
            <strong>9Mix</strong>
            <small>{user.displayName}</small>
          </div>
          <button type="button" className="live-close-btn" onClick={onClose}>
            ပိတ်မည်
          </button>
        </header>

        <div className="betting-balance-card">
          <div>
            <span>လက်ကျန်ငွေ</span>
            <strong>{formatMmk(user.balance)}</strong>
          </div>
          <div>
            <span>လောင်းထားသောငွေ</span>
            <strong>{formatMmk(openBetsEstimate)}</strong>
          </div>
        </div>

        <div className="betting-menu-grid">
          <button
            type="button"
            onClick={() => {
              setBetStatus('');
              setLeagueFilter(null);
              setScreen('maung');
            }}
          >
            <span>⚽</span>
            <b>မောင်း</b>
          </button>
          <button
            type="button"
            onClick={() => {
              setBetStatus('');
              setLeagueFilter(null);
              setScreen('body-goal');
            }}
          >
            <span>🎯</span>
            <b>ဘော်ဒီ/ဂိုးပေါင်း</b>
          </button>
          <button type="button" onClick={() => setScreen('wallet')}>
            <span>💰</span>
            <b>ငွေစာရင်း</b>
          </button>
          <button type="button" onClick={() => void refresh()}>
            <span>🔄</span>
            <b>ဒေတာပြန်လည်ရယူ</b>
          </button>
        </div>

        <p className="betting-hint">
          ကြေးဒေတာ — Htay API + မြန်မာကြေး endpoint များမှ အလိုအလျောက် ရယူပါသည် ({bettingRows.length}{' '}
          ပွဲ)
        </p>
      </div>
    </div>
  );
}
