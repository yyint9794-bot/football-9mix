import { getEnv } from './walletStorage.mjs';

export function defaultSiteSettings() {
  return {
    payment: {
      kbz: { number: getEnv('WALLET_KPAY_NUMBER', '09674646102'), label: 'KBZ Pay' },
      wave: { number: getEnv('WALLET_WAVE_NUMBER', '09674646102'), label: 'Wave Pay' },
    },
    announcement: {
      text: '',
      enabled: false,
    },
    banners: {
      web: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
      bet: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
      hub: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
      app: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
    },
  };
}

function normalizeBanner(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    imageUrl: String(source.imageUrl || '').trim(),
    linkUrl: String(source.linkUrl || '').trim(),
    enabled: source.enabled === true && Boolean(String(source.imageUrl || '').trim()),
    alt: String(source.alt || fallback.alt || 'ကြော်ငြာ'),
  };
}

export function normalizeSiteSettings(raw) {
  const defaults = defaultSiteSettings();
  const source = raw && typeof raw === 'object' ? raw : {};

  const paymentSource = source.payment && typeof source.payment === 'object' ? source.payment : {};
  const kbzSource = paymentSource.kbz && typeof paymentSource.kbz === 'object' ? paymentSource.kbz : {};
  const waveSource = paymentSource.wave && typeof paymentSource.wave === 'object' ? paymentSource.wave : {};
  const announcementSource =
    source.announcement && typeof source.announcement === 'object' ? source.announcement : {};
  const bannersSource = source.banners && typeof source.banners === 'object' ? source.banners : {};

  return {
    payment: {
      kbz: {
        number: String(kbzSource.number || defaults.payment.kbz.number).trim(),
        label: String(kbzSource.label || defaults.payment.kbz.label).trim(),
      },
      wave: {
        number: String(waveSource.number || defaults.payment.wave.number).trim(),
        label: String(waveSource.label || defaults.payment.wave.label).trim(),
      },
    },
    announcement: {
      text: String(announcementSource.text || '').trim(),
      enabled: announcementSource.enabled === true && Boolean(String(announcementSource.text || '').trim()),
    },
    banners: {
      web: normalizeBanner(bannersSource.web, defaults.banners.web),
      bet: normalizeBanner(bannersSource.bet, defaults.banners.bet),
      hub: normalizeBanner(bannersSource.hub, defaults.banners.hub),
      app: normalizeBanner(bannersSource.app, defaults.banners.app),
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

  if (patch.announcement && typeof patch.announcement === 'object') {
    next.announcement = {
      text: String(patch.announcement.text ?? next.announcement.text).trim(),
      enabled:
        patch.announcement.enabled === undefined
          ? next.announcement.enabled
          : patch.announcement.enabled === true,
    };
    next.announcement.enabled = next.announcement.enabled && Boolean(next.announcement.text);
  }

  if (patch.banners && typeof patch.banners === 'object') {
    for (const key of ['web', 'bet', 'hub', 'app']) {
      if (patch.banners[key]) {
        next.banners[key] = normalizeBanner(
          { ...next.banners[key], ...patch.banners[key] },
          base.banners[key],
        );
      }
    }
  }

  return normalizeSiteSettings(next);
}
