import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { applicationService } from '../../services/applicationService';
import { dashboardService } from '../../services/dashboardService';
import { disbursementService } from '../../services/disbursementService';
import { customerService } from '../../services/customerService';
import type { Customer, DashboardSummary, Disbursement, LoanApplication } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { authService } from '../auth/authService';

export function DashboardPage() {
  const user = authService.getCurrentUser();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [nextSummary, nextApplications, nextCustomers, nextDisbursements] = await Promise.all([
          dashboardService.getDashboardSummary(),
          applicationService.getApplications(),
          customerService.getCustomers(),
          disbursementService.getDisbursements(),
        ]);

        setSummary(nextSummary);
        setApplications(nextApplications);
        setCustomers(Object.fromEntries(nextCustomers.map((customer) => [customer.id, customer])) as Record<number, Customer>);
        setDisbursements(nextDisbursements);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const recentApplications = useMemo(
    () => [...applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [applications],
  );

  const recentDisbursements = useMemo(
    () => [...disbursements].sort((a, b) => new Date(b.disbursedAt).getTime() - new Date(a.disbursedAt).getTime()).slice(0, 5),
    [disbursements],
  );

  const summaryCards = summary ? [
    { label: 'Total Customers', value: summary.totalCustomers },
    { label: 'Total Applications', value: summary.totalApplications },
    { label: 'Pending Applications', value: summary.pendingApplications },
    { label: 'Underwriting', value: summary.underwritingApplications },
    { label: 'Approved', value: summary.approvedApplications },
    { label: 'Rejected', value: summary.rejectedApplications },
    { label: 'Ready for Disbursement', value: summary.readyForDisbursement },
    { label: 'Disbursed', value: summary.disbursedApplications },
  ] : [];

  if (loading) {
    return <div className="page-block"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Dashboard</h1>
        </div>
        {user ? <span className="role-pill">{user.role}</span> : null}
      </div>

      <div className="dashboard-card-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className="dashboard-card">
            <span className="dashboard-card__label">{card.label}</span>
            <strong className="dashboard-card__value">{card.value}</strong>
          </div>
        ))}
      </div>

      <section className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card__header">
          <h3>Quick actions</h3>
        </div>
        <div className="quick-action-grid">
          <Link to="/customers/new" className="quick-action">Create Customer</Link>
          <Link to="/applications/new?customerId=1" className="quick-action">Create Loan Application</Link>
          <Link to="/applications" className="quick-action">View Applications</Link>
          <Link to="/customers" className="quick-action">View Customers</Link>
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card__header">
          <h3>Pending work</h3>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Required Action</th>
              </tr>
            </thead>
            <tbody>
              {applications
                .filter((application) => ['SUBMITTED', 'CREDIT_PASSED', 'APPROVED', 'READY_FOR_DISBURSEMENT'].includes(application.status))
                .slice(0, 5)
                .map((application) => (
                  <tr key={application.id}>
                    <td>{application.id}</td>
                    <td>{customers[application.customerId]?.fullName ?? 'Unknown customer'}</td>
                    <td>{formatCurrency(application.requestedAmount)}</td>
                    <td><StatusBadge status={application.status} /></td>
                    <td>
                      <Link to={`/applications/${application.id}`} className="text-link">View</Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card__header">
          <h3>Recent applications</h3>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Customer</th>
                <th>Loan Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((application) => (
                <tr key={application.id}>
                  <td>{application.id}</td>
                  <td>{customers[application.customerId]?.fullName ?? 'Unknown customer'}</td>
                  <td>{application.loanType}</td>
                  <td>{formatCurrency(application.requestedAmount)}</td>
                  <td><StatusBadge status={application.status} /></td>
                  <td>{formatDate(application.createdAt)}</td>
                  <td><Link to={`/applications/${application.id}`} className="text-link">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card__header">
          <h3>Recent disbursements</h3>
        </div>

        {recentDisbursements.length === 0 ? (
          <div className="empty-state">
            <h3>No loans have been disbursed yet.</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Transaction Reference</th>
                  <th>Disbursed Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDisbursements.map((disbursement) => (
                  <tr key={disbursement.id}>
                    <td>{disbursement.applicationId}</td>
                    <td>{customers[applications.find((application) => application.id === disbursement.applicationId)?.customerId ?? -1]?.fullName ?? 'Unknown customer'}</td>
                    <td>{formatCurrency(disbursement.amount)}</td>
                    <td>{disbursement.transactionReference}</td>
                    <td>{formatDate(disbursement.disbursedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
