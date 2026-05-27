export function openBetPage() {
  window.location.href = '/bet';
}

export function openAdminPage() {
  window.location.href = '/admin';
}

export function openHomePage() {
  window.location.href = '/';
}

export function getAppPath() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path;
}
