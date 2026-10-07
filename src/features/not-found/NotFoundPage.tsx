import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page-block">
      <div className="error-panel">
        <p className="eyebrow">404</p>
        <h1>Page Not Found</h1>
        <p style={{ marginTop: '12px' }}>The page you requested does not exist.</p>
        <div style={{ marginTop: '18px' }}>
          <Link to="/dashboard" className="text-link">Return to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
