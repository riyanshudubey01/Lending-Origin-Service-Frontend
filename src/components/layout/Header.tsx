import { useNavigate } from 'react-router-dom';
import { authService } from '../../features/auth/authService';
import type { User } from '../../types';

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Lending operations</p>
        <h2>LOS Lending System</h2>
      </div>

      <div className="user-meta">
        {user ? (
          <>
            <span>
              {user.username} / {user.role}
            </span>
            <button type="button" className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
