export function proxiedStreamUrl(url: string) {
  if (!url || !url.startsWith('http')) {
    return '';
  }

  return `/api/hls-proxy?url=${encodeURIComponent(url)}`;
}
