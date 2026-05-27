import type { MouseEvent, ReactNode } from 'react';
import { APP_APK_FILENAME, isIosDevice, resolveAppDownloadHref, shouldDownloadApkFile } from './appDownload';

type DownloadAppButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function DownloadAppButton({
  className = 'download-button',
  children = 'အက်ပ်ဒေါင်းလုဒ်',
}: DownloadAppButtonProps) {
  const href = resolveAppDownloadHref();
  const isApk = shouldDownloadApkFile();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isIosDevice()) {
      event.preventDefault();
      window.location.href = '/app';
    }
  };

  return (
    <a
      className={className}
      href={href}
      download={isApk ? APP_APK_FILENAME : undefined}
      onClick={handleClick}
      rel={isApk ? 'noopener' : undefined}
    >
      {children}
      {isApk ? <span className="download-button-sub">APK</span> : null}
    </a>
  );
}
