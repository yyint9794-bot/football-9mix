import { useEffect, useMemo, useState } from 'react';
import {
  buildLeagueLogoIndex,
  getFootballMatches,
  getStreamVariants,
  groupMatchesByLeague,
  hasStream,
  isOddsClosed,
  resolveLeagueLogoForGroup,
} from './api';
import { AccountLoginModal } from './AccountLoginModal';
import { AdminPanel } from './AdminPanel';
import { useAuth } from './wallet/AuthContext';
import { LiveStreamPlayer } from './LiveStreamPlayer';
import {
  extractMyanmarOdds,
  formatBodyPillLabel,
  formatBodySideLabel,
  formatGoalSideLabel,
} from './betting/odds';
import { parseKickoffTime } from './liveMatch';
import { preloadMatchLogos } from './teamLogoIndex';
import { LeagueLogo, TeamLogo } from './TeamLogo';
import type { Match } from './types';

const filters = ['အားလုံး', 'တိုက်ရိုက်', 'လာမည့်ပွဲ', 'ကြည့်ရှုရနိုင်'] as const;
type Filter = (typeof filters)[number];
import type { OddsSection } from './betting/types';

const ALL_LEAGUES = 'လိဂ်အားလုံး';
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? '';
const AD_SLOTS = {
  top: import.meta.env.VITE_ADSENSE_SLOT_TOP ?? '',
  inline: import.meta.env.VITE_ADSENSE_SLOT_INLINE ?? '',
  bottom: import.meta.env.VITE_ADSENSE_SLOT_BOTTOM ?? '',
};
const VIDEO_AD_URL = import.meta.env.VITE_VIDEO_AD_URL ?? '';
const TELEGRAM_URL = import.meta.env.VITE_TELEGRAM_URL ?? 'https://t.me/livefootball902';
const priorityLeagues = [
  ['world cup', 'fifa world cup', 'fifa wc', 'wc'],
  ['champions league', 'uefa champions league', 'uefa cl', 'ucl'],
  ['premier league', 'english premier league', 'eng pr', 'epl'],
];

function getLeaguePriority(name: string) {
  const normalizedName = name.toLowerCase();
  const index = priorityLeagues.findIndex((aliases) =>
    aliases.some((alias) => normalizedName.includes(alias)),
  );

  return index === -1 ? priorityLeagues.length : index;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function parseMatchTime(time: string) {
  return parseKickoffTime(time);
}

function getMatchKickoffDate(match: Match) {
  const iso = String(match.startTime || match.start_time || '').trim();
  if (iso) {
    const parsedIso = new Date(iso);
    if (!Number.isNaN(parsedIso.getTime())) {
      return parsedIso;
    }
  }

  return parseMatchTime(match.time);
}

function getMatchDateKey(match: Match) {
  const parsed = getMatchKickoffDate(match);
  if (!parsed) {
    return 'undated';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isCurrentOrFutureMatch(match: Match) {
  const dateKey = getMatchDateKey(match);
  if (dateKey === 'undated') {
    return !isCompletedMatch(match);
  }

  if (dateKey >= getTodayDateKey()) {
    return true;
  }

  return isLiveMatch(match);
}

function formatMatchDateLabel(dateKey: string) {
  if (dateKey === 'undated') {
    return 'ရက်စွဲမသိ';
  }

  const parsed = new Date(`${dateKey}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (dayDiff === 0) {
    return 'ယနေ့';
  }

  if (dayDiff === 1) {
    return 'မနက်ဖြန်';
  }

  return parsed.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function groupMatchesByDate(matches: Match[]) {
  const groups = matches.reduce<Record<string, Match[]>>((acc, match) => {
    const key = getMatchDateKey(match);
    acc[key] = acc[key] ?? [];
    acc[key].push(match);
    return acc;
  }, {});

  return Object.entries(groups).sort(([dateA], [dateB]) => {
    if (dateA === 'undated') {
      return 1;
    }

    if (dateB === 'undated') {
      return -1;
    }

    return dateA.localeCompare(dateB);
  });
}

function isStreamLive(match: Match) {
  if (!hasStream(match) || isCompletedMatch(match)) {
    return false;
  }

  const status = String(match.status).toLowerCase();
  return status.includes('live') || status.includes('in play') || status.includes('playing');
}

function isCompletedMatch(match: Match) {
  const status = String(match.status).toLowerCase();
  return (
    status.includes('finished') ||
    status.includes('completed') ||
    status.includes('ft') ||
    status.includes('ended') ||
    match.is_finished === true ||
    match.completed === true
  );
}

function isWithinLiveWindow(match: Match) {
  const start = parseMatchTime(match.time);
  if (!start) {
    return false;
  }

  const now = Date.now();
  const kickoff = start.getTime();
  const fullTime = kickoff + 2.5 * 60 * 60 * 1000;

  return now >= kickoff - 15 * 60 * 1000 && now <= fullTime;
}

function isLiveMatch(match: Match) {
  if (isStreamLive(match)) {
    return true;
  }

  if (isCompletedMatch(match) || !isWithinLiveWindow(match)) {
    return false;
  }

  const status = String(match.status).toLowerCase();
  return (
    hasStream(match) &&
    (status === 'active' || status.includes('1h') || status.includes('2h') || status.includes('live'))
  );
}

function compareFeaturedMatches(a: Match, b: Match) {
  const liveDiff = Number(isLiveMatch(b)) - Number(isLiveMatch(a));
  const streamDiff = Number(hasStream(b)) - Number(hasStream(a));
  const oddsDiff = Number(extractMyanmarOdds(b).length > 0) - Number(extractMyanmarOdds(a).length > 0);

  return liveDiff || streamDiff || oddsDiff || String(a.time).localeCompare(String(b.time));
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function App() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('အားလုံး');
  const [activeLeague, setActiveLeague] = useState(ALL_LEAGUES);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOddsOnly, setShowOddsOnly] = useState(false);
  const [showVideoAd, setShowVideoAd] = useState(false);
  const [playingMatch, setPlayingMatch] = useState<Match | null>(null);
  const [playSession, setPlaySession] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    let disposed = false;

    const loadMatches = (signal?: AbortSignal) => {
      getFootballMatches(signal, (partialMatches) => {
        if (disposed) {
          return;
        }

        setMatches(partialMatches);
        if (partialMatches.length) {
          setLoading(false);
        }
      })
        .then((nextMatches) => {
          if (!disposed) {
            setMatches(nextMatches);
          }
        })
        .catch((err: Error) => {
          if (!disposed && err.name !== 'AbortError') {
            setError('Football data ကို ယခုမယူနိုင်သေးပါ။ ခဏနေပြန်စမ်းပါ။');
          }
        })
        .finally(() => {
          if (!disposed) {
            setLoading(false);
          }
        });
    };

    const controller = new AbortController();
    loadMatches(controller.signal);

    const refreshTimer = window.setInterval(() => {
      loadMatches();
    }, 45000);

    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const hasSeenVideoAd = sessionStorage.getItem('football-video-ad-seen') === 'true';

    if (loading || hasSeenVideoAd) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowVideoAd(true);
      sessionStorage.setItem('football-video-ad-seen', 'true');
    }, 6500);

    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (matches.length) {
      preloadMatchLogos(matches);
    }
  }, [matches]);

  const leagueLogoIndex = useMemo(() => buildLeagueLogoIndex(matches), [matches]);

  const leagueSummaries = useMemo(() => {
    const grouped = groupMatchesByLeague(matches);
    return Object.entries(grouped)
      .map(([name, leagueMatches]) => ({
        name,
        count: leagueMatches.length,
        logo: resolveLeagueLogoForGroup(name, leagueMatches, leagueLogoIndex),
      }))
      .sort(
        (a, b) =>
          getLeaguePriority(a.name) - getLeaguePriority(b.name) ||
          b.count - a.count ||
          a.name.localeCompare(b.name),
      );
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return matches.filter((match) => {
      const searchTarget = [
        match.league.name,
        match.homeTeam.name,
        match.awayTeam.name,
        String(match.status),
        match.time,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = normalizedQuery ? searchTarget.includes(normalizedQuery) : true;
      const matchesFilter =
        showOddsOnly ||
        activeFilter === 'အားလုံး' ||
        (activeFilter === 'တိုက်ရိုက်' && isLiveMatch(match)) ||
        (activeFilter === 'လာမည့်ပွဲ' && String(match.status).toLowerCase().includes('coming')) ||
        (activeFilter === 'ကြည့်ရှုရနိုင်' && hasStream(match));
      const matchesLeague = showOddsOnly || activeLeague === ALL_LEAGUES || match.league.name === activeLeague;
      const matchesOdds = !showOddsOnly || extractMyanmarOdds(match).length > 0;
      const matchesDate = isCurrentOrFutureMatch(match);

      return matchesQuery && matchesFilter && matchesLeague && matchesOdds && matchesDate;
    });
  }, [activeFilter, activeLeague, matches, query, showOddsOnly]);

  const visibleMatches = useMemo(() => [...filteredMatches].sort(compareFeaturedMatches), [filteredMatches]);
  const featuredMatch = visibleMatches.find((match) => isLiveMatch(match) && hasStream(match)) ?? visibleMatches[0];
  const sortedDateEntries = groupMatchesByDate(visibleMatches)
    .filter(([dateKey]) => dateKey === 'undated' || dateKey >= getTodayDateKey())
    .map(([dateKey, dateMatches]) => {
    const leagueEntries = Object.entries(groupMatchesByLeague(dateMatches)).sort(
      ([leagueA, matchesA], [leagueB, matchesB]) =>
        Number(matchesB.some(isLiveMatch)) - Number(matchesA.some(isLiveMatch)) ||
        getLeaguePriority(leagueA) - getLeaguePriority(leagueB) ||
        matchesB.length - matchesA.length ||
        leagueA.localeCompare(leagueB),
    );

    return { dateKey, dateMatches, leagueEntries };
  });
  const liveCount = matches.filter(isLiveMatch).length;
  const streamCount = matches.filter(hasStream).length;
  const oddsCount = matches.filter((match) => extractMyanmarOdds(match).length > 0).length;

  function openMyanmarOdds() {
    setShowOddsOnly(true);
    setActiveFilter('အားလုံး');
    setActiveLeague(ALL_LEAGUES);
    setQuery('');
    setMenuOpen(false);
    window.setTimeout(() => document.getElementById('matches')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  return (
    <main className="app-shell">
      <section className="hero" id="home">
        <nav className="topbar">
          <div className="brand">
            <div className="menu-wrap">
              <button
                className={menuOpen ? 'menu-button active' : 'menu-button'}
                type="button"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((isOpen) => !isOpen)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
            <span className="brand-mark">
              <img src="/logo.png" alt="Football Myanmar logo" />
            </span>
            <div>
              <strong>Football Myanmar</strong>
              <small>ပွဲစဉ်များနှင့် Live Stream</small>
            </div>
          </div>
          <div className="top-actions">
            {user?.role === 'admin' ? (
              <button type="button" className="ghost-button" onClick={() => setShowAdminPanel(true)}>
                Admin
              </button>
            ) : null}
            {user ? (
              <button type="button" className="ghost-button" onClick={() => setShowAccountModal(true)}>
                အကောင့်
              </button>
            ) : null}
            <a className="download-button" href="#matches">
              အက်ပ်ဒေါင်းလုဒ်
            </a>
            <a className="ghost-button" href="#matches">
              ပွဲများကြည့်ရန်
            </a>
          </div>
        </nav>

        {menuOpen ? (
          <>
            <button
              className="menu-backdrop"
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="side-menu" aria-label="Main menu">
              <div className="side-menu-head">
                <strong>မီနူး</strong>
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  ပိတ်မည်
                </button>
              </div>
              <div className="side-menu-links">
                <button type="button" onClick={openMyanmarOdds}>
                  <span className="menu-live-dot" />
                  မြန်မာကြေးကြည့်ရန်
                </button>
                <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
                  <span className="menu-live-dot" />
                  Telegram ဆက်သွယ်ရန်
                </a>
                {user?.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowAdminPanel(true);
                    }}
                  >
                    <span className="menu-live-dot" />
                    Admin Panel
                  </button>
                ) : null}
              </div>
            </aside>
          </>
        ) : null}

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">နေ့စဉ်ဘောလုံးပွဲစဉ်</p>
            <h1>လိဂ်အလိုက် ပွဲတွေကို မြန်မြန်ရှာပါ။</h1>
            <p>
              ဘောလုံးပွဲများကို တိုက်ရိုက်ကြည့်ရှုနိုင်သည့် အပြင် မြန်မာကြေးဖြစ်လဲ
              တိုက်ရိုက်လောင်းနိုင်ပါသည်။
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#matches">
                စတင်ကြည့်မယ်
              </a>
              <span className="status-pill">
                {loading ? 'ပွဲစဉ်များ ယူနေသည်...' : `${matches.length} ပွဲ ပြသထားသည်`}
              </span>
            </div>
          </div>

          <FeaturedMatch
            match={featuredMatch}
            loading={loading}
            onOpenAccount={() => setShowAccountModal(true)}
          />
        </div>
      </section>

      <section className="stats-grid" aria-label="ပွဲစဉ်အချက်အလက်">
        <StatCard label="စုစုပေါင်းပွဲ" value={matches.length} />
        <StatCard label="တိုက်ရိုက်ပွဲ" value={liveCount} />
        <StatCard label="ကြည့်ရှုရနိုင်" value={streamCount} />
        <StatCard label="မြန်မာကြေးပါ" value={oddsCount} />
      </section>

      <AdBanner label="ကြော်ငြာ" slot={AD_SLOTS.top} />

      <section className="control-panel" id="matches">
        <div>
          <p className="eyebrow">လိဂ်ရွေးပါ</p>
          <h2>ပွဲစဉ်များ</h2>
        </div>
        <label className="search-box">
          <span>ရှာရန်</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="လိဂ်၊ အသင်း၊ အခြေအနေ..."
          />
        </label>
      </section>

      <section className="league-browser" aria-label="League browser">
        <button
          className={activeLeague === ALL_LEAGUES ? 'league-chip active' : 'league-chip'}
          onClick={() => setActiveLeague(ALL_LEAGUES)}
          type="button"
        >
          <span className="league-icon all">အ</span>
          <span>
            <strong>{ALL_LEAGUES}</strong>
            <small>{matches.length} ပွဲ</small>
          </span>
        </button>
        {leagueSummaries.map((league) => (
          <button
            className={activeLeague === league.name ? 'league-chip active' : 'league-chip'}
            key={league.name}
            onClick={() => setActiveLeague(league.name)}
            type="button"
          >
            <span className="league-icon">
              <LeagueLogo src={league.logo || ''} name={league.name} />
            </span>
            <span>
              <strong>{league.name}</strong>
              <small>{league.count} ပွဲ</small>
            </span>
          </button>
        ))}
      </section>

      <div className="filter-row" role="tablist" aria-label="Match filters">
        {filters.map((filter) => (
          <button
            className={activeFilter === filter ? 'filter-chip active' : 'filter-chip'}
            key={filter}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      <AdBanner label="ကြော်ငြာ" slot={AD_SLOTS.inline} compact />

      {error ? <div className="error-card">{error}</div> : null}

      {loading ? (
        <section className="match-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="match-card skeleton" key={index} />
          ))}
        </section>
      ) : (
        <section className="league-stack">
          <div className="results-bar">
            <span>{showOddsOnly ? 'မြန်မာကြေး ပါသောပွဲများ' : activeLeague}</span>
            <strong>{showOddsOnly ? `${oddsCount} ပွဲ ကြေးရရှိသည်` : `${filteredMatches.length} ပွဲ တွေ့ရှိသည်`}</strong>
            {showOddsOnly ? (
              <button type="button" onClick={() => setShowOddsOnly(false)}>
                ပွဲအားလုံးပြန်ကြည့်
              </button>
            ) : null}
          </div>
          {sortedDateEntries.map(({ dateKey, dateMatches, leagueEntries }) => (
            <article className="date-section" key={dateKey}>
              <div className="date-heading">
                <h3>{formatMatchDateLabel(dateKey)}</h3>
                <span>{dateMatches.length} ပွဲ</span>
              </div>
              {leagueEntries.map(([league, leagueMatches]) => (
                <article className="league-section" key={`${dateKey}-${league}`}>
                  <div className="league-heading">
                    <h3>{league}</h3>
                    <span>{leagueMatches.length} ပွဲ</span>
                  </div>
                  <div className="match-grid">
                    {leagueMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onPlay={(selectedMatch) => {
                          setPlayingMatch(selectedMatch);
                          setPlaySession((session) => session + 1);
                        }}
                        onOpenAccount={() => setShowAccountModal(true)}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </article>
          ))}
          {!filteredMatches.length ? (
            <div className="empty-card">
              {showOddsOnly
                ? 'API မှာ မြန်မာကြေး မရသေးပါ။ ကြေးပေးလာတာနဲ့ ဒီနေရာမှာ တန်းပြပါမယ်။'
                : 'ပွဲမတွေ့ပါ။ အခြားလိဂ် သို့မဟုတ် အသင်းနာမည်နဲ့ ပြန်ရှာပါ။'}
            </div>
          ) : null}
        </section>
      )}
      <AdBanner label="ကြော်ငြာ" slot={AD_SLOTS.bottom} compact />
      {playingMatch ? (
        <LivePlayerModal
          key={playSession}
          match={playingMatch}
          onClose={() => setPlayingMatch(null)}
          onOpenAccount={() => setShowAccountModal(true)}
        />
      ) : null}
      {showVideoAd ? <VideoAdModal onClose={() => setShowVideoAd(false)} /> : null}
      {showAccountModal ? <AccountLoginModal onClose={() => setShowAccountModal(false)} /> : null}
      {showAdminPanel ? <AdminPanel onClose={() => setShowAdminPanel(false)} /> : null}
      <nav className="bottom-nav" aria-label="အောက်ခြေမီနူး">
        <a href="#home">ပင်မ</a>
        <a href="#matches">လိဂ်များ</a>
        <a href="#matches">ပွဲစဉ်</a>
      </nav>
    </main>
  );
}

function VideoAdModal({ onClose }: { onClose: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className="video-ad-overlay" role="dialog" aria-modal="true" aria-label="Video advertisement">
      <div className="video-ad-card">
        <div className="video-ad-head">
          <span>Sponsored Video</span>
          <button type="button" onClick={onClose} disabled={secondsLeft > 0}>
            {secondsLeft > 0 ? `${secondsLeft}s` : 'Skip'}
          </button>
        </div>
        <div className="video-ad-frame">
          {VIDEO_AD_URL ? (
            <video src={VIDEO_AD_URL} autoPlay muted playsInline controls={secondsLeft <= 0} />
          ) : (
            <div className="video-ad-placeholder">
              <span className="menu-live-dot" />
              <strong>Video ကြော်ငြာနေရာ</strong>
              <small>Ad network video URL ထည့်ပြီးနောက် ကြော်ငြာ video ပြပါမည်</small>
            </div>
          )}
        </div>
        <p>ကြော်ငြာပြီးဆုံးပါက App ကိုဆက်လက်အသုံးပြုနိုင်ပါသည်။</p>
      </div>
    </div>
  );
}

function LivePlayerModal({
  match,
  onClose,
  onOpenAccount,
}: {
  match: Match;
  onClose: () => void;
  onOpenAccount: () => void;
}) {
  return (
    <div className="video-ad-overlay" role="dialog" aria-modal="true" aria-label="တိုက်ရိုက်ပွဲကြည့်ရှုခြင်း">
      <div className="live-player-card">
        <div className="live-player-toolbar">
          <button type="button" className="live-back-btn" onClick={onClose}>
            ← နောက်သို့
          </button>
        </div>
        <div className="video-ad-head">
          <span>တိုက်ရိုက်ကြည့်ရှုရန်</span>
          <button type="button" className="live-close-btn" onClick={onClose}>
            ပိတ်မည်
          </button>
        </div>
        <div className="live-player-title">
          <strong>
            {match.homeTeam.name} vs {match.awayTeam.name}
          </strong>
          <small>{match.league.name}</small>
        </div>
        <LiveStreamPlayer match={match} />
        <MatchOdds match={match} compact onBetClick={onOpenAccount} />
      </div>
    </div>
  );
}

function AdBanner({ label, slot, compact = false }: { label: string; slot: string; compact?: boolean }) {
  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot) {
      return;
    }

    const scriptId = 'adsense-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      document.head.appendChild(script);
    }

    window.adsbygoogle = window.adsbygoogle ?? [];
    window.adsbygoogle.push({});
  }, [slot]);

  if (!ADSENSE_CLIENT || !slot) {
    return (
      <aside className={compact ? 'ad-card compact' : 'ad-card'}>
        <span>{label}</span>
        <strong>ကြော်ငြာနေရာ</strong>
        <small>AdSense ID ထည့်ပြီးနောက် ကြော်ငြာများပြပါမည်</small>
      </aside>
    );
  }

  return (
    <aside className={compact ? 'ad-card compact live-card' : 'ad-card live-card'}>
      <span>{label}</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

function FeaturedMatch({
  match,
  loading,
  onOpenAccount,
}: {
  match?: Match;
  loading: boolean;
  onOpenAccount: () => void;
}) {
  if (loading || !match) {
    return <div className="featured-card skeleton" />;
  }

  const streamAvailable = hasStream(match);

  return (
    <aside className={streamAvailable ? 'featured-card live-card' : 'featured-card'}>
      <div className="featured-top">
        <TeamLogo src={match.league.logo} name={match.league.name} />
        <span>{match.league.name}</span>
      </div>
      <div className="versus-layout">
        <TeamBlock teamName={match.homeTeam.name} logo={match.homeTeam.logo} engName={String(match.homeEngName || '')} />
        <span className="vs-badge">VS</span>
        <TeamBlock teamName={match.awayTeam.name} logo={match.awayTeam.logo} engName={String(match.awayEngName || '')} />
      </div>
      <div className="match-meta">
        <strong>{match.time}</strong>
        <span className={streamAvailable ? 'live-badge' : 'soon-badge'}>{match.status}</span>
      </div>
      <MatchOdds match={match} onBetClick={onOpenAccount} />
    </aside>
  );
}

function MatchCard({
  match,
  onPlay,
  onOpenAccount,
}: {
  match: Match;
  onPlay: (match: Match) => void;
  onOpenAccount: () => void;
}) {
  const streamAvailable = hasStream(match);
  const live = isLiveMatch(match);
  const variants = getStreamVariants(match);

  return (
    <article className={live ? 'match-card compact live-card' : streamAvailable ? 'match-card compact stream-card' : 'match-card compact'}>
      <div className="match-card-header">
        <span className="league-mini">{match.league.name}</span>
        <span>{match.time}</span>
        {live ? <span className="live-badge">တိုက်ရိုက်</span> : null}
        {!live && streamAvailable ? <span className="soon-badge">ကြည့်ရှုရနိုင်</span> : null}
      </div>
      <div className="versus-compact">
        <div className="team-side">
          <TeamLogo src={match.homeTeam.logo} name={match.homeTeam.name} engName={String(match.homeEngName || '')} />
          <strong>{match.homeTeam.name}</strong>
        </div>
        <span className="vs-mini">VS</span>
        <div className="team-side">
          <TeamLogo src={match.awayTeam.logo} name={match.awayTeam.name} engName={String(match.awayEngName || '')} />
          <strong>{match.awayTeam.name}</strong>
        </div>
      </div>
      <MatchOdds match={match} compact onBetClick={onOpenAccount} />
      {variants.length ? (
        <div className="stream-actions">
          <button className="quality-watch live-watch" onClick={() => onPlay(match)} type="button">
            {live ? 'တိုက်ရိုက်ကြည့်မယ်' : 'ကြည့်မယ်'}
          </button>
        </div>
      ) : (
        <button className="watch-button" disabled type="button">
          ကြည့်ရှုလင့်ခ် မရသေးပါ
        </button>
      )}
    </article>
  );
}

function MatchOdds({
  match,
  compact = false,
  onBetClick,
}: {
  match: Match;
  compact?: boolean;
  onBetClick?: () => void;
}) {
  const sections = extractMyanmarOdds(match);
  const live = isLiveMatch(match);
  const closed = live || isOddsClosed(match);

  return (
    <div className={compact ? 'odds-box compact' : 'odds-box'}>
      <div className="odds-title">
        <span className="menu-live-dot" />
        <strong>မြန်မာကြေး</strong>
        {closed ? <span className="odds-closed-badge">ကြေးပိတ်</span> : null}
      </div>
      {closed ? (
        <p className="odds-closed-text">ကြေးပိတ်ပါပြီ — ဒီပွဲအတွက် လောင်းမရတော့ပါ</p>
      ) : sections.length ? (
        <div className="odds-blocks">
          {sections.map((section, index) => (
            <div className="odds-block" key={`${section.title}-${index}`}>
              <strong className="odds-section-title">{section.title}</strong>
              {section.kind === 'body' ? (
                <div className="odds-pick">
                  <div className="odds-row">
                    <span>ကြေးပေးအသင်း</span>
                    <b>{formatBodyPillLabel(section, match)}</b>
                  </div>
                  <div className="odds-row">
                    <span>အိမ်ရှင် ဘော်ဒီ</span>
                    <b>{formatBodySideLabel(section.homeLine, section.homeRate)}</b>
                  </div>
                  <div className="odds-row">
                    <span>ဧည့် ဘော်ဒီ</span>
                    <b>
                      {section.awayLine !== '—'
                        ? formatBodySideLabel(section.awayLine, section.awayRate)
                        : '—'}
                    </b>
                  </div>
                </div>
              ) : null}
              {section.kind === 'goal' ? (
                <div className="odds-pick">
                  <div className="odds-row">
                    <span>ဂိုးပေါ်</span>
                    <b>{formatGoalSideLabel(section.goalLine, section.overRate)}</b>
                  </div>
                  <div className="odds-row">
                    <span>ဂိုးအောက်</span>
                    <b>{formatGoalSideLabel(section.goalLine, section.underRate)}</b>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="odds-hint">ကြေးမထုတ်ရသေးပါ — ခဏနေပြီး ထပ်စစ်ပါ</p>
      )}
      {!closed ? (
        <button type="button" className="telegram-cta bet-cta" onClick={onBetClick}>
          ဘောပွဲလောင်းမည်
        </button>
      ) : null}
    </div>
  );
}

function TeamBlock({
  teamName,
  logo,
  engName = '',
}: {
  teamName: string;
  logo: string;
  engName?: string;
}) {
  return (
    <div className="team-block">
      <TeamLogo src={logo} name={teamName} engName={engName} large />
      <strong>{teamName}</strong>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default App;
