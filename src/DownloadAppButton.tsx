import { useState, type MouseEvent, type ReactNode } from 'react';
import { APP_APK_FILENAME, isIosDevice, resolveAppDownloadHref, triggerApkDownload } from './appDownload';

type DownloadAppButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function DownloadAppButton({
  className = 'download-button',
  children = 'အက်ပ်ဒေါင်းလုဒ်',
}: DownloadAppButtonProps) {
  const [busy, setBusy] = useState(false);
  const href = resolveAppDownloadHref();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (busy) {
      return;
    }

    setBusy(true);
    void triggerApkDownload()
      .catch(() => {
        window.location.href = href;
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <a
      className={className}
      href={href}
      download={APP_APK_FILENAME}
      onClick={handleClick}
      rel="noopener"
    >
      {busy ? 'ဒေါင်းလုဒ်…' : children}
      {!isIosDevice() ? <span className="download-button-sub">APK</span> : null}
    </a>
  );
}
