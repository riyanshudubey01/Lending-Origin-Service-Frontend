import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { applicationService } from '../../services/applicationService';
import { customerService } from '../../services/customerService';
import type { Customer, LoanApplication } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

const statusOptions = [
  'All',
  'DRAFT',
  'SUBMITTED',
  'ELIGIBILITY_FAILED',
  'ELIGIBILITY_PASSED',
  'CREDIT_FAILED',
  'CREDIT_PASSED',
  'UNDERWRITING',
  'APPROVED',
  'REJECTED',
  'SANCTIONED',
  'READY_FOR_DISBURSEMENT',
  'DISBURSED',
];

const loanTypeOptions = ['All', 'PERSONAL', 'HOME', 'AUTO'];

export function ApplicationListPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loanTypeFilter, setLoanTypeFilter] = useState('All');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [apps, allCustomers] = await Promise.all([
          applicationService.getApplications(),
          customerService.getCustomers(),
        ]);

        if (!isMounted) {
          return;
        }

        const customerMap = Object.fromEntries(allCustomers.map((customer) => [customer.id, customer])) as Record<number, Customer>;
        setCustomers(customerMap);
        setApplications(apps);
      } catch {
        if (isMounted) {
          setError('Unable to load applications.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const min = Number(minAmount) || 0;
    const max = Number(maxAmount) || Number.POSITIVE_INFINITY;

    let nextApplications = [...applications];

    if (query) {
      nextApplications = nextApplications.filter((application) => {
        const customer = customers[application.customerId];
        const customerName = customer?.fullName ?? '';

        return (
          application.id.toString().includes(query) ||
          customerName.toLowerCase().includes(query) ||
          application.loanType.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== 'All') {
      nextApplications = nextApplications.filter((application) => application.status === statusFilter);
    }

    if (loanTypeFilter !== 'All') {
      nextApplications = nextApplications.filter((application) => application.loanType === loanTypeFilter);
    }

    nextApplications = nextApplications.filter(
      (application) => application.requestedAmount >= min && application.requestedAmount <= max,
    );

    nextApplications.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.requestedAmount - a.requestedAmount;
        case 'lowest':
          return a.requestedAmount - b.requestedAmount;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return nextApplications;
  }, [applications, customers, loanTypeFilter, maxAmount, minAmount, searchTerm, sortBy, statusFilter]);

  if (loading) {
    return <div className="page-block"><p>Loading applications...</p></div>;
  }

  if (error) {
    return (
      <div className="page-block">
        <div className="error-panel">
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Loan applications</p>
          <h1>Applications</h1>
        </div>
      </div>

      <div className="panel-card" style={{ marginBottom: '20px' }}>
        <div className="form-grid-two">
          <div className="field">
            <label className="field__label" htmlFor="app-search">Search</label>
            <input id="app-search" className="input" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search applications..." aria-label="Search applications" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="status-filter">Status</label>
            <select id="status-filter" className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="loan-filter">Loan Type</label>
            <select id="loan-filter" className="input" value={loanTypeFilter} onChange={(event) => setLoanTypeFilter(event.target.value)}>
              {loanTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sort-by">Sort</label>
            <select id="sort-by" className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="min-amount">Min Amount</label>
            <input id="min-amount" className="input" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} placeholder="0" type="number" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="max-amount">Max Amount</label>
            <input id="max-amount" className="input" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} placeholder="10000000" type="number" />
          </div>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="empty-state">
          <h3>No loan applications found.</h3>
          <p>Create a loan application.</p>
        </div>
      ) : (
        <div className="panel-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Customer</th>
                  <th>Loan Type</th>
                  <th>Requested Amount</th>
                  <th>Tenure</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => {
                  const customer = customers[application.customerId];

                  return (
                    <tr key={application.id}>
                      <td>{application.id}</td>
                      <td>{customer?.fullName ?? 'Unknown customer'}</td>
                      <td>{application.loanType}</td>
                      <td>{formatCurrency(application.requestedAmount)}</td>
                      <td>{application.tenureMonths} months</td>
                      <td>
                        <StatusBadge status={application.status} />
                      </td>
                      <td>{formatDate(application.createdAt)}</td>
                      <td>
                        <Link to={`/applications/${application.id}`} className="text-link">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
