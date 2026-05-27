type LeagueFilterSheetProps = {
  leagues: string[];
  selected: Set<string> | null;
  onChange: (next: Set<string> | null) => void;
  onClose: () => void;
};

export function LeagueFilterSheet({ leagues, selected, onChange, onClose }: LeagueFilterSheetProps) {
  const activeSet = selected ?? new Set(leagues);
  const allSelected = !selected || selected.size === leagues.length;

  const toggleLeague = (league: string) => {
    const base = selected ? new Set(selected) : new Set(leagues);
    if (base.has(league)) {
      base.delete(league);
    } else {
      base.add(league);
    }
    if (!base.size) {
      onChange(null);
      return;
    }
    if (base.size === leagues.length) {
      onChange(null);
      return;
    }
    onChange(base);
  };

  return (
    <div className="league-filter-overlay" role="presentation" onClick={onClose}>
      <div
        className="league-filter-sheet"
        role="dialog"
        aria-label="လိဂ်ရွေးချယ်ရန်"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="league-filter-head">
          <strong>လိဂ်ရွေးချယ်ရန်</strong>
          <button type="button" className="league-filter-close" onClick={onClose}>
            ပိတ်မည်
          </button>
        </header>

        <div className="league-filter-actions">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={allSelected ? 'active' : ''}
          >
            အားလုံး
          </button>
          <button type="button" onClick={() => onChange(null)}>
            ရှင်းမည်
          </button>
        </div>

        <ul className="league-filter-list">
          {leagues.map((league) => {
            const checked = activeSet.has(league);
            return (
              <li key={league}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLeague(league)}
                  />
                  <span>{league}</span>
                </label>
              </li>
            );
          })}
        </ul>

        <button type="button" className="league-filter-apply" onClick={onClose}>
          အတည်ပြုမည်
        </button>
      </div>
    </div>
  );
}
