import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { applicationService } from '../../services/applicationService';
import { customerService } from '../../services/customerService';
import type { Customer, LoanApplication } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { authService } from '../auth/authService';

export function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = authService.getCurrentUser();
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage ?? '';

  useEffect(() => {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      setError('Customer not found.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadCustomer = async () => {
      setLoading(true);
      setError('');

      try {
        const [nextCustomer, nextApplications] = await Promise.all([
          customerService.getCustomerById(numericId),
          applicationService.getApplicationsByCustomerId(numericId),
        ]);

        if (!isMounted) {
          return;
        }

        if (!nextCustomer) {
          setError('Customer not found.');
          return;
        }

        setCustomer(nextCustomer);
        setApplications(nextApplications);
      } catch {
        if (isMounted) {
          setError('Unable to load customer details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCustomer();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="page-block"><p>Loading customer details...</p></div>;
  }

  if (error || !customer) {
    return (
      <div className="page-block">
        <div className="error-panel">
          <h3>{error || 'Customer not found.'}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Customer details</p>
          <h1>{customer.fullName}</h1>
        </div>

        {currentUser?.role === 'SALES' ? (
          <Button onClick={() => navigate(`/applications/new?customerId=${customer.id}`)}>
            Create Loan Application
          </Button>
        ) : null}
      </div>

      {successMessage ? <div className="success-banner">{successMessage}</div> : null}

      <div className="panel-card">
        <div className="panel-card__header">
          <h3>Customer Information</h3>
        </div>

        <div className="info-grid">
          <div>
            <span className="label">Customer ID</span>
            <strong>{customer.id}</strong>
          </div>
          <div>
            <span className="label">Full Name</span>
            <strong>{customer.fullName}</strong>
          </div>
          <div>
            <span className="label">Date of Birth</span>
            <strong>{formatDate(customer.dateOfBirth)}</strong>
          </div>
          <div>
            <span className="label">Email</span>
            <strong>{customer.email}</strong>
          </div>
          <div>
            <span className="label">Phone</span>
            <strong>{customer.phone}</strong>
          </div>
          <div>
            <span className="label">Employment Type</span>
            <strong>{customer.employmentType === 'SALARIED' ? 'Salaried' : 'Self Employed'}</strong>
          </div>
          <div>
            <span className="label">Monthly Income</span>
            <strong>{formatCurrency(customer.monthlyIncome)}</strong>
          </div>
          <div>
            <span className="label">Created At</span>
            <strong>{formatDate(customer.createdAt)}</strong>
          </div>
        </div>
      </div>

      <div className="panel-card panel-card--spaced">
        <div className="panel-card__header">
          <h3>Loan Applications</h3>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <p>No loan applications for this customer.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Loan Type</th>
                  <th>Requested Amount</th>
                  <th>Tenure</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <button type="button" className="text-button" onClick={() => navigate(`/applications/${application.id}`)}>
                        {application.id}
                      </button>
                    </td>
                    <td>{application.loanType}</td>
                    <td>{formatCurrency(application.requestedAmount)}</td>
                    <td>{application.tenureMonths} months</td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
