import { Outlet } from 'react-router-dom';
import { authService } from '../../features/auth/authService';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  const user = authService.getCurrentUser();

  return (
    <div className="layout-shell">
      <Sidebar />

      <div className="layout-main">
        <Header user={user} />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
