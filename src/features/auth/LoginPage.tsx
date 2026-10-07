import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authService } from './authService';

const demoCredentials = [
  { label: 'Sales', username: 'sales1', password: 'password' },
  { label: 'Credit', username: 'credit1', password: 'password' },
  { label: 'Disbursement', username: 'disb1', password: 'password' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authService.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await authService.login(credentials);

      if (!user) {
        setError('Invalid username or password');
        return;
      }

      navigate('/dashboard');
    } catch {
      setError('Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-card__head">
          <p className="eyebrow">Lending operations</p>
          <h1>LOS Login</h1>
        </div>

        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <Input
            label="Username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            placeholder="Enter username"
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="Enter password"
            autoComplete="current-password"
          />

          {error ? <div className="inline-error">{error}</div> : null}

          <Button type="submit" disabled={isSubmitting} className="full-width">
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>

        <div className="demo-credentials">
          <h2>Demo credentials</h2>
          <ul>
            {demoCredentials.map((entry) => (
              <li key={entry.username}>
                <strong>{entry.label}:</strong> {entry.username} / {entry.password}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
