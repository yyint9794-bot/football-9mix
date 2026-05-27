const LANG_KEY = 'mix9-locale';

export type AppLocale = 'my' | 'en';

export function getStoredLocale(): AppLocale {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === 'en' ? 'en' : 'my';
}

export function setStoredLocale(locale: AppLocale) {
  localStorage.setItem(LANG_KEY, locale);
}

type UserLanguageSheetProps = {
  locale: AppLocale;
  onChange: (locale: AppLocale) => void;
  onClose: () => void;
};

export function UserLanguageSheet({ locale, onChange, onClose }: UserLanguageSheetProps) {
  return (
    <div className="league-filter-overlay" role="presentation" onClick={onClose}>
      <div
        className="league-filter-sheet settings-sheet"
        role="dialog"
        aria-label="ဘာသာစကား ရွေးရန်"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="league-filter-head">
          <strong>ဘာသာစကား ရွေးရန်</strong>
          <button type="button" className="league-filter-close" onClick={onClose}>
            ပိတ်မည်
          </button>
        </header>

        <div className="language-options">
          <button
            type="button"
            className={locale === 'my' ? 'active' : ''}
            onClick={() => {
              onChange('my');
              onClose();
            }}
          >
            <span>🇲🇲</span>
            <b>မြန်မာ</b>
          </button>
          <button
            type="button"
            className={locale === 'en' ? 'active' : ''}
            onClick={() => {
              onChange('en');
              onClose();
            }}
          >
            <span>🇬🇧</span>
            <b>English</b>
          </button>
        </div>
      </div>
    </div>
  );
}
