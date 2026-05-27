import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { getStreamUrlCandidates, type StreamQuality } from './api';
import { proxiedStreamUrl } from './streamProxy';
import type { Match } from './types';

function isSlowConnection() {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } })
    .connection;

  if (!connection) {
    return false;
  }

  if (connection.saveData) {
    return true;
  }

  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g'
  );
}

function isPublicTunnelHost() {
  const host = window.location.hostname;
  return host.endsWith('.loca.lt') || host.endsWith('.trycloudflare.com') || host.includes('ngrok');
}

function shouldUseNativeHls() {
  if (isPublicTunnelHost()) {
    return false;
  }

  const agent = navigator.userAgent;
  return (/safari/i.test(agent) && !/chrome|chromium|android/i.test(agent)) || /iphone|ipad|ipod/i.test(agent);
}

function configureStreamXhr(xhr: XMLHttpRequest) {
  if (isPublicTunnelHost()) {
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', '1');
  }
}

type LiveStreamPlayerProps = {
  match: Match;
  compact?: boolean;
};

export function LiveStreamPlayer({ match, compact = false }: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const urlIndexRef = useRef(0);
  const stallTimerRef = useRef<number | null>(null);
  const upgradeTimerRef = useRef<number | null>(null);
  const bandwidthRef = useRef({ bytes: 0, ms: 0 });
  const hasPlayedRef = useRef(false);

  const [playerError, setPlayerError] = useState('');
  const [needsPlayTap, setNeedsPlayTap] = useState(false);
  const [urlIndex, setUrlIndex] = useState(0);
  const [activeQuality, setActiveQuality] = useState<StreamQuality>('sd');

  const hasHd = useMemo(
    () => getStreamUrlCandidates(match, 'hd').length > 0,
    [match],
  );
  const hasSd = useMemo(
    () => getStreamUrlCandidates(match, 'sd').length > 0,
    [match],
  );

  const streamCandidates = useMemo(() => {
    return getStreamUrlCandidates(match, activeQuality).map((url) => proxiedStreamUrl(url));
  }, [activeQuality, match]);

  const streamUrl = streamCandidates[urlIndex] ?? '';
  urlIndexRef.current = urlIndex;

  const clearTimers = useCallback(() => {
    if (stallTimerRef.current) {
      window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }

    if (upgradeTimerRef.current) {
      window.clearTimeout(upgradeTimerRef.current);
      upgradeTimerRef.current = null;
    }
  }, []);

  const tryNextSource = useCallback(() => {
    if (urlIndexRef.current + 1 < streamCandidates.length) {
      setUrlIndex(urlIndexRef.current + 1);
      return true;
    }

    return false;
  }, [streamCandidates.length]);

  const downgradeToSd = useCallback(() => {
    if (!hasSd || activeQuality === 'sd') {
      return;
    }

    setActiveQuality('sd');
    setUrlIndex(0);
    urlIndexRef.current = 0;
  }, [activeQuality, hasSd]);

  const upgradeToHd = useCallback(() => {
    if (!hasHd || activeQuality === 'hd' || isSlowConnection()) {
      return;
    }

    setActiveQuality('hd');
    setUrlIndex(0);
    urlIndexRef.current = 0;
  }, [activeQuality, hasHd]);

  useEffect(() => {
    hasPlayedRef.current = false;
    setUrlIndex(0);
    urlIndexRef.current = 0;
    setActiveQuality('sd');
    setPlayerError('');
    setNeedsPlayTap(false);
    clearTimers();
  }, [clearTimers, match.id]);

  useEffect(() => {
    if (!isPublicTunnelHost()) {
      return;
    }

    void fetch(`${window.location.origin}/`, {
      headers: { 'Bypass-Tunnel-Reminder': '1' },
    });
  }, []);

  const handlePlayTap = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = false;
    void video.play().then(() => setNeedsPlayTap(false)).catch(() => setNeedsPlayTap(true));
  }, []);

  useLayoutEffect(() => {
    const video = videoRef.current;

    if (!video || !streamUrl) {
      setPlayerError('ဒီပွဲအတွက် ကြည့်ရှုလင့်ခ် မရရှိသေးပါ။');
      return;
    }

    setPlayerError('');
    bandwidthRef.current = { bytes: 0, ms: 0 };

    let disposed = false;

    const playVideo = () => {
      video.muted = true;
      void video.play().catch(() => {
        if (!disposed) {
          setNeedsPlayTap(true);
        }
      });
    };

    const onPlaying = () => {
      hasPlayedRef.current = true;
    };

    const onWaiting = () => {
      if (disposed || !hasPlayedRef.current) {
        return;
      }

      if (stallTimerRef.current) {
        window.clearTimeout(stallTimerRef.current);
      }

      stallTimerRef.current = window.setTimeout(downgradeToSd, 8000);
    };

    const onTimeUpdate = () => {
      if (video.currentTime > 0) {
        hasPlayedRef.current = true;
        if (stallTimerRef.current) {
          window.clearTimeout(stallTimerRef.current);
          stallTimerRef.current = null;
        }
      }
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('timeupdate', onTimeUpdate);

    hlsRef.current?.destroy();
    hlsRef.current = null;

    const startNative = () => {
      video.src = streamUrl;
      playVideo();
    };

    if (shouldUseNativeHls() || !Hls.isSupported()) {
      startNative();

      const onError = () => {
        if (tryNextSource()) {
          return;
        }
        setPlayerError('ယခု ကြည့်ရှုလို့ မရသေးပါ။');
      };

      video.addEventListener('error', onError);

      return () => {
        disposed = true;
        clearTimers();
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('error', onError);
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }

    const hls = new Hls({
      enableWorker: !/iphone|ipad|ipod|android/i.test(navigator.userAgent),
      lowLatencyMode: true,
      maxBufferLength: 16,
      startLevel: -1,
      manifestLoadingTimeOut: 30000,
      fragLoadingTimeOut: 30000,
      xhrSetup: configureStreamXhr,
    });

    hlsRef.current = hls;
    hls.attachMedia(video);
    hls.loadSource(streamUrl);

    hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
      const stats = data.frag.stats;
      if (stats.loading.end > stats.loading.start) {
        bandwidthRef.current.bytes += stats.total;
        bandwidthRef.current.ms += stats.loading.end - stats.loading.start;
      }
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (!disposed) {
        playVideo();
      }
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal || disposed) {
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
        return;
      }

      if (tryNextSource()) {
        return;
      }

      if (hasSd && activeQuality !== 'sd') {
        downgradeToSd();
        return;
      }

      setPlayerError('ယခု ကြည့်ရှုလို့ မရသေးပါ။');
    });

    upgradeTimerRef.current = window.setTimeout(() => {
      const { bytes, ms } = bandwidthRef.current;
      if (ms > 0 && (bytes * 8) / (ms * 1000) >= 2 && activeQuality === 'sd') {
        upgradeToHd();
      }
    }, isSlowConnection() ? 40000 : 15000);

    return () => {
      disposed = true;
      clearTimers();
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('timeupdate', onTimeUpdate);
      hls.destroy();
      hlsRef.current = null;
    };
  }, [
    activeQuality,
    clearTimers,
    downgradeToSd,
    hasSd,
    match.id,
    streamUrl,
    tryNextSource,
    upgradeToHd,
  ]);

  return (
    <div className={compact ? 'stream-player compact' : 'stream-player'}>
      <div className="live-video-wrap is-live">
        <video
          ref={videoRef}
          className="live-video"
          autoPlay
          controls
          controlsList="nodownload noremoteplayback"
          playsInline
          muted
          preload="auto"
        />
        {needsPlayTap ? (
          <button type="button" className="live-play-tap" onClick={handlePlayTap}>
            ▶ ကြည့်ရန် နှိပ်ပါ
          </button>
        ) : null}
      </div>
      {isPublicTunnelHost() ? (
        <p className="player-hint">tunnel link: ပထမအကြိမ် Continue နှိပ်ပြီးမှ live ကြည့်ပါ</p>
      ) : null}
      {playerError ? <p className="player-error">{playerError}</p> : null}
    </div>
  );
}
