import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { applicationService } from '../../services/applicationService';
import { customerService } from '../../services/customerService';
import { sanctionService } from '../../services/sanctionService';
import type { Customer, LoanApplication, Sanction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function SanctionPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sanction, setSanction] = useState<Sanction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const id = Number(applicationId);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setError('Application not found.');
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [nextApplication, nextSanction] = await Promise.all([
          applicationService.getApplicationById(id),
          sanctionService.getSanctionByApplicationId(id),
        ]);

        if (!nextApplication) {
          setError('Application not found.');
          return;
        }

        const nextCustomer = await customerService.getCustomerById(nextApplication.customerId);

        setApplication(nextApplication);
        setCustomer(nextCustomer);
        setSanction(nextSanction);
      } catch {
        setError('Unable to load sanction details.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id]);

  if (loading) {
    return <div className="page-block"><p>Loading sanction details...</p></div>;
  }

  if (error || !application || !customer || !sanction) {
    return (
      <div className="page-block">
        <div className="error-panel">
          <h3>{error || 'Sanction not found for this application.'}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Loan sanction</p>
          <h1>Sanction Details</h1>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="panel-card">
        <div className="panel-card__header">
          <h3>Application summary</h3>
        </div>

        <div className="info-grid">
          <div>
            <span className="label">Application ID</span>
            <strong>{application.id}</strong>
          </div>
          <div>
            <span className="label">Customer Name</span>
            <strong>{customer.fullName}</strong>
          </div>
          <div>
            <span className="label">Loan Type</span>
            <strong>{application.loanType}</strong>
          </div>
          <div>
            <span className="label">Requested Amount</span>
            <strong>{formatCurrency(application.requestedAmount)}</strong>
          </div>
          <div>
            <span className="label">Sanctioned Amount</span>
            <strong>{formatCurrency(sanction.sanctionedAmount)}</strong>
          </div>
          <div>
            <span className="label">Interest Rate</span>
            <strong>{sanction.interestRate}%</strong>
          </div>
          <div>
            <span className="label">Tenure</span>
            <strong>{sanction.tenureMonths} months</strong>
          </div>
          <div>
            <span className="label">Monthly EMI</span>
            <strong>{formatCurrency(sanction.monthlyEmi)}</strong>
          </div>
          <div>
            <span className="label">Sanctioned Date</span>
            <strong>{formatDate(sanction.sanctionedAt)}</strong>
          </div>
          <div>
            <span className="label">Sanctioned By</span>
            <strong>{sanction.sanctionedBy}</strong>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={() => navigate(`/applications/${application.id}`)}>
          View Application
        </Button>
      </div>
    </div>
  );
}
