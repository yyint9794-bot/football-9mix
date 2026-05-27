import { useEffect, useState } from 'react';
import {
  fetchMatchExtra,
  type MatchExtraKind,
  type MatchExtrasPayload,
  type MatchFactItem,
  type MatchStatRow,
  type TableRow,
} from './matchExtras';
import type { Match } from './types';

const TAB_LABELS: Record<MatchExtraKind, string> = {
  facts: 'Facts',
  lineup: 'Lineup',
  table: 'Table',
  stats: 'Stats',
};

type MatchExtrasPanelProps = {
  match: Match;
  activeTab: MatchExtraKind;
};

export function MatchExtrasTabs({
  activeTab,
  onChange,
}: {
  activeTab: MatchExtraKind;
  onChange: (tab: MatchExtraKind) => void;
}) {
  const tabs: MatchExtraKind[] = ['facts', 'lineup', 'table', 'stats'];

  return (
    <div className="extras-tabs" role="tablist" aria-label="ပွဲအချက်အလက်">
      {tabs.map((tab) => (
        <button
          className={activeTab === tab ? 'extras-tab active' : 'extras-tab'}
          key={tab}
          onClick={() => onChange(tab)}
          role="tab"
          aria-selected={activeTab === tab}
          type="button"
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}

export function MatchExtrasPanel({ match, activeTab }: MatchExtrasPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<MatchExtrasPayload[MatchExtraKind]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchMatchExtra(match, activeTab, controller.signal)
      .then((payload) => setData(payload))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError('ဒီအချက်အလက်ကို ယခုမရနိုင်သေးပါ။');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeTab, match.id]);

  if (loading) {
    return <p className="extras-hint">ဒေတာ ယူနေသည်...</p>;
  }

  if (error) {
    return <p className="extras-error">{error}</p>;
  }

  if (!data.length && activeTab !== 'facts') {
    return (
      <p className="extras-hint">
        {TAB_LABELS[activeTab]} ဒေတာ မရရှိသေးပါ။ API key မှာ ဒီအပိုင်း ဖွင့်ထားရပါမယ်။
      </p>
    );
  }

  if (activeTab === 'facts') {
    return <FactsView items={data as MatchFactItem[]} />;
  }

  if (activeTab === 'lineup') {
    return <LineupView sides={data as MatchExtrasPayload['lineup']} match={match} />;
  }

  if (activeTab === 'table') {
    return <TableView rows={data as TableRow[]} />;
  }

  return <StatsView rows={data as MatchStatRow[]} match={match} />;
}

function FactsView({ items }: { items: MatchFactItem[] }) {
  return (
    <ul className="facts-list">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </li>
      ))}
    </ul>
  );
}

function LineupView({
  sides,
  match,
}: {
  sides: MatchExtrasPayload['lineup'];
  match: Match;
}) {
  if (!sides.length) {
    return <p className="extras-hint">လူစာရင်း မထုတ်ရသေးပါ။</p>;
  }

  return (
    <div className="lineup-grid">
      {sides.map((side) => (
        <article className="lineup-side" key={side.team}>
          <header>
            <strong>{side.team || match.homeTeam.name}</strong>
            <span>{side.formation}</span>
          </header>
          <div className="lineup-block">
            <small>အခြေခံ ၁၁ ယောက်</small>
            <ul>
              {side.starters.map((player) => (
                <li key={`${player.number}-${player.name}`}>
                  <span>{player.number}</span>
                  <b>{player.name}</b>
                  <em>{player.position}</em>
                </li>
              ))}
            </ul>
          </div>
          {side.substitutes.length ? (
            <div className="lineup-block">
              <small>အစားထိုး</small>
              <ul>
                {side.substitutes.map((player) => (
                  <li key={`sub-${player.number}-${player.name}`}>
                    <span>{player.number}</span>
                    <b>{player.name}</b>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function TableView({ rows }: { rows: TableRow[] }) {
  if (!rows.length) {
    return <p className="extras-hint">လိဂ်ဇယား မရရှိသေးပါ။</p>;
  }

  return (
    <div className="table-wrap">
      <table className="league-table">
        <thead>
          <tr>
            <th>#</th>
            <th>အသင်း</th>
            <th>ပွဲ</th>
            <th>နိုင်</th>
            <th>ရေး</th>
            <th>ရှုံး</th>
            <th>ရမှတ်</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.rank}-${row.team}`}>
              <td>{row.rank}</td>
              <td>{row.team}</td>
              <td>{row.played || '—'}</td>
              <td>{row.won || '—'}</td>
              <td>{row.drawn || '—'}</td>
              <td>{row.lost || '—'}</td>
              <td>{row.points || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatsView({ rows, match }: { rows: MatchStatRow[]; match: Match }) {
  if (!rows.length) {
    return <p className="extras-hint">ပွဲစတက် အချက်အလက် မရရှိသေးပါ။</p>;
  }

  return (
    <div className="stats-panel">
      <div className="stats-head">
        <span>{match.homeTeam.name}</span>
        <span>{match.awayTeam.name}</span>
      </div>
      {rows.map((row) => (
        <div className="stats-row" key={row.label}>
          <strong>{row.home}</strong>
          <span>{row.label}</span>
          <strong>{row.away}</strong>
        </div>
      ))}
    </div>
  );
}
