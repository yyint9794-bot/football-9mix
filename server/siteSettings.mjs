import { getEnv } from './walletStorage.mjs';

const MAX_BANNER_DATA_URL_CHARS = 520_000;

export function defaultSiteSettings() {
  return {
    payment: {
      kbz: { number: getEnv('WALLET_KPAY_NUMBER', '09674646102'), label: 'KBZ Pay' },
      wave: { number: getEnv('WALLET_WAVE_NUMBER', '09674646102'), label: 'Wave Pay' },
    },
    announcements: {
      web: { text: '', enabled: false },
      bet: { text: '', enabled: false },
    },
    banners: {
      web: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
      user: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
    },
  };
}

function normalizeAnnouncement(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const text = String(source.text || '').trim();
  return {
    text,
    enabled: source.enabled === true && Boolean(text),
  };
}

function normalizeBanner(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  let imageUrl = String(source.imageUrl || '').trim();
  if (imageUrl.startsWith('data:image/') && imageUrl.length > MAX_BANNER_DATA_URL_CHARS) {
    imageUrl = '';
  }
  return {
    imageUrl,
    linkUrl: String(source.linkUrl || '').trim(),
    enabled: source.enabled === true && Boolean(imageUrl),
    alt: String(source.alt || fallback.alt || 'ကြော်ငြာ'),
  };
}

function migrateLegacySettings(raw) {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const next = { ...raw };

  if (raw.announcement && typeof raw.announcement === 'object' && !raw.announcements) {
    next.announcements = {
      web: { ...raw.announcement },
      bet: { ...raw.announcement },
    };
  }

  if (raw.banners && typeof raw.banners === 'object') {
    const banners = { ...raw.banners };
    if (!banners.user) {
      banners.user = banners.hub || banners.bet || banners.app || banners.user;
    }
    next.banners = banners;
  }

  return next;
}

export function normalizeSiteSettings(raw) {
  const defaults = defaultSiteSettings();
  const source = migrateLegacySettings(raw && typeof raw === 'object' ? raw : {});

  const paymentSource = source.payment && typeof source.payment === 'object' ? source.payment : {};
  const kbzSource = paymentSource.kbz && typeof paymentSource.kbz === 'object' ? paymentSource.kbz : {};
  const waveSource = paymentSource.wave && typeof paymentSource.wave === 'object' ? paymentSource.wave : {};
  const announcementsSource =
    source.announcements && typeof source.announcements === 'object' ? source.announcements : {};
  const bannersSource = source.banners && typeof source.banners === 'object' ? source.banners : {};

  return {
    payment: {
      kbz: {
        number: String(kbzSource.number || defaults.payment.kbz.number).trim(),
        label: String(kbzSource.label || defaults.payment.kbz.label).trim() || defaults.payment.kbz.label,
      },
      wave: {
        number: String(waveSource.number || defaults.payment.wave.number).trim(),
        label: String(waveSource.label || defaults.payment.wave.label).trim() || defaults.payment.wave.label,
      },
    },
    announcements: {
      web: normalizeAnnouncement(announcementsSource.web, defaults.announcements.web),
      bet: normalizeAnnouncement(announcementsSource.bet, defaults.announcements.bet),
    },
    banners: {
      web: normalizeBanner(bannersSource.web, defaults.banners.web),
      user: normalizeBanner(bannersSource.user, defaults.banners.user),
    },
  };
}

export function getSiteSettingsFromDb(db) {
  return normalizeSiteSettings(db?.siteSettings);
}

export function applySiteSettingsPatch(current, patch) {
  const base = normalizeSiteSettings(current);
  if (!patch || typeof patch !== 'object') {
    return base;
  }

  const next = structuredClone(base);

  if (patch.payment && typeof patch.payment === 'object') {
    if (patch.payment.kbz) {
      next.payment.kbz = {
        ...next.payment.kbz,
        ...patch.payment.kbz,
        number: String(patch.payment.kbz.number ?? next.payment.kbz.number).trim(),
        label: String(patch.payment.kbz.label ?? next.payment.kbz.label).trim(),
      };
    }
    if (patch.payment.wave) {
      next.payment.wave = {
        ...next.payment.wave,
        ...patch.payment.wave,
        number: String(patch.payment.wave.number ?? next.payment.wave.number).trim(),
        label: String(patch.payment.wave.label ?? next.payment.wave.label).trim(),
      };
    }
  }

  if (patch.announcements && typeof patch.announcements === 'object') {
    for (const key of ['web', 'bet']) {
      if (patch.announcements[key]) {
        next.announcements[key] = normalizeAnnouncement(
          { ...next.announcements[key], ...patch.announcements[key] },
          base.announcements[key],
        );
      }
    }
  }

  if (patch.announcement && typeof patch.announcement === 'object') {
    next.announcements.web = normalizeAnnouncement(
      { ...next.announcements.web, ...patch.announcement },
      base.announcements.web,
    );
    next.announcements.bet = normalizeAnnouncement(
      { ...next.announcements.bet, ...patch.announcement },
      base.announcements.bet,
    );
  }

  if (patch.banners && typeof patch.banners === 'object') {
    for (const key of ['web', 'user']) {
      if (patch.banners[key]) {
        next.banners[key] = normalizeBanner(
          { ...next.banners[key], ...patch.banners[key] },
          base.banners[key],
        );
      }
    }
    if (patch.banners.hub || patch.banners.bet) {
      next.banners.user = normalizeBanner(
        { ...next.banners.user, ...(patch.banners.user || patch.banners.hub || patch.banners.bet) },
        base.banners.user,
      );
    }
  }

  return normalizeSiteSettings(next);
}
