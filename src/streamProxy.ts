import { remoteApiOrigin } from './remoteApiOrigin';

export function proxiedStreamUrl(url: string) {
  if (!url || !url.startsWith('http')) {
    return '';
  }

  const origin = remoteApiOrigin();
  return `${origin}/api/hls-proxy?url=${encodeURIComponent(url)}`;
}
