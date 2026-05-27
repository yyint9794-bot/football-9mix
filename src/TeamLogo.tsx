import { useEffect, useMemo, useState } from 'react';
import { createFallbackTeamLogo } from './api';
import { buildTeamLogoSources } from './teamLogoUrl';

type TeamLogoProps = {
  src: string;
  name: string;
  engName?: string;
  large?: boolean;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function TeamLogo({ src, name, engName = '', large = false }: TeamLogoProps) {
  const label = engName.trim() || name;
  const fallback = useMemo(() => createFallbackTeamLogo(label), [label]);
  const resolvedSrc = useMemo(() => src?.trim() || '', [src]);

  const sources = useMemo(() => {
    const remote = buildTeamLogoSources(resolvedSrc);
    return remote.length ? [...remote, fallback] : [fallback];
  }, [resolvedSrc, fallback]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const displaySrc = sources[Math.min(sourceIndex, sources.length - 1)] ?? fallback;
  const isRemote = !displaySrc.startsWith('data:image');

  useEffect(() => {
    setSourceIndex(0);
  }, [resolvedSrc, label]);

  return (
    <span className={`${large ? 'team-logo large' : 'team-logo'} ${isRemote ? 'has-photo' : 'fallback'}`}>
      {!isRemote ? <span className="team-initials">{getInitials(label)}</span> : null}
      <img
        src={displaySrc}
        alt={`${label} logo`}
        className="loaded"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          setSourceIndex((index) => (index < sources.length - 1 ? index + 1 : index));
        }}
      />
    </span>
  );
}

export function LeagueLogo({ src, name }: { src: string; name: string }) {
  return <TeamLogo src={src} name={name} />;
}
