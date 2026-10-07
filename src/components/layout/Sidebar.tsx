import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/applications', label: 'Applications' },
  { to: '/operations', label: 'Operations' },
  { to: '/underwriting/1', label: 'Underwriting', hidden: true },
  { to: '/disbursement/1', label: 'Disbursement', hidden: true },
];

export function Sidebar() {
  return (
    <aside className="sidebar-panel">
      <div className="brand-block">
        <span className="brand-mark">LOS</span>
        <span>Loan Origination</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.filter((item) => !item.hidden).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
