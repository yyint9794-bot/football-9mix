/**
 * Cloudflare API token + account id — CI / local
 */
export function loadCloudflareEnv() {
  function clean(name) {
    const raw = process.env[name];
    if (!raw) {
      return '';
    }
    return raw.trim().replace(/\s+/g, '');
  }

  const token = clean('CLOUDFLARE_API_TOKEN');
  const accountId = clean('CLOUDFLARE_ACCOUNT_ID');

  return { token, accountId };
}

export function requireCloudflareEnv() {
  const { token, accountId } = loadCloudflareEnv();

  if (!token) {
    throw new Error('CLOUDFLARE_API_TOKEN မရှိ — GitHub Secrets သို့မဟုတ် env ထည့်ပါ');
  }
  if (!accountId) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID မရှိ');
  }
  if (token.includes('curl') || token.includes('http')) {
    throw new Error('CLOUDFLARE_API_TOKEN မှား — cfut_... token သာ');
  }
  if (!/^[a-f0-9]{32}$/i.test(accountId)) {
    throw new Error(`CLOUDFLARE_ACCOUNT_ID မှား (${accountId.length} chars) — 32 hex လိုသည်`);
  }

  return {
    token,
    accountId,
    wranglerEnv: {
      ...process.env,
      CLOUDFLARE_API_TOKEN: token,
      CLOUDFLARE_ACCOUNT_ID: accountId,
    },
  };
}
