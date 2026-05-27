/** Remote Config / app-version.json — "|" သို့မဟုတ် newline ခွဲ features */
export function parseReleaseFeatures(raw: string | undefined): string[] {
  const text = String(raw ?? '').trim();
  if (!text) {
    return [];
  }

  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
      }
    } catch {
      // fall through
    }
  }

  return text
    .split(/\||\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}
