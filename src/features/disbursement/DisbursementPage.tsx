import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StatusBadge } from '../../components/common/StatusBadge';
import { authService } from '../auth/authService';
import { applicationService } from '../../services/applicationService';
import { customerService } from '../../services/customerService';
import { disbursementService } from '../../services/disbursementService';
import { sanctionService } from '../../services/sanctionService';
import type { Customer, Disbursement, LoanApplication, Sanction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

const maskAccountNumber = (accountNumber: string): string => {
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length <= 4) {
    return '*'.repeat(digits.length);
  }

  return `${'*'.repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
};

export function DisbursementPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sanction, setSanction] = useState<Sanction | null>(null);
  const [disbursement, setDisbursement] = useState<Disbursement | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        const [nextApplication, nextSanction, nextDisbursement] = await Promise.all([
          applicationService.getApplicationById(id),
          sanctionService.getSanctionByApplicationId(id),
          disbursementService.getDisbursementByApplicationId(id),
        ]);

        if (!nextApplication) {
          setError('Application not found.');
          return;
        }

        const nextCustomer = await customerService.getCustomerById(nextApplication.customerId);

        setApplication(nextApplication);
        setCustomer(nextCustomer);
        setSanction(nextSanction);
        setDisbursement(nextDisbursement);
      } catch {
        setError('Unable to load disbursement details.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id]);

  const handleDisburse = async () => {
    if (!application) {
      return;
    }

    const cleaned = accountNumber.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 9 || cleaned.length > 18) {
      setError('Bank account number must contain 9 to 18 digits.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const nextDisbursement = await disbursementService.disburseLoan(
        application.id,
        cleaned,
        authService.getCurrentUser()?.username ?? 'Disbursement Officer',
      );

      setDisbursement(nextDisbursement);
      setAccountNumber(cleaned);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to disburse the loan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-block"><p>Loading disbursement details...</p></div>;
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
          <p className="eyebrow">Disbursement</p>
          <h1>Disburse loan</h1>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {disbursement ? (
        <div className="panel-card">
          <div className="panel-card__header">
            <h3>Loan disbursed successfully</h3>
          </div>

          <div className="info-grid">
            <div>
              <span className="label">Application ID</span>
              <strong>{disbursement.applicationId}</strong>
            </div>
            <div>
              <span className="label">Amount</span>
              <strong>{formatCurrency(disbursement.amount)}</strong>
            </div>
            <div>
              <span className="label">Transaction Reference</span>
              <strong>{disbursement.transactionReference}</strong>
            </div>
            <div>
              <span className="label">Disbursed Date</span>
              <strong>{formatDate(disbursement.disbursedAt)}</strong>
            </div>
            <div>
              <span className="label">Status</span>
              <strong>{disbursement.status}</strong>
            </div>
          </div>

          <div className="form-actions">
            <Button type="button" onClick={() => navigate(`/applications/${application.id}`)}>
              View Application
            </Button>
          </div>
        </div>
      ) : (
        <div className="panel-card">
          <div className="panel-card__header">
            <h3>Disbursement review</h3>
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
              <span className="label">Sanctioned Amount</span>
              <strong>{formatCurrency(sanction.sanctionedAmount)}</strong>
            </div>
            <div>
              <span className="label">Monthly EMI</span>
              <strong>{formatCurrency(sanction.monthlyEmi)}</strong>
            </div>
            <div>
              <span className="label">Tenure</span>
              <strong>{sanction.tenureMonths} months</strong>
            </div>
          </div>

          <div className="panel-card panel-card--spaced">
            <Input
              label="Bank Account Number"
              name="accountNumber"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="123456789012"
            />

            <div className="result-card">
              <h4>Confirm disbursement</h4>
              <p><strong>Amount:</strong> {formatCurrency(sanction.sanctionedAmount)}</p>
              <p><strong>Account:</strong> {maskAccountNumber(accountNumber || '0000000000')}</p>
              <p>Are you sure you want to disburse this loan?</p>
            </div>

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate(`/applications/${application.id}`)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleDisburse()} disabled={submitting}>
                {submitting ? 'Disbursing...' : 'Disburse Loan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error ? <div className="inline-error">{error}</div> : null}
    </div>
  );
}
