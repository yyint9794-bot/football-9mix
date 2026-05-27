import App from './App';
import { AdminWebPage } from './AdminWebPage';
import { BetWebPage } from './BetWebPage';
import { getAppPath } from './navigation';

export function RootApp() {
  const path = getAppPath();

  if (path === '/admin') {
    return <AdminWebPage />;
  }

  if (path === '/bet') {
    return <BetWebPage />;
  }

  return <App />;
}
