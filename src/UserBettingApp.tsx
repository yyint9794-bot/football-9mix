import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getBettingMatches } from './api';
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
import { UserBetSidebar } from './UserBetSidebar';
import { MatchResultsPanel } from './MatchResultsPanel';
import { BettingChrome } from './BettingChrome';
import { MatchScoreBadge } from './MatchScoreBadge';
import { UserBetsPanel } from './UserBetsPanel';
import { UserChangePasswordSheet } from './UserChangePasswordSheet';
import {
  getStoredLocale,
  setStoredLocale,
  UserLanguageSheet,
  type AppLocale,
} from './UserLanguageSheet';
import { UserPaymentPanel } from './UserPaymentPanel';
import type { Match } from './types';
import { fetchMyBets, formatMmk, placeBet, settleMyBets } from './wallet/api';
import { buildMatchResults } from './wallet/betSync';
import { useAuth } from './wallet/AuthContext';
import type { WalletBetPick } from './wallet/types';

type Screen =
  | 'hub'
  | 'body-goal'
  | 'maung'
  | 'deposit'
  | 'withdraw'
  | 'open-bets'
  | 'results';

type UserBettingAppProps = {
  onClose: () => void;
  layout?: 'modal' | 'page';
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

export function UserBettingApp({ onClose, layout = 'modal' }: UserBettingAppProps) {
  const shellClass = layout === 'page' ? 'betting-app-page' : 'betting-app-overlay';
  const closeLabel = layout === 'page' ? 'ပင်မသို့' : 'ပိတ်မည်';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [locale, setLocale] = useState<AppLocale>(() => getStoredLocale());
  const [openBetsEstimate, setOpenBetsEstimate] = useState(0);
  const [placingBet, setPlacingBet] = useState(false);

  const loadOpenStake = useCallback(async () => {
    try {
      const result = await fetchMyBets('open');
      setOpenBetsEstimate(result.openStake);
    } catch {
      setOpenBetsEstimate(0);
    }
  }, []);

  useEffect(() => {
    setShowTerms(!user?.termsAccepted);
  }, [user?.termsAccepted]);

  useEffect(() => {
    let disposed = false;
    const loadTimeout = window.setTimeout(() => {
      if (!disposed) {
        setLoading(false);
      }
    }, 14_000);

    getBettingMatches(undefined, (partial) => {
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
        window.clearTimeout(loadTimeout);
      });

    return () => {
      disposed = true;
      window.clearTimeout(loadTimeout);
    };
  }, []);

  useEffect(() => {
    void loadOpenStake();
  }, [loadOpenStake, user?.id]);

  useEffect(() => {
    if (!user || !matches.length) {
      return;
    }

    void settleMyBets(buildMatchResults(matches))
      .then((result) => {
        if (result.credited > 0) {
          void refresh();
        }
        return loadOpenStake();
      })
      .catch(() => undefined);
  }, [matches, user, refresh, loadOpenStake]);

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

  const toApiPicks = (picks: BetPick[]): WalletBetPick[] =>
    picks.map((pick) => {
      const row = bettingRows.find((entry) => String(entry.match.id) === pick.matchId);
      const goalLine = row?.goal?.goalLine
        ? Number(String(row.goal.goalLine).replace(/[^\d.]/g, ''))
        : undefined;
      return {
        matchId: pick.matchId,
        league: pick.league,
        homeName: pick.homeName,
        awayName: pick.awayName,
        side: pick.side,
        oddsLabel: pick.oddsLabel,
        summary: pick.summary,
        goalLine: Number.isFinite(goalLine) ? goalLine : undefined,
      };
    });

  const handlePlaceBet = async () => {
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
    } else if (screen === 'body-goal') {
      if (bodyPicks.length !== 1) {
        setBetStatus('ဘော်ဒီအတွက် အသင်းတစ်သင်းသာ ရွေးပါ');
        return;
      }
    } else {
      return;
    }

    const picks = screen === 'maung' ? maungPicks : bodyPicks;
    setPlacingBet(true);
    setBetStatus('');
    try {
      await placeBet({
        type: screen === 'maung' ? 'maung' : 'body',
        stake: amount,
        picks: toApiPicks(picks),
      });
      await refresh();
      await loadOpenStake();
      setMaungPicks([]);
      setBodyPicks([]);
      setStake('');
      setBetStatus(
        screen === 'maung'
          ? `မောင်း ${picks.length} ပွဲ — ${formatMmk(amount)} လောင်းပြီးပါပြီ`
          : `${picks[0].summary} — ${formatMmk(amount)} လောင်းပြီးပါပြီ`,
      );
    } catch (error) {
      setBetStatus(error instanceof Error ? error.message : 'လောင်းမှု မအောင်မြင်ပါ');
    } finally {
      setPlacingBet(false);
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
            <button
              type="button"
              className="bet-footer-submit"
              disabled={placingBet}
              onClick={() => void handlePlaceBet()}
            >
              {placingBet ? '…' : 'လောင်းမည်'}
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
            <button
              type="button"
              className="bet-footer-submit"
              disabled={placingBet}
              onClick={() => void handlePlaceBet()}
            >
              {placingBet ? '…' : 'လောင်းမည်'}
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
        <p className="bet-kickoff">
          ပွဲချိန် : {row.kickoffLabel}
          <MatchScoreBadge match={row.match} className="match-score-badge bet" />
        </p>

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
          {closeLabel}
        </button>
      </div>
    </header>
  );

  const renderSubPage = (title: string, content: ReactNode) => (
    <div className={shellClass}>
      <div className="betting-app-shell hub-sub payment-flow">
        <BettingChrome>
          <header className="betting-topbar dark">
            <button type="button" className="live-back-btn" onClick={() => setScreen('hub')}>
              ←
            </button>
            <strong>{title}</strong>
            <button type="button" className="live-close-btn" onClick={onClose}>
              {closeLabel}
            </button>
          </header>
          {content}
        </BettingChrome>
      </div>
    </div>
  );

  if (screen === 'deposit') {
    return renderSubPage('ငွေသွင်း', <UserPaymentPanel mode="deposit" />);
  }

  if (screen === 'withdraw') {
    return renderSubPage('ငွေထုတ်', <UserPaymentPanel mode="withdraw" />);
  }

  if (screen === 'open-bets') {
    return renderSubPage('လောင်းထားသောပွဲများ', <UserBetsPanel mode="open" />);
  }

  if (screen === 'results') {
    return renderSubPage(
      'ပွဲပြီးရလဒ်',
      <div className="bet-results-page">
        <MatchResultsPanel matches={matches} loading={loading} />
        <section className="bet-settled-section">
          <h3>လောင်းရလဒ်</h3>
          <UserBetsPanel mode="settled" />
        </section>
      </div>,
    );
  }

  if (screen === 'body-goal' || screen === 'maung') {
    const filterActive = Boolean(leagueFilter && leagueFilter.size < availableLeagues.length);
    return (
      <div className={shellClass}>
        <BettingChrome>
          <div className="betting-app-shell dark bet-odds-screen">
          {renderBettingTopbar(screen === 'maung' ? 'မောင်း' : 'ဘော်ဒီ/ဂိုးပေါင်း')}

          {filterActive ? (
            <p className="bet-filter-hint">
              လိဂ် {leagueFilter?.size} ခု ရွေးထား — ပွဲ {filteredRows.length}
            </p>
          ) : null}

          <div className="bet-odds-body">
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
          </div>

          {showLeagueFilter && availableLeagues.length ? (
            <LeagueFilterSheet
              leagues={availableLeagues}
              selected={leagueFilter}
              onChange={setLeagueFilter}
              onClose={() => setShowLeagueFilter(false)}
            />
          ) : null}
          </div>
        </BettingChrome>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <BettingChrome>
      <div className="betting-app-shell hub">
        <UserBetSidebar
          open={sidebarOpen}
          user={user}
          onClose={() => setSidebarOpen(false)}
          onChangePassword={() => {
            setSidebarOpen(false);
            setShowPasswordSheet(true);
          }}
          onChooseLanguage={() => {
            setSidebarOpen(false);
            setShowLanguageSheet(true);
          }}
          onLogout={() => void logout()}
        />

        {showPasswordSheet ? (
          <UserChangePasswordSheet onClose={() => setShowPasswordSheet(false)} />
        ) : null}
        {showLanguageSheet ? (
          <UserLanguageSheet
            locale={locale}
            onChange={(next) => {
              setStoredLocale(next);
              setLocale(next);
            }}
            onClose={() => setShowLanguageSheet(false)}
          />
        ) : null}

        <header className="betting-hub-head">
          <button
            type="button"
            className="menu-button hub-menu"
            aria-label="Menu"
            onClick={() => setSidebarOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="betting-hub-brand">
            <strong className="betting-hub-logo">
              <span className="betting-hub-logo-accent">9</span>Mix
            </strong>
            <small className="betting-hub-contact">Viber / Telegram — 09674646102</small>
            <small className="betting-hub-user">{user.displayName}</small>
          </div>
          <button type="button" className="live-close-btn" onClick={onClose}>
            {closeLabel}
          </button>
        </header>

        <div className="betting-hub-main">
          <div className="betting-balance-card">
            <div className="betting-balance-top">
              <div className="betting-balance-cell">
                <span>လက်ကျန်ငွေ</span>
                <strong>{formatMmk(user.balance)}</strong>
              </div>
              <div className="betting-balance-cell">
                <span>ကြေးပွဲစဉ်များ</span>
                <strong>{bettingRows.length}</strong>
              </div>
            </div>
            <div className="betting-balance-bottom">
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
            <button type="button" onClick={() => setScreen('open-bets')}>
              <span>📋</span>
              <b>လောင်းထားသောပွဲများ</b>
            </button>
            <button type="button" onClick={() => setScreen('results')}>
              <span>🏁</span>
              <b>ပွဲပြီးရလဒ်</b>
            </button>
            <button type="button" onClick={() => setScreen('deposit')}>
              <span>💵</span>
              <b>ငွေသွင်း</b>
            </button>
            <button type="button" onClick={() => setScreen('withdraw')}>
              <span>💸</span>
              <b>ငွေထုတ်</b>
            </button>
            <button
              type="button"
              className="betting-menu-wide"
              onClick={() => {
                void refresh();
                void loadOpenStake();
                void settleMyBets(buildMatchResults(matches)).then((result) => {
                  if (result.credited > 0) {
                    void refresh();
                  }
                  void loadOpenStake();
                });
              }}
            >
              <span>🔄</span>
              <b>ဒေတာပြန်လည်ရယူ</b>
            </button>
          </div>

          <div className="betting-hub-deco" aria-hidden />
        </div>

      </div>
      </BettingChrome>
    </div>
  );
}
